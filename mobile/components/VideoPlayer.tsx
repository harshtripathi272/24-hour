/**
 * Video Player Component
 * 
 * Plays videos using WebView with embedded YouTube player.
 * This abstracts the YouTube URL from the app - the actual URL
 * comes from the backend's secure stream endpoint.
 */
import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  onWatchProgress?: (duration: number) => void;
}

export default function VideoPlayer({ streamUrl, title, onWatchProgress }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const watchStartTime = useRef<number>(Date.now());

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const togglePlay = useCallback(() => {
    const command = isPlaying ? 'pauseVideo' : 'playVideo';
    webViewRef.current?.injectJavaScript(`
      document.querySelector('iframe').contentWindow.postMessage('{"event":"command","func":"${command}","args":""}', '*');
      true;
    `);
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const command = isMuted ? 'unMute' : 'mute';
    webViewRef.current?.injectJavaScript(`
      document.querySelector('iframe').contentWindow.postMessage('{"event":"command","func":"${command}","args":""}', '*');
      true;
    `);
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Track watch progress on unmount
  React.useEffect(() => {
    return () => {
      const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
      if (onWatchProgress && watchDuration > 0) {
        onWatchProgress(watchDuration);
      }
    };
  }, [onWatchProgress]);

  // Create HTML wrapper for the YouTube embed
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            width: 100%; 
            height: 100%; 
            background: #000; 
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe
          src="${streamUrl}&enablejsapi=1&playsinline=1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webView}
          onLoadEnd={handleLoadEnd}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6c5ce7" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={togglePlay}>
          <Text style={styles.controlIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
          <Text style={styles.controlText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Use built-in player controls for seeking
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  titleContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d4f',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 28,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 40,
  },
  controlButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2d2d4f',
    borderRadius: 16,
    minWidth: 100,
  },
  controlIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  controlText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    color: '#6c6c8f',
    fontSize: 12,
    marginTop: 8,
  },
});
