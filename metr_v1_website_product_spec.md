# Metr V1 Website & Product Specification

**Document purpose:** Single source of truth for the software engineer
building the first public Metr website.\
**Version:** 1.0\
**Status:** Build-ready\
**Brand:** Metr\
**Parent company:** Juno Technologies\
**Product category:** AI commerce infrastructure for fashion brands

------------------------------------------------------------------------

## 1. Product Definition

Metr is an AI commerce infrastructure platform for fashion brands.

A brand connects its commerce data to Metr once. Metr builds a
structured understanding of the brand, its products, sizing, inventory,
customers and shopper behavior. That intelligence is then used to
improve product discovery and sizing across the brand's storefront.

### V1 product thesis

Most fashion storefronts still make shoppers do the hard work:

-   translate natural intent into search keywords;
-   browse large catalogs manually;
-   understand inconsistent product metadata;
-   interpret generic size charts;
-   guess which size will actually fit.

Metr makes the storefront understand the shopper.

For V1, Metr has three product layers:

1.  **Metr Core** --- merchant, catalog and commerce intelligence layer.
2.  **Metr Discover** --- AI-powered product discovery and
    recommendation.
3.  **Metr Fit** --- product-specific sizing and fit recommendation.

**Resolve** and **Operate** are part of the long-term product direction
but are not V1 launch capabilities. The website may reference the
broader platform direction carefully, but must not imply unfinished
functionality is currently available.

------------------------------------------------------------------------

## 2. Positioning

### Primary positioning

> **AI commerce infrastructure for fashion brands.**

### Supporting proposition

> Metr gives fashion storefronts an intelligence layer for product
> discovery and fit.

### Product idea

Metr should feel like infrastructure, not a chatbot widget and not a
collection of unrelated AI tools.

The conceptual flow is:

``` text
BRAND DATA
    ↓
METR CORE
    ↓
COMMERCE INTELLIGENCE
    ↓
DISCOVER + FIT
    ↓
BETTER SHOPPING EXPERIENCE
    ↓
CONVERSION + FIT DATA
    ↓
BETTER INTELLIGENCE
```

### What Metr is not

Do not position Metr as:

-   a generic AI chatbot;
-   an ERP;
-   a replacement for Shopify or WooCommerce;
-   a fashion marketplace;
-   a consumer shopping app;
-   a generic analytics dashboard;
-   an all-in-one commerce suite in V1.

------------------------------------------------------------------------

## 3. Target Customer

V1 is built for fashion brands operating their own online storefront.

Ideal initial customers:

-   Pakistani DTC fashion brands;
-   apparel brands with meaningful size variation;
-   brands with 50+ SKUs;
-   Shopify, WooCommerce or custom storefronts;
-   brands acquiring customers through social media and paid
    advertising;
-   brands experiencing product discovery or sizing friction.

Relevant merchant categories include:

-   womenswear;
-   menswear;
-   streetwear;
-   western apparel;
-   modest fashion;
-   activewear;
-   multi-category apparel brands.

The website should still look international. Do not visually or verbally
make Metr feel restricted to Pakistan.

------------------------------------------------------------------------

# 4. V1 Capabilities

## 4.1 Metr Core

Metr Core is the shared intelligence layer underneath all products.

### Inputs

Depending on integration availability, Metr can ingest:

-   brand identity;
-   product catalog;
-   product variants;
-   product descriptions;
-   images;
-   prices;
-   categories;
-   collections;
-   product attributes;
-   inventory state;
-   size charts;
-   fit notes;
-   product metadata;
-   merchant policies.

Future inputs include orders, returns, reviews and richer behavioral
data.

### Normalization

Merchant data should map into Metr's canonical fashion taxonomy.

Example:

``` json
{
  "product_type": "t_shirt",
  "fit": "oversized",
  "color_family": "white",
  "color": "off_white",
  "gender": "unisex",
  "sizes": ["S", "M", "L", "XL"]
}
```

The website should communicate this as Metr **understanding the
catalog**, not merely importing it.

------------------------------------------------------------------------

## 4.2 Metr Discover

Metr Discover lets shoppers describe what they want naturally and
returns relevant products from the merchant's actual catalog.

### Example shopper queries

> Something black for a university dinner under Rs 5,000.

> Oversized tees that work with blue jeans.

> I want something minimal for summer that isn't too formal.

> Show me neutral everyday shirts in my budget.

