'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/mangaka/Logo';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Clock, 
  Play, 
  Globe, 
  Moon, 
  Sun,
  Lightbulb, 
  ClipboardList, 
  CheckSquare, 
  FileEdit, 
  FileCheck, 
  TrendingUp, 
  ArrowRight,
  BookOpenCheck,
  ChevronDown,
  Menu,
  X,
  Layers,
  Star,
  Bell,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { clsx } from 'clsx';
import MangaStylePanel from '@/components/ui/MangaStylePanel';

// Custom hook for scroll-reveal animations
function useIntersectionObserver(elementRef: React.RefObject<Element | null>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [elementRef]);

  return isVisible;
}

// Type definitions
type RoleKey = "mangaka" | "assistant" | "editor" | "board";

interface RoleCardData {
  role: string;
  desc: string;
  points: string[];
  img: string;
  bg: string;
  linkRole: RoleKey;
}

interface FeatureItem {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  desc: string;
  color: string;
}

interface AnnotationItem {
  cx: number;
  cy: number;
  pingOrigin: string; // CSS style origin e.g. "58% 22%"
  linePath: string; // SVG path
  tooltipText: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  bgClass: string;
  iconColorClass: string;
  positionClass: string;
}

interface HeroSlide {
  image: string;
  titleKey: string;
  descKey: string;
  annotations: AnnotationItem[];
}

