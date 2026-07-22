'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import MangakaAppShell from '@/components/mangaka/MangakaAppShell';
import { useMangakaDashboard } from '@/hooks/useMangakaDashboard';
import MangakaDashboardOverview from './MangakaDashboardOverview';
import MangakaSeriesTab from './MangakaSeriesTab';
import MangakaChaptersTab from './MangakaChaptersTab';
import MangakaPageEditorTab from './MangakaPageEditorTab';
import MangakaTasksTab from './MangakaTasksTab';
import MangakaFilesTab from './MangakaFilesTab';
import MangakaEditorialTab from './MangakaEditorialTab';
import MangakaRankingsTab from './MangakaRankingsTab';
import MangakaNotificationsTab from './MangakaNotificationsTab';
import MangakaSettingsTab from './MangakaSettingsTab';

export function MangakaDashboard() {
  const {
    activeTab,
    setActiveTab,
    modalInfo,
    setModalInfo,
    triggerModal,
    handleTaskAction,
    filteredTasks,
    series,
    seriesLoading,
    seriesError,
    fetchSeries,
  } = useMangakaDashboard();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <MangakaDashboardOverview
            triggerModal={triggerModal}
            handleTaskAction={handleTaskAction}
            filteredTasks={filteredTasks}
          />
        );
      case 'My Series':
        return (
          <MangakaSeriesTab
            seriesError={seriesError}
            seriesLoading={seriesLoading}
            series={series}
            fetchSeries={fetchSeries}
            triggerModal={triggerModal}
          />
        );
      case 'Chapters':
        return <MangakaChaptersTab series={series} triggerModal={triggerModal} />;
      case 'Page Editor':
        return (
          <MangakaPageEditorTab
            setActiveTab={setActiveTab}
            triggerModal={triggerModal}
          />
        );
      case 'Tasks':
        return (
          <MangakaTasksTab
            triggerModal={triggerModal}
          />
        );
      case 'Files':
        return <MangakaFilesTab triggerModal={triggerModal} />;
      case 'Editorial Reviews':
        return <MangakaEditorialTab triggerModal={triggerModal} />;
      case 'Rankings':
        return <MangakaRankingsTab triggerModal={triggerModal} />;
      case 'Notifications':
        return <MangakaNotificationsTab />;
      case 'Settings':
        return <MangakaSettingsTab triggerModal={triggerModal} />;
      default:
        return <div className="text-slate-800 text-xs font-bold">Module loaded.</div>;
    }
  };

  return (
    <MangakaAppShell activeSidebarItem={activeTab} onSidebarNavigate={setActiveTab}>
      {renderTabContent()}

      {/* Dynamic Interaction Modal */}
      {modalInfo?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setModalInfo(null)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white border border-slate-150 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-burgundy-750 animate-bounce" />
              {modalInfo.title}
            </h3>
            
            <p className="text-xs font-medium text-slate-550 leading-relaxed mt-3 border border-slate-100 bg-slate-50 p-4 rounded-lg">
              {modalInfo.content}
            </p>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setModalInfo(null)}
                className="px-4 py-2 bg-burgundy-850 hover:bg-burgundy-900 active:bg-burgundy-950 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </MangakaAppShell>
  );
}
export default MangakaDashboard;
