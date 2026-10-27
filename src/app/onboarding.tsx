import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Heading, Icon, Label, Screen } from '../components/ui';
import { Athlete } from '../components/visuals';
import { colors as c } from '../constants/theme';
import { ProfileForm } from '../features/profile/ProfileForm';
export default function Onboarding() {
  return (
    <Screen title="Welcome to formwise." subtitle="A stronger you starts with a little momentum.">
      <View
        style={{
          backgroundColor: c.lime,
          borderRadius: 28,
          padding: 24,
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: 1, gap: 14 }}>
          <Icon name="aperture" color={c.bg} size={32} />
          <Label style={{ color: c.bg, fontSize: 30, lineHeight: 35, fontWeight: '800' }}>
            Your pace.{'\n'}Your progress.
          </Label>
          <Label style={{ color: '#42532D', maxWidth: 240 }}>
            Plan your workouts. Find your rhythm. Keep showing up.
          </Label>
        </View>
        <Athlete size={150} />
      </View>
      <Badge>OFFLINE FIRST · NO ACCOUNT NEEDED</Badge>
      <Heading small>Make yourself at home.</Heading>
      <Label muted>
        A few details help make your space feel like you. Everything here is optional.
      </Label>
      <ProfileForm onboarding onDone={() => router.replace('/')} />
    </Screen>
  );
}