// Multilingual dictionary
const translations = {
  VI: {
    navHome: "Trang chủ",
    navFeatures: "Tính năng",
    navRoles: "Vai trò",
    navPricing: "Bảng giá",
    navResources: "Tài nguyên",
    navContact: "Liên hệ",
    navLogin: "Đăng nhập",
    navRegister: "Đăng ký",
    
    heroTitlePre: "Quản lý toàn bộ quy trình ",
    heroTitleHighlight: "sáng tác & xuất bản",
    heroTitlePost: " Manga",
    heroSubtitle: "MangaFlow giúp Mangaka, trợ lý, biên tập viên và hội đồng biên tập làm việc hiệu quả hơn – từ ý tưởng đến khi xuất bản.",
    
    bullet1Title: "Quản lý bản thảo và chapter",
    bullet1Desc: "Tổ chức cốt truyện, storyboard và quản lý tệp tin tập trung.",
    bullet2Title: "Phân công & theo dõi công việc chi tiết",
    bullet2Desc: "Giao việc vẽ nền, đổ bóng, hiệu ứng cho trợ lý theo trang.",
    bullet3Title: "Bảng xếp hạng & ra quyết định xuất bản",
    bullet3Desc: "Thu thập phiếu bầu, theo dõi xu hướng và tính toán thứ hạng.",
    
    btnStart: "Bắt đầu miễn phí",
    btnDemo: "Xem demo",
    
    tooltipAssistant: "Chọn vùng & giao task",
    tooltipEditor: "Ghi chú trực tiếp trên trang",
    tooltipRank: "Theo dõi ranking realtime",
    
    tooltipReviewDraft: "Đánh giá bản thảo",
    tooltipReviewComments: "Góp ý & phản hồi trực tiếp",
    tooltipReviewApprove: "Duyệt xuất bản chương mới",
    
    tooltipBoardPolls: "Phân tích số liệu độc giả",
    tooltipBoardVotes: "Bỏ phiếu duyệt series mới",
    tooltipBoardRisk: "Cảnh báo rủi ro xếp hạng",

    statSeries: "Series đang quản lý",
    statUsers: "Người dùng",
    statChapters: "Chapter đã phát hành",
    statOnTime: "Tỉ lệ đúng hạn",
    
    featuresTitle: "Tính năng nổi bật cho studio Manga",
    featuresSubtitle: "Tất cả công cụ cần thiết để quản lý series, chapter, page, task, review và ranking trong một nền tảng duy nhất.",
    feature1Title: "Page Annotation Editor",
    feature1Desc: "Khoanh vùng panel, nhân vật, speech bubble hoặc background trực tiếp trên trang manga.",
    feature2Title: "Task Assignment",
    feature2Desc: "Giao việc cho assistant theo từng vùng, deadline, priority và tài nguyên liên quan.",
    feature3Title: "Submission & Revision",
    feature3Desc: "Assistant nộp kết quả, Mangaka duyệt hoặc yêu cầu chỉnh sửa theo từng phiên bản.",
    feature4Title: "Editorial Review",
    feature4Desc: "Tantou Editor đánh dấu lỗi, góp ý và approve chapter trước khi xuất bản.",
    feature5Title: "Reader Voting & Ranking",
    feature5Desc: "Nhập dữ liệu bình chọn độc giả và tổng hợp bảng xếp hạng series sau mỗi kỳ phát hành.",
    feature6Title: "Realtime Notifications",
    feature6Desc: "Thông báo realtime khi có task mới, revision, approval hoặc ranking warning.",

    rolesTitle: "Dành cho mọi vai trò trong ngành Manga",
    rolesSubtitle: "MangaFlow tối ưu hóa từng bước sáng tạo với giao diện độc lập được tùy chỉnh cho từng chủ thể.",
    
    role1Name: "Mangaka",
    role1Desc: "Tác giả / Chủ series",
    role1Points: [
      "Quản lý series, chapter, trang truyện",
      "Giao việc cho trợ lý theo từng vùng",
      "Duyệt hoặc yêu cầu chỉnh sửa",
      "Theo dõi bảng xếp hạng series"
    ],
    
    role2Name: "Assistant",
    role2Desc: "Trợ lý",
    role2Points: [
      "Xem và nhận công việc được giao",
      "Tải tài nguyên và hoàn thiện phần việc",
      "Gửi kết quả để Mangaka duyệt",
      "Theo dõi số trang & thu nhập"
    ],
    
    role3Name: "Tantou Editor",
    role3Desc: "Biên tập viên phụ trách",
    role3Points: [
      "Đọc và đánh dấu chỉnh sửa",
      "Quản lý hồ sơ & số liệu series",
      "Theo dõi tiến độ theo thời gian thực",
      "Bảo vệ series trước hội đồng"
    ],
    
    role4Name: "Editorial Board",
    role4Desc: "Hội đồng biên tập",
    role4Points: [
      "Bỏ phiếu duyệt series mới",
      "Quyết định lịch xuất bản / hủy series",
      "Nhập dữ liệu bình chọn độc giả",
      "Xem bảng xếp hạng tổng hợp"
    ],
    
    btnLearnMore: "Tìm hiểu thêm",
    
    workflowTitle: "Quy trình hoạt động",
    workflowSubtitle: "7 bước tự động khép kín từ khâu lên ý tưởng sáng tác tới khi xuất bản tác phẩm.",
    
    step1: "Tạo ý tưởng & series mới",
    step2: "Nộp bản thảo sơ bộ",
    step3: "Phân công công việc cho trợ lý",
    step4: "Duyệt & chỉnh sửa trang truyện",
    step5: "Biên tập viên đánh giá",
    step6: "Hội đồng biên tập ra quyết định",
    step7: "Xuất bản & theo dõi bảng xếp hạng",
    
    footerCopyright: "© 2026 MangaFlow Inc. Bảo lưu mọi quyền.",
    footerTerms: "Điều khoản",
    footerPrivacy: "Bảo mật",
    footerContact: "Liên hệ",
    footerHelp: "Trợ giúp",
    
    modalTitle: "Chi tiết vai trò",
    modalClose: "Đóng thông tin",
    modalDetails: {
      mangaka: "Vai trò Mangaka (Tác giả chính) sở hữu toàn quyền quản lý đối với manga series của họ. Họ có thể lập bố cục cốt truyện, tải lên các trang phân phân cảnh thô, phân phát công việc vẽ hình (background, speedlines, screentone) cho các trợ lý, và nộp trang hoàn chỉnh lên biên tập viên.",
      assistant: "Vai trò Trợ lý (Assistant) hỗ trợ tác giả chính hoàn thành các chi tiết nhỏ trên bản thảo manga. Họ nhận các đầu việc được giao, tải tệp nguồn về làm việc, sau đó gửi lại kết quả để Mangaka xét duyệt. Trợ lý cũng có thể quản lý lịch sử làm việc và theo dõi thu nhập.",
      editor: "Vai trò Biên tập viên (Tantou Editor) đồng hành trực tiếp cùng tác giả để quản lý tiến độ và đánh giá thẩm mỹ của manga. Họ có quyền phản hồi đóng góp ý kiến ngay trên trang truyện, bảo vệ tác phẩm trước hội đồng xuất bản và kiểm tra số liệu.",
      board: "Vai trò Hội đồng biên tập (Editorial Board) là cơ quan thẩm định tối cao. Họ biểu quyết cho phép xuất bản chính thức, xét duyệt các đề xuất phát hành, theo dõi bảng xếp hạng doanh thu và phiếu bầu định kỳ từ độc giả."
    }
  },
  EN: {
    navHome: "Home",
    navFeatures: "Features",
    navRoles: "Roles",
    navPricing: "Pricing",
    navResources: "Resources",
    navContact: "Contact",
    navLogin: "Login",
    navRegister: "Register",
    
    heroTitlePre: "Manage Entire ",
    heroTitleHighlight: "Creation & Publishing",
    heroTitlePost: " Manga Process",
    heroSubtitle: "MangaFlow helps Mangakas, assistants, editors, and editorial boards collaborate efficiently – from initial concept to publication.",
    
    bullet1Title: "Manuscript & Chapter Management",
    bullet1Desc: "Organize storyline scripts, storyboards, and manage asset files centrally.",
    bullet2Title: "Detailed Task Allocation",
    bullet2Desc: "Assign drawing layers, screen tones, or shading tasks to assistants page-by-page.",
    bullet3Title: "Rankings & Editorial Decisions",
    bullet3Desc: "Track reader votes, visualize performance metrics, and process serial changes.",
    
    btnStart: "Start Free",
    btnDemo: "Watch Demo",
    
    tooltipAssistant: "Select region & assign task",
    tooltipEditor: "Inline page feedback",
    tooltipRank: "Realtime ranking tracking",
    
    tooltipReviewDraft: "Review manuscript draft",
    tooltipReviewComments: "Inline comments & feedback",
    tooltipReviewApprove: "Quick chapter approval",
    
    tooltipBoardPolls: "Analyze reader polls data",
    tooltipBoardVotes: "Vote on serialization proposals",
    tooltipBoardRisk: "Realtime ranking risk warning",

    statSeries: "Managed Series",
    statUsers: "Active Users",
    statChapters: "Released Chapters",
    statOnTime: "On-time Delivery",
    
    featuresTitle: "Core Features for Manga Studios",
    featuresSubtitle: "All essential tools to manage series, chapters, pages, tasks, reviews, and rankings in one unified platform.",
    feature1Title: "Page Annotation Editor",
    feature1Desc: "Select panels, characters, speech bubbles, or background areas directly on manga pages.",
    feature2Title: "Task Assignment",
    feature2Desc: "Assign assistant work by selected region, deadline, priority, and related assets.",
    feature3Title: "Submission & Revision",
    feature3Desc: "Assistants submit work, while Mangaka can approve or request versioned revisions.",
    feature4Title: "Editorial Review",
    feature4Desc: "Tantou Editors mark issues, add feedback, and approve chapters before publication.",
    feature5Title: "Reader Voting & Ranking",
    feature5Desc: "Input reader voting data and generate series ranking after each publication cycle.",
    feature6Title: "Realtime Notifications",
    feature6Desc: "Receive realtime updates for new tasks, revisions, approvals, and ranking warnings.",

    rolesTitle: "Built for Every Manga Industry Role",
    rolesSubtitle: "MangaFlow optimizes the creative pipeline with distinct, customized workspaces for all production members.",
    
    role1Name: "Mangaka",
    role1Desc: "Author / Series Lead",
    role1Points: [
      "Manage serialization series, chapters, and pages",
      "Assign drawing layers to assistants by frames",
      "Approve or request page modifications",
      "Track series reader polls and metrics"
    ],
    
    role2Name: "Assistant",
    role2Desc: "Studio Assistant",
    role2Points: [
      "View and claim assigned sketch templates",
      "Download raw materials and submit art pieces",
      "Deliver layout updates for Mangaka approval",
      "Track work stats and monthly compensation"
    ],
    
    role3Name: "Tantou Editor",
    role3Desc: "Assigned Editor",
    role3Points: [
      "Read drafts and write inline modification markups",
      "Manage serial profiles and analytics metrics",
      "Monitor workspace timelines in real time",
      "Advocate for series during board approvals"
    ],
    
    role4Name: "Editorial Board",
    role4Desc: "Publisher Board",
    role4Points: [
      "Vote on new series serialization approvals",
      "Confirm publishing schedules or cancel serials",
      "Compile public reader popularity results",
      "Review unified publishing dashboard indices"
    ],
    
    btnLearnMore: "Learn More",
    
    workflowTitle: "Operational Workflow",
    workflowSubtitle: "7 automated phases linking creation with physical and digital serialization platforms.",
    
    step1: "Create Concept & Series",
    step2: "Submit Draft Manuscript",
    step3: "Delegate Canvas to Assistants",
    step4: "Review & Correct Pages",
    step5: "Editor Progress Feedback",
    step6: "Editorial Board Decision",
    step7: "Publish & Track Popularity",
    
    footerCopyright: "© 2026 MangaFlow Inc. All rights reserved.",
    footerTerms: "Terms",
    footerPrivacy: "Privacy",
    footerContact: "Contact",
    footerHelp: "Help",
    
    modalTitle: "Role Details",
    modalClose: "Close details",
    modalDetails: {
      mangaka: "The Mangaka (Lead Artist/Author) role holds total authority over their creations. They map story arcs, upload rough frames, allocate task blocks (inking, backgrounds, speedlines) to assistants, and submit compiled pages to editors.",
      assistant: "The Studio Assistant role assists authors with detailed screen finishing. They receive drawing targets, download resources, and upload completed inks. Assistants can also check their personal log dashboard and earnings.",
      editor: "The Tantou Editor role works directly with creators to manage deadlines and visual aesthetics. Editors attach layout flags directly to page canvases, guide series scheduling, and check weekly reader poll metrics.",
      board: "The Editorial Board is the supreme decision-making authority. Members vote on serial launches, authorize release templates, track publisher revenue curves, and compute periodic popularity rankings."
    }
  }
};

