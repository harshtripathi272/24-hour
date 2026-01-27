/**
 * Video Player Screen
 * 
 * Plays a video using the secure stream URL from the backend.
 * The actual YouTube URL is never exposed to the app - it comes
 * from the backend's /video/:id/stream endpoint.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoAPI, StreamResponse } from '../../../services/api';
import VideoPlayer from '../../../components/VideoPlayer';

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

  const fetchStreamUrl = useCallback(async () => {
    if (!id || !playbackToken) {
      setError('Missing video information');
      setIsLoading(false);
      return;
    }

    try {
      // Get secure stream URL from backend
      // The backend validates the playback token and returns the embed URL
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

  const handleWatchProgress = useCallback(async (duration: number) => {
    if (id && duration > 5) {
      try {
        // Track watch progress (bonus feature)
        await VideoAPI.trackWatch(id, duration, false);
      } catch {
        // Silently fail - tracking is non-critical
      }
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !streamData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Play Video</Text>
          <Text style={styles.errorMessage}>{error || 'Unknown error occurred'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStreamUrl}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <VideoPlayer
        streamUrl={streamData.stream_url}
        title={title || streamData.title}
        onWatchProgress={handleWatchProgress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d4f',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a0a0c0',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#a0a0c0',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
