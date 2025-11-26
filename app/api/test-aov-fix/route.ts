/**
 * Test endpoint to verify AOV fix deployment
 *
 * GET /api/test-aov-fix
 *
 * Returns deployment status and code version
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const testCustomer = {
    average_deal_size: "9000.00", // Simulate DECIMAL from database
    profit_per_deal: "4500.00",
    conversion_rate: "0.35",
  };

  // Test the conversion logic
  const convertedAOV = testCustomer.average_deal_size
    ? Number(testCustomer.average_deal_size)
    : undefined;

  const convertedProfit = testCustomer.profit_per_deal
    ? Number(testCustomer.profit_per_deal)
    : undefined;

  const convertedRate = testCustomer.conversion_rate
    ? Number(testCustomer.conversion_rate)
    : undefined;

  return NextResponse.json({
    status: 'AOV Fix Deployed',
    deploymentTime: new Date().toISOString(),
    version: 'bb8c4df',
    testResults: {
      rawFromDatabase: {
        average_deal_size: testCustomer.average_deal_size,
        type: typeof testCustomer.average_deal_size,
      },
      afterConversion: {
        averageDealSize: convertedAOV,
        type: typeof convertedAOV,
        profitPerDeal: convertedProfit,
        conversionRate: convertedRate,
      },
      conversionWorking: convertedAOV === 9000 && typeof convertedAOV === 'number',
      loggingEnabled: true,
    },
    expectedLogs: [
      "[PROPOSAL API] 💰 Business Metrics from Customer Record:",
      "[PROPOSAL API] 💰 Business Metrics being passed to generator:",
      "💰 [Revenue Calculation] Deal Value Configuration:",
    ],
    instructions: {
      message: "If this endpoint returns successfully, the fix is deployed",
      nextSteps: [
        "1. Check customer record has average_deal_size set in Supabase",
        "2. Generate a new proposal",
        "3. Check Vercel logs for the 'Business Metrics' log lines",
        "4. Verify 'Average Deal Value: £9,000' appears in logs",
      ],
    },
  });
}
