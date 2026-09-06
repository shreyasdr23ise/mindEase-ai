"""Seed script for MindEase AI.

Creates demo users, wellness exercises, medicine records, emergency resources,
mood data, journal entries, conversations, and counselors.

Uses synchronous SQLAlchemy for standalone execution.
"""

import uuid
from datetime import datetime, timedelta, date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.models.mood import MoodLog
from app.models.journal import JournalEntry
from app.models.wellness import WellnessExercise
from app.models.medicine import MedicineInformation
from app.models.emergency import EmergencyResource
from app.models.counselor import Counselor
from app.models.privacy import UserPrivacySettings
from app.models.audit import AuditLog
from app.models.activity import ActivityLog
from app.core.security import get_password_hash


def main():
    print(f"Connecting to database...")
    engine = create_engine(settings.SYNC_DATABASE_URL, echo=False)
    Session = sessionmaker(bind=engine)
    db = Session()

    # Import Base to create tables
    from app.core.database import Base
    Base.metadata.create_all(engine)
    print("Tables ensured.")

    # ---------- Clean existing demo data ----------
    demo_email = "demo@mindease.ai"
    admin_email = settings.ADMIN_EMAIL or "admin@mindease.ai"
    counselor_email = "counselor@mindease.ai"

    existing_demo = db.query(User).filter(User.email == demo_email).first()
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    existing_counselor = db.query(User).filter(User.email == counselor_email).first()

    # Also find any existing admin-role user (handles the case where the admin
    # email was changed between deploys but a prior admin row still exists).
    any_admin = db.query(User).filter(User.role == "admin").first()

    admin_password = settings.ADMIN_PASSWORD or settings.DEMO_ADMIN_PASSWORD

    def _create_admin_user():
        admin_user = User(
            id=uuid.uuid4(),
            email=admin_email,
            username="mindease_admin",
            full_name="MindEase Administrator",
            hashed_password=get_password_hash(admin_password),
            role="admin",
            is_active=True,
            is_anonymous=False,
            onboarding_completed=True,
        )
        db.add(admin_user)
        db.flush()
        db.add(UserPrivacySettings(user_id=admin_user.id))
        return admin_user

    if existing_demo and existing_admin:
        # Everything already seeded - just refresh the admin password from env.
        existing_admin.hashed_password = get_password_hash(admin_password)
        existing_admin.role = "admin"
        db.commit()
        print(f"Seed already applied. Admin password refreshed from env for {admin_email}.")
        db.close()
        return

    if existing_demo and any_admin:
        # The configured admin email doesn't exist, but there IS a prior admin
        # row (likely with the old default email). Update it in-place rather
        # than inserting a new row that would conflict on the unique username.
        any_admin.email = admin_email
        any_admin.hashed_password = get_password_hash(admin_password)
        any_admin.role = "admin"
        any_admin.is_active = True
        db.commit()
        print(f"Updated existing admin to {admin_email}. Existing demo data preserved.")
        db.close()
        return

    if existing_demo and not existing_admin and not any_admin:
        # Prod migration: demo content exists, but no admin user at all.
        # Create the admin only; do not duplicate demo content.
        _create_admin_user()
        db.commit()
        print(f"Added admin user {admin_email}. Existing demo data preserved.")
        db.close()
        return

    # ---------- Wellness exercises ----------
    print("Seeding wellness exercises...")
    exercises_data = [
        {
            "title": "Box Breathing (4-4-4-4)",
            "category": "breathing",
            "description": "A simple, powerful breathing technique to calm your nervous system and reduce stress in just a few minutes.",
            "instructions": [
                "Find a comfortable seated position and relax your shoulders",
                "Breathe in slowly through your nose for 4 counts",
                "Hold your breath gently for 4 counts",
                "Exhale slowly through your mouth for 4 counts",
                "Hold your lungs empty for 4 counts",
                "Repeat this 4-4-4-4 cycle for 5 rounds or 5 minutes",
            ],
            "duration_minutes": 5,
            "difficulty": "beginner",
        },
        {
            "title": "4-7-8 Relaxing Breath",
            "category": "breathing",
            "description": "Also known as the 'relaxing breath', this pattern helps you fall asleep faster and calm anxiety.",
            "instructions": [
                "Sit or lie down comfortably with your back straight",
                "Place the tip of your tongue against the ridge behind your front teeth",
                "Exhale completely through your mouth, making a 'whoosh' sound",
                "Close your mouth and inhale quietly through your nose for 4 counts",
                "Hold your breath for 7 counts",
                "Exhale completely through your mouth, making a 'whoosh' sound, for 8 counts",
                "This is one breath. Repeat for 4 full breaths",
            ],
            "duration_minutes": 5,
            "difficulty": "beginner",
        },
        {
            "title": "5-4-3-2-1 Grounding Technique",
            "category": "grounding",
            "description": "A sensory grounding exercise to bring you back to the present moment during anxiety or panic.",
            "instructions": [
                "Acknowledge 5 things you can see around you",
                "Acknowledge 4 things you can touch or feel (texture of your clothes, chair, ground)",
                "Acknowledge 3 things you can hear (birds, traffic, the hum of a fan)",
                "Acknowledge 2 things you can smell (coffee, fresh air, your own scent)",
                "Acknowledge 1 thing you can taste (mint, water, or just your mouth)",
                "Slow down and truly notice each one, taking a deep breath between each step",
            ],
            "duration_minutes": 5,
            "difficulty": "beginner",
        },
        {
            "title": "CBT Thought Record",
            "category": "cbt",
            "description": "Identify and challenge negative automatic thoughts to shift your perspective on difficult situations.",
            "instructions": [
                "Describe the situation that triggered a strong emotion",
                "Write down the automatic thought that came to mind",
                "Rate how strongly you believe this thought (0-100%)",
                "Note the emotion(s) you felt and their intensity",
                "Look for evidence that supports the thought",
                "Look for evidence that contradicts the thought",
                "Write a balanced, alternative thought",
                "Re-rate your belief in the original thought",
            ],
            "duration_minutes": 15,
            "difficulty": "intermediate",
        },
        {
            "title": "Body Scan Meditation",
            "category": "mindfulness",
            "description": "A guided mindfulness practice that brings attention to each part of your body to release tension.",
            "instructions": [
                "Lie down comfortably or sit in a supportive chair",
                "Close your eyes and take 3 slow, deep breaths",
                "Bring attention to your feet - notice any sensations without judgment",
                "Slowly move your attention up to your legs, hips, and lower back",
                "Continue to your stomach, chest, and hands",
                "Notice your arms, shoulders, neck, and jaw - soften any tension",
                "Finish with your face and the top of your head",
                "Take a final deep breath and gently open your eyes",
            ],
            "duration_minutes": 10,
            "difficulty": "beginner",
        },
        {
            "title": "Progressive Muscle Relaxation",
            "category": "stress_relief",
            "description": "Tense and relax different muscle groups to release physical stress and promote deep relaxation.",
            "instructions": [
                "Sit or lie in a comfortable position",
                "Close your eyes and take a few deep breaths",
                "Clench your fists tightly for 5 seconds, then release for 10 seconds",
                "Tense your upper arms and shoulders for 5 seconds, then release",
                "Tighten your facial muscles (squeeze eyes, scrunch nose) for 5 seconds, then release",
                "Tense your jaw by clenching your teeth for 5 seconds, then relax",
                "Tense your stomach for 5 seconds, then release",
                "Tense your thighs and calves for 5 seconds, then release",
                "Tense your feet by curling toes for 5 seconds, then release",
                "Take a final deep breath and notice the relaxation throughout your body",
            ],
            "duration_minutes": 10,
            "difficulty": "beginner",
        },
        {
            "title": "Gratitude Journaling",
            "category": "positive_reflection",
            "description": "Cultivate a positive mindset by focusing on the good things in your life, big or small.",
            "instructions": [
                "Take out a journal or a piece of paper",
                "Write down 3 things you are grateful for today",
                "For each one, write why you're grateful for it",
                "Try to be specific rather than general",
                "Include small things (a good cup of tea, a kind word) not just big events",
                "Read back what you wrote and allow yourself to feel the gratitude",
            ],
            "duration_minutes": 10,
            "difficulty": "beginner",
        },
        {
            "title": "Sleep Wind-Down Routine",
            "category": "sleep",
            "description": "A gentle pre-sleep routine to signal to your body that it's time to rest and improve sleep quality.",
            "instructions": [
                "One hour before bed, dim your lights and reduce screen brightness",
                "Put your phone on 'Do Not Disturb' and place it away from the bed",
                "Take a warm shower or bath to lower your core body temperature afterward",
                "Do a 5-minute gentle stretch or body scan meditation",
                "Write down any lingering worries or tomorrow's to-do list to clear your mind",
                "Drink a small cup of caffeine-free herbal tea (chamomile or peppermint)",
                "Read a physical book or listen to soft, calming music",
                "When you get into bed, do the 4-7-8 breathing for 4 rounds",
            ],
            "duration_minutes": 30,
            "difficulty": "beginner",
        },
    ]

    exercise_map = {}
    for ex in exercises_data:
        # Use categorical enum values
        cat_map = {
            "breathing": "breathing", "grounding": "grounding",
            "mindfulness": "mindfulness", "stress_relief": "stress_relief",
            "cbt": "cbt", "sleep": "sleep", "positive_reflection": "positive_reflection",
        }
        diff_map = {"beginner": "beginner", "intermediate": "intermediate", "advanced": "advanced"}
        row = WellnessExercise(
            id=uuid.uuid4(),
            title=ex["title"],
            category=cat_map[ex["category"]],
            description=ex["description"],
            instructions=ex["instructions"],
            duration_minutes=ex["duration_minutes"],
            difficulty=diff_map[ex["difficulty"]],
            is_active=True,
        )
        db.add(row)
        exercise_map[ex["title"]] = row
    db.flush()
    print(f"  Added {len(exercises_data)} exercises.")

    # ---------- Medicine records ----------
    print("Seeding medicine information...")
    medicines_data = [
        {
            "name": "Sertraline (Zoloft)",
            "generic_name": "Sertraline Hydrochloride",
            "category": "SSRI Antidepressant",
            "common_uses": "Major depressive disorder, obsessive-compulsive disorder, panic disorder, PTSD, social anxiety disorder, and premenstrual dysphoric disorder",
            "description": "Sertraline is a selective serotonin reuptake inhibitor (SSRI) that increases serotonin levels in the brain to improve mood and reduce anxiety. It is one of the most widely prescribed antidepressants.",
            "side_effects": ["Nausea", "Diarrhea", "Insomnia", "Drowsiness", "Dry mouth", "Increased sweating", "Dizziness", "Sexual side effects"],
            "warnings": ["Increased risk of suicidal thoughts in young adults (ages 18-24) during initial treatment", "May cause serotonin syndrome when combined with other serotonergic drugs", "Do not discontinue abruptly - taper under medical supervision"],
            "precautions": ["Liver or kidney impairment", "Bipolar disorder (may trigger mania)", "History of seizures", "Pregnancy or breastfeeding", "Bleeding disorders"],
            "administration_info": {
                "typical_starting_dose": "50mg once daily (25mg for some conditions)",
                "taken": "Can be taken with or without food, preferably at the same time each day",
                "onset": "2-6 weeks for full therapeutic effect",
                "missed_dose": "Take as soon as you remember unless it's almost time for your next dose",
            },
            "interaction_warnings": ["MAO inhibitors (dangerous interaction)", "NSAIDs (bleeding risk)", "Warfarin and anticoagulants", "Other antidepressants", "St. John's Wort", "Alcohol"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Fluoxetine (Prozac)",
            "generic_name": "Fluoxetine Hydrochloride",
            "category": "SSRI Antidepressant",
            "common_uses": "Major depressive disorder, obsessive-compulsive disorder, bulimia nervosa, and panic disorder",
            "description": "Fluoxetine is an SSRI with a long half-life, meaning it stays in the body longer and may be better for patients who miss doses. It is effective for depression and several anxiety disorders.",
            "side_effects": ["Nausea", "Headache", "Insomnia", "Nervousness", "Drowsiness", "Decreased appetite", "Weight loss", "Sexual dysfunction"],
            "warnings": ["Long half-life requires caution when switching medications", "Increased suicidal ideation risk in younger patients", "Serotonin syndrome risk"],
            "precautions": ["Liver impairment", "Renal impairment", "Cardiac conditions (QT prolongation)", "Diabetes (may affect blood sugar)", "History of mania"],
            "administration_info": {
                "typical_starting_dose": "20mg once daily",
                "taken": "Usually taken in the morning to avoid insomnia",
                "onset": "4-6 weeks",
                "missed_dose": "Take as soon as you remember if within a few hours; otherwise skip",
            },
            "interaction_warnings": ["MAO inhibitors", "Other antidepressants", "Warfarin", "Tamoxifen", "Alcohol"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Escitalopram (Lexapro)",
            "generic_name": "Escitalopram Oxalate",
            "category": "SSRI Antidepressant",
            "common_uses": "Major depressive disorder and generalized anxiety disorder",
            "description": "Escitalopram is a highly selective SSRI often well-tolerated with fewer drug interactions than many other antidepressants. It is effective for both depression and generalized anxiety.",
            "side_effects": ["Nausea", "Headache", "Sweating", "Fatigue", "Insomnia or drowsiness", "Dry mouth", "Sexual dysfunction"],
            "warnings": ["Increased suicidality in young adults", "Risk of QT prolongation in overdose", "Serotonin syndrome"],
            "precautions": ["Hepatic impairment (may require reduced dose)", "Cardiac conditions", "Hyponatremia in elderly", "Bipolar disorder"],
            "administration_info": {
                "typical_starting_dose": "10mg once daily",
                "taken": "With or without food, morning or evening consistently",
                "onset": "1-4 weeks",
                "missed_dose": "Take as soon as you remember unless near next dose",
            },
            "interaction_warnings": ["MAO inhibitors", "Linezolid", "Tramadol", "Other serotonergic drugs", "Alcohol"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Alprazolam (Xanax)",
            "generic_name": "Alprazolam",
            "category": "Benzodiazepine",
            "common_uses": "Anxiety disorders, panic disorder, and anxiety associated with depression (short-term management)",
            "description": "Alprazolam is a benzodiazepine that works by enhancing GABA, a neurotransmitter that reduces nervous system activity. It provides rapid relief from acute anxiety but has a risk of dependence.",
            "side_effects": ["Drowsiness", "Dizziness", "Coordination problems", "Memory impairment", "Slurred speech", "Constipation", "Increased salivation or dry mouth"],
            "warnings": ["High abuse and dependence potential", "Dangerous withdrawal if stopped abruptly (including seizures)", "Combination with opioids can cause fatal respiratory depression", "Not recommended as first-line long-term treatment"],
            "precautions": ["History of substance abuse", "Liver disease", "Respiratory conditions", "Glaucoma", "Elderly patients (increased fall risk)"],
            "administration_info": {
                "typical_dose_range": "0.25-0.5mg three times daily (short-term)",
                "taken": "Can be taken with or without food",
                "onset": "Rapid - within 1 hour",
                "missed_dose": "Take if remembered soon; do not double up",
            },
            "interaction_warnings": ["Opioids (life-threatening)", "Alcohol (dangerous CNS depression)", "Other central nervous system depressants", "CYP3A4 inhibitors such as ketoconazole"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Lorazepam (Ativan)",
            "generic_name": "Lorazepam",
            "category": "Benzodiazepine",
            "common_uses": "Anxiety disorders, insomnia, and status epilepticus (emergency seizure control)",
            "description": "Lorazepam is a benzodiazepine with a moderate duration of action. It is used for short-term relief of anxiety and can be given orally, sublingually, or intravenously.",
            "side_effects": ["Sedation", "Dizziness", "Weakness", "Unsteadiness", "Memory problems", "Nausea", "Headache"],
            "warnings": ["Dependence and withdrawal risk", "Respiratory depression with opioids or alcohol", "May impair judgment and motor skills"],
            "precautions": ["Renal or hepatic impairment", "Myasthenia gravis", "Sleep apnea", "History of substance abuse"],
            "administration_info": {
                "typical_dose_range": "1-3mg per day in divided doses",
                "taken": "For anxiety: 2-3 times daily; for sleep: once at bedtime",
                "onset": "30-60 minutes oral",
                "missed_dose": "Take as remembered unless close to next dose",
            },
            "interaction_warnings": ["Opioids (severe respiratory depression)", "Alcohol", "CNS depressants", "Valproic acid"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Bupropion (Wellbutrin)",
            "generic_name": "Bupropion Hydrochloride",
            "category": "NDRI Antidepressant",
            "common_uses": "Major depressive disorder, seasonal affective disorder (SAD), and smoking cessation (Zyban)",
            "description": "Bupropion is an atypical antidepressant that works on norepinephrine and dopamine. It is often chosen because it tends not to cause weight gain or sexual dysfunction common with SSRIs.",
            "side_effects": ["Insomnia", "Dry mouth", "Headache", "Nausea", "Constipation", "Increased heart rate", "Agitation", "Decreased appetite"],
            "warnings": ["Lowers seizure threshold (avoid in patients with seizure disorders or eating disorders)", "Risk of hypertension", "Serotonin syndrome risk", "Contraindicated with MAO inhibitors"],
            "precautions": ["Seizure history", "Eating disorders", "Traumatic brain injury", "Liver disease", "Hypertension", "Bipolar disorder"],
            "administration_info": {
                "typical_starting_dose": "150mg once daily (may increase to 300mg)",
                "taken": "Morning or early afternoon to avoid insomnia",
                "onset": "4-6 weeks",
                "missed_dose": "Take as soon as remembered, but do not take late in the day",
            },
            "interaction_warnings": ["MAO inhibitors", "Seizure threshold lowering drugs", "Antipsychotics", "Alcohol (increases seizure risk)", "Ritonavir"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Venlafaxine (Effexor)",
            "generic_name": "Venlafaxine Hydrochloride",
            "category": "SNRI Antidepressant",
            "common_uses": "Major depressive disorder, generalized anxiety disorder, panic disorder, social anxiety disorder",
            "description": "Venlafaxine is a serotonin-norepinephrine reuptake inhibitor (SNRI). At higher doses it also affects norepinephrine, which may help with fatigue and lack of energy.",
            "side_effects": ["Nausea", "Dizziness", "Insomnia", "Sweating", "Constipation", "Dry mouth", "Increased blood pressure (at higher doses)", "Sexual dysfunction"],
            "warnings": ["Can raise blood pressure - needs monitoring", "Serotonin syndrome risk", "Withdrawal symptoms require gradual tapering", "Increased suicidality in young adults"],
            "precautions": ["Hypertension", "Glaucoma", "Bipolar disorder", "Seizure disorders", "Hepatic and renal impairment"],
            "administration_info": {
                "typical_starting_dose": "75mg once daily (extended-release)",
                "taken": "Once daily with food at the same time",
                "onset": "2-4 weeks",
                "missed_dose": "Take as soon as remembered unless close to next dose",
            },
            "interaction_warnings": ["MAO inhibitors", "Anticoagulants", "NSAIDs (bleeding)", "Other serotonergic drugs", "Drugs affecting blood pressure"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Quetiapine (Seroquel)",
            "generic_name": "Quetiapine Fumarate",
            "category": "Atypical Antipsychotic",
            "common_uses": "Bipolar disorder (manic and depressive episodes), schizophrenia, and augmentation of major depressive disorder",
            "description": "Quetiapine is an atypical antipsychotic that modulates multiple neurotransmitters. Lower doses are used off-label for insomnia and anxiety, while higher doses treat mood and psychotic disorders.",
            "side_effects": ["Drowsiness and sedation", "Dizziness", "Dry mouth", "Weight gain", "Increased cholesterol and triglycerides", "Constipation", "Orthostatic hypotension"],
            "warnings": ["Metabolic changes (weight, glucose, lipids) require monitoring", "Extrapyramidal symptoms and tardive dyskinesia risk", "Increased mortality in elderly with dementia", "Neuroleptic malignant syndrome (rare but serious)"],
            "precautions": ["Cardiovascular disease", "Diabetes", "Seizure disorders", "Hypothyroidism", "History of falls"],
            "administration_info": {
                "typical_dose_range": "25-800mg daily depending on condition",
                "taken": "Often at bedtime due to sedative effects",
                "onset": "Several weeks for full effect",
                "missed_dose": "Take as remembered unless close to next dose",
            },
            "interaction_warnings": ["CYP3A4 inhibitors or inducers", "Alcohol", "CNS depressants", "Antihypertensives"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Mirtazapine (Remeron)",
            "generic_name": "Mirtazapine",
            "category": "NaSSA Antidepressant",
            "common_uses": "Major depressive disorder, often beneficial in depression with insomnia and decreased appetite",
            "description": "Mirtazapine is a noradrenergic and specific serotonergic antidepressant (NaSSA) that is sedating and can stimulate appetite, making it useful for depression with poor sleep and appetite loss.",
            "side_effects": ["Drowsiness", "Weight gain", "Increased appetite", "Dizziness", "Dry mouth", "Constipation", "Sedation"],
            "warnings": ["May cause severe neutropenia/agranulocytosis (rare) - report signs of infection", "Serotonin syndrome risk", "Hepatotoxicity", "Increased suicidality in young adults"],
            "precautions": ["Liver or kidney impairment", "Cardiovascular disease", "Seizure disorders", "Elderly patients"],
            "administration_info": {
                "typical_starting_dose": "15mg once daily at bedtime",
                "taken": "At bedtime due to sedative effect",
                "onset": "1-4 weeks",
                "missed_dose": "Take as remembered unless close to next dose",
            },
            "interaction_warnings": ["MAO inhibitors", "CNS depressants", "Alcohol", "Warfarin"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Duloxetine (Cymbalta)",
            "generic_name": "Duloxetine Hydrochloride",
            "category": "SNRI Antidepressant",
            "common_uses": "Major depressive disorder, generalized anxiety disorder, diabetic peripheral neuropathic pain, fibromyalgia, chronic musculoskeletal pain",
            "description": "Duloxetine is an SNRI that is unique in being effective for both depression/anxiety and chronic pain conditions by modulating both serotonin and norepinephrine.",
            "side_effects": ["Nausea", "Dry mouth", "Constipation", "Fatigue", "Sweating", "Insomnia", "Dizziness"],
            "warnings": ["Hepatotoxicity (severe, rare)", "Serotonin syndrome risk", "Increased blood pressure", "Withdrawal with abrupt cessation", "Increased suicidality in young adults"],
            "precautions": ["Liver disease", "Renal impairment", "Glaucoma", "Hypertension", "Bleeding disorders", "Bipolar disorder"],
            "administration_info": {
                "typical_starting_dose": "30mg or 60mg once daily",
                "taken": "Once daily with or without food",
                "onset": "2-4 weeks",
                "missed_dose": "Take as soon as remembered unless close to next dose",
            },
            "interaction_warnings": ["MAO inhibitors", "NSAIDs and anticoagulants (bleeding)", "Other serotonergic drugs", "Thioridazine", "Alcohol (hepatotoxicity)"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Methylphenidate (Ritalin/Concerta)",
            "generic_name": "Methylphenidate Hydrochloride",
            "category": "CNS Stimulant",
            "common_uses": "Attention-deficit/hyperactivity disorder (ADHD) and narcolepsy",
            "description": "Methylphenidate is a central nervous system stimulant that increases dopamine and norepinephrine activity, improving focus, attention, and impulse control in ADHD.",
            "side_effects": ["Decreased appetite", "Insomnia", "Nervousness", "Increased heart rate", "Headache", "Stomach ache", "Irritability during dose wearing off"],
            "warnings": ["High abuse potential (Schedule II controlled substance)", "Cardiovascular effects - can raise blood pressure and heart rate", "Risk of sudden death in patients with heart abnormalities", "Stimulant misuse risk"],
            "precautions": ["Heart conditions", "High blood pressure", "Glaucoma", "Tics/Tourette syndrome", "Seizure disorders", "Anxiety or agitation", "History of substance abuse"],
            "administration_info": {
                "typical_dose_range": "5-20mg immediate release or 18-54mg extended release",
                "taken": "In the morning; short-acting may be taken 2-3 times daily",
                "onset": "Immediate-release: 30-60 min; Extended-release: 60-90 min",
                "missed_dose": "Take in morning if remembered; skip if late in day to avoid insomnia",
            },
            "interaction_warnings": ["MAO inhibitors (dangerous)", "Blood pressure medications", "Anticoagulants", "Alcohol", "CNS stimulants"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
        {
            "name": "Trazodone (Desyrel)",
            "generic_name": "Trazodone Hydrochloride",
            "category": "SARI Antidepressant",
            "common_uses": "Major depressive disorder, and commonly used at low doses for insomnia",
            "description": "Trazodone is a serotonin antagonist and reuptake inhibitor (SARI). At low doses it is widely used off-label for sleep, and at higher doses it treats depression.",
            "side_effects": ["Sedation and drowsiness", "Dizziness", "Dry mouth", "Headache", "Nausea", "Blurred vision", "Low blood pressure when standing"],
            "warnings": ["Priapism (rare but serious emergency - seek immediate care)", "Serotonin syndrome risk", "QT prolongation risk", "Increased suicidality in young adults"],
            "precautions": ["Cardiac conditions", "Hepatic impairment", "History of priapism", "Glaucoma", "Risk of falls in elderly"],
            "administration_info": {
                "typical_dose_range": "Sleep: 25-100mg at bedtime; Depression: 150-300mg/day",
                "taken": "Often at bedtime due to sedation",
                "onset": "1-2 weeks for depression; 30-60 min for sleep",
                "missed_dose": "Take as remembered unless close to next dose",
            },
            "interaction_warnings": ["MAO inhibitors", "Other serotonergic drugs", "CYP3A4 inhibitors", "Antihypertensives", "Alcohol"],
            "source": "FDA Prescribing Information",
            "source_url": "https://www.fda.gov/drugs",
        },
    ]

    for med in medicines_data:
        row = MedicineInformation(
            id=uuid.uuid4(),
            name=med["name"],
            generic_name=med["generic_name"],
            category=med["category"],
            common_uses=med["common_uses"],
            description=med["description"],
            side_effects=med["side_effects"],
            warnings=med["warnings"],
            precautions=med["precautions"],
            administration_info=med.get("administration_info"),
            interaction_warnings=med["interaction_warnings"],
            source=med["source"],
            source_url=med["source_url"],
            last_updated=datetime.utcnow(),
            is_active=True,
        )
        db.add(row)
    db.flush()
    print(f"  Added {len(medicines_data)} medicines.")

    # ---------- Emergency resources ----------
    print("Seeding emergency resources...")
    emergencies_data = [
        {
            "country": "India",
            "region": "National",
            "organization": "Vandrevala Foundation Crisis Helpline",
            "emergency_number": "112",
            "crisis_helpline": "1860-266-2345",
            "website": "https://www.vandrevalafoundation.com",
            "availability": "24/7",
            "description": "Free, confidential mental health crisis support in multiple Indian languages.",
        },
        {
            "country": "India",
            "region": "National",
            "organization": "AASRA",
            "emergency_number": "112",
            "crisis_helpline": "+91 98204 66726",
            "website": "http://www.aasra.info",
            "availability": "24/7",
            "description": "Suicide prevention helpline providing emotional support to those in distress.",
        },
        {
            "country": "India",
            "region": "National",
            "organization": "iCall - Tata Institute of Social Sciences",
            "emergency_number": "112",
            "crisis_helpline": "9152987821",
            "website": "https://icallhelpline.org",
            "availability": "Mon-Sat 10am-8pm",
            "description": "Telephonic and email-based psychological counseling service.",
        },
        {
            "country": "India",
            "region": "National",
            "organization": "KIRAN (MHA Helpline)",
            "emergency_number": "112",
            "crisis_helpline": "1800-599-0019",
            "website": "https://www.mohfw.gov.in",
            "availability": "24/7",
            "description": "Ministry of Health and Family Welfare's 24x7 mental health rehabilitation helpline.",
        },
        {
            "country": "US",
            "region": "National",
            "organization": "988 Suicide & Crisis Lifeline",
            "emergency_number": "911",
            "crisis_helpline": "988",
            "website": "https://988lifeline.org",
            "availability": "24/7",
            "description": "Call or text 988 for free, confidential 24/7 support in English and Spanish.",
        },
        {
            "country": "US",
            "region": "National",
            "organization": "Crisis Text Line",
            "emergency_number": "911",
            "crisis_helpline": "Text HOME to 741741",
            "website": "https://www.crisistextline.org",
            "availability": "24/7",
            "description": "Free 24/7 support via text message for anyone in crisis.",
        },
        {
            "country": "US",
            "region": "National",
            "organization": "SAMHSA National Helpline",
            "emergency_number": "911",
            "crisis_helpline": "1-800-662-4357",
            "website": "https://www.samhsa.gov/find-help/national-helpline",
            "availability": "24/7",
            "description": "Free, confidential treatment referral and information service for mental and substance use disorders.",
        },
        {
            "country": "UK",
            "region": "National",
            "organization": "Samaritans",
            "emergency_number": "999",
            "crisis_helpline": "116 123",
            "website": "https://www.samaritans.org",
            "availability": "24/7",
            "description": "Free, confidential emotional support for anyone in distress, 24/7, bilingual (Welsh available).",
        },
        {
            "country": "UK",
            "region": "National",
            "organization": "SHOUT (Text Service)",
            "emergency_number": "999",
            "crisis_helpline": "Text SHOUT to 85258",
            "website": "https://giveusashout.org",
            "availability": "24/7",
            "description": "Free, confidential 24/7 text-based support for anyone in crisis.",
        },
        {
            "country": "International",
            "region": "Global",
            "organization": "Befrienders Worldwide",
            "emergency_number": "911 or local emergency",
            "crisis_helpline": "See website for local numbers",
            "website": "https://www.befrienders.org",
            "availability": "Varies by country",
            "description": "Global network of emotional support helplines operating in many countries.",
        },
        {
            "country": "International",
            "region": "Global",
            "organization": "International Association for Suicide Prevention (IASP)",
            "emergency_number": "911 or local emergency",
            "crisis_helpline": "See website for local numbers",
            "website": "https://www.iasp.info",
            "availability": "Varies by country",
            "description": "Collaborates with local organizations worldwide; find crisis centers by country.",
        },
        {
            "country": "International",
            "region": "Global",
            "organization": "Find A Helpline",
            "emergency_number": "911 or local emergency",
            "crisis_helpline": "Search website",
            "website": "https://findahelpline.com",
            "availability": "Varies by country",
            "description": "Global directory to find mental health helplines in various countries and languages.",
        },
    ]

    for em in emergencies_data:
        row = EmergencyResource(
            id=uuid.uuid4(),
            country=em["country"],
            region=em["region"],
            organization=em["organization"],
            emergency_number=em["emergency_number"],
            crisis_helpline=em["crisis_helpline"],
            website=em["website"],
            availability=em["availability"],
            description=em["description"],
            last_verified=datetime.utcnow(),
            is_active=True,
        )
        db.add(row)
    db.flush()
    print(f"  Added {len(emergencies_data)} emergency resources.")

    db.commit()

    # ---------- Create users ----------
    print("Creating users...")
    admin_user = _create_admin_user()

    demo_user = User(
        id=uuid.uuid4(),
        email=demo_email,
        username="demo_user",
        full_name="Demo User",
        hashed_password=get_password_hash(settings.DEMO_USER_PASSWORD),
        role="user",
        is_active=True,
        is_anonymous=False,
        onboarding_completed=True,
        preferred_name="Aarav",
        wellness_goals=["Reduce stress", "Improve sleep", "Build emotional resilience"],
        preferred_style="empathetic",
    )
    db.add(demo_user)

    counselor_user = User(
        id=uuid.uuid4(),
        email=counselor_email,
        username="dr_meera",
        full_name="Dr. Meera Sharma",
        hashed_password=get_password_hash(settings.DEMO_COUNSELOR_PASSWORD),
        role="counselor",
        is_active=True,
        is_anonymous=False,
        onboarding_completed=True,
        preferred_name="Dr. Meera",
    )
    db.add(counselor_user)
    db.flush()

    # Privacy settings for demo and admin
    db.add(UserPrivacySettings(user_id=demo_user.id))
    db.add(UserPrivacySettings(user_id=counselor_user.id))

    # Counselor profile
    counselor_profile = Counselor(
        id=uuid.uuid4(),
        user_id=counselor_user.id,
        specialty="Anxiety & Stress Management",
        experience_years=8,
        bio="Dr. Meera Sharma is a licensed clinical psychologist specializing in anxiety disorders, stress management, and cognitive behavioral therapy. She has helped 500+ clients build emotional resilience.",
        location="Bengaluru, India",
        availability={"weekdays": "9am-6pm IST", "mode": "online and in-person"},
        is_online=True,
        rating=4.8,
        consultation_fee=1500,
        is_active=True,
    )
    db.add(counselor_profile)

    # Second counselor (another user)
    counselor_user2 = User(
        id=uuid.uuid4(),
        email="counselor2@mindease.ai",
        username="dr_rahul",
        full_name="Dr. Rahul Iyer",
        hashed_password=get_password_hash(settings.DEMO_COUNSELOR_PASSWORD),
        role="counselor",
        is_active=True,
        is_anonymous=False,
        onboarding_completed=True,
        preferred_name="Dr. Rahul",
    )
    db.add(counselor_user2)
    db.flush()

    counselor_profile2 = Counselor(
        id=uuid.uuid4(),
        user_id=counselor_user2.id,
        specialty="Depression & Mood Disorders",
        experience_years=6,
        bio="Dr. Rahul Iyer is a counseling psychologist focused on depression, mood disorders, and mindfulness-based approaches to mental wellness.",
        location="Mumbai, India",
        availability={"weekends": "10am-4pm IST", "mode": "online"},
        is_online=False,
        rating=4.6,
        consultation_fee=1200,
        is_active=True,
    )
    db.add(counselor_profile2)
    db.flush()
    print("  Created admin, demo, and 2 counselor users.")

    # ---------- Mood data: 30 days for demo user ----------
    print("Seeding 30 days of mood data for demo user...")
    moods_sequence = [
        "neutral", "good", "good", "low", "neutral", "very_good", "good",
        "neutral", "low", "low", "neutral", "good", "neutral", "good",
        "very_good", "neutral", "low", "neutral", "good", "good",
        "neutral", "low", "very_low", "neutral", "good", "good", "neutral",
        "good", "very_good", "good",
    ]
    mood_enum = {"very_good": "very_good", "good": "good", "neutral": "neutral", "low": "low", "very_low": "very_low"}

    start_date = date.today() - timedelta(days=29)
    for i, mood in enumerate(moods_sequence):
        log_date = start_date + timedelta(days=i)
        # Deterministic pseudo-random values
        stress = 3 + (i * 7) % 8
        anxiety = 2 + (i * 5) % 8
        if mood in ("low", "very_low"):
            stress = min(10, stress + 3)
            anxiety = min(10, anxiety + 3)
        elif mood in ("good", "very_good"):
            stress = max(1, stress - 2)
            anxiety = max(1, anxiety - 2)

        n = MoodLog(
            id=uuid.uuid4(),
            user_id=demo_user.id,
            mood=mood_enum[mood],
            stress_level=stress,
            anxiety_level=anxiety,
            note=("" if i % 5 != 0 else (f"Day {i+1}: Trying to stay consistent with breathing exercises.")),
            created_at=datetime.combine(log_date, datetime.min.time().replace(hour=9 + (i % 10))),
        )
        db.add(n)
    db.flush()
    print(f"  Added 30 mood logs.")

    # ---------- Journal entries ----------
    print("Seeding journal entries...")
    journal_data = [
        {
            "title": "A difficult exam week",
            "content": "The midterm pressure really got to me this week. I stayed up too late studying and woke up exhausted. I felt anxious every time I opened my notes. But I'm trying to remind myself that one exam doesn't define my worth, and I've been practicing the 4-7-8 breathing before studying.",
            "mood": "low",
            "writing_prompt": "What has been on your mind this week?",
        },
        {
            "title": "A good morning walk",
            "content": "I went for a walk early today and the weather was beautiful. For the first time in a while I felt genuinely calm. I noticed the birds and the fresh air, and it reminded me how much being outside helps my mood. I want to make this a habit.",
            "mood": "good",
            "writing_prompt": "Describe a positive moment from today.",
        },
        {
            "title": "Feeling proud of small progress",
            "content": "I've been journaling for a week now and I actually feel lighter. Talking to the MindEase AI and logging my mood has helped me notice patterns. I realized I feel worse on days I skip breakfast. Small insight, but it matters.",
            "mood": "good",
            "writing_prompt": "What small progress have you made recently?",
        },
        {
            "title": "A lonely Saturday",
            "content": "Everyone seemed busy today and I spent most of it alone. It's hard not to feel isolated sometimes. I used the 5-4-3-2-1 grounding exercise which helped a bit. I think I should reach out to a friend tomorrow.",
            "mood": "low",
            "writing_prompt": "How are you feeling about connection right now?",
        },
        {
            "title": "Gratitude practice",
            "content": "Today I'm grateful for the kind message my sister sent, for the coffee I made myself this morning, and for the fact that I kept up my wellness routine even on a busy day. Writing these down genuinely shifts my mood.",
            "mood": "very_good",
            "writing_prompt": "List three things you're grateful for today.",
        },
    ]
    journal_mood_map = {"low": "low", "good": "good", "very_good": "very_good"}

    for i, je in enumerate(journal_data):
        created = start_date + timedelta(days=i * 5 + 1)
        entry = JournalEntry(
            id=uuid.uuid4(),
            user_id=demo_user.id,
            title=je["title"],
            content=je["content"],
            mood=journal_mood_map[je["mood"]],
            emotion_analysis={"emotion": je["mood"], "confidence": 0.7, "severity": "low"},
            word_count=len(je["content"].split()),
            writing_prompt=je["writing_prompt"],
            created_at=datetime.combine(created, datetime.min.time().replace(hour=21)),
        )
        db.add(entry)
    db.flush()
    print(f"  Added {len(journal_data)} journal entries.")

    # ---------- Conversations & messages ----------
    print("Seeding conversations and messages...")
    conversation_data = [
        {
            "title": "Dealing with exam stress",
            "messages": [
                ("user", "I have my final exams in 2 weeks and I'm so stressed I can't focus on anything."),
                ("assistant", "Thank you for sharing that. Exam pressure can feel really overwhelming, and it's completely normal to struggle with focus when stress builds. Let's break this down. What's the one subject or topic that's causing the most anxiety?"),
                ("user", "It's mathematics. I keep failing practice tests and it makes me feel hopeless."),
                ("assistant", "I hear how discouraging that is. Failing practice tests can really shake your confidence. But remember - practice tests are meant to reveal gaps so you can fix them, not to define your ability. Would it help to try a breathing exercise before your next study session to reset?"),
            ],
        },
        {
            "title": "Anxiety about social situations",
            "messages": [
                ("user", "I get so anxious before any social gathering. My heart races and I feel sweaty."),
                ("assistant", "Social anxiety is really common and it can feel physically intense - racing heart and sweating are signs your body's fight-or-flight response is active. That's not weakness, it's your nervous system trying to protect you. Have you tried any grounding techniques to help bring yourself back to the present?"),
            ],
        },
        {
            "title": "Sleep troubles",
            "messages": [
                ("user", "I've been lying awake for hours every night. My mind just won't turn off."),
                ("assistant", "Racing thoughts at bedtime are exhausting. It sounds like your mind is still 'wired' when your body wants rest. A wind-down routine can really help signal to your brain that it's time to sleep. Would you like me to guide you through a sleep routine? One helpful technique is the 4-7-8 breathing right in bed."),
                ("user", "Yes please, I'll try it tonight. Thanks."),
                ("assistant", "That's great to hear. Remember to be patient with yourself - sleep patterns take a little time to shift. Also try dimming lights an hour before bed and keeping screens out of the bedroom. You've got this. Check back in and let me know how it goes!"),
            ],
        },
        {
            "title": "Feeling lonely",
            "messages": [
                ("user", "I feel so lonely even though I'm surrounded by people sometimes."),
                ("assistant", "That kind of loneliness is especially hard - feeling alone even in a crowd. It often comes from a sense of disconnection rather than physical isolation. I'm really glad you shared this. Would you like to talk about what connection would look like for you right now?"),
            ],
        },
        {
            "title": "Gratitude check-in",
            "messages": [
                ("user", "I actually had a really good day today! I finished my project and went for a walk."),
                ("assistant", "That's wonderful - I'm genuinely happy to hear you had a good day! Finishing a project and getting outside is a solid win. It's great you're noticing and appreciating the positives. Want to reflect on what made today feel different, so you can recreate it?"),
            ],
        },
        {
            "title": "Anger management",
            "messages": [
                ("user", "I got so angry at my roommate today over something small. I said things I regret."),
                ("assistant", "It sounds like frustration built up and came out all at once - that can feel really tough afterward. The fact that you regret it and want to do better shows self-awareness. Anger often signals something important is being challenged. Let's talk about what really set you off, and I can share some techniques for catching the rise before it peaks."),
            ],
        },
        {
            "title": "Learning about medication",
            "messages": [
                ("user", "My doctor prescribed sertraline. Can you tell me about it?"),
                ("assistant", "Sertraline is an SSRI commonly used for depression, anxiety, and OCD. It works by increasing serotonin in the brain to improve mood and reduce anxiety. It's very normal to have questions - and remember I can only share general info, not medical advice. It typically takes 2-6 weeks to feel full effects, and side effects like nausea usually settle in the first week. Always discuss anything specific with your doctor."),
            ],
        },
        {
            "title": "Academic pressure and motivation",
            "messages": [
                ("user", "I've lost all motivation to study. I just stare at my books and feel useless."),
                ("assistant", "Losing motivation can feel really heavy, and it's often your mind's way of telling you it's overwhelmed or burned out - not that you're useless. You are not falling behind permanently; you're struggling, and that's different. Let's make a tiny, non-intimidating goal for today - even 10 minutes of focused work with a break after."),
            ],
        },
        {
            "title": "Welcoming new user",
            "messages": [
                ("user", "Hi, I'm new here. I wanted to try this because I've been feeling down a lot lately."),
                ("assistant", "Hello! I'm so glad you reached out and took this step for yourself - that takes real courage. I'm MindEase, your mental health companion. I want to help you feel heard. Tell me a bit more about how you've been feeling, and we can take it from there together. Remember, you can log your mood, journal, or try wellness exercises whenever you like."),
            ],
        },
        {
            "title": "Panic attack help",
            "messages": [
                ("user", "I think I'm having a panic attack right now. I can't breathe and my chest feels tight."),
                ("assistant", "I'm here with you right now. You are safe, and this will pass. Let's breathe together slowly: in for 4 counts, hold for 4, out for 6. Can you do that with me? Now, look around and name 5 things you can see. You're doing great. This is a panic response, and it is temporary. Keep focusing on your breath."),
            ],
        },
        {
            "title": "Wellness exploration",
            "messages": [
                ("user", "What wellness exercises do you have? I want to try something new."),
                ("assistant", "That's a great step for your wellbeing! We have several: Box Breathing and 4-7-8 for calming, the 5-4-3-2-1 Grounding for anxiety, a Body Scan Meditation for mindfulness, Progressive Muscle Relaxation for stress relief, a CBT Thought Record for challenging negative thoughts, Gratitude Journaling, and a Sleep Wind-Down routine. Which sounds most helpful to you right now?"),
            ],
        },
    ]

    conversations_created = []
    for i, cd in enumerate(conversation_data):
        conv_date = date.today() - timedelta(days=cd["messages"].__len__() % 10 + i)
        conv = Conversation(
            id=uuid.uuid4(),
            user_id=demo_user.id,
            title=cd["title"],
            created_at=datetime.combine(conv_date, datetime.min.time().replace(hour=10)),
        )
        db.add(conv)
        db.flush()
        conversations_created.append(conv)

        for j, (role, content) in enumerate(cd["messages"]):
            msg_time = datetime.combine(conv_date, datetime.min.time().replace(hour=10 + j))
            msg = Message(
                id=uuid.uuid4(),
                conversation_id=conv.id,
                role=role,
                content=content,
                created_at=msg_time,
            )
            # Add simple emotion/intent for user messages
            if role == "user":
                msg.emotion_detected = {"emotion": "neutral", "confidence": 0.5, "severity": "low"}
                msg.intent_detected = {"intent": "general", "confidence": 0.5}
            db.add(msg)
        conv.updated_at = datetime.combine(conv_date, datetime.min.time().replace(hour=10 + len(cd["messages"])))
    db.flush()
    print(f"  Added {len(conversation_data)} conversations with messages.")

    # ---------- Audit logs ----------
    print("Seeding audit logs...")
    for action in ["register", "login", "chat_message", "mood_create", "journal_create", "wellness_session"]:
        db.add(AuditLog(
            id=uuid.uuid4(),
            user_id=demo_user.id,
            action=action,
            details={"note": "seeded demo data"},
            ip_address="127.0.0.1",
        ))
    db.flush()

    # ---------- Demo activity timeline ----------
    print("Seeding demo activity timeline...")
    demo_devices = [
        {
            "device_type": "mobile",
            "device_manufacturer": "Samsung",
            "device_model": "Galaxy S24",
            "os": "android",
            "os_version": "14",
            "app_version": "1.0.0",
            "network_type": "wifi",
        },
        {
            "device_type": "mobile",
            "device_manufacturer": "Google",
            "device_model": "Pixel 8",
            "os": "android",
            "os_version": "15",
            "app_version": "1.0.0",
            "network_type": "cellular",
        },
        {
            "device_type": "mobile",
            "device_manufacturer": "Apple",
            "device_model": "iPhone 15",
            "os": "ios",
            "os_version": "17",
            "app_version": "1.0.0",
            "network_type": "wifi",
        },
    ]
    timeline = [
        # (hour_minute_offset, event_type, event_category, status, metadata, device_idx)
        (-96, "REGISTER", "auth", "success", {"email": "demo@mindease.ai"}, 0),
        (-96, "ONBOARDING_COMPLETED", "onboarding", "success", {"goals": True}, 0),
        (-48, "LOGIN", "auth", "success", {"email": "demo@mindease.ai", "role": "user"}, 0),
        (-48, "HOME_OPENED", "navigation", "success", {"screen": "home"}, 0),
        (-47, "MOOD_CHECKIN", "mood", "success", {"mood": "neutral", "stress_level": 6, "anxiety_level": 5}, 0),
        (-46, "CHAT_STARTED", "chat", "success", {"title": "Dealing with exam stress"}, 0),
        (-45, "CHAT_MESSAGE", "chat", "success", {"intent": "general", "emotion": "stress", "character_count": 84}, 0),
        (-44, "CHAT_MESSAGE", "chat", "success", {"intent": "general", "emotion": "stress", "character_count": 61}, 0),
        (-30, "WELLNESS_STARTED", "wellness", "success", {"exercise": "breathing", "completed": False}, 1),
        (-30, "WELLNESS_COMPLETED", "wellness", "success", {"exercise": "breathing", "completed": True, "duration_seconds": 292}, 1),
        (-24, "MEDICINE_INFO_REQUEST", "medicine", "success", {"queried": True}, 1),
        (-18, "JOURNAL_CREATED", "journal", "success", {"word_count": 47}, 1),
        (-12, "PROFILE_VIEWED", "profile", "success", {"screen": "profile"}, 2),
        (-4, "LOGIN", "auth", "success", {"email": "demo@mindease.ai", "role": "user"}, 2),
        (-3, "MOOD_CHECKIN", "mood", "success", {"mood": "good", "stress_level": 3, "anxiety_level": 4}, 2),
        (-1, "CHAT_STARTED", "chat", "success", {"title": "Gratitude check-in"}, 2),
        (-1, "CHAT_MESSAGE", "chat", "success", {"intent": "general", "emotion": "positive", "character_count": 76}, 2),
        (-1, "LOGOUT", "auth", "success", {"email": "demo@mindease.ai"}, 2),
        (-96, "LOGIN_FAILED", "auth", "failed", {"email": "demo@mindease.ai"}, 0),
    ]
    for ts_offset, event_type, event_category, status_flag, metadata, dev_idx in timeline:
        device = demo_devices[dev_idx % len(demo_devices)]
        event_time = datetime.utcnow() + timedelta(hours=ts_offset)
        db.add(ActivityLog(
            id=uuid.uuid4(),
            user_id=demo_user.id,
            event_type=event_type,
            event_category=event_category,
            timestamp=event_time,
            status=status_flag,
            device_type=device["device_type"],
            device_manufacturer=device["device_manufacturer"],
            device_model=device["device_model"],
            os=device["os"],
            os_version=device["os_version"],
            app_version=device["app_version"],
            network_type=device["network_type"],
            ip_address="203.0.113.7",
            request_id=str(uuid.uuid4()),
            session_id=str(uuid.uuid4()),
            metadata=metadata,
            created_at=event_time,
        ))
    db.flush()
    print(f"  Added {len(timeline)} activity events.")

    db.commit()
    print("\n=== SEED COMPLETE ===")
    print(f"  Admin user:     {admin_email} / (password set via env, not printed)")
    print(f"  Demo user:      {demo_email} / demo123")
    print(f"  Counselor user: {counselor_email} / counselor123")
    print(f"  Exercises:      {len(exercises_data)}")
    print(f"  Medicines:      {len(medicines_data)}")
    print(f"  Emergency:      {len(emergencies_data)}")
    print(f"  Mood logs:      30")
    print(f"  Journal entries:{len(journal_data)}")
    print(f"  Conversations:  {len(conversation_data)}")
    print(f"  Counselors:     2")
    print(f"  Activity events:{len(timeline)}")

    db.close()


if __name__ == "__main__":
    main()
