import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
// Forms re-read saved preferences when revisited after a backup restore or another tab's edits.
export function useFocusRevision() {
  const [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setRevision((value) => value + 1);
    }, []),
  );
  return revision;
}
