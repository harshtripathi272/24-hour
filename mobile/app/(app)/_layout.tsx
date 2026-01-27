/**
 * App Layout - Clean Black & White Tab Navigation
 */
import { Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';

export default function AppLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopWidth: 1,
            borderTopColor: '#222',
            paddingTop: 10,
            paddingBottom: 10,
            height: 70,
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#666',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <Text style={[styles.iconText, focused && styles.iconTextActive]}>H</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => (
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <Text style={[styles.iconText, focused && styles.iconTextActive]}>S</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="video/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconBoxActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  iconTextActive: {
    color: '#000',
  },
});
