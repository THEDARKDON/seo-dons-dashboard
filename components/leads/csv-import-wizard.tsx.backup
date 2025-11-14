'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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
  { value: 'state', label: 'State', required: false },
  { value: 'postal_code', label: 'Postal Code', required: false },
  { value: 'country', label: 'Country', required: false },
  { value: 'industry', label: 'Industry', required: false },
  { value: 'company_size', label: 'Company Size', required: false },
  { value: 'notes', label: 'Notes', required: false },
  { value: 'lead_source', label: 'Lead Source', required: false },
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

interface CSVRow {
  [key: string]: string;
}

export function CSVImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    duplicates: number;
    errors: string[];
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error('CSV file is empty');
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
            return lowerHeader.includes(fieldName) || fieldName.includes(lowerHeader);
          });

          if (matchedField) {
            autoMapping[header] = matchedField.value;
          } else {
            autoMapping[header] = 'skip';
          }
        });

        setColumnMapping(autoMapping);
        setStep(2);
        toast.success(`Loaded ${data.length} rows from CSV`);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  }, []);

  const handleImport = async () => {
    // Validate mapping
    const hasFirstName = Object.values(columnMapping).includes('first_name');
    const hasLastName = Object.values(columnMapping).includes('last_name');
    const hasEmailOrPhone = Object.values(columnMapping).includes('email') ||
                             Object.values(columnMapping).includes('phone');

    if (!hasFirstName || !hasLastName) {
      toast.error('First Name and Last Name are required fields');
      return;
    }

    if (!hasEmailOrPhone) {
      toast.error('At least one of Email or Phone is required');
      return;
    }

    setImporting(true);
    setStep(3);

    try {
      // Transform CSV data to lead format
      const leads = csvData.map((row, index) => {
        const lead: any = {
          lead_source: 'CSV Import',
          lead_source_details: file?.name || 'Unknown',
        };

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

      // Send to API in batches
      const batchSize = 50;
      let successful = 0;
      let failed = 0;
      let duplicates = 0;
      const errors: string[] = [];

      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        setImportProgress(Math.round(((i + batch.length) / leads.length) * 100));

        const response = await fetch('/api/leads/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads: batch, fileName: file?.name }),
        });

        const result = await response.json();

        if (response.ok) {
          successful += result.successful || 0;
          failed += result.failed || 0;
          duplicates += result.duplicates || 0;
          if (result.errors) {
            errors.push(...result.errors);
          }
        } else {
          failed += batch.length;
          errors.push(result.error || 'Unknown error');
        }
      }

      setImportResults({ successful, failed, duplicates, errors });
      setStep(4);
      toast.success(`Import complete! ${successful} leads imported`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import leads');
      setStep(2);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              Step {step} of 4: {
                step === 1 ? 'Upload File' :
                step === 2 ? 'Map Columns' :
                step === 3 ? 'Importing' :
                'Complete'
              }
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Select a CSV file to upload'}
              {step === 2 && 'Map CSV columns to lead fields'}
              {step === 3 && 'Importing leads into your CRM'}
              {step === 4 && 'Import complete'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full ${
                  s < step ? 'bg-green-500' :
                  s === step ? 'bg-blue-500' :
                  'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Choose a CSV file</p>
              <p className="text-sm text-muted-foreground mb-4">
                Make sure your CSV has headers in the first row
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <FileText className="h-4 w-4 mr-2" />
                    Select CSV File
                  </span>
                </Button>
              </label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">CSV Requirements:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Must have First Name and Last Name columns</li>
                <li>Must have Email OR Phone column</li>
                <li>Headers must be in the first row</li>
                <li>Recommended: Company, Job Title, Phone, Email</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Map Columns */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm">
                <Check className="h-4 w-4 inline mr-2" />
                Found {csvData.length} rows in <strong>{file?.name}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <p className="font-medium">Map your CSV columns to CRM fields:</p>

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
                  <div key={header} className="grid grid-cols-3 gap-4 items-center">
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
                    {csvData[0] && (
                      <div className="col-span-3 text-sm text-muted-foreground pl-4 border-l-2">
                        Example: {csvData[0][header]?.slice(0, 50)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleImport} className="gap-2">
                Import {csvData.length} Leads
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 3 && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium">Importing leads...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process your file</p>
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">{importProgress}% complete</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && importResults && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Import Complete!</h3>
              <p className="text-muted-foreground">Your leads have been imported</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Successful</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{importResults.successful}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Duplicates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">{importResults.duplicates}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{importResults.failed}</p>
                </CardContent>
              </Card>
            </div>

            {importResults.errors.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errors ({importResults.errors.length})
                </p>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {importResults.errors.slice(0, 10).map((error, i) => (
                    <li key={i} className="text-muted-foreground">• {error}</li>
                  ))}
                  {importResults.errors.length > 10 && (
                    <li className="text-muted-foreground">... and {importResults.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setStep(1);
                setFile(null);
                setCsvData([]);
                setCsvHeaders([]);
                setColumnMapping({});
                setImportResults(null);
              }}>
                Import Another File
              </Button>
              <Button onClick={() => router.push('/dashboard/leads')}>
                View All Leads
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
