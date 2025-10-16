'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PipelineColumn } from './pipeline-column';
import { DealCard } from './deal-card';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

const stages = [
  { id: 'prospecting', label: 'Prospecting', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'qualification', label: 'Qualification', color: 'bg-blue-50 dark:bg-blue-950' },
  { id: 'proposal', label: 'Proposal', color: 'bg-purple-50 dark:bg-purple-950' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-50 dark:bg-orange-950' },
  { id: 'closed_won', label: 'Won', color: 'bg-green-50 dark:bg-green-950' },
  { id: 'closed_lost', label: 'Lost', color: 'bg-red-50 dark:bg-red-950' },
];

interface Deal {
  id: string;
  deal_name: string;
  deal_value: number;
  stage: string;
  stage_position: number;
  probability?: number;
  expected_close_date?: string;
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface PipelineBoardProps {
  initialDeals: Deal[];
}

export function PipelineBoard({ initialDeals }: PipelineBoardProps) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the deal being dragged
    const activeDeal = deals.find(d => d.id === activeId);
    if (!activeDeal) return;

    // Check if dropped on a stage column or another deal
    const overStage = stages.find(s => s.id === overId)?.id;
    const overDeal = deals.find(d => d.id === overId);
    const targetStage = overStage || overDeal?.stage;

    if (!targetStage) return;

    // If stage changed
    if (activeDeal.stage !== targetStage) {
      const updatedDeals = deals.map(deal =>
        deal.id === activeId ? { ...deal, stage: targetStage } : deal
      );

      setDeals(updatedDeals);

      // Update in database
      try {
        const updates: any = {
          stage: targetStage,
          updated_at: new Date().toISOString(),
        };

        // If moving to closed_won, set actual_close_date
        if (targetStage === 'closed_won' && activeDeal.stage !== 'closed_won') {
          updates.actual_close_date = new Date().toISOString().split('T')[0];
        }

        const { error } = await supabase
          .from('deals')
          .update(updates)
          .eq('id', activeId);

        if (error) throw error;

        toast.success(`Deal moved to ${stages.find(s => s.id === targetStage)?.label}`);
        router.refresh();
      } catch (error) {
        console.error('Error updating deal:', error);
        toast.error('Failed to update deal');
        // Revert on error
        setDeals(deals);
      }
    }
  };

  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals
      .filter(d => d.stage === stage.id)
      .sort((a, b) => (a.stage_position || 0) - (b.stage_position || 0));
    return acc;
  }, {} as Record<string, Deal[]>);

  // Calculate stage totals
  const stageTotals = stages.map(stage => ({
    ...stage,
    count: dealsByStage[stage.id]?.length || 0,
    value: dealsByStage[stage.id]?.reduce((sum, deal) => sum + Number(deal.deal_value), 0) || 0,
  }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stageTotals.map(stage => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="rotate-3 opacity-80">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
