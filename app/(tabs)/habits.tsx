import { and, eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [filtered, setFiltered] = useState<Habit[]>([]);
  const [search, setSearch] = useState('');
  const [categoryList, setCategoryList] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
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
    setFiltered(habitsWithLogs);

    const cats = await db.select({ id: categories.id, name: categories.name }).from(categories);
    setCategoryList(cats);
  };

  useEffect(() => { loadHabits(); }, []);

  useEffect(() => {
    let results = habitList;
    if (search) {
      results = results.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (selectedCategory) {
      results = results.filter(h => h.categoryId === selectedCategory);
    }
    setFiltered(results);
  }, [search, selectedCategory, habitList]);

  const logToday = async (habitId: number, alreadyLogged: boolean) => {
    if (alreadyLogged) {
      Alert.alert('Already logged', 'You have already logged this habit today!');
      return;
    }
    await db.insert(habitLogs).values({ habitId, date: today, count: 1, completed: 1, notes: null });
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
      <TextInput
        style={styles.searchBar}
        placeholder="🔍 Search habits..."
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, !selectedCategory && styles.filterActive]}
          onPress={() => setSelectedCategory(null)}>
          <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {categoryList.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterBtn, selectedCategory === cat.id && styles.filterActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}>
            <Text style={[styles.filterText, selectedCategory === cat.id && styles.filterTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
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
              <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/edit-habit?id=${item.id}`)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteHabit(item.id)}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No habits found.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-habit')}>
        <Text style={styles.fabText}>+ Add Habit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  searchBar: { backgroundColor: '#fff', margin: 8, borderRadius: 12, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, gap: 6, marginBottom: 4 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  filterActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  filterText: { fontSize: 12, color: '#333' },
  filterTextActive: { color: '#fff' },
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
  editBtn: { backgroundColor: '#45B7D1', borderRadius: 6, padding: 6, marginBottom: 4, alignItems: 'center' },
  editBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#ff6b6b', borderRadius: 6, padding: 6, alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },
  fab: { backgroundColor: '#2d6a4f', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});