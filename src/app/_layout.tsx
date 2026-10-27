import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Empty, Loading, Screen } from '../components/ui';
import { useApp } from '../store/useApp';
import { colors } from '../constants/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function RootLayout() {
  const { data, error, initialize } = useApp();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    void initialize();
  }, [initialize]);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {error ? (
        <Screen title="Let’s get you back on track.">
          <Empty
            title="Your data needs attention"
            body={error}
            action={<Button title="Try again" onPress={() => void initialize()} />}
          />
        </Screen>
      ) : !data ? (
        <Loading />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: reducedMotion ? 'none' : 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="plan/[id]" />
          <Stack.Screen name="session/[id]" />
          <Stack.Screen name="history" />
          <Stack.Screen name="coach" />
          <Stack.Screen name="exercise-video" />
          <Stack.Screen name="backup-preview" />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}
