import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { db } from '../db/client';
import { habitLogs, habits, users } from '../db/schema';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [habitCount, setHabitCount] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [streak, setStreak] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { isDark, toggleTheme, colors } = useTheme();

  useEffect(() => {
    AsyncStorage.getItem('userId').then(async (userId) => {
      if (userId) {
        const result = await db.select().from(users).where(eq(users.id, parseInt(userId)));
        if (result.length > 0) {
          setUsername(result[0].username);
          const date = new Date(result[0].createdAt);
          setMemberSince(date.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' }));
        }
      }
    });

    AsyncStorage.getItem('notifications').then((val) => {
      setNotificationsEnabled(val === 'true');
    });

    loadStats();
  }, []);

  const loadStats = async () => {
    const habitList = await db.select().from(habits);
    setHabitCount(habitList.length);

    const logs = await db.select().from(habitLogs).where(eq(habitLogs.completed, 1));
    setTotalLogs(logs.length);

    const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
    let s = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (dates[i] === expected.toISOString().split('T')[0]) s++;
      else break;
    }
    setStreak(s);
  };

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

  const toggleNotifications = async () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    await AsyncStorage.setItem('notifications', newVal.toString());
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.username, { color: colors.text }]}>{username}</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Member since {memberSince}</Text>
      </View>

      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>YOUR STATS</Text>
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{habitCount}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Habits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{totalLogs}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Completions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{streak} 🔥</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Day Streak</Text>
        </View>
      </View>

      {/* Settings */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>SETTINGS</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>🌙 Dark Mode</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: '#2d6a4f' }} />
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>🔔 Daily Reminders</Text>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: '#2d6a4f' }} />
        </View>
      </View>

      {/* App Info */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>APP INFO</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Version</Text>
          <Text style={[styles.infoValue, { color: colors.subtext }]}>1.0.0</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Storage</Text>
          <Text style={[styles.infoValue, { color: colors.subtext }]}>Local only</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Built with</Text>
          <Text style={[styles.infoValue, { color: colors.subtext }]}>React Native & Expo</Text>
        </View>
      </View>

      {/* Account Actions */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>ACCOUNT</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2d6a4f', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  statsCard: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, padding: 16, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#2d6a4f' },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#eee' },
  card: { marginHorizontal: 16, borderRadius: 12, padding: 16, elevation: 2 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingLabel: { fontSize: 16 },
  divider: { height: 1, marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 16 },
  infoValue: { fontSize: 16 },
  buttons: { marginHorizontal: 16, marginTop: 16, gap: 12, marginBottom: 40 },
  logoutBtn: { backgroundColor: '#2d6a4f', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#ff6b6b', padding: 16, borderRadius: 12, alignItems: 'center' },
  deleteText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});