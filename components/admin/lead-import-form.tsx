'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Plus, FileText, Loader2, CheckCircle, XCircle, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';

const LEAD_FIELDS = [
  { value: 'first_name', label: 'First Name', required: true },
  { value: 'last_name', label: 'Last Name', required: true },
  { value: 'email', label: 'Email', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'company', label: 'Company', required: false },
  { value: 'job_title', label: 'Job Title', required: false },
  { value: 'website', label: 'Website', required: false },
  { value: 'linkedin_url', label: 'LinkedIn URL', required: false },
  { value: 'address', label: 'Address', required: false },
  { value: 'city', label: 'City', required: false },
  { value: 'state', label: 'State/Region', required: false },
  { value: 'postal_code', label: 'Postal Code', required: false },
  { value: 'country', label: 'Country', required: false },
  { value: 'industry', label: 'Industry', required: false },
  { value: 'company_size', label: 'Company Size', required: false },
  { value: 'annual_revenue', label: 'Annual Revenue', required: false },
  { value: 'notes', label: 'Notes', required: false },
  { value: 'skip', label: '-- Skip Column --', required: false },
];

const PREDEFINED_CATEGORIES = [
  { value: 'cold', label: 'Cold Lead' },
  { value: 'warm', label: 'Warm Lead' },
  { value: 'hot', label: 'Hot Lead' },
  { value: 'instantly_opened', label: 'Instantly Opened' },
  { value: 'email_replied', label: 'Email Replied' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'not_interested', label: 'Not Interested' },
];

interface LeadImportFormProps {
  userId: string;
}

interface ParsedLead {
  first_name?: string;
  last_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin_url?: string;
  job_title?: string;
  industry?: string;
  company_size?: string;
  annual_revenue?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
}

interface CSVRow {
  [key: string]: string;
}

