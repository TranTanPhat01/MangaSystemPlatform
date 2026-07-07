import React from 'react';
import { clsx } from 'clsx';

interface MangaStylePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 1 | 2 | 3;
  hasSpeechBubble?: boolean;
  bubblePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function MangaStylePanel({
  children,
  className,
  variant = 1,
  hasSpeechBubble = false,
  bubblePosition = 'bottom-left',
  ...props
}: MangaStylePanelProps) {
  const clipClass = 
    variant === 1 
      ? 'manga-panel-clip-1' 
      : variant === 2 
        ? 'manga-panel-clip-2' 
        : 'manga-panel-clip-3';

  return (
    <div className={clsx("relative group", className)} {...props}>
      {/* 3D offset comic panel shadow */}
      <div className={clsx(
        "absolute inset-0 bg-slate-950/10 dark:bg-black/45 translate-x-1 translate-y-1 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:translate-y-1.5",
        clipClass
      )} />

      {/* Main Panel Content Card */}
      <div className={clsx(
        "relative w-full h-full p-5 border border-slate-900 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5",
        clipClass
      )}>
        {children}

        {/* Manga speech bubble pointer tail */}
        {hasSpeechBubble && (
          <div className={clsx(
            "absolute w-3.5 h-3.5 border border-slate-900 dark:border-slate-800 bg-white dark:bg-slate-900 transform rotate-45 z-10",
            bubblePosition === 'top-left' && "top-0 left-8 -translate-y-1/2 border-r-0 border-b-0",
            bubblePosition === 'top-right' && "top-0 right-8 -translate-y-1/2 border-l-0 border-b-0",
            bubblePosition === 'bottom-left' && "bottom-0 left-8 translate-y-1/2 border-t-0 border-l-0",
            bubblePosition === 'bottom-right' && "bottom-0 right-8 translate-y-1/2 border-t-0 border-r-0"
          )} />
        )}
      </div>
    </div>
  );
}