### Discovery pipeline

``` text
Natural-language request
        ↓
Intent extraction
        ↓
Semantic retrieval
+ keyword retrieval
+ structured filters
+ inventory filtering
        ↓
Product ranking
        ↓
Valid catalog results
        ↓
Natural explanation
```

### Key behaviors

Discover should:

-   search only the connected merchant's catalog;
-   understand intent beyond exact keywords;
-   respect price and product constraints;
-   avoid unavailable products;
-   return real product cards;
-   explain why products match;
-   support follow-up refinement;
-   preserve conversation context where appropriate.

Discover must never invent products.

### Merchant value

The website may communicate:

-   reduce catalog friction;
-   make more of the catalog discoverable;
-   help shoppers express intent naturally;
-   personalize product discovery;
-   connect high-intent shoppers to relevant SKUs.

Do not publish unsupported numerical conversion claims in V1.

------------------------------------------------------------------------

## 4.3 Metr Fit

Metr Fit provides product-specific size recommendations.

Instead of showing every shopper the same static size chart, Fit
combines information about the shopper with the actual product's sizing
data.

### Potential shopper inputs

-   usual size;
-   size consistency;
-   height;
-   preferred fit;
-   shoulder profile;
-   chest/waist profile;
-   waist/hip profile;
-   relevant product-specific questions.

Not every product requires every input.

### Output

A recommendation may include:

``` json
{
  "recommended_size": "M",
  "confidence": 0.91,
  "fit_summary": {
    "shoulders": "close",
    "chest": "comfortable",
    "waist": "relaxed"
  }
}
```

### Key behaviors

Fit should:

-   use the merchant's approved size chart;
-   account for product type;
-   account for available variants;
-   keep body areas distinct where relevant;
-   account for shopper fit preference;
-   produce one recommended size when confidence is sufficient;
-   explain the expected fit in understandable language;
-   avoid pretending to know measurements that are not supported by
    data.

### Merchant value

Communicate Fit as:

-   better sizing guidance;
-   less uncertainty before purchase;
-   product-specific recommendations;
-   a foundation for learning from fit outcomes over time.

Do not promise a specific return reduction until Metr has measured
production evidence.

------------------------------------------------------------------------

# 5. Future Platform Direction

This section is context for engineering and future-proofing. It is not
the V1 feature list.

## Metr Resolve

Planned returns and exchange intelligence:

-   return initiation;
-   return reason understanding;
-   exchange recommendations;
-   size correction;
-   store-credit workflows;
-   merchant return rules;
-   return analytics;
-   revenue recovery.

## Metr Operate

Planned commerce orchestration capabilities:

-   order visibility;
-   inventory visibility;
-   integrations;
-   workflow automation;
-   commerce analytics;
-   merchant AI agent;
-   operational recommendations.

The architecture and website information hierarchy should leave room for
these products without displaying them as available at launch.

------------------------------------------------------------------------

# 6. Website Goal

The V1 website has four jobs:

1.  Explain what Metr is within 5 seconds.
2.  Make Discover and Fit understandable without technical knowledge.
3.  Establish Metr as serious commerce infrastructure rather than an AI
    gimmick.
4.  Convert qualified brands into demo or early-access leads.

### Primary CTA

**Request access**

### Secondary CTA

**See how it works**

Do not use multiple competing CTAs such as Start Free, Book Demo,
Contact Sales and Join Waitlist simultaneously.

------------------------------------------------------------------------

# 7. Site Map

V1 should remain intentionally small.

``` text
/
├── Product
│   ├── Discover
│   └── Fit
├── Developers
├── About
├── Request Access
├── Privacy
└── Terms
```

These may be separate routes or Product/Developers may initially be
sections on the homepage. Recommended V1 routes:

``` text
/
/discover
/fit
/developers
/about
/access
/privacy
/terms
```

Navigation:

``` text
[Metr Logo]   Product   Developers   About              Request access
```

Product can open a small menu:

``` text
Discover
Fit
```

------------------------------------------------------------------------

# 8. Homepage Specification

## 8.1 Navigation

### Left

Metr horizontal lockup.

### Center/right

-   Product
-   Developers
-   About

### CTA

**Request access**

### Behavior

-   transparent/dark initially;
-   subtle background appears after scrolling;
-   sticky;
-   no oversized navigation;
-   mobile uses compact menu.

------------------------------------------------------------------------

## 8.2 Hero

