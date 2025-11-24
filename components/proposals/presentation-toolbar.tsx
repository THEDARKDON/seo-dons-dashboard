'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Maximize, Download, Minimize } from 'lucide-react';

interface PresentationToolbarProps {
  proposalTitle: string;
  pdfUrl?: string | null;
}

export function PresentationToolbar({ proposalTitle, pdfUrl }: PresentationToolbarProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide toolbar after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 25, 200);
    setZoom(newZoom);
    window.dispatchEvent(new CustomEvent('presentation-zoom', { detail: newZoom }));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 25, 50);
    setZoom(newZoom);
    window.dispatchEvent(new CustomEvent('presentation-zoom', { detail: newZoom }));
  };

  const handleFitToWidth = () => {
    setZoom(100);
    window.dispatchEvent(new CustomEvent('presentation-zoom', { detail: 100 }));
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleExit = () => window.close();

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium">{proposalTitle}</h1>
          <span className="text-xs text-white/60">Presentation Mode</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="text-white hover:bg-white/20 h-8"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-sm w-16 text-center">{zoom}%</span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="text-white hover:bg-white/20 h-8"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitToWidth}
            className="text-white hover:bg-white/20 h-8 text-xs"
            title="Reset Zoom"
          >
            Fit to Width
          </Button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="text-white hover:bg-white/20 h-8"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          {/* Download PDF */}
          {pdfUrl && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white hover:bg-white/20 h-8"
              title="Download PDF"
            >
              <a href={pdfUrl} download>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </a>
            </Button>
          )}

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Exit */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="text-white hover:bg-white/20 h-8"
            title="Close Presentation"
          >
            <X className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
