import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../db/client';
import { users } from '../db/schema';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userId').then(async (userId) => {
      if (userId) {
        const result = await db.select().from(users).where(eq(users.id, parseInt(userId)));
        if (result.length > 0) setUsername(result[0].username);
      }
    });
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userId');
    router.replace('/login');
  };

  const handleDeleteAccount = async () => {
    Alert.alert('Delete Account', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          await db.delete(users).where(eq(users.id, parseInt(userId)));
          await AsyncStorage.removeItem('userId');
          router.replace('/login');
        }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.username}>{username}</Text>
      <Text style={styles.subtitle}>Habit Tracker Account</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>🗑️ Delete Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', alignItems: 'center', paddingTop: 60 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2d6a4f', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#999', marginBottom: 40 },
  section: { width: '100%', paddingHorizontal: 24, gap: 12 },
  logoutBtn: { backgroundColor: '#2d6a4f', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#ff6b6b', padding: 16, borderRadius: 12, alignItems: 'center' },
  deleteText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});