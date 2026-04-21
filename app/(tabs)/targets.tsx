import { and, eq, gte } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../db/client';
import { habitLogs, habits, targets } from '../../db/schema';

type Target = { 
  id: number; 
  habitId: number; 
  habitName: string; 
  goalCount: number; 
  period: string;
  progress: number;
};

export default function TargetsScreen() {
  const [targetList, setTargetList] = useState<Target[]>([]);
  const [habitList, setHabitList] = useState<{ id: number; name: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<number | null>(null);
  const [goalCount, setGoalCount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const load = async () => {
    const result = await db.select({
      id: targets.id,
      habitId: targets.habitId,
      habitName: habits.name,
      goalCount: targets.goalCount,
      period: targets.period,
    }).from(targets).leftJoin(habits, eq(targets.habitId, habits.id));

    const today = new Date();
    const targetsWithProgress = await Promise.all(result.map(async (target) => {
      let startDate = new Date();
      if (target.period === 'weekly') {
        startDate.setDate(today.getDate() - today.getDay());
      } else {
        startDate.setDate(1);
      }
      const startStr = startDate.toISOString().split('T')[0];
      const logs = await db.select().from(habitLogs)
        .where(and(eq(habitLogs.habitId, target.habitId), eq(habitLogs.completed, 1), gte(habitLogs.date, startStr)));
      return { ...target, progress: logs.length } as Target;
    }));

    setTargetList(targetsWithProgress);
    const h = await db.select({ id: habits.id, name: habits.name }).from(habits);
    setHabitList(h);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!selectedHabit || !goalCount) { Alert.alert('Error', 'Fill in all fields'); return; }
    await db.insert(targets).values({ 
      habitId: selectedHabit, 
      userId: 1, 
      goalCount: parseInt(goalCount), 
      period, 
      createdAt: new Date().toISOString() 
    });
    setModalVisible(false);
    load();
  };

  const deleteTarget = async (id: number) => {
    Alert.alert('Delete', 'Delete this target?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(targets).where(eq(targets.id, id));
        load();
      }},
    ]);
  };

  const getStatus = (progress: number, goal: number) => {
  if (progress >= goal) return { label: 'Achieved!', colour: '#2d6a4f' };
  if (progress >= goal * 0.7) return { label: 'On Track', colour: '#f4a261' };
  return { label: 'Behind', colour: '#e63946' };
};

  return (
    <View style={styles.container}>
      <FlatList
        data={targetList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const rate = Math.min(item.progress / item.goalCount, 1);
          const status = getStatus(item.progress, item.goalCount);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.habitName}>{item.habitName}</Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTarget(item.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.goal}>{item.goalCount} times {item.period}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${rate * 100}%` as any, backgroundColor: status.colour }]} />
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{item.progress} / {item.goalCount} completed</Text>
                <Text style={[styles.statusLabel, { color: status.colour }]}>{status.label}</Text>
              </View>
              <Text style={styles.remaining}>
                {item.progress >= item.goalCount ? 'Target met!' : `${item.goalCount - item.progress} more to go`}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No targets yet.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => {
        setSelectedHabit(null); setGoalCount(''); setPeriod('weekly');
        setModalVisible(true);
      }}>
        <Text style={styles.fabText}>+ Add Target</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Target</Text>
            <Text style={styles.label}>Select Habit</Text>
            {habitList.map(h => (
              <TouchableOpacity key={h.id} onPress={() => setSelectedHabit(h.id)}
                style={[styles.habitBtn, selectedHabit === h.id && styles.habitSelected]}>
                <Text style={{ color: selectedHabit === h.id ? '#fff' : '#333' }}>{h.name}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.label}>Goal Count</Text>
            <TextInput style={styles.input} placeholder="e.g. 5" keyboardType="numeric" value={goalCount} onChangeText={setGoalCount} />
            <Text style={styles.label}>Period</Text>
            <View style={styles.row}>
              {(['weekly', 'monthly'] as const).map(p => (
                <TouchableOpacity key={p} onPress={() => setPeriod(p)}
                  style={[styles.periodBtn, period === p && styles.periodSelected]}>
                  <Text style={{ color: period === p ? '#fff' : '#333' }}>{p}</Text>
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
  card: { backgroundColor: '#fff', margin: 8, borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  habitName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  goal: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 8 },
  barBg: { height: 12, backgroundColor: '#f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: 12, borderRadius: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 12, color: '#666' },
  statusLabel: { fontSize: 12, fontWeight: 'bold' },
  remaining: { fontSize: 12, color: '#999', marginTop: 4 },
  btn: { fontSize: 20 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
  fab: { backgroundColor: '#2d6a4f', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  label: { fontSize: 14, fontWeight: '600', color: '#555' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 8 },
  habitBtn: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 4 },
  habitSelected: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  periodBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  periodSelected: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  saveBtn: { backgroundColor: '#2d6a4f', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancel: { textAlign: 'center', color: '#999', marginTop: 8 },
  deleteBtn: { backgroundColor: '#ff6b6b', borderRadius: 6, padding: 6, alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});