// --- Sub-components to keep code clean and modular ---

interface HeaderProps {
  t: typeof translations.VI;
  lang: 'VI' | 'EN';
  setLang: (l: 'VI' | 'EN') => void;
  isDarkMode: boolean;
  setIsDarkMode: (d: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (o: boolean) => void;
}

function HomepageHeader({
  t,
  lang,
  setLang,
  isDarkMode,
  setIsDarkMode,
  mobileMenuOpen,
  setMobileMenuOpen
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19] border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-md">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <Logo size={36} className="transition-transform group-hover:scale-105" />
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-wide text-white uppercase leading-none font-sans">
            MangaFlow
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-1 tracking-wide font-mono">
            Workflow & Publishing System
          </span>
        </div>
      </Link>

      {/* Desktop Menu Links */}
      <nav className="hidden lg:flex items-center gap-7 text-xs font-bold">
        <Link href="#" className="text-white border-b-2 border-burgundy-750 pb-1 px-1 transition-all">{t.navHome}</Link>
        <Link href="#features" className="text-slate-300 hover:text-white transition-colors">{t.navFeatures}</Link>
        <Link href="#roles" className="text-slate-300 hover:text-white transition-colors">{t.navRoles}</Link>
        <Link href="#workflow" className="text-slate-300 hover:text-white transition-colors">{t.navPricing}</Link>
        <Link href="#" className="text-slate-300 hover:text-white transition-colors">{t.navResources}</Link>
        <Link href="#" className="text-slate-300 hover:text-white transition-colors">{t.navContact}</Link>
      </nav>

      {/* Desktop Right Actions */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-bold">
        {/* Language Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 text-slate-350 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors">
            <Globe size={14} className="stroke-[2]" />
            <span>{lang === 'VI' ? 'Tiếng Việt (VI)' : 'English (EN)'}</span>
            <ChevronDown size={12} className="stroke-[2.5]" />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-[#111827] border border-slate-800 rounded-lg shadow-md hidden group-hover:block overflow-hidden py-1 z-50">
            <button onClick={() => setLang('VI')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200">Tiếng Việt (VI)</button>
            <button onClick={() => setLang('EN')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200">English (EN)</button>
          </div>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Authentication buttons */}
        <Link 
          href="/login"
          className="px-4 py-2 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          {t.navLogin}
        </Link>
        <Link 
          href="/register"
          className="px-4 py-2 text-white bg-[#6B1D2F] hover:bg-[#5A1827] rounded-lg transition-colors shadow-sm shadow-burgundy-900/10"
        >
          {t.navRegister}
        </Link>
      </div>

      {/* Mobile Drawer Trigger Menu Icon */}
      <div className="flex lg:hidden items-center gap-3">
        <Link 
          href="/register"
          className="px-3.5 py-1.5 text-white bg-[#6B1D2F] hover:bg-[#5A1827] rounded-lg text-xs font-bold transition-colors"
        >
          {t.navRegister}
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>
  );
}

interface HeroProps {
  t: typeof translations.VI;
  isDarkMode: boolean;
}

function HeroSection({ t, isDarkMode }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goToSlide = (idx: number) => {
    if (animating || idx === currentSlide) return;
    setPrevSlide(currentSlide);
    setCurrentSlide(idx);
    setAnimating(true);
    setTimeout(() => {
      setPrevSlide(null);
      setAnimating(false);
    }, 580);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normalizedX = (x / rect.width) - 0.5;
    const normalizedY = (y / rect.height) - 0.5;
    setTilt({
      rotateX: -normalizedY * 12,
      rotateY: normalizedX * 12
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  // Slides configuration
  const slides: HeroSlide[] = [
    {
      image: "/assets/manga_artist_hero.png",
      titleKey: "bullet1Title",
      descKey: "bullet1Desc",
      annotations: [
        {
          cx: 58,
          cy: 22,
          pingOrigin: "58% 22%",
          linePath: "M 28 22 L 58 22",
          tooltipText: t.tooltipAssistant,
          icon: Users,
          bgClass: "bg-burgundy-50 dark:bg-burgundy-950",
          iconColorClass: "text-burgundy-800 dark:text-burgundy-400",
          positionClass: "top-[17%] left-[28%] translate-x-[-100%]"
        },
        {
          cx: 70,
          cy: 54,
          pingOrigin: "70% 54%",
          linePath: "M 85 54 L 70 54",
          tooltipText: t.tooltipEditor,
          icon: FileText,
          bgClass: "bg-plum-50 dark:bg-plum-950",
          iconColorClass: "text-plum-800 dark:text-plum-400",
          positionClass: "top-[49%] right-[2%]"
        },
        {
          cx: 54,
          cy: 74,
          pingOrigin: "54% 74%",
          linePath: "M 54 84 L 54 74",
          tooltipText: t.tooltipRank,
          icon: TrendingUp,
          bgClass: "bg-emerald-50 dark:bg-emerald-950",
          iconColorClass: "text-emerald-800 dark:text-emerald-400",
          positionClass: "bottom-[6%] left-[54%] translate-x-[-50%]"
        }
      ]
    },
    {
      image: "/assets/editorial_review_hero_anime.png",
      titleKey: "bullet2Title",
      descKey: "bullet2Desc",
      annotations: [
        {
          cx: 38,
          cy: 42,
          pingOrigin: "38% 42%",
          linePath: "M 16 42 L 38 42",
          tooltipText: t.tooltipReviewDraft,
          icon: FileEdit,
          bgClass: "bg-burgundy-50 dark:bg-burgundy-950",
          iconColorClass: "text-burgundy-800 dark:text-burgundy-400",
          positionClass: "top-[37%] left-[16%] translate-x-[-100%]"
        },
        {
          cx: 65,
          cy: 28,
          pingOrigin: "65% 28%",
          linePath: "M 85 28 L 65 28",
          tooltipText: t.tooltipReviewComments,
          icon: MessageSquare,
          bgClass: "bg-plum-50 dark:bg-plum-950",
          iconColorClass: "text-plum-800 dark:text-plum-400",
          positionClass: "top-[23%] right-[2%]"
        },
        {
          cx: 58,
          cy: 72,
          pingOrigin: "58% 72%",
          linePath: "M 58 86 L 58 72",
          tooltipText: t.tooltipReviewApprove,
          icon: CheckSquare,
          bgClass: "bg-emerald-55/10 dark:bg-emerald-950",
          iconColorClass: "text-emerald-800 dark:text-emerald-400",
          positionClass: "bottom-[4%] left-[58%] translate-x-[-50%]"
        }
      ]
    },
    {
      image: "/assets/publishing_analytics_hero_anime.png",
      titleKey: "bullet3Title",
      descKey: "bullet3Desc",
      annotations: [
        {
          cx: 32,
          cy: 44,
          pingOrigin: "32% 44%",
          linePath: "M 14 44 L 32 44",
          tooltipText: t.tooltipBoardPolls,
          icon: TrendingUp,
          bgClass: "bg-burgundy-50 dark:bg-burgundy-950",
          iconColorClass: "text-burgundy-800 dark:text-burgundy-400",
          positionClass: "top-[39%] left-[14%] translate-x-[-100%]"
        },
        {
          cx: 62,
          cy: 30,
          pingOrigin: "62% 30%",
          linePath: "M 82 30 L 62 30",
          tooltipText: t.tooltipBoardVotes,
          icon: BookOpenCheck,
          bgClass: "bg-plum-50 dark:bg-plum-950",
          iconColorClass: "text-plum-800 dark:text-plum-400",
          positionClass: "top-[25%] right-[5%]"
        },
        {
          cx: 52,
          cy: 76,
          pingOrigin: "52% 76%",
          linePath: "M 52 88 L 52 76",
          tooltipText: t.tooltipBoardRisk,
          icon: Clock,
          bgClass: "bg-emerald-50 dark:bg-emerald-950",
          iconColorClass: "text-emerald-800 dark:text-emerald-400",
          positionClass: "bottom-[4%] left-[52%] translate-x-[-50%]"
        }
      ]
    },
    {
      image: "/assets/manga_task_assignment_hero.png",
      titleKey: "bullet1Title",
      descKey: "bullet1Desc",
      annotations: []
    },
    {
      image: "/assets/manga_ranking_board_hero.png",
      titleKey: "bullet3Title",
      descKey: "bullet3Desc",
      annotations: []
    }
  ];

  // Auto slide cycle
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (currentSlide + 1) % slides.length;
      goToSlide(next);
    }, 5000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, slides.length, animating]);

  const handlePrev = () => goToSlide((currentSlide - 1 + slides.length) % slides.length);
  const handleNext = () => goToSlide((currentSlide + 1) % slides.length);

  const activeSlide = slides[currentSlide];

  return (
    <section className="px-6 py-12 md:py-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-0">
      {/* Left Column Text */}
      <div className={clsx("lg:col-span-5 space-y-6 transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] delay-100",
        mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
      )}>
        <h1 className={clsx("text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]", isDarkMode ? "text-white" : "text-slate-850")}>
          {t.heroTitlePre}
          <span className="bg-gradient-to-r from-burgundy-800 to-plum-900 bg-clip-text text-transparent">
            {t.heroTitleHighlight}
          </span>
          {t.heroTitlePost}
        </h1>
        
        <p className={clsx("font-semibold text-sm leading-relaxed", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          {t.heroSubtitle}
        </p>

        {/* Highlights Checklist - dynamically highlighting based on current slide */}
        <div className="space-y-3.5">
          {[
            { text: t.bullet1Title, desc: t.bullet1Desc },
            { text: t.bullet2Title, desc: t.bullet2Desc },
            { text: t.bullet3Title, desc: t.bullet3Desc }
          ].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => setCurrentSlide(idx)}
              className={clsx("flex gap-3 p-2 rounded-xl cursor-pointer transition-all duration-300",
                currentSlide === idx 
                  ? "bg-burgundy-50/50 dark:bg-burgundy-950/20 border border-burgundy-100/50 dark:border-burgundy-900/30 scale-[1.01]" 
                  : "border border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <div className={clsx("h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border text-[10px] font-black",
                currentSlide === idx
                  ? "bg-[#6B1D2F] border-[#6B1D2F] text-white"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
              )}>
                <span>{idx + 1}</span>
              </div>
              <div>
                <h4 className={clsx("font-bold text-xs", isDarkMode ? "text-slate-200" : "text-slate-855")}>{item.text}</h4>
                <p className={clsx("text-[10px] font-medium mt-0.5", isDarkMode ? "text-slate-500" : "text-slate-450")}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons with nested button-in-button design from high-end-visual-design skill */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link 
            href="/register" 
            className="inline-flex items-center justify-center gap-4 pl-6 pr-3.5 py-3 bg-[#6B1D2F] hover:bg-[#5A1827] text-white font-bold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_4px_12px_rgba(107,29,47,0.15)] group text-sm active:scale-[0.98]"
          >
            <span>{t.btnStart}</span>
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-white/20 shrink-0">
              <ArrowRight size={14} className="stroke-[2.5] transform group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
          <Link 
            href="/dashboard"
            className={clsx("inline-flex items-center justify-center gap-4 pl-6 pr-3.5 py-3 border font-bold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xs text-sm active:scale-[0.98] group",
              isDarkMode ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200" : "bg-white border-slate-255 hover:bg-slate-50 text-slate-700"
            )}
          >
            <span>{t.btnDemo}</span>
            <span className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
              isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"
            )}>
              <Play size={12} className={clsx("transform group-hover:scale-105 transition-transform", isDarkMode ? "fill-slate-300 text-slate-300" : "fill-slate-600 text-slate-600")} />
            </span>
          </Link>
        </div>
      </div>

      {/* Right Column Image Slider Carousel - with mounting transition */}
      <div className={clsx("lg:col-span-7 relative max-w-2xl mx-auto w-full transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] delay-300",
        mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
      )}>
        {/* Glow backdrop reflections */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] h-[92%] bg-gradient-to-tr from-burgundy-800/10 to-plum-900/10 blur-3xl -z-10 rounded-3xl" />
        <div className="absolute -bottom-6 left-[10%] right-[10%] h-6 bg-slate-900/10 dark:bg-black/40 blur-xl rounded-full -z-10" />

        <div 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition: tilt.rotateX === 0 ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 0.05s ease-out'
          }}
          className={clsx("rounded-3xl p-3 border overflow-hidden relative transition-all duration-300",
            isDarkMode ? "bg-slate-900/40 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" : "bg-slate-50/50 border-slate-200/50 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
          )}
        >
          {/* ── Card Shuffle Deck ── */}
          <div className="relative w-full aspect-[800/520] rounded-2xl" style={{ perspective: '1200px' }}>

