import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Button, Label } from '../../components/ui';
import { colors as c } from '../../constants/theme';
import { youtubeEmbed, youtubeThumbnail, youtubeWatch } from '../../lib/youtube';
import * as Linking from 'expo-linking';

type State = 'thumbnail' | 'loading' | 'playing' | 'error';

export function YouTubePlayer({ videoId }: { videoId: string }) {
  // Track videoId in state so we can reset playerState when it changes (avoids setState in effect).
  const [trackedId, setTrackedId] = useState(videoId);
  const [playerState, setPlayerState] = useState<State>('thumbnail');
  const [hidden, setHidden] = useState(false);

  if (trackedId !== videoId) {
    setTrackedId(videoId);
    setPlayerState('thumbnail');
  }

  useEffect(() => {
    // Guard against SSR environments where document is unavailable.
    if (typeof document === 'undefined') return;
    const onChange = () => {
      const isHidden = document.hidden;
      setHidden(isHidden);
      // Collapse to thumbnail when tab is hidden so the iframe unmounts.
      if (isHidden) setPlayerState('thumbnail');
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  const openExternal = () => void Linking.openURL(youtubeWatch(videoId));

  return (
    <View style={styles.container}>
      {/* Thumbnail / tap-to-play */}
      {playerState === 'thumbnail' && !hidden && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Watch demonstration"
          onPress={() => setPlayerState('playing')}
          style={styles.thumbnailWrap}
        >
          {/* Use a native img element for the thumbnail on web */}
          {React.createElement('img', {
            src: youtubeThumbnail(videoId),
            alt: '',
            style: {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            },
          })}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Label style={styles.playIcon}>▶</Label>
            </View>
          </View>
          <View style={styles.tapHint}>
            <Label style={styles.tapHintText}>Tap to load video</Label>
          </View>
        </Pressable>
      )}

      {/* Embedded iframe player */}
      {playerState === 'playing' && !hidden &&
        React.createElement('iframe', {
          ...{ credentialless: '' },
          src: youtubeEmbed(videoId),
          title: 'YouTube exercise demonstration',
          width: '100%',
          height: '100%',
          style: { border: 0, flex: 1 },
          allow:
            'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen; autoplay',
          allowFullScreen: true,
          referrerPolicy: 'strict-origin-when-cross-origin',
          onError: () => setPlayerState('error'),
        })}

      {/* Loading fallback for the brief moment before iframe is rendered */}
      {playerState === 'loading' && (
        <View style={styles.loadingContainer}>
          <Label muted>Loading…</Label>
        </View>
      )}

      {/* Error state with integrated fallback */}
      {playerState === 'error' && (
        <View style={styles.errorContainer}>
          <Label muted style={styles.errorText}>
            This video could not be embedded — it may be restricted or your browser may be blocking
            the embed.
          </Label>
          <Button
            title="Open in YouTube"
            icon="external-link"
            tone="secondary"
            onPress={openExternal}
          />
          <Button
            title="Try again"
            icon="refresh-cw"
            tone="secondary"
            onPress={() => setPlayerState('thumbnail')}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 200,
    maxHeight: 420,
    backgroundColor: '#000',
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumbnailWrap: {
    flex: 1,
    backgroundColor: '#111',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  playIcon: {
    color: '#fff',
    fontSize: 22,
    marginLeft: 4,
  },
  tapHint: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  errorText: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  mutedText: {
    color: c.muted,
  },
});