### Eyebrow

`AI COMMERCE INFRASTRUCTURE FOR FASHION BRANDS`

### H1

> **Make your storefront understand the shopper.**

### Body

> Metr gives fashion brands an intelligence layer for product discovery
> and fit, built on a structured understanding of every product in the
> catalog.

### CTAs

**Request access**\
**See how it works**

### Supporting microcopy

> Built for modern fashion storefronts.

Avoid adding logos of customers unless permission exists.

### Hero visual

Do not use an abstract AI orb.

Use an interactive commerce demonstration:

``` text
SHOPPER

"I need something black for a university dinner,
under Rs 5,000. Nothing too formal."

                    ↓

METR / DISCOVER

Intent
Occasion        Semi-formal
Color           Black
Budget          < Rs 5,000
Style           Minimal

                    ↓

[Product] [Product] [Product]
```

Overlay subtle Metr measurement lines, coordinates and five-tick
graphics.

------------------------------------------------------------------------

## 8.3 Problem Section

### Label

`01 / THE PROBLEM`

### Heading

> **Fashion stores have data. Shoppers have intent. The two rarely speak
> the same language.**

### Body

> Traditional search depends on keywords. Size charts depend on
> interpretation. Product catalogs are inconsistent. Metr creates the
> intelligence layer between what a shopper means and what a brand
> actually sells.

### Visual

Two-column schematic:

``` text
SHOPPER                         CATALOG

occasion                       product_type
budget           METR          color
style             →            fit
body profile                   sizes
preferences                    inventory
```

------------------------------------------------------------------------

## 8.4 Platform Introduction

### Label

`02 / METR`

### Heading

> **One intelligence layer. Every product understood.**

### Body

> Connect your catalog once. Metr structures product information, sizing
> and brand context into a machine-readable commerce layer that powers
> shopper-facing intelligence.

### Visual

``` text
Catalog
Sizing
Inventory
Brand context
     ↓
┌───────────────┐
│   METR CORE   │
└───────────────┘
     ↓
Discover     Fit
```

The Metr Core block should use the approved measurement icon.

------------------------------------------------------------------------

# 9. Discover Section

### Label

`03 / DISCOVER`

### Heading

> **Search built around intent, not keywords.**

### Body

> Metr Discover understands natural shopping requests, retrieves valid
> products from your catalog and ranks them against what the shopper
> actually wants.

### Supporting points

Use only three:

**Natural intent**\
Shoppers describe what they want in their own words.

**Catalog grounded**\
Recommendations come from real, available products.

**Context aware**\
Budget, occasion, style and preferences can shape every result.

### Interactive demo

Provide 3 selectable example prompts:

``` text
Something minimal for a dinner under Rs 5,000.

Oversized neutral tees for everyday wear.

A black outfit that feels smart but not formal.
```

Selecting a prompt animates:

1.  query;
2.  extracted intent;
3.  three mock product cards;
4.  a short explanation.

The interaction can use static demo data in V1. It does not need to call
a production AI endpoint.

### CTA

**Explore Discover →**

Links to `/discover`.

------------------------------------------------------------------------

# 10. Fit Section

### Label

`04 / FIT`

### Heading

> **Sizing that understands the product and the person.**

### Body

> Metr Fit combines product-specific size data with shopper preferences
> to recommend a size and explain how it is expected to fit.

### Demo visual

``` text
METR FIT

Product
Essential Oversized Tee

Your usual size
[M]

Preferred fit
[Relaxed]

Height
[5'10"]

──────────────

RECOMMENDED SIZE

M                       91%

Shoulders       Comfortable
Chest           Relaxed
Length          Regular
```

### Supporting copy

> Static charts show measurements. Metr turns them into a decision.

### CTA

**Explore Fit →**

Links to `/fit`.

------------------------------------------------------------------------

# 11. Intelligence Loop Section

### Label

`05 / INTELLIGENCE`

### Heading

> **Built to get smarter with commerce.**

### Body

> Discovery, sizing and future post-purchase intelligence are designed
> around the same commerce model, so shopper interactions can become
> structured signals instead of disconnected events.

### Visual

Animate a circular or linear flow:

``` text
UNDERSTAND
    ↓
DISCOVER
    ↓
FIT
    ↓
PURCHASE
    ↓
LEARN
    └────────→ UNDERSTAND
```

Do not claim cross-merchant learning or network effects as live unless
implemented and contractually appropriate.

