'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useEnhancedPDF } from '@/hooks/use-enhanced-pdf';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface EnhancedPDFButtonProps {
  proposalId: string;
  existingPdfUrl?: string;
  proposalNumber?: string;
  companyName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function EnhancedPDFButton({
  proposalId,
  existingPdfUrl,
  proposalNumber,
  companyName,
  variant = 'outline',
  size = 'default',
  className,
}: EnhancedPDFButtonProps) {
  const { generatePDF, downloadPDF, isGenerating, progress, error } = useEnhancedPDF({
    showToasts: true,
    onSuccess: (result) => {
      if (result.pdfUrl && result.filename) {
        // Automatically download after generation
        downloadPDF(result.pdfUrl, result.filename);
      }
    },
  });

  const handleClick = async () => {
    if (existingPdfUrl && !isGenerating) {
      // If PDF exists, download it
      const filename = `seo-proposal-${companyName || proposalNumber || proposalId}.pdf`;
      await downloadPDF(existingPdfUrl, filename);
    } else if (!isGenerating) {
      // Generate new PDF
      await generatePDF(proposalId);
    }
  };

  const getButtonText = () => {
    if (isGenerating) {
      return 'Generating PDF...';
    }
    if (existingPdfUrl) {
      return 'Download PDF';
    }
    return 'Generate Enhanced PDF';
  };

  const getIcon = () => {
    if (isGenerating) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (existingPdfUrl) {
      return <Download className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              disabled={isGenerating}
              variant={variant}
              size={size}
              className={className}
            >
              {getIcon()}
              <span className="ml-2">{getButtonText()}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isGenerating
                ? `Generating high-fidelity PDF (${progress}%)`
                : existingPdfUrl
                ? 'Download the existing PDF'
                : 'Generate a pixel-perfect PDF from HTML'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isGenerating && progress > 0 && (
        <Progress value={progress} className="h-1" />
      )}

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}

/**
 * Smaller icon-only version of the enhanced PDF button
 */
export function EnhancedPDFIconButton({
  proposalId,
  existingPdfUrl,
  proposalNumber,
  companyName,
}: Omit<EnhancedPDFButtonProps, 'variant' | 'size' | 'className'>) {
  return (
    <EnhancedPDFButton
      proposalId={proposalId}
      existingPdfUrl={existingPdfUrl}
      proposalNumber={proposalNumber}
      companyName={companyName}
      variant="ghost"
      size="icon"
      className="h-8 w-8"
    />
  );
}