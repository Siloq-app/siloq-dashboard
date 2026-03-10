export interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  icon: string;
  content: string;
}

export const helpArticles: HelpArticle[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Set up your first site and understand how Siloq helps your business get found online.',
    icon: 'Rocket',
    content: `## What Siloq Does For You

Siloq organizes your website content so search engines (and AI assistants like ChatGPT) understand exactly what your business does and why you're the best choice.

**The result:** Your most important pages rank higher, you stop competing with yourself, and customers find you faster.

---

## Step 1: Connect Your Website

After logging into your dashboard, you'll add your WordPress site:

1. Click **"Add Site"** from your dashboard
2. Enter your website URL
3. Install the Siloq WordPress plugin (we'll guide you through it)
4. Enter your API key when prompted

That's it — Siloq will start analyzing your site automatically.

> **Having trouble connecting?** See our [Troubleshooting guide](/dashboard/help/troubleshooting) for common solutions.

---

## Step 2: Complete Your Business Profile

The setup wizard asks a few questions about your business:

- **What type of business are you?** (Local service, e-commerce, blog, etc.)
- **What services or products do you offer?**
- **What areas do you serve?** (for local businesses)

**Why this matters:** These answers help Siloq understand your business so it can organize your content around what actually makes you money.

---

## Step 3: Review Your First Analysis

Once analysis completes (usually 5-15 minutes), you'll see your content organized into "silos" — topic clusters that show search engines you're an authority.

Each silo has:
- A **Boss Page** (your main money-making page for that topic)
- **Supporting Pages** (content that builds authority and links to your Boss Page)

Think of it like a team: the Boss Page is the closer who makes the sale, and supporting pages are the team members who build trust and credibility.

### Don't Panic: Your First Health Score

**Most sites score 40-60 on their first analysis.** This is completely normal.

Websites grow organically over years. Blog posts get published without strategy. Old landing pages linger. Internal linking is inconsistent or random.

**A low score isn't failure — it's opportunity.** You're now seeing what was invisible before. Focus on progress, not perfection.

---

## Step 4: Fix What's Hurting You

Siloq automatically identifies problems:

- **Cannibalization:** Pages competing against each other for the same searches
- **Orphan Pages:** Content that isn't connected to anything
- **Missing Links:** Opportunities to strengthen your structure

You'll see clear recommendations — just follow them to improve your rankings.

---

## Step 5: Create Content That Works

When you're ready to add new content, Siloq's Content Ideas feature suggests topics that:

- Fill gaps in your coverage
- Support your money-making pages
- Don't compete with what you already have

No more guessing what to write about.

---

## Your First Month

| Week | Focus |
|------|-------|
| **Week 1** | Complete setup, review your analysis, absorb your starting point |
| **Week 2** | Designate Boss Pages, fix obvious cannibalization |
| **Week 3** | Review each silo, connect orphan pages, improve internal linking |
| **Week 4** | Review Content Ideas, plan your first strategic content |

After your first month, shift to the regular routine in our Recommended Workflow guide.`,
  },
  {
    slug: 'dashboard-overview',
    title: 'Dashboard Overview',
    description: 'Learn the interface — your command central for search performance.',
    icon: 'LayoutDashboard',
    content: `## The Main View

When you log in, you'll see your connected sites at a glance:

- **Site Health Score** — A quick snapshot of how well your content is organized
- **Issues to Address** — Problems that need your attention
- **Recent Activity** — What's changed since your last visit

---

## Navigation Tabs

### 📊 Overview
Your site's big picture. See your silo structure visualized, health metrics, and priority recommendations.

### 📄 Pages
Browse all the pages on your site with powerful search and filters. See which pages are Boss Pages, which are supporting content, and which need attention.

### 🔗 Silos
Deep dive into each topic cluster. See the Boss Page, all supporting content, and how they link together.

### 💡 Content Ideas
Suggestions for new content based on gaps in your coverage. Every idea is designed to strengthen your existing structure — not compete with it.

### ⚠️ Issues
A prioritized list of problems affecting your rankings. Each issue includes what's wrong, why it matters, and how to fix it.

### ⚙️ Settings
Manage your site connection, API keys, and preferences.

---

## Understanding Your Health Score

Your Health Score (0-100) reflects how well your content is organized:

| Score | Meaning |
|-------|---------|
| 90-100 | Excellent — Your site structure is optimized |
| 70-89 | Good — Minor improvements available |
| 50-69 | Needs Work — Important issues to address |
| Below 50 | Critical — Structural problems hurting your rankings |

**Don't stress about perfection.** Focus on the highest-impact fixes first — Siloq prioritizes them for you.

---

## Quick Actions

From any page, you can:

- **Mark as Boss Page** — Designate a page as your main money-maker for a topic
- **View Recommendations** — See specific improvements for any page
- **Check Cannibalization** — See if pages are competing with each other

---

## Pro Tips

1. **Check weekly, not daily.** SEO changes take time. A weekly review keeps you on track without obsessing.
2. **Fix cannibalization first.** Pages competing with each other is the fastest way to hurt your rankings.
3. **Trust the structure.** Siloq's recommendations are designed to work together. Following them consistently produces results.`,
  },
  {
    slug: 'understanding-silos',
    title: 'Understanding Silos',
    description: 'The secret weapon behind websites that dominate search results.',
    icon: 'Network',
    content: `## What Is a Silo?

A silo is a group of related content organized around one main topic.

**Example:** If you're a roofing company, you might have silos for:
- Roof Repair
- Roof Replacement
- Storm Damage
- Commercial Roofing

Each silo contains everything a customer (or search engine) needs to know about that topic — all connected and organized.

---

## Why Silos Matter

### For Search Engines
When Google sees content organized into clear topics with strong internal connections, it understands what you're an expert in, which page to show for which searches, and how much authority you have on each topic.

**Messy, disconnected content confuses search engines.** They don't know which page to rank, so they might not rank any of them.

### For AI Assistants
ChatGPT, Google's AI, and other assistants are increasingly answering questions directly. Well-organized silos help AI understand your expertise and cite you as a source.

### For Your Customers
Organized content helps visitors find what they need and guides them from "just looking" to "ready to buy."

---

## Anatomy of a Silo

### 1. Boss Page (Money Page)
The main page for that topic — usually a service page or product page. This is where conversions happen.

### 2. Supporting Content
Blog posts, guides, FAQs, and resources that answer questions customers ask, build trust, and link to your Boss Page.

### 3. Internal Links
Strategic connections between pages that guide visitors, pass authority to your Boss Page, and show search engines how everything connects.

---

## The Siloq Difference

Most websites have content scattered everywhere. **Siloq fixes this automatically:**

1. **Analyzes** all your existing content
2. **Identifies** natural topic clusters
3. **Organizes** content into proper silos
4. **Recommends** links and fixes
5. **Prevents** new content from breaking the structure

---

## Common Questions

**Q: How many silos should I have?**
As many as you have distinct services or product categories.

**Q: Can a page be in multiple silos?**
Generally, no. Each page should have one job and belong to one silo.

**Q: What if Siloq suggests different silos than I expected?**
Siloq organizes based on what search engines see. If it groups things differently, that's often a sign your content needs clarification.`,
  },
  {
    slug: 'boss-pages',
    title: 'Boss Pages',
    description: 'Identify and protect your most important money-making pages.',
    icon: 'Crown',
    content: `## What Is a Boss Page?

A Boss Page is the primary page for a topic that:
- Targets your highest-value keywords
- Converts visitors into leads or sales
- Receives authority from supporting content

**Examples:** Your main "Roof Repair" service page, a product category page, or your "Get a Quote" page. These pages make you money. Everything else should support them.

---

## Why Boss Pages Matter

### They're Your Rankings Target
When someone searches "roof repair Kansas City," you want ONE specific page to rank — your Boss Page. Not a blog post. Not an old landing page.

### They Prevent Self-Competition
Without a designated Boss Page, search engines guess which page to show. Often they guess wrong.

### They Focus Your Authority
Every link to your Boss Page makes it stronger. Spreading links across many pages dilutes your power.

---

## How Siloq Identifies Boss Pages

Siloq analyzes your content and suggests Boss Pages based on:
- Commercial intent (pages designed to convert)
- Keyword targeting (pages optimized for valuable terms)
- Existing authority (pages already receiving links)
- Content depth (comprehensive pages that deserve to rank)

You can accept Siloq's suggestions or designate your own.

---

## Setting a Boss Page

1. Find the page you want to designate
2. Click the **Boss Page toggle** (crown icon)
3. Confirm the topic/silo it belongs to

Siloq will automatically update recommendations, flag competing pages, and suggest internal links.

---

## Best Practices

- **One Boss Page Per Topic** — If you have two candidates, combine them or differentiate them
- **Make It Conversion-Ready** — Clear offering, calls-to-action, trust signals
- **Let Supporting Content Do the Heavy Lifting** — Blog posts answer questions and link to your Boss Page when readers are ready to act

---

## Warning Signs

Siloq will alert you if:
- **No Boss Page designated** — A silo without a Boss Page can't focus authority
- **Multiple candidates** — Pages competing for the same position
- **Weak Boss Page** — Your designated page needs improvement`,
  },
  {
    slug: 'cannibalization',
    title: 'Fixing Cannibalization',
    description: 'Stop your pages from competing against each other in search results.',
    icon: 'Swords',
    content: `## What Is Cannibalization?

Cannibalization happens when search engines see multiple pages on your site targeting the same topic and can't decide which one to rank.

**The result:** Instead of one page ranking well, multiple pages rank poorly (or not at all).

### Real Examples

**Roofing Company:** Three pages all targeting "roof repair" — a service page, a blog post, and an old landing page. Google sees confusion and ranks a competitor instead.

**Dental Practice:** A service page, a blog post about options, and another about safety — all targeting "teeth whitening." The service page can't rank because its own blog posts are stealing the position.

---

## Why It Hurts Your Business

- **Split Authority** — Links get divided between competing pages
- **Ranking Instability** — Google may alternate which page it shows, or drop them entirely
- **Wasted Content** — That blog post might be hurting your service page instead of helping
- **Lost Conversions** — If a blog post ranks instead of your service page, visitors never see your call-to-action

---

## How to Fix It

### 1. Designate a Winner
Choose one page as the Boss Page. The other becomes supporting content.

### 2. Differentiate
Adjust one page to target a different (but related) intent.

### 3. Consolidate
Merge content into one stronger page and redirect the other.

### 4. Redirect
Send traffic from the weaker page to the stronger one.

---

## Prevention

Once you're using Siloq, new cannibalization becomes rare because:
- **Content Ideas** suggests topics that don't conflict
- **Boss Page designation** makes ownership clear
- **Continuous monitoring** catches problems early

Most businesses see improvement within 2-4 weeks of fixing cannibalization.`,
  },
  {
    slug: 'content-ideas',
    title: 'Content Ideas',
    description: 'Know exactly what to write next — topics that strengthen your authority.',
    icon: 'Lightbulb',
    content: `## The Problem With "Just Write More"

Most SEO advice says to publish more content. But publishing without strategy leads to cannibalization, thin coverage, and wasted effort.

**Siloq solves this** by analyzing your existing content and identifying gaps that actually matter.

---

## How Content Ideas Work

### Coverage Gaps
Topics your customers search for that you haven't addressed yet.

### Supporting Opportunities
Content that would strengthen your Boss Pages by answering related questions.

### Authority Builders
Topics that establish expertise and attract links.

### Competitive Gaps
Topics your competitors rank for that you're missing.

---

## Using the Content Ideas Tab

Each suggestion includes:

| Field | What It Tells You |
|-------|-------------------|
| **Topic** | The subject to write about |
| **Type** | Blog post, guide, FAQ, etc. |
| **Target Silo** | Which Boss Page this supports |
| **Priority** | How impactful this content would be |
| **Notes** | Specific guidance for this piece |

---

## From Idea to Published

1. **Select an idea** from your list
2. **Review the guidance** — Siloq explains what to cover and why
3. **Create your content** — Write it yourself, assign to a team member, or use AI tools
4. **Publish through WordPress** — Siloq tracks it automatically
5. **Siloq updates your structure** — Links and relationships are managed for you

Siloq's suggestions work great as briefs for any writer — human or AI. The strategy comes from Siloq. The production method is up to you.

---

## Content Siloq Will Never Suggest

- Topics that compete with your Boss Pages
- Content that would cannibalize existing pages
- Topics outside your business expertise
- Low-value content just to "publish more"

Every suggestion is designed to strengthen — not fragment — your authority.`,
  },
  {
    slug: 'managing-pages',
    title: 'Managing Your Pages',
    description: 'Complete visibility into every page on your site and how to organize them.',
    icon: 'FileText',
    content: `## The Pages View

Your Pages tab shows all content Siloq has indexed, with page title/URL, status indicators, silo assignment, and key metrics.

### Search and Filter
- **Search** by title, URL, or keyword
- **Filter by silo** to see content in a topic cluster
- **Filter by status** to find pages needing attention
- **Filter by type** (Boss Page, supporting, orphan)

---

## Page Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 👑 Crown | Boss Page for its silo |
| ⚠️ Warning | Has issues to address |
| 🔗 Link icon | Properly connected |
| ❓ Question | Needs silo assignment |
| 🚫 No entry | Orphan page (not connected) |

---

## Common Page Actions

- **Assign to Silo** — Accept Siloq's suggestion or choose a different silo
- **Designate as Boss Page** — Mark as the primary page for its topic
- **Mark as No-Index** — Tell Siloq to ignore a page
- **Flag for Review** — Add to your review queue

---

## Handling Orphan Pages

Orphan pages aren't connected to your site structure. Options:
1. **Connect it** — Add to appropriate silo with proper links
2. **Redirect it** — Send traffic to a relevant page
3. **Remove it** — Delete if it adds no value
4. **No-index it** — Keep but exclude from SEO

---

## Pro Tips

- **Start with problem pages** — Filter by "Has Issues" for fast results
- **Check orphans monthly** — New ones appear as you add content
- **Use search strategically** — Search your main keywords; every result should have a clear, non-competing role`,
  },
  {
    slug: 'faq',
    title: 'FAQ',
    description: 'Quick answers to the most common questions about using Siloq.',
    icon: 'MessageCircleQuestion',
    content: `## Getting Started

**How long does initial analysis take?**
Typically 5-15 minutes. Larger sites (500+ pages) can take 30-45 minutes.

**Do I need technical SEO knowledge?**
No. Siloq translates complex concepts into clear actions.

**Will Siloq change anything on my site automatically?**
No. Siloq analyzes and recommends. You approve all changes. You're always in control.

**My health score is really low. Should I be worried?**
No! Most sites score 40-60 on first analysis. This is normal and means opportunity, not failure.

---

## Site Structure

**Can I have multiple sites on one account?**
Yes, depending on your plan.

**What if I disagree with Siloq's silo suggestions?**
Override any suggestion. Siloq learns from your decisions over time. You know your business best.

**How do I handle multi-location businesses?**
Each location gets its own silo with its own Boss Page. Keep service + location combinations distinct.

---

## Content Decisions

**Should I delete old blog posts or redirect them?**
Delete when: thin, outdated, no backlinks, zero traffic. Redirect when: has backlinks, ranks for something, a better page covers the topic. When in doubt, redirect.

**Can I use AI tools to write content?**
Absolutely. Siloq's Content Ideas work great as briefs for any writer — human or AI.

---

## Technical Questions

**Does Siloq work with any WordPress theme?**
Yes. Siloq works with any properly-coded WordPress theme.

**Will Siloq slow down my site?**
No. Analysis runs on our servers. Nothing affects your public-facing page speed.

---

## Strategy

**How is Siloq different from Yoast or RankMath?**
Yoast optimizes individual pages. Siloq governs your entire site architecture — preventing cannibalization and ensuring pages work together instead of against each other.

**How quickly will I see ranking improvements?**
Cannibalization fixes: 2-4 weeks. Structure improvements: 1-3 months. New content: 2-6 months. SEO compounds over time.

**Do I still need backlinks?**
Yes. Siloq optimizes on-site structure. Off-site factors still matter. With proper structure, your link building is more effective.

---

## Account & Billing

**Can I try Siloq before committing?**
Yes — start with a free trial.

**What happens if I cancel?**
Data retained 30 days, then permanently deleted.

**Need help?** Contact support@siloq.ai`,
  },
  {
    slug: 'glossary',
    title: 'Glossary',
    description: 'Plain-English definitions for terms you\'ll encounter in Siloq.',
    icon: 'BookOpen',
    content: `## A

**Authority** — How much search engines trust your site or page on a specific topic. Built through quality content, links, and proper structure.

---

## B

**Backlink** — A link from another website to yours. Quality backlinks from relevant sites build your authority.

**Boss Page** — Your main page for a specific topic — the one you want to rank and convert visitors. Also called a "Money Page." Every silo has exactly one.

---

## C

**Cannibalization** — When multiple pages on your site compete for the same keywords, confusing search engines and hurting all competing pages.

**Content Ideas** — Siloq's feature that suggests new content topics designed to strengthen your structure without competing with it.

**Conversion** — When a visitor takes a desired action — submits a form, makes a purchase, calls your business.

**Crawl** — When search engine bots visit your website to discover and read your pages.

---

## G

**GEO (Generative Engine Optimization)** — Optimizing content so AI assistants (ChatGPT, Google AI, Perplexity) cite your business as an authoritative source.

---

## H

**Health Score** — A 0-100 measure of how well a page or silo is structured and optimized.

**Hub & Spoke** — A content structure where one central page (Boss Page) connects to multiple related pages (supporting content).

---

## I

**Index** — When a search engine adds your page to its database so it can appear in search results.

**Internal Link** — A link from one page on your site to another. Critical for passing authority.

**Intent** — What a searcher wants. "Roof repair KC" = commercial intent. "Why is my roof leaking" = informational intent.

---

## K–N

**Keyword** — A word or phrase people search for.

**Money Page** — See "Boss Page."

**Noindex** — A directive telling search engines not to include a page in results.

---

## O–R

**Orphan Page** — A page with no internal links pointing to it. Hard for search engines to find.

**Redirect** — Automatically sending visitors from one URL to another.

**Reverse Silo** — Siloq's proprietary methodology. Supporting content flows authority *upward* to Boss Pages, concentrating ranking power where it drives revenue.

---

## S

**SEO** — Search Engine Optimization. Improving your website to rank higher.

**SERP** — Search Engine Results Page.

**Silo** — A group of related content organized around one topic with one Boss Page and supporting pages.

**Supporting Content** — Pages that build authority and link to the Boss Page.

---

## T

**Target Keyword** — The primary keyword a page is optimized to rank for.

**Thin Content** — Pages with little valuable content.

**Three-Layer Model** — Siloq's framework: GEO + SEO + CRO. Every piece of content should serve all three.`,
  },
  {
    slug: 'recommended-workflow',
    title: 'Recommended Workflow',
    description: 'The routine that gets results — consistent small actions beat occasional marathons.',
    icon: 'ListChecks',
    content: `## The Quick Version

| Frequency | What to Do | Time |
|-----------|------------|------|
| **Weekly** | Check Issues tab, fix high-priority items | 15-30 min |
| **Monthly** | Review orphan pages, check silo health | 30-45 min |
| **Quarterly** | Content planning from Ideas tab | 1-2 hours |

That's it. Consistent small actions beat occasional marathons.

---

## Weekly Check-In (15-30 minutes)

**Pick a day** — Monday to start the week or Friday to clean up.

### Step 1: Check the Issues Tab
Look for anything marked High Priority. These are problems actively hurting your rankings.

### Step 2: Review Recent Content
If you published anything this week, make sure it's assigned to the right silo, linking to its Boss Page, and not competing with existing pages.

### Step 3: Check Your Health Score
Trending up, down, or stable? A dropping score means something changed — investigate.

---

## Monthly Deep Dive (30-45 minutes)

### Step 1: Orphan Page Audit
Filter Pages to show orphans. Connect, redirect, or delete each one.

### Step 2: Silo Health Review
Check each silo: Is the Boss Page still right? Are supporting pages linking to it? Any silos too thin or too broad?

### Step 3: Competitor Glance
Search your main keywords. Notice what competitors do that you don't. Note it for quarterly planning.

---

## Quarterly Content Planning (1-2 hours)

### Step 1: Review Content Ideas
Sort by priority. For each: create it, defer it, or dismiss it.

### Step 2: Map to Business Goals
What are you pushing this quarter? Make sure content supports those silos.

### Step 3: Set Production Schedule
2-4 strategic pieces per month beats 10 random blog posts. Plan who creates what.

### Step 4: Review Last Quarter
What performed? What didn't? Let results inform your next plan.

---

## Time-Saving Tips

- **Batch similar tasks** — Don't context-switch between issues
- **Use filters aggressively** — Don't scroll, filter to what you need
- **Trust the priorities** — Start with High. You don't need to fix everything at once
- **Don't overthink** — Usually your gut is right. Pick one, move forward, adjust later

---

## Building the Habit

- Block 30 minutes on your calendar each week
- Keep a browser tab pinned to your dashboard
- Set a monthly reminder for your deep dive
- Track your Health Score over time — watching it improve is motivating

Small consistent effort compounds into significant results.`,
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and step-by-step solutions to get you back on track.',
    icon: 'Wrench',
    content: `## Plugin Connection Issues

### Plugin won't activate
1. Ensure WordPress 5.8 or higher
2. Check PHP version is 7.4+ (8.0+ recommended)
3. Deactivate other SEO plugins temporarily to check for conflicts
4. Check your server error logs for specific messages

### API key not accepted
1. Copy the key again from your Siloq dashboard (don't type manually)
2. Make sure there are no extra spaces
3. Check that your subscription is active
4. Verify you're using the key for the correct site (keys are site-specific)

### Site not connecting to dashboard
1. Go to plugin settings → "Test Connection"
2. Check if your site has a firewall blocking outgoing connections
3. Verify your site is publicly accessible
4. Clear any server-side caching

---

## Analysis Issues

### Analysis taking too long
Normal: 5-15 minutes (30-45 for 500+ pages). If stuck:
1. Check your site isn't having performance issues
2. Ensure hosting can handle API requests
3. Refresh the dashboard — analysis continues in the background
4. Contact support if it exceeds 2 hours

### Pages aren't showing up
Common causes: draft/private pages, noindex pages, recently published (up to 24h delay).
1. Remove all filters in Pages tab
2. Search for a specific URL
3. Check page status in WordPress
4. Request manual re-sync from Settings

### Analysis seems wrong
Siloq analyzes what search engines see, not what you intend. If results surprise you:
1. Click into the specific page or silo
2. Check detected keywords vs. your targets
3. Look for duplicate content you forgot about
4. Review the "why" explanation

---

## Recommendation Questions

### I disagree with a recommendation
That's okay. Options: dismiss it, defer it, investigate the details, or override it. Siloq learns from your decisions.

### Recommendations seem too aggressive
Siloq optimizes for search performance. Review the overlap data, consider business vs. SEO reasons, and dismiss if the pages should stay separate.

---

## Silo & Page Issues

### Multi-location businesses
Each location gets its own silo and Boss Page. Keep service + location combinations distinct.

### Delete vs. redirect old content
**Delete:** thin, outdated, no backlinks, zero traffic. **Redirect:** has backlinks, ranks for something, better page exists. When in doubt, redirect.

### Pages keep becoming orphaned
When publishing: add at least one internal link TO the new page, and link FROM a related existing page. Make it part of your publishing checklist.

---

## Still Stuck?

**Before contacting support, gather:**
- Your site URL
- WordPress and PHP versions
- Error messages (screenshot or text)
- Steps already tried

**Contact:** support@siloq.ai — We typically respond within a few hours.`,
  },
];

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return helpArticles.find((a) => a.slug === slug);
}

export function searchArticles(query: string): HelpArticle[] {
  if (!query.trim()) return helpArticles;
  const q = query.toLowerCase();
  return helpArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
  );
}