export default function LeadImportForm({ userId }: LeadImportFormProps) {
  const router = useRouter();
  const [showManualForm, setShowManualForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<any>(null);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Manual entry form state
  const [manualLead, setManualLead] = useState<ParsedLead & { category?: string }>({
    first_name: '',
    last_name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    linkedin_url: '',
    job_title: '',
    industry: '',
    company_size: '',
    notes: '',
    category: '',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          alert('CSV file is empty');
          return;
        }

        const headers = results.meta.fields || [];
        const data = results.data as CSVRow[];

        setCsvHeaders(headers);
        setCsvData(data);

        // Auto-map columns based on header names
        const autoMapping: Record<string, string> = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Try to match with lead fields
          const matchedField = LEAD_FIELDS.find(field => {
            const fieldName = field.value.toLowerCase().replace(/_/g, '');

            // Special handling for common variations
            if (fieldName === 'firstname' && (lowerHeader.includes('first') || lowerHeader.includes('fname'))) return true;
            if (fieldName === 'lastname' && (lowerHeader.includes('last') || lowerHeader.includes('lname') || lowerHeader.includes('surname'))) return true;
            if (fieldName === 'company' && (lowerHeader.includes('company') || lowerHeader.includes('organization'))) return true;
            if (fieldName === 'jobtitle' && (lowerHeader.includes('title') || lowerHeader.includes('position') || lowerHeader.includes('role'))) return true;
            if (fieldName === 'phone' && (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('tel'))) return true;
            if (fieldName === 'linkedinurl' && lowerHeader.includes('linkedin')) return true;
            if (fieldName === 'annualrevenue' && (lowerHeader.includes('revenue') || lowerHeader.includes('annual'))) return true;

            return lowerHeader.includes(fieldName) || fieldName.includes(lowerHeader);
          });

          if (matchedField) {
            autoMapping[header] = matchedField.value;
          } else {
            autoMapping[header] = 'skip';
          }
        });

        setColumnMapping(autoMapping);
        setShowColumnMapping(true);
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleImportCSV = async () => {
    // Validate mapping
    const hasFirstName = Object.values(columnMapping).includes('first_name');
    const hasLastName = Object.values(columnMapping).includes('last_name');
    const hasEmailOrPhone = Object.values(columnMapping).includes('email') ||
                             Object.values(columnMapping).includes('phone');

    if (!hasFirstName || !hasLastName) {
      alert('First Name and Last Name are required fields');
      return;
    }

    if (!hasEmailOrPhone) {
      alert('At least one of Email or Phone is required');
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      // Transform CSV data to lead format using column mapping
      const leads = csvData.map((row) => {
        const lead: any = {};

        // Add category if selected
        if (selectedCategory) {
          lead.category = selectedCategory;
        }

        Object.entries(columnMapping).forEach(([csvCol, leadField]) => {
          if (leadField !== 'skip' && row[csvCol]) {
            lead[leadField] = row[csvCol].trim();
          }
        });

        return lead;
      }).filter(lead => lead.first_name && lead.last_name);

      const response = await fetch('/api/admin/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leads,
          assignedToUserId: userId,
          importType: 'csv',
          settings: { skipDuplicates },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        setCsvData([]);
        setCsvFile(null);
        setShowColumnMapping(false);
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
          first_name: '',
          last_name: '',
          company: '',
          email: '',
          phone: '',
          website: '',
          linkedin_url: '',
          job_title: '',
          industry: '',
          company_size: '',
          notes: '',
          category: '',
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

        <div className="flex gap-2 mb-6">
          <Button
            variant={!showManualForm ? 'default' : 'outline'}
            onClick={() => setShowManualForm(false)}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            CSV Upload
          </Button>
          <Button
            variant={showManualForm ? 'default' : 'outline'}
            onClick={() => setShowManualForm(true)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>

        {!showManualForm ? (
          <div className="space-y-4">
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
                  Upload a CSV file and map columns to CRM fields. Required: First Name, Last Name, and either Email or Phone.
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

              {/* Column Mapping */}
              {showColumnMapping && csvData.length > 0 && (
                <>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm">
                      <Check className="h-4 w-4 inline mr-2" />
                      Found {csvData.length} rows in <strong>{csvFile?.name}</strong>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Map your CSV columns to CRM fields:</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCsvFile(null);
                          setCsvData([]);
                          setShowColumnMapping(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <Label className="font-medium mb-2 block">Lead Category (Optional)</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category for all imported leads" />
                        </SelectTrigger>
                        <SelectContent>
                          {PREDEFINED_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        All imported leads will be assigned this category
                      </p>
                    </div>

                    <div className="grid gap-4">
                      {csvHeaders.map((header) => (
                        <div key={header} className="space-y-2">
                          <div className="grid grid-cols-3 gap-4 items-center">
                            <Label className="font-medium">{header}</Label>
                            <div className="col-span-2">
                              <Select
                                value={columnMapping[header] || 'skip'}
                                onValueChange={(value) =>
                                  setColumnMapping(prev => ({ ...prev, [header]: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {LEAD_FIELDS.map((field) => (
                                    <SelectItem key={field.value} value={field.value}>
                                      {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {csvData[0] && csvData[0][header] && (
                            <div className="text-sm text-muted-foreground pl-4 border-l-2">
                              Example: {csvData[0][header]?.slice(0, 50)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Required Fields:</p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>First Name <span className="text-red-500">*</span></li>
                      <li>Last Name <span className="text-red-500">*</span></li>
                      <li>Email OR Phone <span className="text-red-500">*</span></li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleImportCSV}
                    disabled={loading}
                    className="w-full gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        Import {csvData.length} Leads
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={manualLead.first_name}
                    onChange={(e) => setManualLead({ ...manualLead, first_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={manualLead.last_name}
                    onChange={(e) => setManualLead({ ...manualLead, last_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={manualLead.company}
                    onChange={(e) => setManualLead({ ...manualLead, company: e.target.value })}
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

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={manualLead.category || ''}
                    onValueChange={(value) => setManualLead({ ...manualLead, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        )}
      </CardContent>
    </Card>
  );
}
