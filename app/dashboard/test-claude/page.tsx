'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, Brain, TrendingUp, Users, Target, MapPin } from 'lucide-react';

interface ResearchResult {
  companyAnalysis: any;
  marketIntelligence: any;
  competitorAnalysis: any;
  keywordResearch: any;
  locationStrategy?: any;
  totalTokensUsed: number;
  estimatedCost: number;
  thinkingTokensUsed: number;
}

interface TestResponse {
  success: boolean;
  data?: {
    research: ResearchResult;
    performance: {
      durationSeconds: number;
      totalTokens: number;
      thinkingTokens: number;
      estimatedCost: number;
    };
  };
  error?: string;
  details?: string;
}

export default function TestClaudePage() {
  const [companyName, setCompanyName] = useState('A1 Mobility');
  const [website, setWebsite] = useState('https://a1mobility.co.uk');
  const [industry, setIndustry] = useState('Mobility Scooters and Wheelchairs');
  const [location, setLocation] = useState('Kent, UK');
  const [packageTier, setPackageTier] = useState<'local' | 'regional' | 'national'>('local');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResponse | null>(null);
  const [currentStage, setCurrentStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    setCurrentStage('Initializing...');
    setProgress(0);
    setLogs([]);

    try {
      addLog('Starting research request...');

      const response = await fetch('/api/test-claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          website,
          industry,
          location,
          packageTier,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if it's a streaming response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        addLog('Receiving streaming response...');

        // Handle SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('event:')) {
              const eventType = line.slice(7).trim();
              continue;
            }

            if (line.startsWith('data:')) {
              const data = JSON.parse(line.slice(6));

              if (data.stage) {
                // Progress update
                setCurrentStage(data.stage);
                setProgress(data.progress);
                addLog(`${data.progress}% - ${data.stage}`);
              } else if (data.success !== undefined) {
                // Complete or error
                if (data.success) {
                  setResult(data);
                  setCurrentStage('Research complete!');
                  setProgress(100);
                  addLog(`✅ Research completed in ${data.data.performance.durationSeconds}s`);
                  addLog(`💰 Cost: £${data.data.performance.estimatedCost.toFixed(4)}`);
                } else {
                  setResult(data);
                  addLog(`❌ Error: ${data.error}`);
                }
              } else if (data.message) {
                // Start message
                addLog(data.message);
              }
            }
          }
        }
      } else {
        // Non-streaming response (fallback or error)
        const data: TestResponse = await response.json();
        setResult(data);
        addLog(data.error || 'Request completed');
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: 'Failed to connect to API',
        details: error.message,
      });
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const response = await fetch('/api/test-claude');
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert('Failed to check Claude API status');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Claude AI Integration Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the automated proposal research agent powered by Claude Opus 4
          </p>
        </div>
        <Button variant="outline" onClick={handleHealthCheck}>
          Check API Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research Parameters</CardTitle>
          <CardDescription>
            Enter company details to test the deep research agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., A1 Mobility"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g., https://example.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Mobility Scooters"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Kent, UK"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packageTier">Package Tier</Label>
              <Select value={packageTier} onValueChange={(value: any) => setPackageTier(value)} disabled={isLoading}>
                <SelectTrigger id="packageTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local (£2,000/month)</SelectItem>
                  <SelectItem value="regional">Regional (£3,000/month)</SelectItem>
                  <SelectItem value="national">National (£5,000/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleTest}
            disabled={isLoading || !companyName}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching... (60-120 seconds)
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Start Deep Research
              </>
            )}
          </Button>

          {isLoading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  {currentStage || 'Initializing research...'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {logs.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">View Progress Logs ({logs.length})</summary>
              <div className="mt-2 p-4 bg-muted rounded-lg max-h-48 overflow-auto">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs font-mono">{log}</div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Research Complete
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Research Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.success && result.data ? (
              <>
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="text-2xl font-bold">
                      {result.data.performance.durationSeconds}s
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Tokens</div>
                    <div className="text-2xl font-bold">
                      {(result.data.performance.totalTokens / 1000).toFixed(1)}K
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Thinking Tokens</div>
                    <div className="text-2xl font-bold">
                      {(result.data.performance.thinkingTokens / 1000).toFixed(1)}K
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Cost</div>
                    <div className="text-2xl font-bold">
                      £{result.data.performance.estimatedCost.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Company Analysis */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Brain className="h-5 w-5" />
                    Company Analysis
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium">Core Business</div>
                      <div className="text-sm text-muted-foreground">
                        {result.data.research.companyAnalysis.businessOverview.coreBusiness}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Value Proposition</div>
                      <div className="text-sm text-muted-foreground">
                        {result.data.research.companyAnalysis.businessOverview.valueProposition}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Key Opportunities</div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {result.data.research.companyAnalysis.opportunities.map((opp: string, i: number) => (
                          <li key={i}>{opp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Market Intelligence */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <TrendingUp className="h-5 w-5" />
                    Market Intelligence
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium">Industry Trends</div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {result.data.research.marketIntelligence.industryTrends.map((trend: string, i: number) => (
                          <li key={i}>{trend}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Competitor Analysis */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Users className="h-5 w-5" />
                    Top Competitors
                  </div>
                  <div className="grid gap-3">
                    {result.data.research.competitorAnalysis.topCompetitors.map((comp: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="font-medium">{comp.name}</div>
                        <div className="text-sm text-muted-foreground">{comp.website}</div>
                        <div className="text-sm mt-1">{comp.keywordStrategy}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyword Research */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Target className="h-5 w-5" />
                    Primary Keywords
                  </div>
                  <div className="grid gap-2">
                    {result.data.research.keywordResearch.primaryKeywords.slice(0, 5).map((kw: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="font-medium">{kw.keyword}</div>
                        <div className="text-sm text-muted-foreground flex gap-4">
                          <span>Volume: {kw.searchVolume}</span>
                          <span>Difficulty: {kw.difficulty}</span>
                        </div>
                        <div className="text-sm mt-1">{kw.businessValue}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Strategy */}
                {result.data.research.locationStrategy && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <MapPin className="h-5 w-5" />
                      Target Locations
                    </div>
                    <div className="grid gap-2">
                      {result.data.research.locationStrategy.targetLocations.map((loc: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="font-medium">{loc.area}</div>
                          <div className="text-sm text-muted-foreground">
                            Population: {loc.population} | Demand: {loc.searchDemand} | Competition: {loc.competitionLevel}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON (collapsible) */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">View Full JSON Response</summary>
                  <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto text-xs max-h-96">
                    {JSON.stringify(result.data.research, null, 2)}
                  </pre>
                </details>
              </>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">{result.error}</div>
                  {result.details && (
                    <div className="text-sm mt-1">{result.details}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
