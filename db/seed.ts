import { db } from './client';
import { categories, habitLogs, habits, targets, users } from './schema';

export async function seedIfEmpty() {
  const existing = await db.select().from(users);
  if (existing.length > 0) return;

  await db.insert(users).values({
    username: 'john',
    password: 'password123',
    createdAt: new Date().toISOString(),
  });

  await db.insert(categories).values([
    { name: 'Health', colour: '#FF6B6B', icon: '❤️', userId: 1 },
    { name: 'Fitness', colour: '#4ECDC4', icon: '💪', userId: 1 },
    { name: 'Study', colour: '#45B7D1', icon: '📚', userId: 1 },
    { name: 'Mindfulness', colour: '#96CEB4', icon: '🧘', userId: 1 },
  ]);

  await db.insert(habits).values([
    { name: 'Drink Water', description: 'Drink 8 glasses', categoryId: 1, userId: 1, createdAt: new Date().toISOString() },
    { name: 'Exercise', description: '30 min workout', categoryId: 2, userId: 1, createdAt: new Date().toISOString() },
    { name: 'Read', description: 'Read 20 minutes', categoryId: 3, userId: 1, createdAt: new Date().toISOString() },
    { name: 'Meditate', description: '10 min meditation', categoryId: 4, userId: 1, createdAt: new Date().toISOString() },
  ]);

  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    await db.insert(habitLogs).values([
      { habitId: 1, date: dateStr, count: Math.floor(Math.random() * 8) + 1, completed: 1 },
      { habitId: 2, date: dateStr, count: 1, completed: Math.random() > 0.3 ? 1 : 0 },
      { habitId: 3, date: dateStr, count: 1, completed: Math.random() > 0.4 ? 1 : 0 },
      { habitId: 4, date: dateStr, count: 1, completed: Math.random() > 0.5 ? 1 : 0 },
    ]);
  }

  await db.insert(targets).values([
    { habitId: 1, userId: 1, goalCount: 8, period: 'weekly', createdAt: new Date().toISOString() },
    { habitId: 2, userId: 1, goalCount: 5, period: 'weekly', createdAt: new Date().toISOString() },
    { habitId: 3, userId: 1, goalCount: 7, period: 'weekly', createdAt: new Date().toISOString() },
    { habitId: 4, userId: 1, goalCount: 5, period: 'weekly', createdAt: new Date().toISOString() },
  ]);

  console.log('Database seeded!');
}