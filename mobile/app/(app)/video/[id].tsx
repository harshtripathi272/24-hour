/**
 * Video Player Screen - Clean Black & White Theme with Fixed Playback
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { VideoAPI, StreamResponse } from '../../../services/api';

export default function VideoScreen() {
  const { id, title, playbackToken } = useLocalSearchParams<{
    id: string;
    title: string;
    playbackToken: string;
  }>();
  const router = useRouter();

  const [streamData, setStreamData] = useState<StreamResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const watchStartTime = useRef<number>(Date.now());

  const fetchStreamUrl = useCallback(async () => {
    if (!id || !playbackToken) {
      setError('Missing video information');
      setIsLoading(false);
      return;
    }

    try {
      const response = await VideoAPI.getStreamUrl(id, playbackToken);
      setStreamData(response);
    } catch (err: unknown) {
      const errorMessage = 
        err instanceof Error 
          ? (err as unknown as { response?: { data?: { message?: string } } }).response?.data?.message || err.message
          : 'Failed to load video';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id, playbackToken]);

  useEffect(() => {
    fetchStreamUrl();
  }, [fetchStreamUrl]);

  useEffect(() => {
    return () => {
      const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
      if (id && watchDuration > 5) {
        VideoAPI.trackWatch(id, watchDuration, false).catch(() => {});
      }
    };
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const togglePlayPause = () => {
    const command = isPlaying ? 'pauseVideo' : 'playVideo';
    webViewRef.current?.injectJavaScript(`
      try {
        document.querySelector('iframe')?.contentWindow?.postMessage('{"event":"command","func":"${command}","args":""}', '*');
      } catch(e) {}
      true;
    `);
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const command = isMuted ? 'unMute' : 'mute';
    webViewRef.current?.injectJavaScript(`
      try {
        document.querySelector('iframe')?.contentWindow?.postMessage('{"event":"command","func":"${command}","args":""}', '*');
      } catch(e) {}
      true;
    `);
    setIsMuted(!isMuted);
  };

  const getVideoHtml = (url: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <iframe
          src="${url}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error || !streamData) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to Play</Text>
            <Text style={styles.errorMessage}>{error || 'Unknown error'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStreamUrl}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.videoWrapper}>
          <View style={styles.videoContainer}>
            <WebView
              ref={webViewRef}
              source={{ html: getVideoHtml(streamData.stream_url) }}
              style={styles.webView}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.videoTitle}>{title || streamData.title}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>STREAMING</Text>
          </View>
        </View>

        <View style={styles.controlsSection}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={togglePlayPause}
            activeOpacity={0.7}
          >
            <View style={styles.controlCirclePrimary}>
              <Text style={styles.controlIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
            </View>
            <Text style={styles.controlLabel}>{isPlaying ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleMute}
            activeOpacity={0.7}
          >
            <View style={styles.controlCircle}>
              <Text style={styles.controlIconSecondary}>{isMuted ? '🔇' : '🔊'}</Text>
            </View>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Use video controls for seeking</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  backIcon: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  headerSpacer: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 28,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  videoWrapper: {
    paddingHorizontal: 16,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  infoSection: {
    padding: 20,
    paddingBottom: 12,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 26,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#222',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingVertical: 24,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlCirclePrimary: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  controlIcon: {
    fontSize: 18,
    color: '#000',
  },
  controlIconSecondary: {
    fontSize: 22,
  },
  controlLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#444',
    marginTop: 8,
  },
});
