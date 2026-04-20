import { eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { db } from '../../db/client';
import { categories, habitLogs, habits } from '../../db/schema';

const screenWidth = Dimensions.get('window').width;

export default function InsightsScreen() {
  const [stats, setStats] = useState<{ name: string; colour: string; completed: number; total: number }[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [streak, setStreak] = useState(0);

  const load = async () => {
    const habitList = await db.select({
      id: habits.id,
      name: habits.name,
      colour: categories.colour,
    }).from(habits).leftJoin(categories, eq(habits.categoryId, categories.id));

    const results = [];
    let overall = 0;

    for (const habit of habitList) {
      const logs = await db.select().from(habitLogs).where(eq(habitLogs.habitId, habit.id));
      const completed = logs.filter(l => l.completed === 1).length;
      overall += completed;
      results.push({ name: habit.name, colour: habit.colour || '#4ECDC4', completed, total: logs.length });
    }

    setStats(results);
    setTotalCompleted(overall);

    // Calculate streak
    const allLogs = await db.select().from(habitLogs).where(eq(habitLogs.completed, 1));
    const dates = [...new Set(allLogs.map(l => l.date))].sort().reverse();
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

  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalCompleted}</Text>
          <Text style={styles.statLabel}>Total Completions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{streak} 🔥</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Completion Rate by Habit</Text>
      {stats.map((item, index) => {
        const rate = item.total > 0 ? item.completed / item.total : 0;
        return (
          <View key={index} style={styles.barCard}>
            <View style={styles.barHeader}>
              <Text style={styles.barName}>{item.name}</Text>
              <Text style={styles.barPct}>{Math.round(rate * 100)}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${rate * 100}%` as any, backgroundColor: item.colour }]} />
            </View>
            <Text style={styles.barSub}>{item.completed} / {item.total} days</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  row: { flexDirection: 'row', gap: 8, margin: 16 },
  statCard: { flex: 1, backgroundColor: '#2d6a4f', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#a8d5b5', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 16, marginBottom: 8 },
  barCard: { backgroundColor: '#fff', margin: 8, borderRadius: 12, padding: 16, elevation: 2 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  barPct: { fontSize: 14, fontWeight: 'bold', color: '#2d6a4f' },
  barBg: { height: 12, backgroundColor: '#f0f0f0', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: 6 },
  barSub: { fontSize: 12, color: '#999', marginTop: 6 },
});