            {/* Background stack cards (visual depth) */}
            {slides.map((slide, slideIdx) => {
              const isActive = slideIdx === currentSlide;
              const isPrev  = slideIdx === prevSlide;
              // distance from front: 0 = active, 1 = next behind, 2 = further
              const dist = ((slideIdx - currentSlide + slides.length) % slides.length);
              const stackVisible = dist > 0 && dist <= 3;

              const stackStyle: React.CSSProperties = stackVisible ? {
                transform: `translateX(${dist * 6}px) translateY(${dist * 6}px) scale(${1 - dist * 0.04}) rotate(${dist * 1.5}deg)`,
                zIndex: slides.length - dist,
                opacity: Math.max(0, 1 - dist * 0.25),
              } : {};

              return (
                <div
                  key={slideIdx}
                  className={clsx(
                    "absolute inset-0 rounded-2xl overflow-hidden",
                    isActive && !animating && "z-20",
                    isPrev  && "card-throw-out z-30",
                    isActive && animating && !isPrev && "card-rise-in z-20",
                    !isActive && !isPrev && stackVisible && "transition-all duration-500",
                    !isActive && !isPrev && !stackVisible && "opacity-0 pointer-events-none"
                  )}
                  style={!isActive && !isPrev ? stackStyle : undefined}
                >
                  <Image
                    src={slide.image}
                    alt={`Manga Studio Slide ${slideIdx + 1}`}
                    fill
                    priority={slideIdx === 0}
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover"
                  />
                  {/* Subtle dark vignette on non-active stack cards */}
                  {!isActive && !isPrev && stackVisible && (
                    <div className="absolute inset-0 bg-black/30 rounded-2xl" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none z-40">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white pointer-events-auto backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white pointer-events-auto backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-auto z-40">
            {slides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => goToSlide(dotIdx)}
                className={clsx("h-2 rounded-full transition-all duration-300",
                  currentSlide === dotIdx ? "w-6 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface StatsProps {
  t: typeof translations.VI;
  isDarkMode: boolean;
}

function StatsSection({ t, isDarkMode }: StatsProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(sectionRef);

  return (
    <section ref={sectionRef} className={clsx("border-y my-8 py-8 px-6 transition-colors duration-300",
      isDarkMode ? "bg-slate-900/60 border-slate-850" : "bg-slate-50 border-slate-150/80"
    )}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {[
          { icon: BookOpen, count: "1,250+", title: t.statSeries, bg: "bg-burgundy-50 text-burgundy-800 border-burgundy-100 dark:bg-burgundy-950/40 dark:text-burgundy-400 dark:border-burgundy-900/50" },
          { icon: Users, count: "8,450+", title: t.statUsers, bg: "bg-plum-50 text-plum-800 border-plum-100 dark:bg-plum-950/40 dark:text-plum-400 dark:border-plum-900/50" },
          { icon: FileText, count: "32,000+", title: t.statChapters, bg: "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
          { icon: Clock, count: "98.6%", title: t.statOnTime, bg: "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className={clsx("flex items-center gap-4 border p-4 rounded-xl shadow-xs transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={clsx("h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border", stat.bg)}>
                <Icon size={18} className="stroke-[2]" />
              </div>
              <div>
                <h3 className={clsx("text-xl md:text-2xl font-black font-mono tracking-tight", isDarkMode ? "text-white" : "text-slate-800")}>{stat.count}</h3>
                <p className="text-[10px] font-bold text-slate-450 dark:text-slate-555 uppercase tracking-wider mt-0.5">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface CoreFeaturesProps {
  t: typeof translations.VI;
  isDarkMode: boolean;
}

function CoreFeaturesSection({ t, isDarkMode }: CoreFeaturesProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(sectionRef);

  const featuresList: FeatureItem[] = [
    { icon: Layers, title: t.feature1Title, desc: t.feature1Desc, color: "text-burgundy-700 bg-burgundy-50 dark:bg-burgundy-950/40 dark:text-burgundy-400 dark:border-burgundy-900/40" },
    { icon: ClipboardList, title: t.feature2Title, desc: t.feature2Desc, color: "text-plum-700 bg-plum-50 dark:bg-plum-950/40 dark:text-plum-400 dark:border-plum-900/40" },
    { icon: Clock, title: t.feature3Title, desc: t.feature3Desc, color: "text-teal-700 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/40" },
    { icon: FileCheck, title: t.feature4Title, desc: t.feature4Desc, color: "text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40" },
    { icon: Star, title: t.feature5Title, desc: t.feature5Desc, color: "text-yellow-700 bg-yellow-50 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/40" },
    { icon: Bell, title: t.feature6Title, desc: t.feature6Desc, color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40" }
  ];

  return (
    <section ref={sectionRef} id="features" className="px-6 py-16 max-w-7xl mx-auto space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-burgundy-50 dark:bg-burgundy-950/50 text-burgundy-800 dark:text-burgundy-400 uppercase border border-burgundy-100 dark:border-burgundy-900/30">
          Features
        </span>
        <h2 className={clsx("text-2xl md:text-3xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-800")}>
          {t.featuresTitle}
        </h2>
        <p className={clsx("text-xs font-semibold leading-relaxed", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          {t.featuresSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuresList.map((item, idx) => {
          const Icon = item.icon;
          const panelVariant = ((idx % 3) + 1) as 1 | 2 | 3;
          return (
            <MangaStylePanel
              key={idx}
              variant={panelVariant}
              className={clsx("w-full h-full transform transition-all duration-700",
                isVisible 
                  ? "opacity-100 translate-y-0 scale-100" 
                  : "opacity-0 translate-y-10 scale-95"
              )}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <div className="flex flex-col items-start gap-4 h-full">
                <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent", item.color)}>
                  <Icon size={20} className="stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <h4 className={clsx("font-bold text-sm", isDarkMode ? "text-slate-100" : "text-slate-800")}>
                    {item.title}
                  </h4>
                  <p className={clsx("text-[11px] font-medium leading-relaxed", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                    {item.desc}
                  </p>
                </div>
              </div>
            </MangaStylePanel>
          );
        })}
      </div>
    </section>
  );
}

interface RolesProps {
  t: typeof translations.VI;
  isDarkMode: boolean;
  setActiveRole: (role: RoleKey) => void;
}

function RolesSection({ t, isDarkMode, setActiveRole }: RolesProps) {
  const roleCards: RoleCardData[] = [
    {
      role: t.role1Name,
      desc: t.role1Desc,
      points: t.role1Points,
      img: "/assets/mangaka_role.png",
      bg: "hover:border-burgundy-250 dark:hover:border-burgundy-900/50",
      linkRole: "mangaka"
    },
    {
      role: t.role2Name,
      desc: t.role2Desc,
      points: t.role2Points,
      img: "/assets/assistant_role.png",
      bg: "hover:border-plum-250 dark:hover:border-plum-900/50",
      linkRole: "assistant"
    },
    {
      role: t.role3Name,
      desc: t.role3Desc,
      points: t.role3Points,
      img: "/assets/editor_role.png",
      bg: "hover:border-emerald-250 dark:hover:border-emerald-900/50",
      linkRole: "editor"
    },
    {
      role: t.role4Name,
      desc: t.role4Desc,
      points: t.role4Points,
      img: "/assets/board_role.png",
      bg: "hover:border-slate-350 dark:hover:border-slate-650/50",
      linkRole: "board"
    }
  ];

  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(sectionRef);

  return (
    <section ref={sectionRef} id="roles" className="px-6 py-12 max-w-7xl mx-auto space-y-10">
      <div className={clsx("text-center max-w-xl mx-auto space-y-2 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        <h2 className={clsx("text-2xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-800")}>
          {t.rolesTitle}
        </h2>
        <p className={clsx("text-xs font-semibold", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          {t.rolesSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roleCards.map((card, idx) => (
          <div 
            key={idx} 
            className={clsx(
              "border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col justify-between overflow-hidden",
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-150/70",
              card.bg,
              isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
            )}
            style={{ transitionDelay: `${idx * 100}ms` }}
          >
            <div>
              <span className={clsx("text-xs font-black", isDarkMode ? "text-slate-100" : "text-slate-700")}>{card.role}</span>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{card.desc}</p>
              
              {/* Points */}
              <ul className={clsx("mt-4 space-y-2 text-[10px] font-bold list-disc pl-4", isDarkMode ? "text-slate-350" : "text-slate-555")}>
                {card.points.map((pt, pIdx) => (
                  <li key={pIdx}>{pt}</li>
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <div className="relative w-full h-32 mb-3">
                <Image 
                  src={card.img} 
                  alt={card.role}
                  fill
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="object-cover rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <button 
                onClick={() => setActiveRole(card.linkRole)}
                className="w-full inline-flex items-center justify-between text-xs font-bold text-burgundy-855 hover:text-burgundy-950 dark:text-burgundy-400 dark:hover:text-burgundy-300 transition-colors pt-2 border-t border-slate-50 dark:border-slate-800 group/btn"
              >
                <span>{t.btnLearnMore}</span>
                <ArrowRight size={14} className="transform group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface WorkflowProps {
  t: typeof translations.VI;
  isDarkMode: boolean;
}

function WorkflowSection({ t, isDarkMode }: WorkflowProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(sectionRef);

  return (
    <section ref={sectionRef} id="workflow" className={clsx("px-6 py-16 max-w-7xl mx-auto space-y-12 border-t", isDarkMode ? "border-slate-850" : "border-slate-150")}>
      <div className="text-center max-w-xl mx-auto">
        <h2 className={clsx("text-2xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-800")}>
          {t.workflowTitle}
        </h2>
        <p className={clsx("text-xs font-semibold mt-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          {t.workflowSubtitle}
        </p>
      </div>

      {/* Step Timeline Grid */}
      <div className="relative">
        {/* Horizontal dot line connection on desktop */}
        <div className={clsx("hidden lg:block absolute top-[18px] left-[5%] right-[5%] h-0.5 border-t border-dashed z-0 transition-opacity duration-1000",
          isDarkMode ? "border-slate-800" : "border-slate-200",
          isVisible ? "opacity-100" : "opacity-0"
        )} />
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 relative z-10">
          {[
            { title: t.step1, icon: Lightbulb, color: "bg-yellow-50 text-yellow-700 border-yellow-150 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30" },
            { title: t.step2, icon: FileText, color: "bg-blue-50 text-blue-700 border-blue-150 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30" },
            { title: t.step3, icon: ClipboardList, color: "bg-plum-50 text-plum-755 border-plum-155 dark:bg-plum-950/20 dark:text-plum-400 dark:border-plum-900/30" },
            { title: t.step4, icon: FileEdit, color: "bg-teal-50 text-teal-700 border-teal-150 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30" },
            { title: t.step5, icon: FileCheck, color: "bg-indigo-50 text-indigo-700 border-indigo-150 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30" },
            { title: t.step6, icon: TrendingUp, color: "bg-burgundy-50 text-burgundy-800 border-burgundy-150 dark:bg-burgundy-950/20 dark:text-burgundy-400 dark:border-burgundy-900/30" },
            { title: t.step7, icon: BookOpenCheck, color: "bg-emerald-50 text-emerald-850 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" }
          ].map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx} 
                className={clsx("flex flex-col items-center text-center space-y-3.5 hover:-translate-y-0.5 transition-all duration-500",
                  isVisible 
                    ? "opacity-100 translate-y-0 scale-100" 
                    : "opacity-0 translate-y-6 scale-95"
                )}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <div className={clsx("h-10 w-10 rounded-full flex items-center justify-center border shadow-xs relative z-10", 
                  isDarkMode ? "bg-slate-900" : "bg-white",
                  step.color
                )}>
                  <Icon size={16} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className={clsx("inline-flex items-center justify-center h-4.5 w-4.5 rounded-full font-extrabold text-[9px] mb-1 font-mono",
                    isDarkMode ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                  )}>
                    {idx + 1}
                  </span>
                  <h4 className={clsx("text-[10px] font-black leading-tight max-w-[120px] mx-auto", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                    {step.title}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface FooterProps {
  t: typeof translations.VI;
}

function Footer({ t }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-450 text-xs py-12 px-6 border-t border-slate-850">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <div>
            <span className="font-extrabold text-sm tracking-wider text-slate-200 uppercase">
              MangaFlow
            </span>
            <p className="text-[9px] font-semibold text-slate-500 font-mono mt-0.5">
              {t.footerCopyright}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 font-bold text-slate-400">
          <Link href="#" className="hover:text-white transition-colors">{t.footerTerms}</Link>
          <Link href="#" className="hover:text-white transition-colors">{t.footerPrivacy}</Link>
          <Link href="#" className="hover:text-white transition-colors">{t.footerContact}</Link>
          <Link href="#" className="hover:text-white transition-colors">{t.footerHelp}</Link>
        </div>
      </div>
    </footer>
  );
}

interface ModalProps {
  activeRole: RoleKey;
  setActiveRole: (role: RoleKey | null) => void;
  t: typeof translations.VI;
  isDarkMode: boolean;
}

function RoleDetailModal({ activeRole, setActiveRole, t, isDarkMode }: ModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0B0F19]/60 backdrop-blur-xs" onClick={() => setActiveRole(null)} />
      <div className={clsx("relative border rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 animate-in zoom-in-95 duration-200",
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-150"
      )}>
        <h3 className={clsx("text-base font-extrabold capitalize flex items-center gap-2", isDarkMode ? "text-white" : "text-slate-855")}>
          <span className="h-2.5 w-2.5 rounded-full bg-burgundy-700 shrink-0" />
          {t.modalTitle}: {activeRole === 'board' ? t.role4Name : activeRole === 'editor' ? t.role3Name : activeRole === 'assistant' ? t.role2Name : t.role1Name}
        </h3>
        <p className={clsx("text-xs font-semibold mt-3 border p-4 rounded-lg leading-relaxed transition-colors",
          isDarkMode ? "bg-slate-950 border-slate-850 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-555"
        )}>
          {activeRole === 'mangaka' && t.modalDetails.mangaka}
          {activeRole === 'assistant' && t.modalDetails.assistant}
          {activeRole === 'editor' && t.modalDetails.editor}
          {activeRole === 'board' && t.modalDetails.board}
        </p>
        <div className="mt-5 flex justify-end">
          <button 
            onClick={() => setActiveRole(null)}
            className="px-4 py-2 bg-burgundy-850 hover:bg-burgundy-900 text-white font-bold rounded-lg text-xs transition-colors"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main export Component ---

export default function Homepage() {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleKey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = translations[lang];

  return (
    <div className={clsx("w-full min-h-screen font-sans antialiased overflow-x-hidden transition-colors duration-300 selection:bg-burgundy-200 selection:text-burgundy-900 relative",
      isDarkMode ? "text-slate-100" : "text-slate-800"
    )}>
      {/* === Full-bleed homepage background image === */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        {/* Base image layer — slightly blurred to soften */}
        <div
          className="absolute inset-0 bg-[url('/assets/homepage_bg.png')] bg-cover bg-center bg-no-repeat"
          style={{ filter: 'blur(2px) brightness(0.7)', transform: 'scale(1.04)' }}
        />
        {/* Overlay for text readability */}
        <div className={clsx(
          "absolute inset-0",
          isDarkMode
            ? "bg-slate-950/65"
            : "bg-white/60"
        )} />
      </div>
      {/* 1. Header Navigation */}
      <HomepageHeader 
        t={t}
        lang={lang}
        setLang={setLang}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-[#0B0F19]/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-full bg-[#0F172A] border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <Logo size={32} />
                  <span className="font-extrabold text-sm tracking-wide text-white uppercase">
                    MangaFlow
                  </span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Drawer Links */}
              <nav className="flex flex-col gap-4 text-sm font-bold text-slate-300">
                <Link href="#" onClick={() => setMobileMenuOpen(false)} className="text-white border-l-2 border-burgundy-750 pl-3">{t.navHome}</Link>
                <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white pl-3">{t.navFeatures}</Link>
                <Link href="#roles" onClick={() => setMobileMenuOpen(false)} className="hover:text-white pl-3">{t.navRoles}</Link>
                <Link href="#workflow" onClick={() => setMobileMenuOpen(false)} className="hover:text-white pl-3">{t.navPricing}</Link>
                <Link href="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-white pl-3">{t.navResources}</Link>
                <Link href="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-white pl-3">{t.navContact}</Link>
              </nav>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-850">
              {/* Language Switch */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Ngôn ngữ / Language</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setLang('VI'); setMobileMenuOpen(false); }} 
                    className={clsx("px-2.5 py-1.5 rounded font-mono text-[10px] tracking-wider", lang === 'VI' ? 'bg-burgundy-850 text-white' : 'bg-slate-800 text-slate-350')}
                  >
                    VI
                  </button>
                  <button 
                    onClick={() => { setLang('EN'); setMobileMenuOpen(false); }} 
                    className={clsx("px-2.5 py-1.5 rounded font-mono text-[10px] tracking-wider", lang === 'EN' ? 'bg-burgundy-850 text-white' : 'bg-slate-800 text-slate-350')}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Theme switch */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Giao diện / Dark Mode</span>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
                  <span>{isDarkMode ? 'Light' : 'Dark'}</span>
                </button>
              </div>

              {/* Login links */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center justify-center py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-all"
                >
                  {t.navLogin}
                </Link>
                <Link 
                  href="/register" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center justify-center py-2.5 bg-[#6B1D2F] hover:bg-[#5A1827] text-white rounded-lg text-xs font-bold transition-all"
                >
                  {t.navRegister}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hero Section */}
      <HeroSection t={t} isDarkMode={isDarkMode} />

      {/* 3. Statistics Ribbon */}
      <StatsSection t={t} isDarkMode={isDarkMode} />

      {/* 4. Core Features Section */}
      <CoreFeaturesSection t={t} isDarkMode={isDarkMode} />

      {/* 5. Roles Section */}
      <RolesSection t={t} isDarkMode={isDarkMode} setActiveRole={setActiveRole} />

      {/* 6. Process Workflow Section */}
      <WorkflowSection t={t} isDarkMode={isDarkMode} />

      {/* 7. Footer Section */}
      <Footer t={t} />

      {/* Role details popup modal */}
      {activeRole && (
        <RoleDetailModal 
          activeRole={activeRole} 
          setActiveRole={setActiveRole} 
          t={t} 
          isDarkMode={isDarkMode} 
        />
      )}
    </div>
  );
}
