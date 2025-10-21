import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadConvertModal } from '@/components/leads/lead-convert-modal';
import { LeadActivityTimeline } from '@/components/leads/lead-activity-timeline';
import { ClickToCallButton } from '@/components/calling/click-to-call-button';
import { LeadEditModal } from '@/components/leads/lead-edit-modal';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Linkedin,
  MapPin,
  User,
  Briefcase,
  Calendar,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';

async function getLeadData(leadId: string, userId: string) {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) return null;

    // Get lead
    const { data: lead } = await supabase
      .from('leads')
      .select(`
        *,
        users!leads_assigned_to_fkey (id, first_name, last_name, email)
      `)
      .eq('id', leadId)
      .single();

    if (!lead) return null;

    // Check access
    if (user.role === 'bdr' && lead.assigned_to !== user.id) {
      return null;
    }

    // Get activities
    const { data: activities } = await supabase
      .from('lead_activities')
      .select(`
        *,
        users (first_name, last_name)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    return { lead, activities: activities || [] };
  } catch (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
}

export default async function LeadDetailPage(props: { params: { id: string } }) {
  const params = props.params;
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const data = await getLeadData(params.id, userId);

  if (!data) {
    notFound();
  }

  const { lead, activities } = data;
  const assignedUser = lead.users;

  const getScoreBadge = (score: number) => {
    if (score >= 70) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <Flame className="h-3 w-3 mr-1" />
          Hot Lead {score}
        </Badge>
      );
    } else if (score >= 40) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          Warm Lead {score}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Cold Lead {score}
        </Badge>
      );
    }
  };

  const statusColors = {
    new: 'default',
    contacted: 'secondary',
    qualified: 'default',
    unqualified: 'destructive',
    converted: 'success',
    lost: 'destructive',
  } as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {lead.first_name} {lead.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getScoreBadge(lead.lead_score)}
              <Badge variant={statusColors[lead.status as keyof typeof statusColors]}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>
              {lead.lead_source && (
                <Badge variant="outline">{lead.lead_source}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LeadEditModal lead={lead} />
          {lead.status !== 'converted' && (
            <LeadConvertModal leadId={lead.id} leadName={`${lead.first_name} ${lead.last_name}`} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${lead.email}`} className="hover:underline">
                      {lead.email}
                    </a>
                  </div>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                      <ClickToCallButton
                        phoneNumber={lead.phone}
                        leadId={lead.id}
                        customerName={`${lead.first_name} ${lead.last_name}`}
                        customerEmail={lead.email}
                        size="sm"
                        variant="ghost"
                        showLabel={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {lead.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p>{lead.company}</p>
                  </div>
                </div>
              )}

              {lead.job_title && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Job Title</p>
                    <p>{lead.job_title}</p>
                  </div>
                </div>
              )}

              {lead.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {lead.website}
                    </a>
                  </div>
                </div>
              )}

              {lead.linkedin_url && (
                <div className="flex items-center gap-3">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <a
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              )}
            </div>

            {(lead.address || lead.city || lead.state) && (
              <div className="pt-4 border-t">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p>
                      {lead.address && <span>{lead.address}<br /></span>}
                      {lead.city && <span>{lead.city}, </span>}
                      {lead.state && <span>{lead.state} </span>}
                      {lead.postal_code && <span>{lead.postal_code}</span>}
                      {lead.country && <><br />{lead.country}</>}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {lead.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{lead.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Details */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedUser && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">
                    {assignedUser.first_name} {assignedUser.last_name}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p>{formatDate(lead.created_at)}</p>
              </div>
            </div>

            {lead.last_contacted_at && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Contacted</p>
                  <p>{formatDate(lead.last_contacted_at)}</p>
                </div>
              </div>
            )}

            {lead.industry && (
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p>{lead.industry}</p>
              </div>
            )}

            {lead.company_size && (
              <div>
                <p className="text-sm text-muted-foreground">Company Size</p>
                <p>{lead.company_size}</p>
              </div>
            )}

            {lead.tags && lead.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadActivityTimeline leadId={lead.id} initialActivities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
