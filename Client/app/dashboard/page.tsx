'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  FileText, 
  Clock, 
  Award, 
  Plus, 
  Upload, 
  BookOpenCheck,
  CheckCircle,
  FileCheck,
  TrendingDown,
  TrendingUp,
  Image as ImageIcon,
  Compass,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  FolderKanban,
  Settings as SettingsIcon,
  HelpCircle,
  Play
} from 'lucide-react';

// Import custom components
import MangakaAppShell from '@/components/mangaka/MangakaAppShell';
import StatCard from '@/components/mangaka/StatCard';
import ChapterProgressCard from '@/components/mangaka/ChapterProgressCard';
import DeadlineList from '@/components/mangaka/DeadlineList';
import TaskTable, { TaskItem } from '@/components/mangaka/TaskTable';
import EditorialFeedbackCard from '@/components/mangaka/EditorialFeedbackCard';
import RankingRiskCard from '@/components/mangaka/RankingRiskCard';
import StatusBadge from '@/components/mangaka/StatusBadge';
import PriorityBadge from '@/components/mangaka/PriorityBadge';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; title: string; content: string } | null>(null);
  
  // Tasks Mock Data
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      taskName: 'Background drawing',
      page: 'P05',
      assistant: 'Hana',
      status: 'Submitted',
      priority: 'High',
      deadline: 'Today',
      actionText: 'Review',
    },
    {
      id: 'task-2',
      taskName: 'Character shading',
      page: 'P08',
      assistant: 'Kenji',
      status: 'In Progress',
      priority: 'Medium',
      deadline: 'Tomorrow',
      actionText: 'Open',
    },
    {
      id: 'task-3',
      taskName: 'Speed effect',
      page: 'P10',
      assistant: 'Mina',
      status: 'Revision Required',
      priority: 'Urgent',
      deadline: 'Overdue',
      actionText: 'Review',
    },
    {
      id: 'task-4',
      taskName: 'Foreground Inking',
      page: 'P03',
      assistant: 'Hana',
      status: 'Approved',
      priority: 'Medium',
      deadline: '3 days ago',
      actionText: 'Open',
    },
    {
      id: 'task-5',
      taskName: 'Screentone clean',
      page: 'P04',
      assistant: 'Mina',
      status: 'Approved',
      priority: 'Low',
      deadline: '4 days ago',
      actionText: 'Open',
    }
  ]);

  // Deadlines Mock Data
  const deadlines = [
    {
      id: 'dl-1',
      title: 'Chapter 12',
      subtitle: 'Final Editorial Draft Submission',
      dueText: '2 days left',
      isUrgent: false,
    },
    {
      id: 'dl-2',
      title: 'Page 08 shading',
      subtitle: 'Kenji - Assist task delivery',
      dueText: 'Due today',
      isUrgent: true,
    },
    {
      id: 'dl-3',
      title: 'Background P05',
      subtitle: 'Hana - Draft revision submission',
      dueText: 'Due tomorrow',
      isUrgent: false,
    },
    {
      id: 'dl-4',
      title: 'Chapter 13 outline',
      subtitle: 'Initial plot storyboard review',
      dueText: '6 days left',
      isUrgent: false,
    },
  ];

  // Action Triggers
  const triggerModal = (title: string, content: string) => {
    setModalInfo({ isOpen: true, title, content });
  };

  const handleTaskAction = (taskId: string, actionType: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (actionType === 'Review') {
      triggerModal(
        `Editorial Review: ${task.taskName}`,
        `Reviewing page asset ${task.page} created by Assistant ${task.assistant}. Current status is "${task.status}" with ${task.priority} priority. Action required: Approve, request revisions, or add layout feedback.`
      );
    } else {
      triggerModal(
        `Open Task Detail`,
        `Opening detail board for "${task.taskName}" (${task.page}) assigned to ${task.assistant}. Deadline set for ${task.deadline}. You can edit guidelines or chat with the assistant here.`
      );
    }
  };

  // Search filter
  const filteredTasks = tasks.filter(t => 
    t.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.assistant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Page Content based on selected sidebar item
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dashboard':
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
                <DeadlineList deadlines={deadlines} />
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
      case 'My Series':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">My Serialization Series</h1>
                <p className="text-sm text-slate-500 font-semibold mt-1">Manage active manga titles, demographic metadata, and settings.</p>
              </div>
              <button 
                onClick={() => triggerModal("New Series Creation", "Initialize a brand-new manga series. Add outlines, story themes, character dossiers, and configure creative pipelines.")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-900 active:bg-burgundy-950 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span>New Series</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Blue Moon', demographic: 'Shonen', rank: '#4', status: 'Weekly Serialization', chapters: 12, lastActive: '3 hours ago', color: 'bg-emerald-50 text-emerald-800' },
                { name: 'Crimson Days', demographic: 'Seinen', rank: '#18', status: 'Weekly Serialization (Risk)', chapters: 24, lastActive: '1 day ago', color: 'bg-amber-55 text-amber-800' },
                { name: 'Twilight Hunt', demographic: 'Fantasy/Shojo', rank: '#11', status: 'Monthly Serialization', chapters: 8, lastActive: '1 week ago', color: 'bg-emerald-50 text-emerald-800' },
                { name: 'Silent Wind', demographic: 'Shonen', rank: '#7', status: 'Drafting Outline', chapters: 15, lastActive: '2 days ago', color: 'bg-indigo-50 text-indigo-800' }
              ].map((item, i) => (
                <div key={i} className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/50">
                        {item.demographic}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-2">{item.name}</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">Total Published: <span className="font-bold text-slate-700">{item.chapters} chapters</span></p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded border border-transparent ${item.color}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Current Position</span>
                      <p className="text-lg font-bold text-burgundy-900 font-mono mt-0.5">{item.rank}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Last Studio Sync</span>
                      <p className="text-xs font-bold text-slate-700 mt-1">{item.lastActive}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => triggerModal(`Open Series Workspace: ${item.name}`, `Opening complete creative asset board, plot files, guidelines, and chapter outlines for "${item.name}".`)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Workspace
                    </button>
                    <button 
                      onClick={() => triggerModal(`Edit Series Settings: ${item.name}`, `Configuring metadata, publisher codes, assistants list, and release schedule details for "${item.name}".`)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-burgundy-800 hover:bg-burgundy-900 rounded-lg transition-colors"
                    >
                      Edit Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Chapters':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 font-sans">Chapter Release Management</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Track editorial reviews, storyboarding, script status, and release phases.</p>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-150 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Filter Series:</span>
                <select className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none">
                  <option>Blue Moon</option>
                  <option>Crimson Days</option>
                  <option>Twilight Hunt</option>
                </select>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { ch: 'Chapter 12', title: 'The Broken Gate', status: 'In Production (78%)', date: 'Jul 15, 2026', pages: '14/18', badge: 'bg-amber-50 text-amber-700 border-amber-200/80' },
                  { ch: 'Chapter 11', title: 'The Whispering Shadows', status: 'Revision Required', date: 'Jul 08, 2026', pages: '18/18', badge: 'bg-burgundy-50 text-burgundy-700 border-burgundy-200/80' },
                  { ch: 'Chapter 10', title: 'Across the Abyss', status: 'Approved', date: 'Jul 01, 2026', pages: '18/18', badge: 'bg-emerald-50 text-emerald-700 border-emerald-250' },
                  { ch: 'Chapter 09', title: 'Storm Warning', status: 'Published', date: 'Jun 24, 2026', pages: '20/20', badge: 'bg-slate-100 text-slate-655 border-slate-200' }
                ].map((item, i) => (
                  <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/40">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded bg-burgundy-50 border border-burgundy-100 flex items-center justify-center font-mono font-bold text-burgundy-900 text-xs shrink-0">
                        {item.ch.replace('Chapter ', '')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{item.ch}: {item.title}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Release Date: {item.date} • Pages: {item.pages}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.badge}`}>
                        {item.status}
                      </span>
                      <button 
                        onClick={() => triggerModal(`View Chapter Details: ${item.ch}`, `Opening chapter dashboard for "${item.ch}: ${item.title}". View page sequence files, editor suggestions, and task timeline.`)}
                        className="text-xs font-bold text-burgundy-800 hover:text-burgundy-950 px-2 py-1 rounded bg-burgundy-50/50 hover:bg-burgundy-100/50 transition-colors"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Page Editor':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Visual Page Editor & Sequence Manager</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Review drawing bounds, panels layout, dialog box pacing, and arrange page sequences.</p>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm">
              <div className="h-16 w-16 bg-plum-50 border border-plum-100 text-plum-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Page Workspace Open</h3>
              <p className="text-sm text-slate-500 font-semibold mt-1.5 max-w-md mx-auto">
                Select a page from the active chapter production list or click a Review action in the Task Board to open the visual layout and dialog placement canvas.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button 
                  onClick={() => setActiveTab('Dashboard')}
                  className="px-4 py-2 text-xs font-bold text-white bg-burgundy-800 hover:bg-burgundy-900 rounded-lg transition-colors"
                >
                  Go to Task Board
                </button>
                <button 
                  onClick={() => triggerModal("Launch Editor Sandbox", "Open drawing canvas sandbox. Import raw pencil sketches, arrange comic frames, lay down base color fill layers, or type dialogue outlines to experiment.")}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Launch Editor Sandbox
                </button>
              </div>
            </div>
          </div>
        );
      case 'Tasks':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Studio Task Allocation Board</h1>
                <p className="text-sm text-slate-500 font-semibold mt-1">Allocate work (sketching, backgrounds, screentones, effects) to assistants and inspect submissions.</p>
              </div>
              <button 
                onClick={() => triggerModal("Add Task", "Create a new task for Chapter 12 or 13. Select assistant assignee (Hana, Kenji, Mina), specify reference canvas layer, and select priority/deadline.")}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-burgundy-805 hover:bg-burgundy-900 rounded-lg transition-colors"
              >
                <Plus size={14} />
                <span>Create Task</span>
              </button>
            </div>

            <TaskTable tasks={tasks} onAction={handleTaskAction} />
          </div>
        );
      case 'Files':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Studio Asset Manager</h1>
                <p className="text-sm text-slate-500 font-semibold mt-1">Storage vault for comic pages, character concept design sketches, vector panels, PSD files, and exports.</p>
              </div>
              <button 
                onClick={() => triggerModal("Upload File Asset", "Drag and drop drawing files (.clip, .psd, .png) or text files (.txt, .docx, .md) to upload.")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-plum-700 hover:bg-plum-800 active:bg-plum-900 transition-colors shadow-sm"
              >
                <Upload size={14} />
                <span>Upload Assets</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {[
                { name: 'Blue_Moon_C12_P01.clip', type: 'Clip Paint File', size: '48 MB', date: '3 hours ago' },
                { name: 'Character_Concept_Hana.png', type: 'Design Sketch Image', size: '4.2 MB', date: '2 days ago' },
                { name: 'Shading_Brush_Custom.sut', type: 'Sub Tool Asset', size: '150 KB', date: '1 week ago' },
                { name: 'Chapter12_Outline.docx', type: 'Word Document', size: '1.2 MB', date: '5 days ago' },
                { name: 'CrimsonDays_C24_P15.psd', type: 'Photoshop Document', size: '84 MB', date: '1 day ago' },
                { name: 'Panel_Layout_Grid.png', type: 'Layout Template', size: '890 KB', date: '2 weeks ago' },
              ].map((file, i) => (
                <div key={i} className="bg-white border border-slate-150 rounded-xl p-4 shadow-xs hover:border-burgundy-200 transition-colors flex flex-col justify-between">
                  <div className="h-10 w-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shrink-0">
                    <FolderKanban size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-750 truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                      {file.type} • {file.size}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span>{file.date}</span>
                    <button 
                      onClick={() => triggerModal(`Open File: ${file.name}`, `Downloading or launching external studio tool for visual asset file: "${file.name}".`)}
                      className="text-burgundy-855 hover:text-burgundy-950 font-extrabold"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Editorial Reviews':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Editorial Feedback Log</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Review feedback, requested changes, and direct communication history with Chief Editor Sato.</p>
            </div>

            <div className="space-y-4">
              <EditorialFeedbackCard
                chapter="Chapter 11: Final Edits"
                editorName="Sato"
                status="Revision Required"
                note="Dialogue pacing on page 7 needs improvement. Break up Akira's second panel bubble."
                onViewFeedback={() => triggerModal("Editorial Feedback: Chapter 11", "Dialogue spacing issue in Panel 2 of Page 7. Editor Sato notes: 'The dramatic payoff is lost because Akira's bubble is crowded. Suggest splitting the dialog block into two separate text elements.'")}
              />
              
              <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="text-xs font-bold text-slate-700">Past Feedback Archive</span>
                  <span className="text-xs text-slate-400 font-semibold">2 archived entries</span>
                </div>
                <div className="space-y-3.5">
                  {[
                    { ch: 'Chapter 10: Across the Abyss', editor: 'Sato', verdict: 'Approved', note: 'Line art is sharp. Page 12 panels have excellent speed line effects.' },
                    { ch: 'Chapter 09: Storm Warning', editor: 'Sato', verdict: 'Approved', note: 'Script approved without corrections. Drafting can begin.' }
                  ].map((arch, i) => (
                    <div key={i} className="text-xs border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center font-bold text-slate-700">
                        <span>{arch.ch}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">{arch.verdict}</span>
                      </div>
                      <p className="text-slate-500 mt-1 font-semibold">Editor: {arch.editor} • "{arch.note}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'Rankings':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Manga Group Popularity Rankings</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Calculated from editorial metrics, reader polls, and distribution data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <RankingRiskCard
                  series="Crimson Days"
                  currentRank={18}
                  previousRank={13}
                  riskLevel="Medium"
                  onViewRanking={() => triggerModal("Ranking History: Crimson Days", "Crimson Days started serialization at Rank #8, reached a peak of #4, but has dropped over the last 3 weeks due to slower narrative pacing. Editorial board suggestions: Increase action beats in upcoming chapters.")}
                />
              </div>

              <div className="md:col-span-2 bg-white border border-slate-150 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-50">Ranking Board Summary</h3>
                <div className="space-y-3 font-semibold text-xs">
                  {[
                    { title: 'Blue Moon', rank: '#4', trend: 'up', class: 'text-emerald-600 bg-emerald-50' },
                    { title: 'Silent Wind', rank: '#7', trend: 'up', class: 'text-emerald-600 bg-emerald-50' },
                    { title: 'Twilight Hunt', rank: '#11', trend: 'neutral', class: 'text-slate-500 bg-slate-50' },
                    { title: 'Crimson Days', rank: '#18', trend: 'down', class: 'text-red-600 bg-red-50' }
                  ].map((rnk, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                      <span className="text-slate-800 font-bold">{rnk.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-655 font-mono">{rnk.rank}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-0.5 ${rnk.class}`}>
                          {rnk.trend === 'up' && <TrendingUp size={10} />}
                          {rnk.trend === 'down' && <TrendingDown size={10} />}
                          {rnk.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'Notifications':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Studio Notifications</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Alerts, chat notifications, and workflow status messages.</p>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl shadow-sm divide-y divide-slate-100">
              {[
                { title: 'Assistant Kenji sent Page 08 character shading', type: 'Task Submitted', time: '1 hour ago', unread: true },
                { title: 'Editor Sato requested changes on Chapter 11 dialogue layout', type: 'Editorial Review', time: '3 hours ago', unread: true },
                { title: 'Assistant Hana completed Background drawing for Page 05', type: 'Task Submitted', time: '5 hours ago', unread: false },
                { title: 'Monthly Publishing Rankings calculated: Crimson Days dropped 5 positions', type: 'System Alert', time: '1 day ago', unread: false },
                { title: 'Blue Moon Chapter 10 approved for publishing export', type: 'System Notification', time: '2 days ago', unread: false }
              ].map((notif, i) => (
                <div key={i} className={`p-4 flex items-start gap-3 hover:bg-slate-50/50 ${notif.unread ? 'bg-burgundy-50/10' : ''}`}>
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${notif.unread ? 'bg-burgundy-700 animate-pulse' : 'bg-slate-200'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-3 text-xs font-bold text-slate-800">
                      <h4>{notif.title}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">{notif.time}</span>
                    </div>
                    <span className="text-[10px] font-bold text-burgundy-800/80 mt-1 inline-block uppercase tracking-wider">
                      {notif.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Settings':
        return (
          <div className="space-y-6 animate-in fade-in duration-350">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Studio Profile & Integration Settings</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Configure workspace parameters, notification thresholds, and publisher credentials.</p>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm max-w-2xl">
              <h3 className="font-bold text-slate-800 text-sm mb-4 pb-1 border-b border-slate-100">Studio Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-655 mb-1">Manga Creator Nickname</label>
                  <input type="text" defaultValue="Akira" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-burgundy-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-655 mb-1">Serialization Publisher ID</label>
                  <input type="text" defaultValue="PUB-SHONEN-9021" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-burgundy-500 font-mono" />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="text-xs font-bold text-slate-750">SMS Notification Alert</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">Receive immediate notifications on your phone for urgent editor reviews.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-burgundy-800" />
                </div>

                <div className="flex justify-end pt-3">
                  <button 
                    onClick={() => triggerModal("Save Settings", "Manga studio preferences successfully stored in workspace storage profile.")}
                    className="px-4 py-2 text-xs font-bold text-white bg-burgundy-800 hover:bg-burgundy-900 rounded-lg transition-colors"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Module loaded.</div>;
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
