'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';

interface MobileCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call?: any;
  isNew: boolean;
  tags: any[];
  onSave: () => void;
}

export function MobileCallDialog({
  open,
  onOpenChange,
  call,
  isNew,
  tags,
  onSave
}: MobileCallDialogProps) {
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    phone_number: '',
    contact_name: '',
    call_type: 'mobile',
    direction: 'outbound',
    duration_minutes: 0,
    duration_seconds: 0,
    status: 'completed',
    outcome: '',
    notes: '',
    follow_up_date: null as Date | null,
    follow_up_notes: '',
    location_name: '',
    customer_id: '',
    lead_id: '',
    called_at: new Date(),
  });

  useEffect(() => {
    if (open) {
      loadData();
      if (call && !isNew) {
        // Load existing call data
        setFormData({
          phone_number: call.phone_number || '',
          contact_name: call.contact_name || '',
          call_type: call.call_type || 'mobile',
          direction: call.direction || 'outbound',
          duration_minutes: Math.floor((call.duration_seconds || 0) / 60),
          duration_seconds: (call.duration_seconds || 0) % 60,
          status: call.status || 'completed',
          outcome: call.outcome || '',
          notes: call.notes || '',
          follow_up_date: call.follow_up_date ? new Date(call.follow_up_date) : null,
          follow_up_notes: call.follow_up_notes || '',
          location_name: call.location_name || '',
          customer_id: call.customer_id || '',
          lead_id: call.lead_id || '',
          called_at: new Date(call.called_at),
        });
        setSelectedTags(call.tags?.map((t: any) => t.id) || []);
      } else {
        // Reset form for new call
        setFormData({
          phone_number: '',
          contact_name: '',
          call_type: 'mobile',
          direction: 'outbound',
          duration_minutes: 0,
          duration_seconds: 0,
          status: 'completed',
          outcome: '',
          notes: '',
          follow_up_date: null,
          follow_up_notes: '',
          location_name: '',
          customer_id: '',
          lead_id: '',
          called_at: new Date(),
        });
        setSelectedTags([]);
      }
    }
  }, [open, call, isNew]);

  const loadData = async () => {
    // Get current user ID
    if (clerkUser) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (userData) {
        setCurrentUserId(userData.id);
      }
    }

    // Load customers and leads for selection
    const [customersRes, leadsRes] = await Promise.all([
      supabase.from('customers').select('id, first_name, last_name, company').order('company'),
      supabase.from('leads').select('id, first_name, last_name, company').order('company')
    ]);

    setCustomers(customersRes.data || []);
    setLeads(leadsRes.data || []);
  };

  const handleSubmit = async () => {
    if (!formData.phone_number) {
      toast.error('Phone number is required');
      return;
    }

    setLoading(true);

    try {
      const totalDurationSeconds = formData.duration_minutes * 60 + formData.duration_seconds;

      const callData = {
        user_id: isNew ? currentUserId : call.user_id,
        phone_number: formData.phone_number,
        contact_name: formData.contact_name || null,
        call_type: formData.call_type,
        direction: formData.direction,
        duration_seconds: totalDurationSeconds,
        status: formData.status,
        outcome: formData.outcome || null,
        notes: formData.notes || null,
        follow_up_date: formData.follow_up_date ? format(formData.follow_up_date, 'yyyy-MM-dd') : null,
        follow_up_notes: formData.follow_up_notes || null,
        location_name: formData.location_name || null,
        customer_id: formData.customer_id || null,
        lead_id: formData.lead_id || null,
        called_at: formData.called_at.toISOString(),
      };

      let callId = call?.id;

      if (isNew) {
        // Create new call
        const { data, error } = await supabase
          .from('mobile_calls')
          .insert(callData)
          .select()
          .single();

        if (error) throw error;
        callId = data.id;
      } else {
        // Update existing call
        const { error } = await supabase
          .from('mobile_calls')
          .update(callData)
          .eq('id', call.id);

        if (error) throw error;
      }

      // Update tags
      if (callId) {
        // Remove existing tags
        await supabase
          .from('mobile_call_tag_relations')
          .delete()
          .eq('mobile_call_id', callId);

        // Add new tags
        if (selectedTags.length > 0) {
          await supabase
            .from('mobile_call_tag_relations')
            .insert(
              selectedTags.map(tagId => ({
                mobile_call_id: callId,
                tag_id: tagId,
              }))
            );
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving call:', error);
      toast.error('Failed to save call');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Try to get location name using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();

            setFormData(prev => ({
              ...prev,
              location_name: data.display_name || `${latitude}, ${longitude}`,
            }));

            toast.success('Location captured');
          } catch (error) {
            setFormData(prev => ({
              ...prev,
              location_name: `${latitude}, ${longitude}`,
            }));
          }
        },
        (error) => {
          toast.error('Could not get location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Log New Mobile Call' : 'Edit Call Details'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+44 7700 900000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name</Label>
                <Input
                  id="name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value, lead_id: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company || `${customer.first_name} ${customer.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead">Lead</Label>
                <Select
                  value={formData.lead_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value, customer_id: '' }))}
                  disabled={!!formData.customer_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.company || `${lead.first_name} ${lead.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Call Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Call Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Call Type</Label>
                <Select
                  value={formData.call_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, call_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, direction: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Call Duration</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="0"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                  />
                  <span className="text-sm">min</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                  />
                  <span className="text-sm">sec</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select
                  value={formData.outcome}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, outcome: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="callback_scheduled">Callback Scheduled</SelectItem>
                    <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                    <SelectItem value="no_decision">No Decision</SelectItem>
                    <SelectItem value="wrong_number">Wrong Number</SelectItem>
                    <SelectItem value="voicemail_left">Voicemail Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Called At</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.called_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.called_at, "PPP p")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.called_at}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, called_at: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Location</h3>
            <div className="flex gap-2">
              <Input
                value={formData.location_name}
                onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                placeholder="Enter location or use current location"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Use Current
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag.id)
                        ? prev.filter(t => t !== tag.id)
                        : [...prev, tag.id]
                    );
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Call Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter call notes, key points discussed, etc..."
              rows={4}
            />
          </div>

          {/* Follow Up */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Follow Up</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Follow Up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.follow_up_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.follow_up_date ? format(formData.follow_up_date, "PPP") : "Select date..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.follow_up_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, follow_up_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Follow Up Notes</Label>
                <Input
                  value={formData.follow_up_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, follow_up_notes: e.target.value }))}
                  placeholder="What needs to be done..."
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isNew ? 'Log Call' : 'Update Call'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}