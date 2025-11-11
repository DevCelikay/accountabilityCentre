import { useState } from 'react';
import { X, Save, Trash2, Calendar, Clock, Tag, Zap } from 'lucide-react';
import { CalendarEvent, api } from '../../services/api';
import { format } from 'date-fns';

interface EventEditModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onSaved: () => void;
}

export function EventEditModal({ event, onClose, onSaved }: EventEditModalProps) {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || '',
    start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
    priority: event.priority || 'medium',
    energy_required: event.energy_required || 'medium',
    is_flexible: event.is_flexible,
    status: event.status,
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await api.updateCalendarEvent(event.id, {
        title: formData.title,
        description: formData.description,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        priority: formData.priority as any,
        energy_required: formData.energy_required as any,
        is_flexible: formData.is_flexible,
        status: formData.status as any,
      });

      onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      setDeleting(true);
      await api.deleteCalendarEvent(event.id);
      onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const isGoogleEvent = event.source === 'google_calendar';
  const isAIScheduled = event.ai_scheduled;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Event</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                {isGoogleEvent && (
                  <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded">
                    Google Calendar
                  </span>
                )}
                {isAIScheduled && (
                  <span className="px-2 py-0.5 bg-violet-600/20 text-violet-400 rounded flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    AI Scheduled
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event description (optional)"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Energy Required */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Energy Required
            </label>
            <select
              value={formData.energy_required}
              onChange={(e) => handleChange('energy_required', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="high">High Energy</option>
              <option value="medium">Medium Energy</option>
              <option value="low">Low Energy</option>
              <option value="recharge">Recharge / Rest</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>

          {/* Flexible Flag */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_flexible"
              checked={formData.is_flexible}
              onChange={(e) => handleChange('is_flexible', e.target.checked)}
              className="w-4 h-4 bg-slate-800 border border-white/10 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is_flexible" className="text-sm text-gray-300">
              This event is flexible and can be rescheduled
            </label>
          </div>

          {/* AI Reasoning (if available) */}
          {event.ai_reasoning && (
            <div className="p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
              <div className="text-xs font-semibold text-violet-400 mb-1">
                AI Scheduling Reasoning
              </div>
              <div className="text-sm text-gray-300">{event.ai_reasoning}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:shadow-blue-500/50 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
