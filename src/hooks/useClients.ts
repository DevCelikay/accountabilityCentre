import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Client } from '../types';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const allClients = await db.clients
        .orderBy('createdAt')
        .reverse()
        .toArray();
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const newClient: Client = {
        ...client,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      await db.clients.add(newClient);
      await loadClients();
      return newClient;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      await db.clients.update(id, updates);
      await loadClients();
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      // Check if there are tasks associated with this client
      const taskCount = await db.tasks.where('clientId').equals(id).count();
      if (taskCount > 0) {
        throw new Error('Cannot delete client with existing tasks');
      }
      await db.clients.delete(id);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  const archiveClient = async (id: string) => {
    try {
      await db.clients.update(id, { isArchived: true });
      await loadClients();
    } catch (error) {
      console.error('Error archiving client:', error);
      throw error;
    }
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    archiveClient,
    refresh: loadClients,
  };
}
