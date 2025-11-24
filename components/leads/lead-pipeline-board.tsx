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
import { LeadPipelineColumn } from './lead-pipeline-column';
import { LeadPipelineCard } from './lead-pipeline-card';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

const stages = [
  { id: 'new', label: 'New', color: 'bg-blue-50 dark:bg-blue-950' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-50 dark:bg-yellow-950' },
  { id: 'qualified', label: 'Qualified', color: 'bg-purple-50 dark:bg-purple-950' },
  { id: 'unqualified', label: 'Unqualified', color: 'bg-red-50 dark:bg-red-950' },
  { id: 'converted', label: 'Converted', color: 'bg-green-50 dark:bg-green-950' },
];

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status: string;
  lead_score: number;
  lead_source?: string;
  created_at: string;
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface LeadPipelineBoardProps {
  initialLeads: Lead[];
}

export function LeadPipelineBoard({ initialLeads }: LeadPipelineBoardProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the lead being dragged
    const activeLead = leads.find(l => l.id === activeId);
    if (!activeLead) return;

    // Check if dropped on a stage column or another lead
    const overStage = stages.find(s => s.id === overId)?.id;
    const overLead = leads.find(l => l.id === overId);
    const targetStage = overStage || overLead?.status;

    if (!targetStage) return;

    // If stage changed
    if (activeLead.status !== targetStage) {
      const updatedLeads = leads.map(lead =>
        lead.id === activeId ? { ...lead, status: targetStage } : lead
      );

      setLeads(updatedLeads);

      // Update in database
      try {
        const { error } = await supabase
          .from('leads')
          .update({
            status: targetStage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeId);

        if (error) throw error;

        toast.success(`Lead moved to ${stages.find(s => s.id === targetStage)?.label}`);
        router.refresh();
      } catch (error) {
        console.error('Error updating lead:', error);
        toast.error('Failed to update lead');
        // Revert on error
        setLeads(leads);
      }
    }
  };

  // Group leads by status
  const leadsByStatus = stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(l => l.status === stage.id);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Calculate stage totals
  const stageTotals = stages.map(stage => ({
    ...stage,
    count: leadsByStatus[stage.id]?.length || 0,
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
          <LeadPipelineColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStatus[stage.id] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="rotate-3 opacity-80">
            <LeadPipelineCard lead={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
