import { useState } from 'react';
import { FamilyMember } from '../types';
import { User, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FamilyMemberFormProps {
  member?: FamilyMember;
  onSubmit: (member: Omit<FamilyMember, 'id'>) => void;
  onCancel: () => void;
}

const colorOptions = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
];

export default function FamilyMemberForm({ member, onSubmit, onCancel }: FamilyMemberFormProps) {
  const [name, setName] = useState(member?.name || '');
  const [color, setColor] = useState(
    member?.color || colorOptions[Math.floor(Math.random() * colorOptions.length)].value,
  );
  const [initial, setInitial] = useState(member?.initial || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // If no initial is provided, use the first letter of the name
    const memberInitial = initial.trim() || name.trim()[0].toUpperCase();

    onSubmit({
      name: name.trim(),
      color,
      initial: memberInitial,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-50 dark:border-slate-800"
    >
      <div className="flex justify-between items-center mb-6">
        <h2
          className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {member ? 'Edit Family Member' : 'Add Family Member'}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-20 h-20 rounded-full mb-3 flex items-center justify-center text-white text-2xl shadow-md"
            style={{ backgroundColor: color }}
          >
            {initial || (name ? name[0] : <User size={32} />)}
          </div>
        </div>

        <div className="mb-5">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="initial"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Initial (optional)
          </label>
          <input
            type="text"
            id="initial"
            value={initial}
            onChange={(e) => setInitial(e.target.value.slice(0, 1).toUpperCase())}
            maxLength={1}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
          />
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Leave blank to use the first letter of the name
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Color
          </label>
          <div className="grid grid-cols-8 gap-2">
            {colorOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-8 h-8 rounded-full ${
                  color === option.value
                    ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900'
                    : ''
                }`}
                style={{ backgroundColor: option.value }}
                onClick={() => setColor(option.value)}
                title={option.name}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {member ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
