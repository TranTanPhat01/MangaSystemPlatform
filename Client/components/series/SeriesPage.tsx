'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { Plus, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useSeries } from '@/hooks/useSeries';
import SeriesGrid from './SeriesGrid';
import SeriesCreateModal from './SeriesCreateModal';
import SeriesEmptyState from './SeriesEmptyState';
import { CreateSeriesRequest } from '@/types/manga';

export default function SeriesPage() {
  const {
    series,
    isLoading,
    error,
    isCreating,
    successMessage,
    fetchSeries,
    createSeries,
    submitProposal,
    clearError,
    clearSuccess,
  } = useSeries();

  const [modalOpen, setModalOpen] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Auto clear notifications after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(clearSuccess, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCreateSubmit = async (data: CreateSeriesRequest) => {
    const newSeries = await createSeries(data);
    if (newSeries) {
      setModalOpen(false);
    }
  };

  const handleSubmitProposal = async (id: string) => {
    setSubmittingId(id);
    try {
      await submitProposal(id);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Banner notifications */}
        <div className="space-y-3">
          {error && (
            <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-rose-400 hover:text-rose-200 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={clearSuccess} className="text-emerald-400 hover:text-emerald-200 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Manga Series</h1>
            <p className="text-xs text-slate-500 font-medium">Create, publish, and track serialization pipelines of registered titles.</p>
          </div>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-650/10 transition-all duration-200"
          >
            <Plus size={14} />
            Add Series
          </button>
        </div>

        {/* Loading / Content State */}
        {isLoading && series.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-semibold mt-3">Loading series list...</span>
          </div>
        ) : series.length === 0 ? (
          <SeriesEmptyState onAddClick={() => setModalOpen(true)} />
        ) : (
          <SeriesGrid
            seriesList={series}
            onSubmitProposal={handleSubmitProposal}
            submittingId={submittingId}
          />
        )}
      </div>

      {/* Create Modal */}
      <SeriesCreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isCreating={isCreating}
      />
    </DashboardLayoutWrapper>
  );
}
