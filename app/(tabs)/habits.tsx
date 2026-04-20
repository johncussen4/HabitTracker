import { and, eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../db/client';
import { categories, habitLogs, habits } from '../../db/schema';

type Habit = {
  id: number;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  categoryColour: string;
  loggedToday: boolean;
};

export default function HabitsScreen() {
  const [habitList, setHabitList] = useState<Habit[]>([]);
  const today = new Date().toISOString().split('T')[0];

  const loadHabits = async () => {
    const result = await db.select({
      id: habits.id,
      name: habits.name,
      description: habits.description,
      categoryId: habits.categoryId,
      categoryName: categories.name,
      categoryColour: categories.colour,
    })
    .from(habits)
    .leftJoin(categories, eq(habits.categoryId, categories.id));

    const habitsWithLogs = await Promise.all(result.map(async (habit) => {
      const log = await db.select().from(habitLogs)
        .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.date, today)));
      return { ...habit, loggedToday: log.length > 0 && log[0].completed === 1 } as Habit;
    }));

    setHabitList(habitsWithLogs);
  };

  useEffect(() => { loadHabits(); }, []);

  const logToday = async (habitId: number, alreadyLogged: boolean) => {
    if (alreadyLogged) {
      Alert.alert('Already logged', 'You have already logged this habit today!');
      return;
    }
    await db.insert(habitLogs).values({
      habitId,
      date: today,
      count: 1,
      completed: 1,
      notes: null,
    });
    loadHabits();
  };

  const deleteHabit = async (id: number) => {
    Alert.alert('Delete Habit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(habits).where(eq(habits.id, id));
        loadHabits();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={habitList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.colourBar, { backgroundColor: item.categoryColour }]} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.category}>{item.categoryName}</Text>
              {item.description && <Text style={styles.desc}>{item.description}</Text>}
              <TouchableOpacity
                style={[styles.logBtn, item.loggedToday && styles.loggedBtn]}
                onPress={() => logToday(item.id, item.loggedToday)}>
                <Text style={styles.logBtnText}>{item.loggedToday ? '✓ Done Today' : 'Log Today'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => router.push(`/edit-habit?id=${item.id}`)}>
                <Text style={styles.edit}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteHabit(item.id)}>
                <Text style={styles.delete}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No habits yet. Add one!</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-habit')}>
        <Text style={styles.fabText}>+ Add Habit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  card: { flexDirection: 'row', backgroundColor: '#fff', margin: 8, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  colourBar: { width: 6 },
  info: { flex: 1, padding: 12 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  category: { fontSize: 12, color: '#666', marginTop: 2 },
  desc: { fontSize: 12, color: '#999', marginTop: 4 },
  logBtn: { backgroundColor: '#2d6a4f', borderRadius: 8, padding: 8, marginTop: 8, alignItems: 'center' },
  loggedBtn: { backgroundColor: '#95d5b2' },
  logBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  actions: { justifyContent: 'center', padding: 12, gap: 8 },
  edit: { fontSize: 20 },
  delete: { fontSize: 20 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },
  fab: { backgroundColor: '#2d6a4f', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});