------------------------------------------------------------------------

# 12. Integration Section

### Label

`06 / INTEGRATE`

### Heading

> **Add intelligence without rebuilding your store.**

### Body

> Metr is designed to sit on top of the commerce stack a brand already
> uses.

### V1 integration cards

-   Shopify --- mark as `Planned` unless production-ready.
-   WooCommerce --- mark as `Planned` unless production-ready.
-   Custom API --- mark as `Developer integration` if supported.
-   JavaScript SDK --- mark according to actual implementation status.

Do not display an integration as available until it works.

### Example code visual

``` javascript
Metr.init({
  merchantId: "brand_123"
})

Metr.openDiscover()
```

This code is illustrative website copy until the SDK contract is
finalized. Engineer must replace it with the real API before
documentation is presented as production documentation.

------------------------------------------------------------------------

# 13. Developer Section

### Heading

> **Commerce intelligence, exposed as infrastructure.**

### Body

> Use Metr through storefront components, APIs and event-driven
> integrations.

### Product surfaces to design toward

``` text
REST API
JavaScript SDK
React components
Webhooks
```

### Future endpoint naming convention

``` text
POST /v1/discovery/search
POST /v1/fit/recommend
GET  /v1/catalog/products/:id
POST /v1/events
```

These are proposed contracts, not guaranteed V1 public endpoints.

### Developer-page tone

Technical, sparse and factual. Avoid marketing language inside code
documentation.

------------------------------------------------------------------------

# 14. Final CTA

Use a large, simple closing section.

### Heading

> **Build a storefront that understands what people want.**

### Body

> Metr is opening early access to fashion brands.

### CTA

**Request access**

### Secondary line

> For partnerships and integrations: hello@metr.\[final-domain\]

Do not hardcode an email/domain until ownership is confirmed.

------------------------------------------------------------------------

# 15. Footer

Columns:

**Product** - Discover - Fit

**Company** - About - Request access

**Developers** - Developers - API status, only when relevant

**Legal** - Privacy - Terms

Footer line:

`© 2026 Juno Technologies (Private) Limited. Metr.`

Confirm legal naming before production deployment.

------------------------------------------------------------------------

# 16. Discover Page Copy

## Hero

### Eyebrow

`METR / DISCOVER`

### H1

> **Your catalog, understood through intent.**

### Body

> Give shoppers a natural way to find products without forcing them to
> translate what they want into search terms.

### CTA

**Request access**

## Section: How it works

### 1. Understand

> Metr converts natural shopping requests into structured intent such as
> occasion, budget, style, color and product preferences.

### 2. Retrieve

> Hybrid retrieval searches the merchant's real catalog using semantic
> similarity, structured attributes and availability.

### 3. Rank

> Relevant products are ranked against the shopper's request.

### 4. Explain

> Metr presents grounded recommendations and lets the shopper refine the
> request naturally.

## Technical diagram

``` text
QUERY
  ↓
INTENT
  ↓
RETRIEVAL
  ├── semantic
  ├── keyword
  ├── filters
  └── availability
  ↓
RANKING
  ↓
PRODUCTS
```

## Closing line

> **Discovery should understand why someone is shopping, not only what
> they typed.**

------------------------------------------------------------------------

# 17. Fit Page Copy

## Hero

### Eyebrow

`METR / FIT`

### H1

> **Turn size charts into decisions.**

### Body

> Metr Fit combines product-specific sizing information with shopper
> preferences to recommend the size most likely to match the fit they
> want.

### CTA

**Request access**

## Section: Product-specific

> A medium is not the same across every product. Metr evaluates sizing
> in the context of the actual garment.

## Section: Shopper-specific

> Fit preference, usual size and relevant body-profile inputs help Metr
> move beyond generic charts.

## Section: Explainable

> The shopper sees more than a letter. Metr can explain how the
> recommended size is expected to fit across relevant areas.

## Example

``` text
RECOMMENDATION

M             91% confidence

Shoulders     Comfortable
Chest         Relaxed
Waist         Relaxed

Preference    Relaxed fit
```

## Closing line

> **Better sizing starts with understanding both sides of the fit.**

------------------------------------------------------------------------

# 18. About Page Copy

### H1

> **We think commerce should understand people better.**

### Body

> Metr is building AI commerce infrastructure for fashion brands. We
> started by solving product discovery and sizing problems inside Juno,
> then began turning that intelligence into infrastructure other brands
> can use.

