-- ========================================
-- SEED POST TEMPLATES
-- Add common LinkedIn post templates
-- ========================================

-- Insert 12 common LinkedIn post templates
INSERT INTO post_templates (name, category, content, description, active, times_used) VALUES

-- 1. Thought Leadership
(
  'Thought Leadership',
  'Leadership',
  'Here''s what I''ve learned about [topic]...

1. [Key insight]
2. [Key insight]
3. [Key insight]

What''s your experience with this?

#Leadership #BusinessStrategy #Growth',
  'Share your expertise and insights',
  true,
  0
),

-- 2. Company Milestone
(
  'Company Milestone',
  'Company',
  '🎉 Exciting news to share!

[Company achievement/milestone]

This wouldn''t have been possible without [acknowledgment].

Here''s what this means for [audience/industry]:
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

Thank you to everyone who made this happen!

#CompanyNews #Milestone #Growth',
  'Celebrate company achievements',
  true,
  0
),

-- 3. Industry News Share
(
  'Industry News Share',
  'News',
  'Just read this interesting article about [topic]: [Link]

Key takeaways:
• [Point 1]
• [Point 2]
• [Point 3]

This is particularly relevant for [industry/role] because [reason].

What are your thoughts?

#Industry #News #Trends',
  'Share and comment on industry news',
  true,
  0
),

-- 4. Client Success Story
(
  'Client Success Story',
  'Success',
  '🌟 Client Success Story

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

#ClientSuccess #Results #CaseStudy',
  'Showcase client achievements',
  true,
  0
),

-- 5. Team Highlight
(
  'Team Highlight',
  'Team',
  '👏 Team Spotlight: [Name/Department]

Today I want to recognize [person/team] for [achievement/quality].

[Brief story or example]

This is the kind of [value/behavior] that makes our team exceptional.

Shout out to [person/team] for [specific contribution]!

#TeamWork #Appreciation #Culture',
  'Recognize team members and culture',
  true,
  0
),

-- 6. Service Showcase
(
  'Service Showcase',
  'Product',
  '💡 Did you know we can help you with [service/problem]?

Many [target audience] struggle with:
❌ [Pain point 1]
❌ [Pain point 2]
❌ [Pain point 3]

Our [service] helps you:
✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]

Interested in learning more? Drop a comment or send me a message.

#ServiceSpotlight #Solutions #Business',
  'Highlight products or services',
  true,
  0
),

-- 7. Weekly Tips
(
  'Weekly Tips',
  'Educational',
  '💡 [Day] Tip for [Target Audience]

Here are [number] quick tips to [achieve goal]:

1️⃣ [Tip 1]
Why it works: [Brief explanation]

2️⃣ [Tip 2]
Why it works: [Brief explanation]

3️⃣ [Tip 3]
Why it works: [Brief explanation]

Which one will you try first?

#Tips #BestPractices #MondayMotivation',
  'Share practical tips and advice',
  true,
  0
),

-- 8. Question to Audience
(
  'Question to Audience',
  'Engagement',
  '🤔 Quick question for [target audience]:

What''s your biggest challenge with [topic/area]?

I''m asking because [reason/context].

Comment below - I''d love to hear your thoughts!

#Discussion #Community #Feedback',
  'Engage audience with questions',
  true,
  0
),

-- 9. Behind the Scenes
(
  'Behind the Scenes',
  'Culture',
  '👀 Behind the scenes at [Company]...

[Share what you''re working on / day in the life]

Here''s what we''re focusing on right now:
• [Current project 1]
• [Current project 2]
• [Current project 3]

Building [product/service/company] is [adjective]. Every day brings new challenges and opportunities.

What are you working on this week?

#BehindTheScenes #Startup #DayInTheLife',
  'Show company culture and daily work',
  true,
  0
),

-- 10. Personal Story
(
  'Personal Story',
  'Personal',
  'A few years ago, I [situation/challenge]...

Here''s what I learned:

[Lesson 1]
[Brief explanation]

[Lesson 2]
[Brief explanation]

[Lesson 3]
[Brief explanation]

The biggest takeaway? [Main insight]

Have you experienced something similar?

#PersonalGrowth #Lessons #Experience',
  'Share personal experiences and lessons',
  true,
  0
),

-- 11. Event Announcement
(
  'Event Announcement',
  'Events',
  '📅 [Event Name] - [Date]

I''m excited to announce [event/webinar/workshop]!

What you''ll learn:
✓ [Topic 1]
✓ [Topic 2]
✓ [Topic 3]

📍 [Location/Platform]
🕐 [Time]
🎟️ [Registration details]

This is perfect for [target audience] who want to [goal/benefit].

Comment "INTERESTED" below and I''ll send you the details!

#Event #Webinar #Learning',
  'Promote events and webinars',
  true,
  0
),

-- 12. Gratitude Post
(
  'Gratitude Post',
  'Personal',
  '🙏 Feeling grateful today...

I wanted to take a moment to appreciate [people/situation/milestone].

[Brief explanation of what you''re grateful for]

This journey has taught me that [lesson/insight].

To everyone who [supported/contributed/believed]: Thank you.

What are you grateful for today?

#Gratitude #ThankYou #Reflection',
  'Express appreciation and gratitude',
  true,
  0
);

-- ========================================
-- VERIFY: Check templates were created
-- ========================================
SELECT
  id,
  name,
  category,
  description,
  active,
  LEFT(content, 50) || '...' as content_preview,
  created_at
FROM post_templates
ORDER BY created_at DESC;
