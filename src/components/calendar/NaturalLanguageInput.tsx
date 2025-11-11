import { useState } from 'react';
import { X, Sparkles, Loader, Calendar, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';

interface NaturalLanguageInputProps {
  onClose: () => void;
  onScheduled: () => void;
}

export function NaturalLanguageInput({ onClose, onScheduled }: NaturalLanguageInputProps) {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [result, setResult] = useState<{
    task: {
      title: string;
      estimated_time: number;
      priority: string;
      tags: string[];
    };
    suggested_time: string;
    confidence: number;
    interpretation: string;
  } | null>(null);

  const handleParse = async () => {
    if (!input.trim()) return;

    try {
      setParsing(true);
      const response = await api.parseNaturalLanguage(input);
      setResult({
        task: {
          title: response.parsed_task.title,
          estimated_time: response.parsed_task.estimated_time,
          priority: response.parsed_task.priority,
          tags: response.parsed_task.tags,
        },
        suggested_time: response.suggested_time,
        confidence: response.confidence,
        interpretation: response.interpretation,
      });
    } catch (error) {
      console.error('Failed to parse input:', error);
      alert('Failed to parse your request. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleSchedule = async () => {
    if (!result) return;

    try {
      setScheduling(true);

      // Create task and schedule it
      const response = await api.parseNaturalLanguage(input);
      await api.scheduleTask(response.parsed_task, 'auto', 'week');

      alert('Task scheduled successfully!');
      onScheduled();
    } catch (error) {
      console.error('Failed to schedule:', error);
      alert('Failed to schedule task. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  const examples = [
    'schedule 30min deep work tomorrow morning',
    'add 1 hour client call friday at 2pm',
    'block 45min for gym tonight',
    'add 2 hours founder work this week',
    'schedule school revision for 1.5 hours sunday',
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default: return 'text-green-400 bg-green-900/20 border-green-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quick Add with AI</h2>
              <p className="text-sm text-gray-400">
                Describe what you want to schedule in plain English
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-6">
              {/* Input Area */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  What do you want to schedule?
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleParse();
                    }
                  }}
                  placeholder="e.g., schedule 30min deep work tomorrow morning"
                  className="w-full h-24 px-4 py-3 bg-slate-800 text-white rounded-lg border border-white/10 focus:border-violet-500 focus:outline-none resize-none"
                  autoFocus
                />
                <div className="mt-2 text-xs text-gray-500">
                  Press Cmd/Ctrl + Enter to parse
                </div>
              </div>

              {/* Examples */}
              <div>
                <div className="text-sm text-gray-400 mb-3">Examples:</div>
                <div className="space-y-2">
                  {examples.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(example)}
                      className="w-full text-left px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-gray-300 rounded-lg text-sm transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Interpretation */}
              <div className="p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
                <div className="text-sm text-violet-400 mb-2">AI Interpretation:</div>
                <div className="text-white">{result.interpretation}</div>
                <div className="mt-2 text-xs text-gray-400">
                  Confidence: {Math.round(result.confidence * 100)}%
                </div>
              </div>

              {/* Parsed Task */}
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Task Details:</div>
                  <div className="p-4 bg-slate-800/50 border border-white/10 rounded-lg">
                    <div className="text-lg font-semibold text-white mb-3">
                      {result.task.title}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">
                          {result.task.estimated_time} minutes
                        </span>
                      </div>

                      <div className={`px-3 py-1 rounded-lg border ${getPriorityColor(result.task.priority)}`}>
                        {result.task.priority}
                      </div>
                    </div>

                    {result.task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {result.task.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-slate-700 text-gray-300 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Time */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">Suggested Time:</div>
                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-semibold">
                      {format(new Date(result.suggested_time), 'EEEE, MMMM d @ h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          {result ? (
            <>
              <button
                onClick={() => setResult(null)}
                className="px-6 py-2 text-gray-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleSchedule}
                disabled={scheduling}
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {scheduling ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Schedule It
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!input.trim() || parsing}
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {parsing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Parse with AI
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
