"use client";

import { useMemo } from "react";

interface SlideContentRendererProps {
  content: string | null;
  isDragging?: boolean;
  className?: string;
  slideWidth?: number;
  slideHeight?: number;
}

export function SlideContentRenderer({ 
  content, 
  isDragging = false,
  className = "",
  slideWidth = 400,
  slideHeight = 300
}: SlideContentRendererProps) {
  const sanitizedContent = useMemo(() => {
    if (!content) {
      return "<p class='text-gray-400 italic'>No content</p>";
    }

    // Basic HTML sanitization - remove script tags and dangerous attributes
    let sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');

    // Enhance media elements for better display
    // Ensure images are responsive
    sanitized = sanitized.replace(
      /<img([^>]*)>/gi,
      '<img$1 style="max-width: 100%; height: auto; border-radius: 0.5rem;" />'
    );
    
    // Ensure videos are responsive
    sanitized = sanitized.replace(
      /<video([^>]*)>/gi,
      '<video$1 style="max-width: 100%; height: auto; border-radius: 0.5rem;" />'
    );
    
    // Ensure iframes are responsive
    sanitized = sanitized.replace(
      /<iframe([^>]*)>/gi,
      '<iframe$1 style="max-width: 100%; border-radius: 0.5rem;" allowfullscreen></iframe>'
    );

    // Ensure content is wrapped in a container if it's just text
    if (!sanitized.trim().startsWith('<')) {
      sanitized = `<p>${sanitized}</p>`;
    }

    return sanitized;
  }, [content]);

  return (
    <div
      className={`flex-1 overflow-y-auto overflow-x-hidden text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-a:text-blue-600 prose-a:underline prose-strong:font-bold prose-em:italic prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-100 prose-pre:p-2 prose-pre:rounded prose-pre:overflow-x-auto prose-img:my-2 prose-video:my-2 prose-iframe:my-2 ${isDragging ? 'pointer-events-none select-none' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      style={{
        wordBreak: 'break-word',
        // Calculate font size based on slide dimensions to fit content
        fontSize: `clamp(0.625rem, ${Math.min(slideWidth, slideHeight) * 0.02}px, 1.25rem)`,
        lineHeight: '1.4',
        // Ensure text scales proportionally with slide size
        transform: 'scale(1)',
        transformOrigin: 'top left',
        maxHeight: '100%',
        // Smooth scrolling for overflow content
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
      }}
    />
  );
}

