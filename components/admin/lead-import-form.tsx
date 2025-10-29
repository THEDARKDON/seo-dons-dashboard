'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Plus, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LeadImportFormProps {
  userId: string;
}

interface ParsedLead {
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin_url?: string;
  job_title?: string;
  industry?: string;
  company_size?: string;
  notes?: string;
}

export default function LeadImportForm({ userId }: LeadImportFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<any>(null);

  // Manual entry form state
  const [manualLead, setManualLead] = useState<ParsedLead>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    linkedin_url: '',
    job_title: '',
    industry: '',
    company_size: '',
    notes: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImportResult(null);

    // Parse CSV
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const leads: ParsedLead[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',').map(v => v.trim());
      const lead: ParsedLead = {};

      headers.forEach((header, index) => {
        const value = values[index]?.replace(/^"|"$/g, ''); // Remove quotes
        if (!value) return;

        // Map CSV headers to lead fields
        if (header.includes('company')) lead.company_name = value;
        else if (header.includes('name') || header.includes('contact')) lead.contact_name = value;
        else if (header.includes('email')) lead.email = value;
        else if (header.includes('phone') || header.includes('tel')) lead.phone = value;
        else if (header.includes('website') || header.includes('url')) lead.website = value;
        else if (header.includes('linkedin')) lead.linkedin_url = value;
        else if (header.includes('title') || header.includes('position')) lead.job_title = value;
        else if (header.includes('industry')) lead.industry = value;
        else if (header.includes('size')) lead.company_size = value;
        else if (header.includes('note')) lead.notes = value;
      });

      if (Object.keys(lead).length > 0) {
        leads.push(lead);
      }
    }

    setParsedLeads(leads);
  };

  const handleImportCSV = async () => {
    if (parsedLeads.length === 0) return;

    setLoading(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/admin/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: parsedLeads,
          assignedToUserId: userId,
          importType: 'csv',
          settings: { skipDuplicates },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        setParsedLeads([]);
        setCsvFile(null);
        router.refresh();
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error: any) {
      alert('Import failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/admin/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: [manualLead],
          assignedToUserId: userId,
          importType: 'manual',
          settings: { skipDuplicates },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        setManualLead({
          company_name: '',
          contact_name: '',
          email: '',
          phone: '',
          website: '',
          linkedin_url: '',
          job_title: '',
          industry: '',
          company_size: '',
          notes: '',
        });
        router.refresh();
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error: any) {
      alert('Import failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Leads</CardTitle>
        <CardDescription>
          Upload a CSV file or add leads manually
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Import Result */}
        {importResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            importResult.summary.failed === 0
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {importResult.summary.failed === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Import Complete</p>
                <div className="text-sm mt-2 space-y-1">
                  <p>Total: {importResult.summary.total}</p>
                  <p className="text-green-600">✓ Successful: {importResult.summary.successful}</p>
                  {importResult.summary.failed > 0 && (
                    <p className="text-red-600">✗ Failed: {importResult.summary.failed}</p>
                  )}
                  {importResult.summary.duplicates > 0 && (
                    <p className="text-orange-600">⚠ Duplicates: {importResult.summary.duplicates}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">
              <Upload className="h-4 w-4 mr-2" />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          {/* CSV Upload Tab */}
          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  CSV should include columns: company_name, contact_name, email, phone, website, linkedin_url, job_title, industry, company_size, notes
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-duplicates"
                  checked={skipDuplicates}
                  onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
                />
                <label
                  htmlFor="skip-duplicates"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Skip duplicate emails
                </label>
              </div>

              {/* Preview Table */}
              {parsedLeads.length > 0 && (
                <>
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-muted">
                      <h3 className="font-medium">Preview ({parsedLeads.length} leads)</h3>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Job Title</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedLeads.slice(0, 10).map((lead, index) => (
                            <TableRow key={index}>
                              <TableCell>{lead.company_name || '-'}</TableCell>
                              <TableCell>{lead.contact_name || '-'}</TableCell>
                              <TableCell>{lead.email || '-'}</TableCell>
                              <TableCell>{lead.phone || '-'}</TableCell>
                              <TableCell>{lead.job_title || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {parsedLeads.length > 10 && (
                        <div className="p-4 text-center text-sm text-muted-foreground border-t">
                          Showing 10 of {parsedLeads.length} leads
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleImportCSV}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>Import {parsedLeads.length} Leads</>
                    )}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={manualLead.company_name}
                    onChange={(e) => setManualLead({ ...manualLead, company_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={manualLead.contact_name}
                    onChange={(e) => setManualLead({ ...manualLead, contact_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={manualLead.email}
                    onChange={(e) => setManualLead({ ...manualLead, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={manualLead.phone}
                    onChange={(e) => setManualLead({ ...manualLead, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={manualLead.website}
                    onChange={(e) => setManualLead({ ...manualLead, website: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    value={manualLead.linkedin_url}
                    onChange={(e) => setManualLead({ ...manualLead, linkedin_url: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={manualLead.job_title}
                    onChange={(e) => setManualLead({ ...manualLead, job_title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={manualLead.industry}
                    onChange={(e) => setManualLead({ ...manualLead, industry: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="company_size">Company Size</Label>
                  <Input
                    id="company_size"
                    value={manualLead.company_size}
                    onChange={(e) => setManualLead({ ...manualLead, company_size: e.target.value })}
                    placeholder="e.g., 10-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={manualLead.notes}
                  onChange={(e) => setManualLead({ ...manualLead, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-duplicates-manual"
                  checked={skipDuplicates}
                  onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
                />
                <label
                  htmlFor="skip-duplicates-manual"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Skip if duplicate email exists
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Lead...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lead
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
