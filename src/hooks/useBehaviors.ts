import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Behavior, BehaviorRecord } from '../types';
import { startOfDay, differenceInDays } from 'date-fns';

export function useBehaviors() {
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBehaviors();
  }, []);

  const loadBehaviors = async () => {
    try {
      const allBehaviors = await db.behaviors
        .orderBy('createdAt')
        .reverse()
        .toArray();
      setBehaviors(allBehaviors);
    } catch (error) {
      console.error('Error loading behaviors:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBehavior = async (behavior: Omit<Behavior, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak' | 'totalSlipUps'>) => {
    try {
      const newBehavior: Behavior = {
        ...behavior,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        currentStreak: 0,
        bestStreak: 0,
        totalSlipUps: 0,
      };
      await db.behaviors.add(newBehavior);
      await loadBehaviors();
      return newBehavior;
    } catch (error) {
      console.error('Error adding behavior:', error);
      throw error;
    }
  };

  const updateBehavior = async (id: string, updates: Partial<Behavior>) => {
    try {
      await db.behaviors.update(id, updates);
      await loadBehaviors();
    } catch (error) {
      console.error('Error updating behavior:', error);
      throw error;
    }
  };

  const deleteBehavior = async (id: string) => {
    try {
      // Delete all records associated with this behavior
      await db.behaviorRecords.where('behaviorId').equals(id).delete();
      await db.behaviors.delete(id);
      await loadBehaviors();
    } catch (error) {
      console.error('Error deleting behavior:', error);
      throw error;
    }
  };

  const logEntry = async (behaviorId: string, type: 'success' | 'slip_up', notes?: string) => {
    try {
      const behavior = behaviors.find(b => b.id === behaviorId);
      if (!behavior) throw new Error('Behavior not found');

      // Create record
      const record: BehaviorRecord = {
        id: crypto.randomUUID(),
        behaviorId,
        timestamp: new Date(),
        type,
        notes,
      };
      await db.behaviorRecords.add(record);

      // Update streak
      if (type === 'success') {
        const newStreak = behavior.currentStreak + 1;
        const newBestStreak = Math.max(newStreak, behavior.bestStreak);
        await db.behaviors.update(behaviorId, {
          currentStreak: newStreak,
          bestStreak: newBestStreak,
        });
      } else {
        // Slip-up resets streak
        await db.behaviors.update(behaviorId, {
          currentStreak: 0,
          totalSlipUps: behavior.totalSlipUps + 1,
        });
      }

      await loadBehaviors();
    } catch (error) {
      console.error('Error logging entry:', error);
      throw error;
    }
  };

  const getTodayStatus = async (behaviorId: string): Promise<boolean> => {
    try {
      const today = startOfDay(new Date());
      const records = await db.behaviorRecords
        .where('behaviorId')
        .equals(behaviorId)
        .toArray();

      const todayRecords = records.filter(r => {
        const recordDate = startOfDay(new Date(r.timestamp));
        return differenceInDays(recordDate, today) === 0;
      });

      return todayRecords.some(r => r.type === 'success');
    } catch (error) {
      console.error('Error checking today status:', error);
      return false;
    }
  };

  return {
    behaviors,
    loading,
    addBehavior,
    updateBehavior,
    deleteBehavior,
    logEntry,
    getTodayStatus,
    refresh: loadBehaviors,
  };
}

export function useBehaviorRecords(behaviorId?: string) {
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [behaviorId]);

  const loadRecords = async () => {
    try {
      let query = db.behaviorRecords.orderBy('timestamp').reverse();

      if (behaviorId) {
        const filtered = await query.toArray();
        setRecords(filtered.filter(r => r.behaviorId === behaviorId));
      } else {
        setRecords(await query.toArray());
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    records,
    loading,
    refresh: loadRecords,
  };
}
