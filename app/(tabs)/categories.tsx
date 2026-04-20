import { eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../db/client';
import { categories } from '../../db/schema';

type Category = { id: number; name: string; colour: string; icon: string; userId: number };

const COLOURS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
const ICONS = ['❤️', '💪', '📚', '🧘', '🏃', '💧', '🎯', '⭐'];

export default function CategoriesScreen() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [selectedColour, setSelectedColour] = useState(COLOURS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadCategories = async () => {
    const result = await db.select().from(categories);
    setCategoryList(result);
  };

  useEffect(() => { loadCategories(); }, []);

  const openAdd = () => {
    setName(''); setSelectedColour(COLOURS[0]); setSelectedIcon(ICONS[0]); setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (cat: Category) => {
    setName(cat.name); setSelectedColour(cat.colour); setSelectedIcon(cat.icon); setEditingId(cat.id);
    setModalVisible(true);
  };

  const save = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
    if (editingId) {
      await db.update(categories).set({ name, colour: selectedColour, icon: selectedIcon }).where(eq(categories.id, editingId));
    } else {
      await db.insert(categories).values({ name, colour: selectedColour, icon: selectedIcon, userId: 1 });
    }
    setModalVisible(false);
    loadCategories();
  };

  const deleteCategory = async (id: number) => {
    Alert.alert('Delete', 'Delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(categories).where(eq(categories.id, id));
        loadCategories();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categoryList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: item.colour }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity onPress={() => openEdit(item)}><Text style={styles.btn}>✏️</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => deleteCategory(item.id)}><Text style={styles.btn}>🗑️</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No categories yet.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>+ Add Category</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit' : 'Add'} Category</Text>
            <TextInput style={styles.input} placeholder="Category name" value={name} onChangeText={setName} />
            <Text style={styles.label}>Colour</Text>
            <View style={styles.row}>
              {COLOURS.map(c => (
                <TouchableOpacity key={c} onPress={() => setSelectedColour(c)}
                  style={[styles.colourDot, { backgroundColor: c }, selectedColour === c && styles.selected]} />
              ))}
            </View>
            <Text style={styles.label}>Icon</Text>
            <View style={styles.row}>
              {ICONS.map(i => (
                <TouchableOpacity key={i} onPress={() => setSelectedIcon(i)}
                  style={[styles.iconBtn, selectedIcon === i && styles.selected]}>
                  <Text style={{ fontSize: 24 }}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 8, borderRadius: 12, padding: 12, gap: 12, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 22 },
  name: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#333' },
  btn: { fontSize: 20, marginLeft: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
  fab: { backgroundColor: '#2d6a4f', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colourDot: { width: 36, height: 36, borderRadius: 18 },
  iconBtn: { padding: 4, borderRadius: 8 },
  selected: { borderWidth: 3, borderColor: '#2d6a4f' },
  saveBtn: { backgroundColor: '#2d6a4f', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancel: { textAlign: 'center', color: '#999', marginTop: 8 },
});