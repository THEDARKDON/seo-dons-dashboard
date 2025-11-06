'use client';

import { useState, useEffect } from 'react';

interface PresentationContentProps {
  proposalId: string;
}

export function PresentationContent({ proposalId }: PresentationContentProps) {
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

  // Always use iframe with inline viewer endpoint for consistent rendering
  return (
    <div className="h-screen pt-16 overflow-hidden bg-gray-100">
      <div
        className="w-full h-full transition-transform duration-300 ease-in-out"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
      >
        <iframe
          src={`/api/proposals/${proposalId}/view-inline`}
          className="w-full h-full border-0"
          title="Proposal Presentation"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
}
