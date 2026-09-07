import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

/**
 * The MindEase AI orb — a branded, calm animated glow with 4 states:
 * idle / thinking / responding / crisis. Uses only the built-in Animated API.
 */
export type OrbState = "idle" | "thinking" | "responding" | "crisis";

interface Props {
  state: OrbState;
  size?: number;
}

export function AiOrb({ state, size = 92 }: Props) {
  const { palette } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const spinners: Animated.CompositeAnimation[] = [];
    if (state === "thinking" || state === "responding") {
      const spin = Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 2600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spin.start();
      spinners.push(spin);
    }
    Animated.timing(glow, {
      toValue: state === "crisis" ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    return () => spinners.forEach((s) => s.stop());
  }, [state, rotate, glow]);

  const scale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.05, 0.92] });
  const spinDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const orbitColor =
    state === "crisis"
      ? palette.danger
      : state === "responding"
      ? palette.lavender
      : state === "thinking"
      ? palette.brand
      : palette.brandDark;

  const haloOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          styles.halo,
          {
            backgroundColor: state === "crisis" ? palette.danger : palette.brand,
            width: size,
            height: size,
            opacity: haloOpacity,
            transform: [{ scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbit,
          {
            borderColor: orbitColor,
            width: size,
            height: size,
            transform: [{ rotate: spinDeg }],
            opacity: state === "idle" ? 0.55 : 0.85,
          },
        ]}
      >
        {[0, 90, 180, 270].map((deg) => (
          <View
            key={deg}
            style={[
              styles.planet,
              {
                backgroundColor: orbitColor,
                transform: [
                  { rotate: `${deg}deg` },
                  { translateY: -size / 2 + 6 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>
      <Animated.View
        style={[
          styles.core,
          {
            backgroundColor: state === "crisis" ? palette.danger : palette.brand,
            width: size * 0.42,
            height: size * 0.42,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { borderRadius: 999, position: "absolute", opacity: 0.3 },
  orbit: {
    borderRadius: 999,
    borderWidth: 2,
    position: "absolute",
  },
  planet: { width: 10, height: 10, borderRadius: 5, position: "absolute", left: "50%", top: "50%", marginLeft: -5, marginTop: -5 },
  core: { borderRadius: 999 },
});