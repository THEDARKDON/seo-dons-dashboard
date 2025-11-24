'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DealCard } from './deal-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface Stage {
  id: string;
  label: string;
  color: string;
  count: number;
  value: number;
}

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

interface PipelineColumnProps {
  stage: Stage;
  deals: Deal[];
}

export function PipelineColumn({ stage, deals }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={isOver ? 'ring-2 ring-blue-500' : ''}>
        <CardHeader className={`${stage.color} border-b`}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{stage.label}</h3>
              <span className="text-sm font-medium px-2 py-1 rounded-full bg-background">
                {stage.count}
              </span>
            </div>
            <p className="text-sm font-semibold">{formatCurrency(stage.value)}</p>
          </div>
        </CardHeader>
        <CardContent className="p-3 min-h-[500px]" ref={setNodeRef}>
          <SortableContext
            items={deals.map(d => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {deals.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No deals
                </div>
              ) : (
                deals.map(deal => <DealCard key={deal.id} deal={deal} />)
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}
