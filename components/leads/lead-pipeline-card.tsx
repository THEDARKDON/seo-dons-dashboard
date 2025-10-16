'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Mail, Phone, GripVertical, Flame } from 'lucide-react';
import Link from 'next/link';
import { ClickToCallButton } from '@/components/calling/click-to-call-button';

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
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface LeadPipelineCardProps {
  lead: Lead;
}

export function LeadPipelineCard({ lead }: LeadPipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignedUser = lead.users;

  const getScoreBadge = (score: number) => {
    if (score >= 70) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
          <Flame className="h-3 w-3 mr-1" />
          {score}
        </Badge>
      );
    } else if (score >= 40) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
          {score}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
          {score}
        </Badge>
      );
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          {/* Drag Handle */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link
                href={`/dashboard/leads/${lead.id}`}
                className="font-semibold hover:underline block truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.first_name} {lead.last_name}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {getScoreBadge(lead.lead_score)}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              >
                <GripVertical className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Company Info */}
          {lead.company && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}

          {/* Job Title */}
          {lead.job_title && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{lead.job_title}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-1">
            {lead.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
          </div>

          {/* Lead Source */}
          {lead.lead_source && (
            <Badge variant="outline" className="text-xs">
              {lead.lead_source}
            </Badge>
          )}

          {/* Assigned User */}
          {assignedUser && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Assigned to: {assignedUser.first_name} {assignedUser.last_name}
            </div>
          )}

          {/* Call Button */}
          {lead.phone && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              <ClickToCallButton
                phoneNumber={lead.phone}
                leadId={lead.id}
                customerName={`${lead.first_name} ${lead.last_name}`}
                variant="outline"
                size="sm"
                showLabel={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