> Fashion commerce contains enormous amounts of product and behavioral
> data, but much of it remains fragmented, inconsistent or difficult for
> shoppers to use. Metr structures that information and turns it into
> useful intelligence at the point of decision.

### Company relationship

> Metr is a product of Juno Technologies.

Do not over-explain the corporate structure on the marketing site.

------------------------------------------------------------------------

# 19. Request Access Page

Keep the form short.

### H1

> **Bring Metr to your storefront.**

### Body

> Tell us about your brand. We are onboarding a limited number of
> fashion merchants for V1.

### Required fields

-   Full name
-   Work email
-   Brand name
-   Website URL
-   Store platform
    -   Shopify
    -   WooCommerce
    -   Custom
    -   Other
-   Approximate monthly online orders
    -   \<100
    -   100--500
    -   500--2,000
    -   2,000+
-   Interested in
    -   Discover
    -   Fit
    -   Both
-   Optional message

### Submit

**Request access**

### Success state

> **Request received.**\
> We'll review your storefront and get in touch if Metr is a fit for the
> V1 program.

Do not promise a response time unless operations can support it.

------------------------------------------------------------------------

# 20. Visual System

The website must use the approved Metr identity.

## Core palette

Recommended starting tokens:

``` css
--metr-black: #111110;
--metr-white: #F5F5F2;
--metr-gray: #7C7C78;
--metr-line: #343432;
--metr-signal: #D7FF3F;
```

The signal color is optional and should represent:

-   active measurement;
-   AI state;
-   selected state;
-   important data;
-   interaction feedback.

It should never dominate the page.

## General composition

Target roughly:

-   80--90% black/charcoal;
-   10--20% white/gray;
-   \<5% signal accent.

### Avoid

-   generic AI gradients;
-   purple/blue glowing blobs;
-   glassmorphism everywhere;
-   excessive rounded cards;
-   floating 3D objects;
-   stock photography;
-   meaningless AI particles.

------------------------------------------------------------------------

# 21. Graphical Language

Use the provided Metr Web Asset Kit.

Core motifs:

-   measurement scales;
-   five-tick signal;
-   dimension lines;
-   technical grids;
-   crosshairs;
-   coordinate markers;
-   bounding boxes;
-   scan frames;
-   registration marks;
-   data typography;
-   technical annotations.

### Principle

Graphics should imply that Metr is **observing, structuring and
measuring commerce**.

They should not simply decorate empty space.

### Example

A product image may be shown inside a scan frame:

``` text
OBJECT / 01
                     FIT / 94.2%

       ┌────────────────────┐
       │                    │
       │       PRODUCT      │
       │                    │
       └────────────────────┘

             ← 284 PX →

TYPE / OVERSIZED TEE
COLOR / OFF WHITE
FIT / RELAXED
```

------------------------------------------------------------------------

# 22. Logo Usage

Primary website lockup:

``` text
[Metr measurement symbol] metr
```

Use:

-   white on black for primary navigation;
-   black on white for light contexts;
-   symbol-only for favicon and compact UI.

Do not:

-   recolor individual ticks;
-   distort the mark;
-   rotate it;
-   add effects;
-   place it inside arbitrary shapes;
-   animate the core logo continuously.

The five-tick pattern may animate when used as a **graphic motif**,
separate from the official logo.

------------------------------------------------------------------------

# 23. Typography

The visual direction is geometric, neutral and modern.

Use one primary sans-serif family plus a system monospace for technical
labels.

### Recommended hierarchy

``` text
Display / H1
64–88px desktop
44–56px tablet
36–44px mobile
Weight 500–700
Tight tracking

H2
44–64px desktop

Body Large
18–22px
Line height 1.4–1.55

Body
15–18px

Technical labels
11–13px
Monospace
Uppercase
Letter spacing 0.08–0.14em
```

If the final licensed brand font is unavailable, use a high-quality
system/geometric fallback during development. Do not distribute font
files through the repository unless licensing permits it.

------------------------------------------------------------------------

# 24. Motion System

Motion should feel like instrumentation.

Good animation patterns:

-   measurement ticks extending;
-   scan line moving once across a product;
-   intent attributes appearing sequentially;
-   number counters resolving into values;
-   grid or coordinate markers subtly responding to cursor;
-   five-tick signal changing height;
-   diagrams connecting as they enter viewport.

