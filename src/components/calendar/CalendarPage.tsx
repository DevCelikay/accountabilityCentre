import { useState, useEffect } from 'react';
import { Calendar, Bot, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { api, CalendarEvent } from '../../services/api';
import { useTasks } from '../../hooks/useTasks';
import { AIScheduler } from './AIScheduler';
import { CalendarView } from './CalendarView';
import { NaturalLanguageInput } from './NaturalLanguageInput';
import { EventEditModal } from './EventEditModal';

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showAIScheduler, setShowAIScheduler] = useState(false);
  const [showNLInput, setShowNLInput] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const { tasks } = useTasks();

  useEffect(() => {
    loadCalendarData();
    checkGoogleConnection();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const calendarEvents = await api.getCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      const status = await api.getCalendarStatus();
      setGoogleConnected(status.connected);
    } catch (error) {
      console.error('Failed to check Google connection:', error);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setSyncing(true);
      await api.syncCalendar(false);
      await loadCalendarData();
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      alert('Failed to sync calendar. Make sure Google Calendar is connected.');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { auth_url } = await api.getGoogleAuthUrl();
      window.open(auth_url, '_blank', 'width=600,height=600');

      // Poll for connection status
      const pollInterval = setInterval(async () => {
        const status = await api.getCalendarStatus();
        if (status.connected) {
          setGoogleConnected(true);
          clearInterval(pollInterval);
          await handleSyncCalendar();
        }
      }, 2000);

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
    }
  };

  const handleRebalance = async () => {
    try {
      const confirmed = confirm(
        'Rebalance today\'s schedule? This will reschedule flexible tasks based on current priorities.'
      );

      if (!confirmed) return;

      setSyncing(true);
      const result = await api.rebalanceSchedule(
        'manual_rebalance',
        new Date().toISOString(),
        'day'
      );

      alert(`Schedule rebalanced!\n\n${result.reasoning}\n\nMoved: ${result.moved_tasks.length} tasks\nDeferred: ${result.deferred_tasks.length} tasks`);

      await loadCalendarData();
    } catch (error) {
      console.error('Failed to rebalance:', error);
      alert('Failed to rebalance schedule');
    } finally {
      setSyncing(false);
    }
  };

  const unscheduledTasks = tasks.filter(
    task => task.status !== 'completed'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                AI Calendar
              </h1>
              <p className="text-gray-400 text-sm">
                Intelligent scheduling powered by GPT-4
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {!googleConnected ? (
              <button
                onClick={handleConnectGoogle}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Connect Google Calendar
              </button>
            ) : (
              <button
                onClick={handleSyncCalendar}
                disabled={syncing}
                className="px-4 py-2 bg-slate-800 text-gray-200 rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync
              </button>
            )}

            <button
              onClick={handleRebalance}
              disabled={syncing}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Rebalance Day
            </button>

            <button
              onClick={() => setShowNLInput(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Quick Add
            </button>

            <button
              onClick={() => setShowAIScheduler(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              AI Schedule ({unscheduledTasks.length})
            </button>
          </div>
        </div>

        {/* Google Connection Status */}
        {googleConnected && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">
              Google Calendar connected and syncing
            </span>
          </div>
        )}

        {/* Calendar View */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <CalendarView events={events} onEventClick={(event) => setEditingEvent(event)} />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Total Events</div>
            <div className="text-2xl font-bold text-white">{events.length}</div>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">AI Scheduled</div>
            <div className="text-2xl font-bold text-blue-400">
              {events.filter(e => e.ai_scheduled).length}
            </div>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Unscheduled Tasks</div>
            <div className="text-2xl font-bold text-orange-400">
              {unscheduledTasks.length}
            </div>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">This Week</div>
            <div className="text-2xl font-bold text-green-400">
              {events.filter(e => {
                const eventDate = new Date(e.start_time);
                const today = new Date();
                const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return eventDate >= today && eventDate <= weekFromNow;
              }).length}
            </div>
          </div>
        </div>
      </div>

      {/* AI Scheduler Modal */}
      {showAIScheduler && (
        <AIScheduler
          tasks={unscheduledTasks}
          onClose={() => setShowAIScheduler(false)}
          onScheduled={() => {
            setShowAIScheduler(false);
            loadCalendarData();
          }}
        />
      )}

      {/* Natural Language Input Modal */}
      {showNLInput && (
        <NaturalLanguageInput
          onClose={() => setShowNLInput(false)}
          onScheduled={() => {
            setShowNLInput(false);
            loadCalendarData();
          }}
        />
      )}

      {/* Event Edit Modal */}
      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => {
            setEditingEvent(null);
            loadCalendarData();
          }}
        />
      )}
    </div>
  );
}
