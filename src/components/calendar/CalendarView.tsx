import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Zap, Edit } from 'lucide-react';
import { CalendarEvent } from '../../services/api';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

interface HoveredEvent {
  event: CalendarEvent;
  x: number;
  y: number;
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );
  const [hoveredEvent, setHoveredEvent] = useState<HoveredEvent | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6am to 10pm

  const getEventsForDay = (day: Date) => {
    return events.filter(event =>
      isSameDay(parseISO(event.start_time), day)
    );
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const top = ((startHour - 6) / 16) * 100; // 6am = 0%, 10pm = 100%
    const height = ((endHour - startHour) / 16) * 100;

    return { top: `${top}%`, height: `${height}%` };
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.source === 'google_calendar') return 'bg-blue-600';
    if (event.ai_scheduled) {
      if (event.priority === 'urgent') return 'bg-red-600';
      if (event.priority === 'high') return 'bg-orange-600';
      if (event.priority === 'medium') return 'bg-yellow-600';
      return 'bg-green-600';
    }
    return 'bg-gray-600';
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateWeek('prev')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>

        <div className="text-lg font-semibold text-white">
          {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </div>

        <button
          onClick={() => navigateWeek('next')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-8 gap-2">
        {/* Time Labels */}
        <div className="col-span-1 space-y-[3.9rem]">
          <div className="h-8"></div> {/* Header spacer */}
          {hours.map(hour => (
            <div key={hour} className="text-xs text-gray-500 text-right pr-2">
              {format(new Date().setHours(hour, 0), 'h a')}
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {weekDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={dayIndex} className="col-span-1">
              {/* Day Header */}
              <div className={`h-8 flex flex-col items-center justify-center rounded-lg mb-2 ${
                isToday ? 'bg-blue-600/20 border border-blue-500/50' : ''
              }`}>
                <div className="text-xs text-gray-400">{format(day, 'EEE')}</div>
                <div className={`text-sm font-semibold ${
                  isToday ? 'text-blue-400' : 'text-white'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Events Container */}
              <div className="relative h-[64rem] bg-slate-800/30 rounded-lg border border-white/5">
                {/* Hour Lines */}
                {hours.map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 border-t border-white/5"
                    style={{ top: `${(idx / 16) * 100}%` }}
                  ></div>
                ))}

                {/* Events */}
                {dayEvents.map((event, idx) => {
                  const position = getEventPosition(event);
                  const colorClass = getEventColor(event);
                  const isHovered = hoveredEvent?.event.id === event.id;

                  return (
                    <div
                      key={idx}
                      className={`absolute left-1 right-1 ${colorClass} rounded px-2 py-1 text-xs text-white overflow-hidden cursor-pointer hover:shadow-lg hover:z-10 transition-all group ${isHovered ? 'ring-2 ring-white/50' : ''}`}
                      style={position}
                      onClick={() => onEventClick(event)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredEvent({ event, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredEvent(null)}
                    >
                      <div className="font-semibold truncate flex items-center gap-1">
                        {event.ai_scheduled && <Zap className="w-3 h-3" />}
                        {event.title}
                        <button
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/20 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] opacity-80 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {format(parseISO(event.start_time), 'h:mm a')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span>Google Calendar</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span>AI Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span>Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-600 rounded"></div>
          <span>High Priority</span>
        </div>
      </div>
    </div>
  );
}
