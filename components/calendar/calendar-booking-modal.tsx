'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, addHours, set, format } from 'date-fns';

interface CalendarBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerEmail: string;
  customerName?: string;
  customerId?: string;
  dealId?: string;
  leadId?: string;
  callRecordId?: string;
  phoneNumber?: string;
}

export function CalendarBookingModal({
  open,
  onOpenChange,
  customerEmail,
  customerName,
  customerId,
  dealId,
  leadId,
  callRecordId,
  phoneNumber,
}: CalendarBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [eventLink, setEventLink] = useState<string | null>(null);

  // Form state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [title, setTitle] = useState(`Follow-up Meeting with ${customerName || 'Customer'}`);
  const [description, setDescription] = useState('');

  // Generate quick date/time options
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail,
          customerName,
          startTime: startTime.toISOString(),
          duration,
          title,
          description: description || `Follow-up meeting after call${phoneNumber ? ` to ${phoneNumber}` : ''}`,
          callRecordId,
          customerId,
          dealId,
          leadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create calendar event');
      }

      setEventLink(data.calendarEventLink);
      setSuccess(true);
      toast.success('Meeting booked successfully!');

      // Auto-close after 3 seconds
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 3000);
    } catch (error: any) {
      console.error('Error booking meeting:', error);
      toast.error(error.message || 'Failed to book meeting');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setEventLink(null);
    setSelectedDate('');
    setSelectedTime('');
    setDuration(30);
    setTitle(`Follow-up Meeting with ${customerName || 'Customer'}`);
    setDescription('');
  };

  if (success && eventLink) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Meeting Booked Successfully!
            </DialogTitle>
            <DialogDescription>
              Calendar invite has been sent to {customerEmail}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                The meeting has been added to your calendar and an invite has been sent to the customer.
              </p>
              <Button asChild className="gap-2">
                <a href={eventLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View in Google Calendar
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Book Follow-up Meeting
          </DialogTitle>
          <DialogDescription>
            Schedule a meeting with {customerName || customerEmail}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Slots */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Time Slots</Label>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
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
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration */}
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

          {/* Title */}
          <div>
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Follow-up Meeting"
              required
            />
          </div>

          {/* Description */}
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

          {/* Customer Info */}
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Attendee:</p>
            <p className="text-muted-foreground">{customerName && `${customerName} - `}{customerEmail}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Meeting
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
