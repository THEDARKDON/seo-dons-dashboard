'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const stages = [
  { value: 'prospecting', label: 'Prospecting', color: 'bg-gray-200' },
  { value: 'qualification', label: 'Qualification', color: 'bg-blue-200' },
  { value: 'proposal', label: 'Proposal', color: 'bg-purple-200' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-200' },
  { value: 'closed_won', label: 'Won', color: 'bg-green-200' },
  { value: 'closed_lost', label: 'Lost', color: 'bg-red-200' },
];

interface DealStagePipelineProps {
  dealId: string;
  currentStage: string;
}

export function DealStagePipeline({ dealId, currentStage }: DealStagePipelineProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentStageIndex = stages.findIndex(s => s.value === currentStage);

  const handleStageChange = async (newStage: string) => {
    if (newStage === currentStage || loading) return;

    setLoading(true);
    try {
      const updates: any = {
        stage: newStage,
        updated_at: new Date().toISOString(),
      };

      // If moving to closed_won, set actual_close_date
      if (newStage === 'closed_won' && currentStage !== 'closed_won') {
        updates.actual_close_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', dealId);

      if (error) throw error;

      toast.success(`Deal moved to ${stages.find(s => s.value === newStage)?.label}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Failed to update stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Deal Stage Pipeline</h3>

      {/* Visual Pipeline */}
      <div className="relative">
        <div className="flex items-center gap-2">
          {stages.map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isPast = index < currentStageIndex;
            const isLost = currentStage === 'closed_lost';
            const isWon = currentStage === 'closed_won';

            return (
              <div key={stage.value} className="flex items-center flex-1">
                <button
                  onClick={() => handleStageChange(stage.value)}
                  disabled={loading || (isLost && stage.value !== 'closed_lost') || (isWon && stage.value !== 'closed_won')}
                  className={cn(
                    'relative flex-1 rounded-lg p-3 text-sm font-medium transition-all',
                    'hover:shadow-md disabled:cursor-not-allowed',
                    isActive && 'ring-2 ring-blue-500 ring-offset-2',
                    isPast && 'opacity-60',
                    stage.color
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isPast && <Check className="h-4 w-4" />}
                    {stage.label}
                  </div>
                  {isActive && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>

                {index < stages.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-1 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Stage Info */}
      <div className="text-sm text-muted-foreground">
        <p>Current Stage: <span className="font-semibold text-foreground">
          {stages.find(s => s.value === currentStage)?.label}
        </span></p>
        <p className="text-xs mt-1">Click on any stage to move the deal forward or backward</p>
      </div>
    </div>
  );
}
