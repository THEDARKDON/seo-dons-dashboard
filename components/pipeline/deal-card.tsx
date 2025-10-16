'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Building2, User, Calendar, DollarSign, GripVertical } from 'lucide-react';
import Link from 'next/link';

interface Deal {
  id: string;
  deal_name: string;
  deal_value: number;
  stage: string;
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

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const customer = deal.customers;
  const assignedUser = deal.users;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          {/* Drag Handle */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link
                href={`/dashboard/deals/${deal.id}`}
                className="font-semibold hover:underline block truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {deal.deal_name}
              </Link>
            </div>
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-5 w-5" />
            </div>
          </div>

          {/* Deal Value */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-bold text-lg">{formatCurrency(Number(deal.deal_value))}</span>
            {deal.probability && (
              <Badge variant="secondary" className="ml-auto">
                {deal.probability}%
              </Badge>
            )}
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {customer.company ? (
                <>
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="truncate">{customer.company}</span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {customer.first_name} {customer.last_name}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Assigned User */}
          {assignedUser && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">
                {assignedUser.first_name} {assignedUser.last_name}
              </span>
            </div>
          )}

          {/* Expected Close Date */}
          {deal.expected_close_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(deal.expected_close_date)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
