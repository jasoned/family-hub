import { motion } from 'framer-motion';
import { CalendarEvent, FamilyMember } from '../../types';
import { Calendar, Clock, MapPin, Pencil, Repeat, Tag, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

interface EventPopoverProps {
  event: CalendarEvent;
  member: FamilyMember;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

const EVENT_TYPES = {
  'School': { color: '#3B82F6', bg: '#EFF6FF' },
  'Work': { color: '#6366F1', bg: '#EEF2FF' },
  'Fun': { color: '#EC4899', bg: '#FCE7F3' },
  'Appointment': { color: '#10B981', bg: '#ECFDF5' },
  'Meal': { color: '#F59E0B', bg: '#FFFBEB' },
  'Chores': { color: '#9333EA', bg: '#F5F3FF' },
  'Sports': { color: '#EF4444', bg: '#FEF2F2' },
  'Birthday': { color: '#F97316', bg: '#FFF7ED' },
  'Holiday': { color: '#14B8A6', bg: '#F0FDFA' },
  'FamilyTime': { color: '#8B5CF6', bg: '#F5F3FF' },
  'Other': { color: '#6B7280', bg: '#F9FAFB' }
};

export default function EventPopover({ event, member, onClose, onEdit, onDelete }: EventPopoverProps) {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };
  
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const eventTypeInfo = event.eventType ? EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] : EVENT_TYPES.Other;
  
  // Get recurrence description for display
  const getRecurrenceDescription = () => {
    if (!event.isRecurring) return null;
    
    let text = '';
    
    switch (event.recurrencePattern) {
      case 'daily':
        text = event.recurrenceInterval === 1 
          ? 'Repeats daily' 
          : `Repeats every ${event.recurrenceInterval} days`;
        break;
      case 'weekly':
        if (event.recurrenceInterval === 1) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          if (event.recurrenceDaysOfWeek && event.recurrenceDaysOfWeek.length > 0) {
            const selectedDays = event.recurrenceDaysOfWeek.map(day => days[day]).join(', ');
            text = `Repeats weekly on ${selectedDays}`;
          } else {
            text = `Repeats weekly on ${format(startDate, 'EEEE')}`;
          }
        } else {
          text = `Repeats every ${event.recurrenceInterval} weeks`;
        }
        break;
      case 'monthly':
        text = event.recurrenceInterval === 1 
          ? `Repeats monthly on day ${event.recurrenceDayOfMonth || startDate.getDate()}` 
          : `Repeats every ${event.recurrenceInterval} months`;
        break;
      default:
        text = 'Repeats regularly';
    }
    
    if (event.recurrenceEndDate) {
      text += ` until ${format(new Date(event.recurrenceEndDate), 'MMM d, yyyy')}`;
    }
    
    return text;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute z-50 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-4 w-80"
      style={{ top: '100%', left: '50%', transform: 'translateX(-50%)' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-2">
          <h3 
            className="text-lg font-semibold mb-1 text-slate-800 dark:text-white" 
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {event.title}
          </h3>
          
          <div className="flex items-center text-xs mb-2">
            <div 
              className="w-4 h-4 rounded-full mr-1.5"
              style={{ backgroundColor: member.color }}
            ></div>
            <span className="text-slate-600 dark:text-slate-300">{member.name}</span>
            
            {event.eventType && (
              <span 
                className="ml-2 px-1.5 py-0.5 rounded text-xs" 
                style={{ 
                  backgroundColor: eventTypeInfo.bg,
                  color: eventTypeInfo.color
                }}
              >
                {event.eventType}
              </span>
            )}
            
            {event.isRecurring && (
              <span className="ml-2 flex items-center text-indigo-500 dark:text-indigo-400">
                <Repeat size={12} className="mr-0.5" />
                <span>Recurring</span>
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <div className="flex items-start">
          <Calendar size={16} className="mt-0.5 mr-2 text-indigo-500" />
          <div>
            {formatDate(startDate)}
          </div>
        </div>
        
        <div className="flex items-start">
          <Clock size={16} className="mt-0.5 mr-2 text-indigo-500" />
          <div>
            {event.allDay ? (
              <div>All-day event</div>
            ) : (
              <div>
                {formatTime(startDate)} - {formatTime(endDate)}
              </div>
            )}
          </div>
        </div>
        
        {event.location && (
          <div className="flex items-start">
            <MapPin size={16} className="mt-0.5 mr-2 text-indigo-500" />
            <div>{event.location}</div>
          </div>
        )}
        
        {event.eventType && (
          <div className="flex items-start">
            <Tag size={16} className="mt-0.5 mr-2 text-indigo-500" />
            <div>{event.eventType}</div>
          </div>
        )}
        
        {event.description && (
          <div className="bg-gray-50 dark:bg-slate-700/50 p-2 rounded mt-2 text-slate-600 dark:text-slate-300">
            {event.description}
          </div>
        )}
        
        {event.isRecurring && (
          <div className="flex items-start mt-3">
            <Repeat size={16} className="mt-0.5 mr-2 text-indigo-500" />
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {getRecurrenceDescription()}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={() => onDelete(event.id)}
          className="p-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Delete event"
        >
          <Trash2 size={16} />
        </button>
        
        <button
          onClick={() => onEdit(event)}
          className="p-1.5 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors flex items-center"
          title="Edit event"
        >
          <Pencil size={16} />
          <span className="ml-1 text-xs">Edit</span>
        </button>
      </div>
    </motion.div>
  );
}
