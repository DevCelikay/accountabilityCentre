import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Task } from '../types';

export function useTasks(clientId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [clientId]);

  const loadTasks = async () => {
    try {
      let query = db.tasks.orderBy('createdAt').reverse();

      if (clientId) {
        const filtered = await query.toArray();
        setTasks(filtered.filter(t => t.clientId === clientId));
      } else {
        setTasks(await query.toArray());
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      await db.tasks.add(newTask);
      await loadTasks();
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const addManyTasks = async (tasks: Omit<Task, 'id' | 'createdAt'>[]) => {
    try {
      const newTasks: Task[] = tasks.map(task => ({
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }));
      await db.tasks.bulkAdd(newTasks);
      await loadTasks();
      return newTasks;
    } catch (error) {
      console.error('Error adding tasks:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await db.tasks.update(id, updates);
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await db.tasks.delete(id);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const completeTask = async (id: string) => {
    try {
      await db.tasks.update(id, {
        status: 'completed',
        completedAt: new Date(),
      });
      await loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  return {
    tasks,
    loading,
    addTask,
    addManyTasks,
    updateTask,
    deleteTask,
    completeTask,
    refresh: loadTasks,
  };
}
