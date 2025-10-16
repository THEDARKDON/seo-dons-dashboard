import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { callSid, transcription } = await req.json();

    if (!callSid || !transcription) {
      return NextResponse.json(
        { error: 'CallSid and transcription are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Use GPT-4 to analyze the call transcription
    const analysisPrompt = `
Analyze this sales call transcription and provide:
1. Sentiment score (-1.0 to 1.0, where -1 is very negative, 0 is neutral, 1 is very positive)
2. Sentiment label (positive, neutral, or negative)
3. Key topics discussed (max 5, as array)
4. Action items extracted (as array)
5. Brief summary (2-3 sentences)

Format your response as JSON with this structure:
{
  "sentiment_score": 0.0,
  "sentiment_label": "neutral",
  "key_topics": ["topic1", "topic2"],
  "action_items": ["action1", "action2"],
  "summary": "Summary text"
}

Transcription:
${transcription}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a sales call analyzer. Provide detailed, actionable analysis of sales calls.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // Update call record with analysis
    const { error: updateError } = await supabase
      .from('call_recordings')
      .update({
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        key_topics: analysis.key_topics,
        action_items: analysis.action_items,
        ai_summary: analysis.summary,
      })
      .eq('call_sid', callSid);

    if (updateError) {
      console.error('Error updating analysis:', updateError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze call' },
      { status: 500 }
    );
  }
}
