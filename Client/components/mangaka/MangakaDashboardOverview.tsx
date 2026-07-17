import React from 'react';
import { Sparkles, Plus, Upload, BookOpen, Layers, FileText, Clock, Award } from 'lucide-react';
import StatCard from './StatCard';
import ChapterProgressCard from './ChapterProgressCard';
import DeadlineList from './DeadlineList';
import TaskTable, { TaskItem } from './TaskTable';
import EditorialFeedbackCard from './EditorialFeedbackCard';
import RankingRiskCard from './RankingRiskCard';
import { DEADLINES } from '@/data/mock/mangaka.mock';

interface MangakaDashboardOverviewProps {
  triggerModal: (title: string, content: string) => void;
  handleTaskAction: (taskId: string, actionType: string) => void;
  filteredTasks: TaskItem[];
}

export default function MangakaDashboardOverview({
  triggerModal,
  handleTaskAction,
  filteredTasks,
}: MangakaDashboardOverviewProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 1. Hero Header */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-burgundy-50/20 rounded-full blur-3xl -z-10" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-plum-50/15 rounded-full blur-2xl -z-10" />
        
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-burgundy-50 text-burgundy-900 border border-burgundy-100/60 mb-3">
            <Sparkles size={12} className="text-burgundy-750" />
            Manga Creation Workflow Active
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Good morning, Akira
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1 max-w-xl">
            Here is your manga studio production status today. Revisions are outstanding for Chapter 11, and Chapter 12 is nearing deadline.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0 w-full md:w-auto">
          <button 
            onClick={() => triggerModal("New Manga Series", "Initialize a new manga production workflow. Specify target demographics, serialization frequency (weekly/monthly), outlines, and key assistants.")}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 active:bg-slate-100 transition-all duration-150 shadow-sm"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>New Series</span>
          </button>
          <button 
            onClick={() => triggerModal("New Manga Chapter", "Define a new chapter workflow. Set release timelines, page constraints, task checklists, and distribute page allocations to studio assistants.")}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-plum-700 hover:bg-plum-800 active:bg-plum-900 transition-all duration-150 shadow-[0_2px_4px_rgba(91,14,45,0.1)]"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>New Chapter</span>
          </button>
          <button 
            onClick={() => triggerModal("Upload Drawing Page", "Select files (PNG, PSD, TIFF, clip format) to upload. Link uploads directly to specific chapter pages for editor review.")}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-burgundy-800 hover:bg-burgundy-900 active:bg-burgundy-950 transition-all duration-150 shadow-[0_2px_4px_rgba(107,29,47,0.15)]"
          >
            <Upload size={14} className="stroke-[2.5]" />
            <span>Upload Page</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Series đang quản lý"
          value={4}
          icon={BookOpen}
          description="↑ 1 series mới"
          trend={{ value: "+1", isPositive: true }}
          highlightColor="plum"
        />
        <StatCard
          title="Chapters đang thực hiện"
          value={3}
          icon={Layers}
          description="2 sắp đến hạn"
          highlightColor="default"
        />
        <StatCard
          title="Bài nộp chờ duyệt"
          value={5}
          icon={FileText}
          description="3 cần bạn xem"
          highlightColor="teal"
        />
        <StatCard
          title="Tasks sắp đến hạn"
          value={8}
          icon={Clock}
          description="2 đã quá hạn"
          highlightColor="amber"
        />
        <StatCard
          title="Nguy cơ ranking thấp"
          value={1}
          icon={Award}
          description="Crimson Days #18"
          trend={{ value: "Drop", isPositive: false }}
          highlightColor="burgundy"
        />
      </div>

      {/* 3. Main Grid (Progress & Deadlines) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChapterProgressCard
            series="Blue Moon"
            chapter="Chapter 12: The Broken Gate"
            deadlineText="2 ngày nữa (23/05/2025)"
            deadlineUrgency="warning"
            coverUrl="/assets/manga_artist_hero.png"
            status="In Progress"
            progress={78}
            pagesCompleted={14}
            pagesTotal={18}
            tasksApproved={22}
            tasksTotal={30}
            onOpen={() => triggerModal("Open Chapter 12", "Opening Blue Moon Chapter 12 workspace. Detail dashboard displays completed layers, assistant chats, guidelines, and editor notes.")}
            onSubmit={() => triggerModal("Submit for Review", "Confirming submission of Chapter 12 (14/18 pages approved) to Chief Editor Sato. Submitting before completing all pages requires editor exception approval.")}
          />
        </div>
        <div className="lg:col-span-1">
          <DeadlineList deadlines={DEADLINES} />
        </div>
      </div>

      {/* 4. Task Table & Secondary alerts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskTable tasks={filteredTasks} onAction={handleTaskAction} />
        </div>
        
        <div className="lg:col-span-1 flex flex-col gap-6">
          <EditorialFeedbackCard
            chapter="Chapter 11: Final Edits"
            editorName="Sato"
            status="Revision Required"
            note="Dialogue pacing on page 7 needs improvement. Break up Akira's second panel bubble."
            onViewFeedback={() => triggerModal("Editorial Feedback: Chapter 11", "Dialogue spacing issue in Panel 2 of Page 7. Editor Sato notes: 'The dramatic payoff is lost because Akira's bubble is crowded. Suggest splitting the dialog block into two separate text elements.'")}
          />
          
          <RankingRiskCard
            series="Crimson Days"
            currentRank={18}
            previousRank={13}
            riskLevel="Medium"
            onViewRanking={() => triggerModal("Ranking History: Crimson Days", "Crimson Days started serialization at Rank #8, reached a peak of #4, but has dropped over the last 3 weeks due to slower narrative pacing. Editorial board suggestions: Increase action beats in upcoming chapters.")}
          />
        </div>
      </div>
    </div>
  );
}
