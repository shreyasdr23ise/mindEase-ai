from uuid import uuid4
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.conversation import (
    ConversationResponse, ConversationUpdate, MessageResponse,
)
from app.schemas.chat import ChatMessage, ChatResponse
from app.services.ai.provider_factory import get_ai_provider
from app.services.crisis.detector import CrisisDetector
from app.services.safety.filter import ResponseSafetyFilter
from app.services.medicine.service import MedicineService
from app.models.crisis import CrisisEvent
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(
    payload: ChatMessage,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Orchestrates the full chat pipeline."""
    # 1. Validate
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    provider = get_ai_provider()
    message_text = payload.message.strip()

    # 2. Crisis detection (early short-circuit for safety)
    crisis = CrisisDetector.detect(message_text)
    is_crisis = crisis["is_crisis"]

    if is_crisis:
        # Log crisis event and return immediate safety response
        crisis_event = CrisisEvent(
            id=uuid4(),
            user_id=current_user.id,
            severity=crisis["severity"],
            detected_content=message_text,
            trigger_type=crisis["crisis_type"],
            response_provided=CrisisDetector.CRISIS_TYPES.get(crisis["crisis_type"], "crisis"),
        )
        db.add(crisis_event)

        # Save conversation if exists or create one
        if payload.conversation_id:
            conv_result = await db.execute(
                select(Conversation).where(
                    Conversation.id == payload.conversation_id,
                    Conversation.user_id == current_user.id,
                )
            )
            conversation = conv_result.scalar_one_or_none()
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            conversation.updated_at = datetime.utcnow()
        else:
            conversation = Conversation(
                id=uuid4(),
                user_id=current_user.id,
                title=message_text[:50],
            )
            db.add(conversation)

        user_msg = Message(
            id=uuid4(),
            conversation_id=conversation.id,
            role="user",
            content=message_text,
        )
        db.add(user_msg)

        safety_response = (
            "I'm really concerned about what you're going through, and I want you to know that "
            "you matter. These intense feelings are painful, but they won't last forever. "
            "Please reach out to someone who can help right now. In India, you can call the "
            "Vandrevala Foundation at 1860-266-2345 or AASRA at +91 98204 66726 anytime. "
            "For emergencies, call 112 or go to the nearest hospital. You deserve immediate "
            "support, and there are caring people ready to help you through this."
        )
        assistant_msg = Message(
            id=uuid4(),
            conversation_id=conversation.id,
            role="assistant",
            content=safety_response,
            emotion_detected={"emotion": "sadness", "confidence": 0.9, "severity": "critical"},
            intent_detected={"intent": "crisis", "confidence": 0.98},
        )
        db.add(assistant_msg)
        await db.commit()

        return ChatResponse(
            response=safety_response,
            conversation_id=conversation.id,
            emotion={"emotion": "sadness", "confidence": 0.9, "severity": "critical"},
            intent={"intent": "crisis", "confidence": 0.98},
            suggested_actions=[
                "Call a crisis helpline now (Vandrevala 1860-266-2345 / AASRA +91 9820466726)",
                "Go somewhere safe and stay with someone you trust",
                "Contact emergency services if you're at immediate risk",
            ],
            is_crisis=True,
            crisis_severity=crisis["severity"],
        )

    # 3. Get or create conversation
    if payload.conversation_id:
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.id == payload.conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = conv_result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            id=uuid4(),
            user_id=current_user.id,
            title=message_text[:50],
        )
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = Message(
        id=uuid4(),
        conversation_id=conversation.id,
        role="user",
        content=message_text,
    )
    db.add(user_msg)
    await db.flush()

    # 4. Intent detection
    intent_result = await provider.detect_intent(message_text)

    # 5. Emotion analysis
    emotion_result = await provider.analyze_emotion(message_text)

    # 6. Context retrieval (last N messages)
    context_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(desc(Message.created_at))
        .limit(10)
    )
    history = list(context_result.scalars().all())
    context = [
        {"role": m.role, "content": m.content}
        for m in reversed(history)
        if m.id != user_msg.id
    ]

    # 7. Handle medicine info intent specially
    medicine_response = None
    if intent_result["intent"] == "medicine_info":
        medicine = await MedicineService.get_medicine_by_name(db, message_text)
        medicine_result = MedicineService.get_safe_medicine_response(message_text, medicine)
        medicine_response = medicine_result
        ai_response = medicine_result["response"]
    else:
        # 8. AI generation
        ai_response = await provider.generate_response(
            message=message_text,
            context=context,
            emotion=emotion_result,
            intent=intent_result,
        )

    # 9. Safety filter
    filtered = ResponseSafetyFilter.filter(ai_response, message_text)
    final_response = filtered["filtered_response"]

    # Update message with emotion/intent
    user_msg.emotion_detected = emotion_result
    user_msg.intent_detected = intent_result
    conversation.updated_at = datetime.utcnow()
    if conversation.title == "New Conversation" or not conversation.title:
        conversation.title = message_text[:50]

    # Save assistant message
    assistant_msg = Message(
        id=uuid4(),
        conversation_id=conversation.id,
        role="assistant",
        content=final_response,
        emotion_detected=emotion_result,
        intent_detected=intent_result,
    )
    db.add(assistant_msg)

    # Log to audit
    audit = AuditLog(
        id=uuid4(),
        user_id=current_user.id,
        action="chat_message",
        details={"intent": intent_result.get("intent"), "emotion": emotion_result.get("emotion")},
    )
    db.add(audit)

    await db.commit()

    # Suggested actions based on intent
    suggested_actions = _get_suggested_actions(intent_result, emotion_result, medicine_response)

    return ChatResponse(
        response=final_response,
        conversation_id=conversation.id,
        emotion=emotion_result,
        intent=intent_result,
        suggested_actions=suggested_actions,
    )


def _get_suggested_actions(intent_result: dict, emotion_result: dict, medicine_response: Optional[dict] = None):
    from app.services.ai.mock_provider import MockAIProvider
    mock = MockAIProvider()
    intent = intent_result.get("intent", "general")
    if medicine_response and intent == "medicine_info":
        return [
            "Note: " + medicine_response.get("disclaimer", ""),
            "Prepare questions for your next doctor's appointment",
            "Explore our wellness exercises for daily support",
            "Track your mood to share patterns with your doctor",
        ]
    return mock.SAFETY_ACTIONS.get(
        intent,
        mock.SAFETY_ACTIONS.get(emotion_result.get("emotion", "general"), mock.SAFETY_ACTIONS["general"]),
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.updated_at))
    )
    return list(result.scalars().all())


@router.get("/conversations/{conversation_id}", response_model=dict)
async def get_conversation(
    conversation_id,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = conv_result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    messages = list(msg_result.scalars().all())
    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "messages": [MessageResponse.model_validate(m) for m in messages],
    }


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def rename_conversation(
    conversation_id,
    update: ConversationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = conv_result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if update.title:
        conversation.title = update.title
        conversation.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(conversation)
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = conv_result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conversation)
    await db.commit()
