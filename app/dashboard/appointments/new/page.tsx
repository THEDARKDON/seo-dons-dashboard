'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Calendar, Loader2, Plus } from 'lucide-react';
import { format, addDays, set } from 'date-fns';
import Link from 'next/link';

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [checkingCalendar, setCheckingCalendar] = useState(true);

  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const checkCalendar = async () => {
      try {
        const response = await fetch('/api/calendar/status');
        const data = await response.json();
        setCalendarConnected(data.connected);
      } catch (error) {
        console.error('Error checking calendar:', error);
      } finally {
        setCheckingCalendar(false);
      }
    };
    checkCalendar();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    if (!contactEmail) {
      toast.error('Contact email is required');
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Get user's Supabase ID
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user?.id)
        .single();

      if (!dbUser) {
        toast.error('User not found');
        return;
      }

      if (syncToCalendar && calendarConnected) {
        // Use calendar API which creates both activity and calendar event
        const response = await fetch('/api/calendar/create-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: contactEmail,
            customerName: contactName || null,
            startTime: startTime.toISOString(),
            duration,
            title: title || `Meeting with ${contactName || contactEmail}`,
            description: description || 'Manually scheduled appointment',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create appointment');
        }

        toast.success('Appointment booked and synced to Google Calendar!');
      } else {
        // Create appointment without calendar sync
        const { error } = await supabase
          .from('activities')
          .insert({
            user_id: dbUser.id,
            activity_type: 'appointment',
            subject: title || `Meeting with ${contactName || contactEmail}`,
            description: description || 'Manually scheduled appointment',
            scheduled_at: startTime.toISOString(),
            status: 'scheduled',
            contact_name: contactName || null,
            contact_email: contactEmail || null,
          });

        if (error) throw error;

        toast.success('Appointment booked successfully!');
      }

      router.push('/dashboard/appointments');
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast.error(error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // Quick slot helpers
  const quickSlots = [
    {
      label: 'Tomorrow 10:00 AM',
      date: format(set(addDays(new Date(), 1), { hours: 10, minutes: 0 }), 'yyyy-MM-dd'),
      time: '10:00',
    },
    {
      label: 'Tomorrow 2:00 PM',
      date: format(set(addDays(new Date(), 1), { hours: 14, minutes: 0 }), 'yyyy-MM-dd'),
      time: '14:00',
    },
    {
      label: 'In 2 Days 10:00 AM',
      date: format(set(addDays(new Date(), 2), { hours: 10, minutes: 0 }), 'yyyy-MM-dd'),
      time: '10:00',
    },
    {
      label: 'Next Week 10:00 AM',
      date: format(set(addDays(new Date(), 7), { hours: 10, minutes: 0 }), 'yyyy-MM-dd'),
      time: '10:00',
    },
  ];

  const handleQuickSlot = (slot: typeof quickSlots[0]) => {
    setSelectedDate(slot.date);
    setSelectedTime(slot.time);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Book Appointment</h1>
          <p className="text-muted-foreground">Schedule a meeting manually</p>
        </div>
        <Link href="/dashboard/appointments">
          <Button variant="outline">← Back</Button>
        </Link>
      </div>

      {/* Calendar Connection Status */}
      {!checkingCalendar && !calendarConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-800 mb-2">
              <strong>Google Calendar not connected</strong> - Appointments will only be saved in the CRM
            </p>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>Enter the meeting information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Meeting Details */}
            <div className="space-y-4">
              <h3 className="font-medium">Meeting Details</h3>

              <div>
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Meeting with ${contactName || 'Contact'}`}
                />
              </div>

              <div>
                <Label htmlFor="description">Notes (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add meeting notes or agenda..."
                  rows={3}
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <h3 className="font-medium">Date & Time</h3>

              {/* Quick Slots */}
              <div>
                <Label className="text-sm mb-2 block">Quick Time Slots</Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickSlots.map((slot, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={selectedDate === slot.date && selectedTime === slot.time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleQuickSlot(slot)}
                      className="text-xs"
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date/Time */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calendar Sync Option */}
            {calendarConnected && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sync_calendar"
                  checked={syncToCalendar}
                  onCheckedChange={(checked) => setSyncToCalendar(checked === true)}
                />
                <label
                  htmlFor="sync_calendar"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sync to Google Calendar and send invite to attendee
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Link href="/dashboard/appointments">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
