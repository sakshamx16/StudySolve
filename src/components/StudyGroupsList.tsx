import { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Plus, 
  Check, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { StudyGroup, Subject } from '../types';

interface StudyGroupsListProps {
  groups: StudyGroup[];
  onToggleJoinGroup: (groupId: string) => void;
  onSelectGroupMaterials: (groupId: string) => void;
  onOpenCreateGroupModal: () => void;
  onDeleteGroup: (groupId: string) => void;
  onRestoreDefaultGroups?: () => void;
}

const subjects: (Subject | 'All')[] = [
  'All',
  'Financial Accounting',
  'Cost & Management Accounting',
  'Economics',
  'Taxation & GST',
  'Corporate & Business Law',
  'Financial Management & Investment',
  'Business Studies & Management',
  'Business Mathematics & Statistics',
  'Auditing & Assurance',
];

export default function StudyGroupsList({
  groups,
  onToggleJoinGroup,
  onSelectGroupMaterials,
  onOpenCreateGroupModal,
  onDeleteGroup,
  onRestoreDefaultGroups,
}: StudyGroupsListProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [groupToDelete, setGroupToDelete] = useState<StudyGroup | null>(null);

  const allSubjects = Array.from(
    new Set([
      ...subjects,
      ...groups.map((g) => g.subject).filter((s) => s && s.trim().length > 0),
    ])
  );

  const filteredGroups = groups.filter((g) => {
    if (selectedSubject === 'All') return true;
    return g.subject === selectedSubject;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 mb-1">
            <Users className="w-3.5 h-3.5" /> Peer Study Circles
          </div>
          <h2 className="text-xl font-bold">Collaborate in Accountancy & Finance Groups</h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mt-1">
            Join or form study groups with fellow students and peers. Share trial balances, tax calculations, and case studies.
          </p>
        </div>

        <button
          onClick={onOpenCreateGroupModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Subject filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {allSubjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSubject === sub
                ? 'bg-stone-900 text-white font-semibold'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {sub === 'All' ? 'All Subjects' : sub}
          </button>
        ))}
      </div>

      {/* Groups Grid or Empty State */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-14 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto mb-4 border border-stone-200 shadow-2xs">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            {groups.length === 0 ? 'No study groups remaining' : 'No groups found for this subject'}
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
            {groups.length === 0
              ? 'All groups have been cleared. You can create a new study circle anytime or restore the default circles.'
              : 'Try choosing "All Subjects" or create a new dedicated group for this subject.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {groups.length === 0 && onRestoreDefaultGroups && (
              <button
                onClick={onRestoreDefaultGroups}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
              >
                Restore Default Groups
              </button>
            )}
            <button
              onClick={onOpenCreateGroupModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Group</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-stone-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group/card"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-2xl shadow-2xs">
                      {group.badgeEmoji}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {group.subject}
                      </span>
                      <h3 className="font-bold text-base text-stone-900 mt-1 leading-snug">
                        {group.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGroupToDelete(group);
                    }}
                    title="Delete group"
                    aria-label={`Delete ${group.name}`}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 opacity-80 hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-3">
                  {group.description}
                </p>

                {group.meetingFrequency && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100 mb-4">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">Sessions: {group.meetingFrequency}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-stone-500 py-2 border-t border-stone-100">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <strong className="text-stone-800">{group.memberCount}</strong> members
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                    <strong className="text-stone-800">{group.materialsCount}</strong> problem sets
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => onToggleJoinGroup(group.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                    group.isJoined
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {group.isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <span>+ Join Group</span>
                  )}
                </button>

                <button
                  onClick={() => onSelectGroupMaterials(group.id)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-blue-600 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span>View Problems</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">
              Delete Study Group?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900">{groupToDelete.name}</strong>? 
              This will remove this group from your active study circles.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGroup(groupToDelete.id);
                  setGroupToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Group</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
