'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LeadPipelineCard } from './lead-pipeline-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Stage {
  id: string;
  label: string;
  color: string;
  count: number;
}

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

interface LeadPipelineColumnProps {
  stage: Stage;
  leads: Lead[];
}

export function LeadPipelineColumn({ stage, leads }: LeadPipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={isOver ? 'ring-2 ring-blue-500' : ''}>
        <CardHeader className={`${stage.color} border-b`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{stage.label}</h3>
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-background">
              {stage.count}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-3 min-h-[500px]" ref={setNodeRef}>
          <SortableContext
            items={leads.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {leads.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No leads
                </div>
              ) : (
                leads.map(lead => <LeadPipelineCard key={lead.id} lead={lead} />)
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}
