/**
 * Hook for enhanced PDF generation with progress tracking
 */

import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  filename?: string;
  generationTime?: string;
  size?: number;
  error?: string;
}

export interface UseEnhancedPDFOptions {
  onSuccess?: (result: PDFGenerationResult) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
}

export function useEnhancedPDF(options: UseEnhancedPDFOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (proposalId: string): Promise<PDFGenerationResult | null> => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch(`/api/proposals/${proposalId}/generate-enhanced-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }

      const result: PDFGenerationResult = await response.json();

      setProgress(100);

      if (options.showToasts !== false) {
        toast({
          title: 'PDF Generated Successfully',
          description: `Your PDF was generated in ${result.generationTime}s`,
        });
      }

      options.onSuccess?.(result);

      // Reset progress after a delay
      setTimeout(() => setProgress(0), 1000);

      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate PDF';
      setError(errorMessage);

      if (options.showToasts !== false) {
        toast({
          title: 'PDF Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      options.onError?.(errorMessage);

      return null;

    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async (pdfUrl: string, filename: string) => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (options.showToasts !== false) {
        toast({
          title: 'PDF Downloaded',
          description: `${filename} has been downloaded`,
        });
      }
    } catch (err) {
      const errorMessage = 'Failed to download PDF';

      if (options.showToasts !== false) {
        toast({
          title: 'Download Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const reset = () => {
    setIsGenerating(false);
    setProgress(0);
    setError(null);
  };

  return {
    generatePDF,
    downloadPDF,
    isGenerating,
    progress,
    error,
    reset
  };
}