import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useClients } from '../../hooks/useClients';
import { Client } from '../../types';
import ClientForm from './ClientForm';
import ClientCard from './ClientCard';

export default function ClientsPage() {
  const { clients, loading, addClient, updateClient, deleteClient, archiveClient } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();

  const handleSubmit = async (data: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      await updateClient(editingClient.id, data);
    } else {
      await addClient(data);
    }
    setShowForm(false);
    setEditingClient(undefined);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClient(undefined);
  };

  const activeClients = clients.filter(c => !c.isArchived);
  const archivedClients = clients.filter(c => c.isArchived);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          New Client
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : activeClients.length === 0 && archivedClients.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400 mb-4">No clients yet. Create your first client or project!</p>
          <p className="text-sm text-gray-500">
            Clients help you organize your tasks by project, work area, or category.
          </p>
        </div>
      ) : (
        <>
          {activeClients.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {activeClients.map(client => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={handleEdit}
                  onDelete={deleteClient}
                  onArchive={archiveClient}
                  taskCount={0} // TODO: Calculate actual task count
                />
              ))}
            </div>
          )}

          {archivedClients.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-gray-400 mb-4 mt-8">Archived</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {archivedClients.map(client => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={handleEdit}
                    onDelete={deleteClient}
                    onArchive={archiveClient}
                    taskCount={0} // TODO: Calculate actual task count
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
