import os
import json
import logging
from django.conf import settings
from apps.brands.models import BrandProfile

logger = logging.getLogger(__name__)

class LLMProviderService:
    @staticmethod
    def analyse_highlights(transcript, duration=300, clip_type='shorts'):
        """Return ranked, bounded clip suggestions; use configured OpenAI or a safe fallback."""
        duration = max(15, min(int(duration or 300), 14400))
        target = {'shorts': 35, 'reel': 45, 'vlog': 120}.get(clip_type, 45)
        api_key = getattr(settings, 'AI_API_KEY', '')
        if getattr(settings, 'AI_PROVIDER', '') == 'openai' and api_key.startswith('sk-') and transcript.strip():
            try:
                import openai
                client = openai.OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=getattr(settings, 'AI_MODEL', 'gpt-4o-mini'),
                    messages=[{'role':'system','content':f'Return JSON with a highlights array. Select 3 engaging {clip_type} segments, each about {target}s. Each item: start, end, score (0-100), title, hook, reason. Never exceed video duration {duration}s.'},{'role':'user','content':transcript[:20000]}],
                    response_format={'type':'json_object'}, temperature=.2,
                )
                result = json.loads(response.choices[0].message.content)
                if isinstance(result.get('highlights'), list): return result['highlights'][:6]
            except Exception as exc:
                logger.warning('Highlight AI fallback: %s', exc)
        starts = [max(0, int(duration*.08)), max(0, int(duration*.38)), max(0, int(duration*.68))]
        labels = ['Strong opening insight', 'Key explanation', 'Memorable conclusion']
        return [{'id':f'clip_{index+1}','start':start,'end':min(duration,start+target),'score':94-index*5,'title':labels[index],'hook':['Start with the clearest promise','Lead with the main takeaway','Close with the strongest lesson'][index],'reason':['High hook potential','Dense, useful information','Strong standalone ending'][index]} for index,start in enumerate(starts)]

    @staticmethod
    def generate_content_package(topic_or_text, target_platforms, brand_profile=None):
        """
        Generates full multi-platform content assets.
        Uses OpenAI or Gemini if configured, else falls back to Deterministic Generator.
        """
        ai_provider = getattr(settings, 'AI_PROVIDER', 'deterministic')
        api_key = getattr(settings, 'AI_API_KEY', '') or getattr(settings, 'GEMINI_API_KEY', '')

        if ai_provider == 'openai' and api_key and api_key.startswith('sk-'):
            try:
                return LLMProviderService._generate_openai(topic_or_text, target_platforms, brand_profile, api_key)
            except Exception as e:
                logger.error(f"OpenAI generation error: {e}. Falling back to deterministic provider.")
                return LLMProviderService._generate_deterministic(topic_or_text, target_platforms, brand_profile)
        
        # Default or fallback generator
        return LLMProviderService._generate_deterministic(topic_or_text, target_platforms, brand_profile)

    @staticmethod
    def _generate_openai(topic_or_text, target_platforms, brand_profile, api_key):
        import openai
        client = openai.OpenAI(api_key=api_key)

        brand_context = ""
        if brand_profile:
            brand_context = f"""
            Brand Name: {brand_profile.brand_name}
            Brand Description: {brand_profile.description}
            Audience: {brand_profile.audience}
            Tone: {brand_profile.tone}
            Preferred Terms: {brand_profile.preferred_terms}
            Avoided Terms: {brand_profile.avoided_terms}
            """

        system_prompt = f"""You are CreatorFlow AI, an expert social media strategist and content developer.
        Analyze the input topic/transcript and generate tailored platform-specific assets.
        Target Platforms: {', '.join(target_platforms)}
        Brand Context:
        {brand_context}

        Output MUST be valid JSON matching this schema:
        {{
            "summary": "Key summary of the topic",
            "assets": [
                {{
                    "platform": "youtube",
                    "asset_type": "titles_and_description",
                    "title": "Main Title",
                    "content": "Full description with timestamps, keywords, and call to action",
                    "metadata": {{
                        "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
                        "keywords": ["kw1", "kw2"],
                        "tags": ["tag1", "tag2"],
                        "timestamps": ["00:00 Intro", "02:15 Deep Dive"],
                        "pinned_comment": "Sample pinned comment",
                        "thumbnail_prompts": ["Concept 1", "Concept 2", "Concept 3"],
                        "ctas": ["CTA 1", "CTA 2", "CTA 3"],
                        "short_ideas": ["Idea 1", "Idea 2"]
                    }}
                }}
            ]
        }}
        """

        response = client.chat.completions.create(
            model=getattr(settings, 'AI_MODEL', 'gpt-4o-mini'),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create content pipeline for:\n{topic_or_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )

        content = response.choices[0].message.content
        return json.loads(content)

    @staticmethod
    def _generate_deterministic(topic_or_text, target_platforms, brand_profile=None):
        """
        High quality, realistic deterministic output generator.
        Guarantees instant, production-ready assets without external API keys.
        """
        clean_text = topic_or_text.strip()
        first_line = clean_text.split('\n')[0][:80] if clean_text else "Content Strategy & Pipeline Creation"
        
        brand_tone = brand_profile.tone if brand_profile else "Authoritative, engaging, and actionable"
        brand_name = brand_profile.brand_name if brand_profile else "CreatorFlow AI"
        audience = brand_profile.audience if brand_profile else "Content Creators & Entrepreneurs"

        assets = []

        if 'youtube' in target_platforms or not target_platforms:
            assets.append({
                "platform": "youtube",
                "asset_type": "full_package",
                "title": f"How to Master {first_line}: The Complete Step-by-Step Guide",
                "content": f"""In this comprehensive breakdown, we explore everything you need to know about {first_line}. Whether you are just getting started or scaling up, these core frameworks will help you succeed faster.

📌 WHAT YOU WILL LEARN:
• The fundamental principles of {first_line}
• 3 critical mistakes to avoid early on
• Step-by-step implementation blueprint
• Best practices for long-term growth and audience engagement

💡 BRAND NOTE ({brand_name}):
Our mission is to empower {audience} with actionable, high-impact workflows.

🔔 Don't forget to Like, Subscribe, and hit the Notification Bell for weekly updates!

💬 Drop a comment below: What's your biggest takeaway from today's video?""",
                "metadata": {
                    "titles": [
                        f"How to Master {first_line}: Complete Guide",
                        f"The Secret Blueprint to {first_line} in 2026",
                        f"Why 90% of Creators Fail at {first_line} (And How to Fix It)",
                        f"5 Game-Changing Strategies for {first_line}",
                        f"Stop Doing {first_line} Wrong: Here is the Right Way"
                    ],
                    "keywords": [first_line, "content strategy", "creator workflow", "productivity", "digital creation", "growth hacking"],
                    "tags": ["contentcreator", "productivity", "growth", "strategy", "creatorflow"],
                    "timestamps": [
                        "00:00 - Introduction & Key Takeaways",
                        "01:45 - The Core Problem Explained",
                        "04:20 - Step-by-Step Execution Framework",
                        "08:50 - Advanced Optimization Techniques",
                        "12:10 - Final Summary & Action Items"
                    ],
                    "pinned_comment": f"🚀 Want to take your {first_line} workflow to the next level? Check out our free checklist linked in the description below!",
                    "thumbnail_prompts": [
                        f"Bold text '{first_line.upper()}' on left, shock-reaction host on right with high-contrast neon purple & cyan lighting.",
                        f"Split screen comparison: 'BEFORE' (cluttered, red cross) vs 'AFTER' (clean automated pipeline, green checkmark).",
                        f"Minimalist dark mode thumbnail featuring glowing 3D icon, bold yellow title text: 'THE SECRET BLUEPRINT'."
                    ],
                    "ctas": [
                        "Subscribe for weekly high-impact creator strategies!",
                        "Download our free workflow PDF in the pinned comment.",
                        "Join our creator community today!"
                    ],
                    "short_ideas": [
                        f"3 quick hacks for {first_line} you can apply in under 60 seconds",
                        f"The #1 myth about {first_line} exposed"
                    ]
                }
            })

        if 'instagram' in target_platforms or not target_platforms:
            assets.append({
                "platform": "instagram",
                "asset_type": "carousel_and_captions",
                "title": f"The Ultimate Checklist for {first_line}",
                "content": f"""Struggling with {first_line}? Here is the step-by-step breakdown you need today. 👇

Slide 1 🎯: The Core Concept of {first_line}
Slide 2 📊: Key Metrics That Actually Matter
Slide 3 ⚡: 3 Actionable Hacks to Double Your Results
Slide 4 🚀: Common Pitfalls to Avoid
Slide 5 💾: Save this post for your next content session!

Which slide hit home for you? Drop your thoughts in the comments below! 👇

---
Tone: {brand_tone}
Audience: {audience}""",
                "metadata": {
                    "short_caption": f"Master {first_line} in 5 simple steps. Swipe left ➡️ and save this post!",
                    "medium_caption": f"Want to scale your {first_line}? We broke down the exact framework we use at {brand_name}. Swipe through the carousel and save for reference!",
                    "hashtags": [f"#{first_line.replace(' ', '')}", "#CreatorEconomy", "#ContentMarketing", "#SocialMediaStrategy", "#CreatorWorkflow", "#DigitalGrowth"],
                    "carousel_outline": [
                        {"slide": 1, "headline": "Mastering The Craft", "body": f"Why {first_line} is changing the game."},
                        {"slide": 2, "headline": "The Strategy", "body": "Focus on value delivery over vanity metrics."},
                        {"slide": 3, "headline": "Action Plan", "body": "3 non-negotiable daily habits."},
                        {"slide": 4, "headline": "Takeaway", "body": "Save & share with your team!"}
                    ],
                    "reel_caption": f"Stop scrolling! 🛑 Here is the #1 truth about {first_line}. Read the caption for full breakdown!"
                }
            })

        if 'linkedin' in target_platforms or not target_platforms:
            assets.append({
                "platform": "linkedin",
                "asset_type": "professional_post",
                "title": f"Strategic Breakdown: {first_line}",
                "content": f"""Most creators view {first_line} as a secondary task.

Here is why that is a major mistake — and how treating it as a core asset changed our growth trajectory:

1️⃣ Clarity precedes conversion: If your core message is fuzzy, no distribution channel will save it.
2️⃣ Systems outpace sheer effort: Building a repeatable pipeline for {first_line} saves 10+ hours every week.
3️⃣ Consistency compounds: Small, structured daily outputs compound into massive brand authority.

At {brand_name}, we shifted our target audience focus toward {audience}, and the engagement results spoke for themselves.

What system or framework do you rely on for your content workflow? I'd love to hear your insights in the comments.

#ContentStrategy #Innovation #Leadership #CreatorFlow #Productivity""",
                "metadata": {
                    "story_post": f"3 years ago, I struggled with {first_line}. I thought more hours was the answer. It wasn't. Today, with structured systems, we ship 5x faster.",
                    "hashtags": ["#ContentStrategy", "#Leadership", "#CreatorEconomy", "#Productivity"],
                    "discussion_question": "What is the biggest bottleneck in your current content production pipeline?"
                }
            })

        if 'twitter' in target_platforms or not target_platforms:
            assets.append({
                "platform": "twitter",
                "asset_type": "thread",
                "title": f"1/7 Thread on {first_line}",
                "content": f"""1/7 How to master {first_line} without burning out:

Here is the exact 5-step framework we use at {brand_name} (Save & RT): 🧵👇

2/7 Step 1: Input Aggregation
Never start from a blank page. Capture raw ideas, transcripts, or notes in one central inbox.

3/7 Step 2: Core Topic Extraction
Identify the single core problem your audience faces. Clarity is king.

4/7 Step 3: Multi-Platform Adaptation
Turn 1 long-form piece into:
• 1 YouTube breakdown
• 1 LinkedIn strategic post
• 1 Twitter thread
• 3 Short-form clips

5/7 Step 4: Quality Review & SEO Tuning
Never auto-publish without review. Edit for tone, clarity, and platform search intent.

6/7 Step 5: Visual Calendar Scheduling
Schedule your posts at peak engagement windows for your target time zone.

7/7 If you found this thread helpful:
1. Follow @{brand_name.replace(' ', '')} for daily creator workflows.
2. Retweet the first tweet below to share with your network!""",
                "metadata": {
                    "single_post": f"The biggest mistake creators make with {first_line}? Trying to do everything manually. Build a pipeline, automate the routine, and double down on strategy.",
                    "hooks": [
                        f"99% of creators do {first_line} wrong. Here is the 5-step fix:",
                        f"How to build a complete content engine around {first_line} in under 30 minutes:"
                    ]
                }
            })

        if 'blog' in target_platforms or not target_platforms:
            assets.append({
                "platform": "blog",
                "asset_type": "seo_article",
                "title": f"The Ultimate Blueprint to {first_line} in 2026",
                "content": f"""# The Ultimate Blueprint to {first_line} in 2026

## Introduction
In the modern digital landscape, content creators face an unprecedented demand for consistency and quality. Harnessing the full power of **{first_line}** is no longer optional — it is the cornerstone of sustainable audience growth.

In this guide, we will break down the exact strategies, workflows, and tools necessary to streamline your production while maintaining an authentic brand voice.

---

## 1. Why {first_line} Matters Now
Digital audiences demand high-value, actionable insights. By structuring your content around clear audience pain points, you position your brand as an industry authority.

### Key Benefits:
- **Scalability**: Turn a single core idea into multiple platform assets.
- **Efficiency**: Cut production time by up to 70%.
- **Retention**: Keep your target audience engaged across channels.

---

## 2. Step-by-Step Implementation Framework

### Step A: Content Ingestion & Structuring
Start with raw material — whether a topic idea, meeting transcript, or reference document. Clean the transcript, extract key insights, and define your core hook.

### Step B: Multi-Platform Optimization
Adapt the core message for YouTube, Instagram, LinkedIn, and Twitter without sacrificing depth or nuance.

---

## 3. Frequently Asked Questions (FAQ)

### Q: How often should I publish content?
**A:** Consistency matters more than frequency. Aim for a schedule you can maintain indefinitely without compromising quality.

### Q: Can AI replace human creator input?
**A:** No. AI excels at repetitive structuring and formatting, but your authentic experience, brand voice, and human touch remain irreplaceable.

---

## Conclusion
Building a resilient content pipeline around {first_line} is the fastest way to turn creative ideas into tangible growth. Start implementing these steps today!""",
                "metadata": {
                    "seo_title": f"Mastering {first_line}: Step-by-Step 2026 Guide",
                    "meta_title": f"{first_line} - Ultimate Guide for Content Creators",
                    "meta_description": f"Learn how to streamline {first_line} with our complete step-by-step guide. Build a multi-platform content pipeline that saves hours every week.",
                    "slug": f"mastering-{first_line.lower().replace(' ', '-')[:50]}",
                    "keywords": [first_line, "content creation", "content pipeline", "blog guide", "creator workflow"],
                    "faq": [
                        {"q": "How often should I publish content?", "a": "Consistency matters more than frequency. Maintain a realistic schedule."},
                        {"q": "Can AI replace human creators?", "a": "No, AI assists with structuring, but human voice drives authentic engagement."}
                    ]
                }
            })

        if 'shorts' in target_platforms or not target_platforms:
            assets.append({
                "platform": "shorts",
                "asset_type": "short_script",
                "title": f"Viral Short Script: {first_line}",
                "content": f"""🎬 SHORT-FORM VIDEO SCRIPT (Reels / TikTok / Shorts)

[00:00 - 00:03] HOOK:
(On Screen Text: "Stop Doing {first_line} Wrong!")
Host: "If you are still creating content manually, you are wasting 10 hours every single week!"

[00:03 - 00:15] PROBLEM:
Host: "Most creators start from scratch every time. They write a script, film, and then struggle to format it for 5 different platforms."

[00:15 - 00:35] SOLUTION:
Host: "Here is what top creators do instead: Upload 1 idea or transcript into a central engine. Extract your core hooks, auto-generate YouTube titles, LinkedIn posts, and Twitter threads, and schedule them all in one click!"

[00:35 - 00:45] CALL TO ACTION:
(On Screen Text: "Link in Bio for Free Template 🚀")
Host: "Comment 'FLOW' below and I'll send you our complete creator pipeline template for free!""",
                "metadata": {
                    "hook": f"Stop Doing {first_line} Wrong!",
                    "suggested_timestamps": "00:00 - 00:45",
                    "onscreen_text": ["Stop Doing This Wrong!", "1 Idea -> 5 Platforms", "Comment 'FLOW' for Template"],
                    "hashtags": ["#Shorts", "#Reels", "#TikTokStrategy", "#CreatorHacks", "#Productivity"]
                }
            })

        return {
            "summary": f"Content pipeline successfully created for: {first_line}",
            "assets": assets
        }
