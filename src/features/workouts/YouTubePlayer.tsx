import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Button, Label } from '../../components/ui';
import { colors as c } from '../../constants/theme';
import { youtubeEmbed, youtubeThumbnail, youtubeWatch } from '../../lib/youtube';
import * as Linking from 'expo-linking';

// Safely require react-native-webview — it needs a native build; Expo Go won't have it.
let WebView: React.ComponentType<any> | null = null;
try {
  WebView = require('react-native-webview').WebView; // eslint-disable-line @typescript-eslint/no-require-imports
} catch {
  // Native module unavailable (Expo Go). Fall back to external-link-only UI.
}

type State = 'thumbnail' | 'loading' | 'playing' | 'error';

export function YouTubePlayer({ videoId }: { videoId: string }) {
  const [playerState, setPlayerState] = useState<State>('thumbnail');
  const [appActive, setAppActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );
  // When the app backgrounds, collapse back to thumbnail so the player unmounts.
  const prevVideoId = useRef(videoId);
  useEffect(() => {
    if (videoId !== prevVideoId.current) {
      prevVideoId.current = videoId;
      setPlayerState('thumbnail');
    }
  }, [videoId]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const active = state === 'active';
      setAppActive(active);
      if (!active) setPlayerState('thumbnail');
    });
    return () => sub.remove();
  }, []);

  const openExternal = () => void Linking.openURL(youtubeWatch(videoId));

  // When WebView isn't available (Expo Go), show a simple external-link card.
  if (!WebView) {
    return (
      <View style={styles.noNativeContainer}>
        <Feather name="youtube" size={32} color={c.muted} />
        <Label muted style={styles.noNativeText}>
          In-app video playback requires a development build. Tap below to watch on YouTube.
        </Label>
        <Button title="Open in YouTube" icon="external-link" tone="secondary" onPress={openExternal} />
      </View>
    );
  }

  const WV = WebView;

  return (
    <View style={styles.container}>
      {/* Thumbnail / tap-to-play */}
      {playerState === 'thumbnail' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Watch demonstration"
          onPress={() => setPlayerState('loading')}
          style={styles.thumbnailWrap}
        >
          <Image
            source={{ uri: youtubeThumbnail(videoId) }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Feather name="play" size={26} color="#fff" />
            </View>
          </View>
          <View style={styles.tapHint}>
            <Label style={styles.tapHintText}>Tap to load video</Label>
          </View>
        </Pressable>
      )}

      {/* Loading spinner shown while WebView initialises */}
      {playerState === 'loading' && (
        <>
          <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]} pointerEvents="none">
            <ActivityIndicator color={c.lime} size="large" />
            <Label muted style={styles.loadingText}>
              Loading…
            </Label>
          </View>
          {appActive && (
            <WV
              key={videoId}
              source={{
                uri: youtubeEmbed(videoId),
                // Identify the app as required by YouTube's WebView integration guidance.
                // Use a proper https URL with the bundle identifier as the host component.
                headers:
                  Platform.OS !== 'web'
                    ? { Referer: 'https://www.youtube.com/', Origin: 'https://www.youtube.com' }
                    : undefined,
              }}
              style={styles.webview}
              allowsInlineMediaPlayback
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction
              setSupportMultipleWindows={false}
              javaScriptEnabled
              domStorageEnabled
              onLoad={() => setPlayerState('playing')}
              onError={() => setPlayerState('error')}
              onHttpError={() => setPlayerState('error')}
            />
          )}
        </>
      )}

      {/* Active player */}
      {playerState === 'playing' && appActive && (
        <WV
          key={videoId}
          source={{
            uri: youtubeEmbed(videoId),
            headers:
              Platform.OS !== 'web'
                ? { Referer: 'https://www.youtube.com/', Origin: 'https://www.youtube.com' }
                : undefined,
          }}
          style={styles.webview}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
          onError={() => setPlayerState('error')}
          onHttpError={() => setPlayerState('error')}
        />
      )}

      {/* Error state with integrated fallback */}
      {playerState === 'error' && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={32} color={c.muted} />
          <Label muted style={styles.errorText}>
            This video could not be embedded — it may be restricted or unavailable.
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
  noNativeContainer: {
    width: '100%',
    minHeight: 160,
    backgroundColor: '#111',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  noNativeText: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
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
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
    fontSize: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
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
    maxWidth: 260,
  },
});
