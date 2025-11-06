'use client';

import { useState, useEffect } from 'react';

interface PresentationContentProps {
  htmlContent?: string | null;
  htmlUrl?: string | null;
}

export function PresentationContent({ htmlContent, htmlUrl }: PresentationContentProps) {
  const [zoom, setZoom] = useState(100);

  // Listen for zoom changes from toolbar
  useEffect(() => {
    const handleZoom = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setZoom(customEvent.detail);
    };

    window.addEventListener('presentation-zoom', handleZoom);
    return () => window.removeEventListener('presentation-zoom', handleZoom);
  }, []);

  if (htmlUrl) {
    // If we have a public URL, use iframe
    return (
      <div className="h-screen pt-16 overflow-auto bg-gray-100">
        <div
          className="min-h-screen transition-transform duration-300 ease-in-out"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <iframe
            src={htmlUrl}
            className="w-full min-h-screen border-0"
            title="Proposal Presentation"
          />
        </div>
      </div>
    );
  }

  // Render HTML content directly
  return (
    <div className="h-screen pt-16 overflow-auto bg-gray-100">
      <div
        className="max-w-[1200px] mx-auto p-8 transition-transform duration-300 ease-in-out"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
      />
    </div>
  );
}