### Timing

Typical UI transitions:

``` text
150–250ms     controls
300–500ms     cards / panels
500–900ms     diagrams
```

Avoid endless ambient movement.

Respect:

``` css
@media (prefers-reduced-motion: reduce)
```

Every core message must remain understandable without animation.

------------------------------------------------------------------------

# 25. Responsive Behavior

Design mobile intentionally.

## Desktop

-   max content width around 1280--1440px;
-   large negative space;
-   two-column product demonstrations;
-   graphical elements may extend beyond content grid.

## Tablet

-   simplify diagrams;
-   reduce oversized decorative graphics;
-   maintain technical annotations where readable.

## Mobile

-   single column;
-   H1 must not exceed comfortable 3--5 lines;
-   interactive demos become stacked cards;
-   technical diagrams become vertical flows;
-   hide nonessential coordinate labels;
-   preserve the primary measurement motif;
-   CTA remains obvious without sticky obstruction.

Minimum supported width: 320px.

------------------------------------------------------------------------

# 26. Accessibility

Target WCAG 2.2 AA.

Required:

-   semantic heading order;
-   keyboard navigation;
-   visible focus states;
-   sufficient contrast;
-   labels for every form input;
-   alt text for meaningful images;
-   decorative SVGs hidden from screen readers;
-   no information conveyed only through color;
-   reduced-motion support;
-   minimum practical tap target of \~44px;
-   error messages associated with fields.

Interactive demos must have a non-animated readable state.

------------------------------------------------------------------------

# 27. SEO

Every public page requires:

-   unique title;
-   meta description;
-   canonical URL;
-   Open Graph tags;
-   Twitter/X card metadata where relevant;
-   structured semantic HTML;
-   sitemap;
-   robots.txt.

### Homepage title

`Metr — AI Commerce Infrastructure for Fashion Brands`

### Homepage description

`Metr gives fashion brands AI-powered product discovery and sizing intelligence built on a structured understanding of their catalog.`

### Discover title

`Metr Discover — AI Product Discovery for Fashion`

### Fit title

`Metr Fit — AI Sizing Intelligence for Fashion Brands`

Do not stuff keywords.

------------------------------------------------------------------------

# 28. Analytics

The website should emit clean first-party events.

Suggested events:

``` text
page_view
nav_clicked
hero_cta_clicked
demo_started
demo_prompt_selected
discover_cta_clicked
fit_cta_clicked
developer_cta_clicked
access_form_started
access_form_submitted
access_form_error
outbound_link_clicked
```

Suggested common properties:

``` json
{
  "page": "/",
  "section": "discover",
  "device_type": "desktop",
  "utm_source": null,
  "utm_campaign": null
}
```

Do not collect sensitive shopper information through marketing
analytics.

------------------------------------------------------------------------

# 29. Lead Storage

The Request Access form should submit to a server-side endpoint.

Suggested internal schema:

``` json
{
  "id": "lead_xxx",
  "name": "Example",
  "email": "founder@brand.com",
  "brand_name": "Brand",
  "website": "https://brand.com",
  "platform": "shopify",
  "monthly_orders": "500_2000",
  "interest": ["discover", "fit"],
  "message": null,
  "utm": {},
  "created_at": "ISO-8601"
}
```

Requirements:

-   server-side validation;
-   rate limiting;
-   bot protection;
-   no secrets in client bundle;
-   success/error states;
-   database persistence or approved CRM integration;
-   internal notification optional.

------------------------------------------------------------------------

# 30. Recommended Frontend Architecture

Recommended:

``` text
Next.js
TypeScript
React
CSS Modules / Tailwind / equivalent
Framer Motion only where useful
SVG assets inline where animation is needed
```

Suggested structure:

``` text
src/
├── app/
│   ├── page.tsx
│   ├── discover/
│   ├── fit/
│   ├── developers/
│   ├── about/
│   ├── access/
│   ├── privacy/
│   └── terms/
│
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── sections/
│   ├── graphics/
│   ├── demos/
│   ├── forms/
│   └── ui/
│
├── content/
│   ├── site.ts
│   ├── discover.ts
│   └── fit.ts
│
├── lib/
│   ├── analytics/
│   ├── validation/
│   └── api/
│
├── styles/
└── assets/
    ├── brand/
    └── graphics/
```

Do not hardcode all marketing copy directly inside large page
components. Keep content structured enough to edit without rewriting
layout logic.

