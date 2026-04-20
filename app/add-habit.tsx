import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { db } from '../db/client';
import { categories, habits } from '../db/schema';

export default function AddHabitScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryList, setCategoryList] = useState<{ id: number; name: string; colour: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    db.select({ id: categories.id, name: categories.name, colour: categories.colour })
      .from(categories)
      .then(setCategoryList);
  }, []);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a habit name'); return; }
    if (!selectedCategory) { Alert.alert('Error', 'Please select a category'); return; }
    await db.insert(habits).values({
      name,
      description,
      categoryId: selectedCategory,
      userId: 1,
      createdAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Habit Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Drink Water" value={name} onChangeText={setName} />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput style={styles.input} placeholder="e.g. Drink 8 glasses" value={description} onChangeText={setDescription} />

      <Text style={styles.label}>Category</Text>
      {categoryList.map(cat => (
        <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)}
          style={[styles.catBtn, selectedCategory === cat.id && { backgroundColor: cat.colour }]}>
          <Text style={{ color: selectedCategory === cat.id ? '#fff' : '#333' }}>{cat.name}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>Save Habit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  catBtn: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginBottom: 8, backgroundColor: '#fff' },
  saveBtn: { backgroundColor: '#2d6a4f', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});