/**
 * Dashboard Screen
 * 
 * Displays 2 video tiles fetched from the backend.
 * Pure rendering - no business logic, just displays what API returns.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { VideoAPI, Video } from '../../services/api';
import VideoTile from '../../components/VideoTile';

export default function DashboardScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const fetchVideos = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      const response = await VideoAPI.getDashboard();
      setVideos(response.videos);
    } catch (error: unknown) {
      const errorMessage = 
        error instanceof Error 
          ? (error as unknown as { response?: { data?: { message?: string } } }).response?.data?.message || error.message
          : 'Failed to load videos';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleVideoPress = (video: Video) => {
    // Navigate to video player with video data passed as params
    router.push({
      pathname: '/(app)/video/[id]',
      params: {
        id: video.id,
        title: video.title,
        playbackToken: video.playback_token,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchVideos(true)}
            tintColor="#6c5ce7"
            colors={['#6c5ce7']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>👋 Welcome back!</Text>
          <Text style={styles.subtitle}>Here's what's new for you</Text>
        </View>

        {videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📺</Text>
            <Text style={styles.emptyTitle}>No videos available</Text>
            <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
          </View>
        ) : (
          <View style={styles.videosContainer}>
            <Text style={styles.sectionTitle}>Featured Videos</Text>
            {videos.map((video) => (
              <VideoTile
                key={video.id}
                video={video}
                onPress={() => handleVideoPress(video)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#a0a0c0',
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0c0',
  },
  videosContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c6c8f',
  },
});
