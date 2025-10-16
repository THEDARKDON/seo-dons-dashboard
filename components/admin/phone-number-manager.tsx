'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Plus, Search, ShoppingCart, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  user_voip_settings: Array<{
    assigned_phone_number: string;
    caller_id_number: string;
    auto_record: boolean;
    auto_transcribe: boolean;
  }>;
}

interface PhoneNumberManagerProps {
  initialUsers: User[];
}

export function PhoneNumberManager({ initialUsers }: PhoneNumberManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [areaCode, setAreaCode] = useState('');

  const searchNumbers = async () => {
    setSearching(true);
    try {
      const url = `/api/admin/twilio/available-numbers${areaCode ? `?areaCode=${areaCode}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch numbers');
      }

      setAvailableNumbers(data.numbers);
      toast.success(`Found ${data.total} available numbers`);
    } catch (error: any) {
      console.error('Error searching numbers:', error);
      toast.error(error.message || 'Failed to search numbers');
    } finally {
      setSearching(false);
    }
  };

  const purchaseNumber = async (phoneNumber: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/twilio/purchase-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase number');
      }

      toast.success(`Phone number ${phoneNumber} purchased successfully!`);

      // Remove from available list
      setAvailableNumbers((prev) => prev.filter((n) => n.phone_number !== phoneNumber));
    } catch (error: any) {
      console.error('Error purchasing number:', error);
      toast.error(error.message || 'Failed to purchase number');
    } finally {
      setLoading(false);
    }
  };

  const assignNumber = async (userId: string, phoneNumber: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/twilio/assign-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          phoneNumber,
          autoRecord: true,
          autoTranscribe: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign number');
      }

      toast.success('Phone number assigned successfully!');

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                user_voip_settings: [
                  {
                    assigned_phone_number: phoneNumber,
                    caller_id_number: phoneNumber,
                    auto_record: true,
                    auto_transcribe: true,
                  },
                ],
              }
            : u
        )
      );

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Error assigning number:', error);
      toast.error(error.message || 'Failed to assign number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Purchase Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Available Numbers
          </CardTitle>
          <CardDescription>Browse and purchase UK phone numbers from Twilio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="areaCode">Area Code (Optional)</Label>
              <Input
                id="areaCode"
                placeholder="e.g., 20 for London"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchNumbers} disabled={searching}>
                {searching ? 'Searching...' : 'Search Numbers'}
              </Button>
            </div>
          </div>

          {availableNumbers.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Available Numbers ({availableNumbers.length})</h3>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {availableNumbers.map((number) => (
                  <div
                    key={number.phone_number}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{number.phone_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {number.locality}, {number.region}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {number.capabilities.voice && <Badge variant="outline">Voice</Badge>}
                        {number.capabilities.SMS && <Badge variant="outline">SMS</Badge>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => purchaseNumber(number.phone_number)}
                      disabled={loading}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Assignments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Numbers to Users
          </CardTitle>
          <CardDescription>Manage phone number assignments for each SDR/BDR</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => {
              const voipSettings = user.user_voip_settings?.[0];

              return (
                <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <p className="font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {user.role}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    {voipSettings?.assigned_phone_number ? (
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {voipSettings.assigned_phone_number}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {voipSettings.auto_record && (
                            <Badge variant="secondary" className="text-xs">
                              Recording
                            </Badge>
                          )}
                          {voipSettings.auto_transcribe && (
                            <Badge variant="secondary" className="text-xs">
                              Transcription
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No number assigned</p>
                    )}

                    <div className="space-y-2">
                      <Input
                        placeholder="+44..."
                        className="w-40"
                        id={`number-${user.id}`}
                        defaultValue={voipSettings?.assigned_phone_number || ''}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`number-${user.id}`) as HTMLInputElement;
                          const phoneNumber = input?.value;
                          if (phoneNumber) {
                            assignNumber(user.id, phoneNumber);
                          }
                        }}
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