------------------------------------------------------------------------

# 31. Component Inventory

Build reusable components for:

``` text
SiteHeader
MobileNavigation
SiteFooter
SectionLabel
Hero
PrimaryButton
SecondaryButton
TechnicalLabel
MeasurementRule
Metric
ProductMockCard
IntentParserDemo
FitRecommendationDemo
PlatformDiagram
IntegrationCard
TechnicalGrid
ScanFrame
DimensionLine
RequestAccessForm
SectionCTA
```

The graphical components should accept className/style props and inherit
color where practical.

------------------------------------------------------------------------

# 32. Performance Requirements

The visual identity must not make the website slow.

Targets:

-   Core Web Vitals in healthy range;
-   avoid video in the initial hero unless strongly optimized;
-   use SVG for technical graphics;
-   lazy-load below-the-fold images;
-   optimize product mock images;
-   avoid huge animation libraries for simple effects;
-   minimize client-side JavaScript;
-   prefer server-rendered static marketing content;
-   prefetch only useful routes.

The hero should become usable immediately, even before optional
animation code loads.

------------------------------------------------------------------------

# 33. Security Requirements

For the marketing website:

-   no API keys in client code;
-   sanitize form input;
-   validate URLs and emails server-side;
-   rate-limit access form;
-   use CSRF protections where architecture requires;
-   use secure headers;
-   use HTTPS only in production;
-   avoid rendering arbitrary merchant HTML;
-   do not expose internal Metr/Juno endpoints.

If a live Discover demo is later connected to an LLM, it must be
isolated from internal systems and have strict rate limits and
prompt/input controls.

------------------------------------------------------------------------

# 34. Content Rules

### Use

-   intelligence;
-   understand;
-   commerce;
-   catalog;
-   discovery;
-   fit;
-   infrastructure;
-   structured;
-   product-specific;
-   grounded;
-   intent.

### Avoid overusing

-   revolutionary;
-   game-changing;
-   cutting-edge;
-   seamless;
-   next-generation;
-   AI-powered everything;
-   agentic;
-   magic;
-   guaranteed;
-   perfect fit.

Metr's tone should be confident, precise and restrained.

------------------------------------------------------------------------

# 35. Claims Policy

The engineer must not invent metrics for visual polish.

Do not display:

``` text
+32% conversion
-41% returns
10x ROI
99% accuracy
```

unless these are backed by approved production data.

For mock interfaces, use clearly demonstrative product-level values such
as `91% confidence` only where the UI is explicitly presented as an
example, not a company performance claim.

------------------------------------------------------------------------

# 36. V1 Build Priority

## P0 --- Launch required

-   Homepage
-   Discover page
-   Fit page
-   Request Access page
-   About page
-   Privacy / Terms placeholders with approved legal copy
-   responsive navigation/footer
-   access form backend
-   analytics
-   SEO metadata
-   Metr logo assets
-   core graphical system
-   static/interactive Discover demo
-   static/interactive Fit demo

## P1 --- Strongly preferred

-   Developers page
-   polished motion
-   integration section
-   Open Graph images
-   richer analytics
-   reusable technical diagrams

## P2 --- After launch

-   live AI demo
-   public API documentation
-   merchant login
-   case studies
-   customer logos
-   benchmarks
-   Resolve marketing page
-   Operate marketing page

------------------------------------------------------------------------

# 37. Definition of Done

The V1 website is ready when:

-   a first-time visitor can explain Metr after viewing the hero and
    first two sections;
-   Discover and Fit are clearly differentiated;
-   no unfinished capability is represented as live;
-   Request Access works end-to-end;
-   every page works from 320px mobile through large desktop;
-   keyboard navigation works;
-   reduced-motion mode works;
-   Lighthouse/performance issues caused by avoidable assets are
    resolved;
-   metadata and social sharing are configured;
-   analytics events fire correctly;
-   copy matches this document;
-   approved Metr logo and graphical assets are used consistently;
-   the website looks like commerce infrastructure, not a generic AI
    startup template.

------------------------------------------------------------------------

# 38. One-Sentence Internal Product Definition

Use this internally whenever product scope becomes unclear:

> **Metr connects to a fashion brand's commerce data, understands its
> catalog, and exposes that intelligence through shopper-facing
> discovery and sizing experiences.**

For V1, if a proposed website section or feature does not reinforce that
idea, it probably does not belong on the site.
