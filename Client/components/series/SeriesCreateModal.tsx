import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { CreateSeriesRequest, PublicationFrequency } from '@/types/manga';

interface SeriesCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSeriesRequest) => Promise<void>;
  isCreating: boolean;
}

export default function SeriesCreateModal({
  isOpen,
  onClose,
  onSubmit,
  isCreating,
}: SeriesCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [frequency, setFrequency] = useState<PublicationFrequency>('Weekly');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit({
      title,
      description: description || undefined,
      genre: genre || undefined,
      frequency,
    });
    // Reset form fields
    setTitle('');
    setDescription('');
    setGenre('');
    setFrequency('Weekly');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-850">
          <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400 animate-bounce" />
            Add New Manga Series
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Series Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isCreating}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shadow Syndicate"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Genre
            </label>
            <input
              type="text"
              disabled={isCreating}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. Action, Fantasy, Shonen"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Publication Frequency
            </label>
            <select
              value={frequency}
              disabled={isCreating}
              onChange={(e) => setFrequency(e.target.value as PublicationFrequency)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="Weekly">Weekly</option>
              <option value="Biweekly">Biweekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Irregular">Irregular</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Synopsis & Description
            </label>
            <textarea
              disabled={isCreating}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief story summary..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isCreating ? (
                <>
                  <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Series'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
