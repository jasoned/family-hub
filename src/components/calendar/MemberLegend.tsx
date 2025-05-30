import React from 'react';
import { FamilyMember } from '../../types';
import { Filter, Users } from 'lucide-react';

interface MemberLegendProps {
  members: FamilyMember[];
  className?: string;
  selectedMembers?: string[];
  onMemberClick?: (memberId: string) => void;
  interactive?: boolean;
  onSelectAll?: () => void;
}

export default function MemberLegend({
  members,
  className = '',
  selectedMembers = [],
  onMemberClick,
  interactive = false,
  onSelectAll,
}: MemberLegendProps) {
  if (members.length === 0) {
    return null;
  }

  const allSelected = selectedMembers.length === 0 || selectedMembers.length === members.length;

  return (
    <div
      className={`p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Users size={16} className="text-indigo-500 mr-2" />
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Family Member Legend
          </h3>
        </div>

        {interactive && onSelectAll && (
          <button
            onClick={onSelectAll}
            className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center hover:underline"
          >
            <Filter size={12} className="mr-1" />
            {allSelected ? 'Filter Members' : 'Show All'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {interactive && onSelectAll && (
          <div
            className={`flex items-center px-2.5 py-1 rounded-lg transition-colors ${
              interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
            } ${
              allSelected
                ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-1 ring-indigo-300 dark:ring-indigo-700'
                : 'bg-gray-50 dark:bg-slate-700/50'
            }`}
            onClick={onSelectAll}
          >
            <div className="w-3 h-3 rounded-full mr-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">All Family</span>
          </div>
        )}

        {members.map((member) => (
          <div
            key={member.id}
            className={`flex items-center px-2.5 py-1 rounded-lg transition-colors ${
              interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
            } ${
              selectedMembers.includes(member.id) || selectedMembers.length === 0
                ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-1 ring-indigo-300 dark:ring-indigo-700'
                : 'bg-gray-50 dark:bg-slate-700/50'
            }`}
            onClick={interactive && onMemberClick ? () => onMemberClick(member.id) : undefined}
          >
            <div
              className="w-3 h-3 rounded-full mr-1.5"
              style={{ backgroundColor: member.color }}
            ></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">{member.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
