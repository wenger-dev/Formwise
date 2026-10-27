import React from 'react';
import { Screen } from '../../components/ui';
import { ProfileForm } from '../../features/profile/ProfileForm';
import { useFocusRevision } from '../../hooks/useFocusRevision';
export default function ProfileScreen() {
  const revision = useFocusRevision();
  return (
    <Screen title="All about you." subtitle="Your goals can grow with you.">
      <ProfileForm key={revision} />
    </Screen>
  );
}
