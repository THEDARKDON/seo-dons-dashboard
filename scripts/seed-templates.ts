import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const templates = [
  {
    title: 'Thought Leadership',
    category: 'leadership',
    content: `Here's what I've learned about [topic]...

1. [Key insight]
2. [Key insight]
3. [Key insight]

What's your experience with this?

#Leadership #BusinessStrategy #Growth`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Company Milestone',
    category: 'company',
    content: `🎉 Exciting news to share!

[Company achievement/milestone]

This wouldn't have been possible without [acknowledgment].

Here's what this means for [audience/industry]:
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

Thank you to everyone who made this happen!

#CompanyNews #Milestone #Growth`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Industry News Share',
    category: 'news',
    content: `Just read this interesting article about [topic]: [Link]

Key takeaways:
• [Point 1]
• [Point 2]
• [Point 3]

This is particularly relevant for [industry/role] because [reason].

What are your thoughts?

#Industry #News #Trends`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Client Success Story',
    category: 'success',
    content: `🌟 Client Success Story

We recently helped [Client/Industry] achieve [specific result].

The Challenge:
[Brief description]

Our Approach:
[Key strategies used]

The Results:
✅ [Metric 1]
✅ [Metric 2]
✅ [Metric 3]

Seeing our clients succeed is why we do what we do.

#ClientSuccess #Results #CaseStudy`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Team Highlight',
    category: 'team',
    content: `👏 Team Spotlight: [Name/Department]

Today I want to recognize [person/team] for [achievement/quality].

[Brief story or example]

This is the kind of [value/behavior] that makes our team exceptional.

Shout out to [person/team] for [specific contribution]!

#TeamWork #Appreciation #Culture`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Service Showcase',
    category: 'product',
    content: `💡 Did you know we can help you with [service/problem]?

Many [target audience] struggle with:
❌ [Pain point 1]
❌ [Pain point 2]
❌ [Pain point 3]

Our [service] helps you:
✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]

Interested in learning more? Drop a comment or send me a message.

#ServiceSpotlight #Solutions #Business`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Weekly Tips',
    category: 'educational',
    content: `💡 [Day] Tip for [Target Audience]

Here are [number] quick tips to [achieve goal]:

1️⃣ [Tip 1]
Why it works: [Brief explanation]

2️⃣ [Tip 2]
Why it works: [Brief explanation]

3️⃣ [Tip 3]
Why it works: [Brief explanation]

Which one will you try first?

#Tips #BestPractices #MondayMotivation`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Question to Audience',
    category: 'engagement',
    content: `🤔 Quick question for [target audience]:

What's your biggest challenge with [topic/area]?

I'm asking because [reason/context].

Comment below - I'd love to hear your thoughts!

#Discussion #Community #Feedback`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Behind the Scenes',
    category: 'culture',
    content: `👀 Behind the scenes at [Company]...

[Share what you're working on / day in the life]

Here's what we're focusing on right now:
• [Current project 1]
• [Current project 2]
• [Current project 3]

Building [product/service/company] is [adjective]. Every day brings new challenges and opportunities.

What are you working on this week?

#BehindTheScenes #Startup #DayInTheLife`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Personal Story',
    category: 'personal',
    content: `A few years ago, I [situation/challenge]...

Here's what I learned:

[Lesson 1]
[Brief explanation]

[Lesson 2]
[Brief explanation]

[Lesson 3]
[Brief explanation]

The biggest takeaway? [Main insight]

Have you experienced something similar?

#PersonalGrowth #Lessons #Experience`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Event Announcement',
    category: 'events',
    content: `📅 [Event Name] - [Date]

I'm excited to announce [event/webinar/workshop]!

What you'll learn:
✓ [Topic 1]
✓ [Topic 2]
✓ [Topic 3]

📍 [Location/Platform]
🕐 [Time]
🎟️ [Registration details]

This is perfect for [target audience] who want to [goal/benefit].

Comment "INTERESTED" below and I'll send you the details!

#Event #Webinar #Learning`,
    is_active: true,
    usage_count: 0
  },
  {
    title: 'Gratitude Post',
    category: 'personal',
    content: `🙏 Feeling grateful today...

I wanted to take a moment to appreciate [people/situation/milestone].

[Brief explanation of what you're grateful for]

This journey has taught me that [lesson/insight].

To everyone who [supported/contributed/believed]: Thank you.

What are you grateful for today?

#Gratitude #ThankYou #Reflection`,
    is_active: true,
    usage_count: 0
  }
];

async function seedTemplates() {
  console.log('🌱 Seeding LinkedIn post templates...');

  for (const template of templates) {
    console.log(`  Adding: ${template.title}`);
    const { error } = await supabase
      .from('linkedin_post_templates')
      .insert(template);

    if (error) {
      console.error(`  ❌ Error adding ${template.title}:`, error.message);
    } else {
      console.log(`  ✅ Added ${template.title}`);
    }
  }

  // Verify
  const { data, error } = await supabase
    .from('linkedin_post_templates')
    .select('id, title, category')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching templates:', error.message);
  } else {
    console.log('\n✅ Templates in database:');
    data.forEach((t: any) => {
      console.log(`  - ${t.title} (${t.category})`);
    });
  }
}

seedTemplates()
  .then(() => {
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
