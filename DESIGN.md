# PropertyGo — Design notes

A buyer's-agent terminal for the Australian property market. Five screens, one canvas.

---

## Design direction

The brief called it "Bloomberg for property." The first pass leaned into that literally — dark, dense, ticker tape, four-column data shelves. Got told it was cluttered. **Pivoted to the opposite read:** Linear/Notion-style restraint, warm paper background, editorial serif for moments of weight, chalk-yellow accent reserved for the things that matter.

Bloomberg's real lesson isn't _dense_ — it's _no chrome between you and the data_. We kept that. Removed the rest.

### Principles

1. **Calm by default, sharp where it counts.** Yellow accent only on AI-matched chips, the most important CTA per page, and "today" markers. Everything else lives in greyscale until acted on.
2. **Editorial typography.** Fraunces (serif) for page titles, section heads, and large numerical values — gives the dashboard a published-document feel rather than a SaaS chrome feel. Inter for everything functional. JetBrains Mono for prices, scores, dates.
3. **Australian conventions, baked in.** Bed/Bath/Car triplets, "Suburb VIC 3122", DD/MM dates, AUD with no cents, state-specific cooling-off, PEXA workspace status.
4. **Hi-fi placeholders, not stock photos.** Property thumbnails are stylised SVGs in six palettes — better than fake imagery, signals "we know this is a mock."

---

## Visual system

| Token                 | Value                  | Used for                          |
| --------------------- | ---------------------- | --------------------------------- |
| Background            | `#FAFAF7` (warm paper) | Page bg                           |
| Surface               | `#FFFFFF`              | Cards, inputs                     |
| Text                  | `#1A1814`              | Primary                           |
| Text dim              | `#6B6660`              | Secondary                         |
| Border                | `rgba(20,18,12,0.07)`  | Hairlines only                    |
| Accent (chalk yellow) | `#E5B100`              | AI matches, primary CTAs, "today" |
| Green                 | `#2F8F4A`              | Interested, settled, on-track     |
| Amber                 | `#B96B00`              | Needs info, due diligence         |
| Red                   | `#B91C1C`              | Urgent, cooling-off, not-for-me   |
| Blue                  | `#2563EB`              | Auction, PEXA settling            |
| Purple                | `#6D28D9`              | Heritage overlay, split decisions |

**Type:** Fraunces 500/600 (display) · Inter 400/500/600 (body) · JetBrains Mono 500 (figures). No weights heavier than 600 — keeps the page calm.

**Spacing:** 4px base. Most padding lands on 8/12/16/24. Section gaps 28–48 to give air between content groups.

**Borders & radii:** 6px buttons, 8px deal cards, 10px cards, 12px hero panels. 1px hairlines on `rgba(20,18,12,0.07)` — visible without being chrome.

**No shadows** anywhere except map popups and a couple of CTAs. The light theme reads cleaner with borders alone.

---

## Screens

### 1. Today (dashboard)

The 5am opener. Three signals across the top, **"Needs your attention"** as a sorted action queue (red→amber→grey by urgency, never more than 4 items shown), **"This week"** as a timeline rail. Below: a calm table of properties awaiting client feedback. Skipped: ticker tape, live activity panel, "pipeline distribution" funnel — all useful, all noise on a morning surface. The agent already knows the pipeline; what they don't know is what _just_ needs them today.

### 2. Property detail

Two-column. Gallery + facts + "Why this matches \[client\]" + comparable sales table on the left. Listing agent contact, inspections, risk overlay (flood/bushfire/heritage/easements/contamination), and a feasibility breakdown on the right. Tabs above the fold but only Overview is drawn — the rest stay in the spec.

### 3. Pipeline (Kanban)

Single unified pipeline (the spec called for consolidating the old separate "Offer" board into a stage of this one). Six stages, with a seventh "Settled" muted at the end. Deal cards adapt to their stage:

- Suggested: shows source chip (AI / client / manual)
- Approved: match score + co-buyer ticks
- Due diligence: progress bar (e.g. 5/8)
- Offer made: tiny offer history log inline
- Under contract: cooling-off badge + PEXA status + next milestone

Priority shows as a dot in the corner — red for urgent, amber for high. No flags, no triangles, no decoration.

### 4. Map discovery

Stylised SVG map of inner Melbourne — Yarra River, Fawkner Park, Carlton Gardens, suburb labels in tracked Inter — with property pins, optional flood/heritage overlays, and a layer toggle in the top-right. Selected pin gets a popup with the same property card pattern as elsewhere. The map is illustrative rather than tile-based; for a static mock it sells the idea better than a screenshotted real map.

### 5. Client portal

Different chrome — agency logo top-left, simple tabs, no agent sidebar. Single column, generous max-width. The settlement panel uses a big serif number for "days until" and a checklist with green = done. Property cards show co-buyer feedback alongside the user's own (e.g. "Tom: Need more info") so the client sees their partner's status without a second login. **Three explicit feedback buttons** — Interested / Need info / Not for me — replacing the spec's earlier swipe-style UX, because property purchase isn't a Tinder decision.

---

## What's hand-waved

- **Animation & micro-interactions.** Static screens; nothing wired up.
- **Buyer Brief Wizard, Settlement Timeline, CMA report PDF, Offer Letter generator.** Mentioned in the spec, not drawn.
- **Slide-out drawer behavior.** Property detail is shown as a full page rather than as a drawer overlaying the map — easier to evaluate as a static mock. The drawer pattern still works in practice, but isn't the demo surface.
- **Real property imagery.** Stylised SVG placeholders. Real photos would change the colour balance of every screen and is a content problem, not a design one.
- **Mobile.** Spec describes mobile views (inspection mode, push-nav property card, swipe-to-advance Kanban). Not in this round.

---

## File layout

```
PropertyGo.html              — entry, uses design_canvas to host all artboards
styles.css                   — tokens + base styles
components/shared.jsx        — Icon, Logo, Sidebar, TopBar, Sparkline, PropertyThumb, MatchScore
screens/
  Dashboard.jsx              — Today
  PropertyDetail.jsx         — Property card (full-page form)
  Pipeline.jsx               — Kanban
  MapDiscovery.jsx           — Map + list
  ClientPortal.jsx           — Client surface
ds/colors_and_type.css       — OneMinute design system source (kept for reference)
_dev/                        — single-screen previews for screenshotting
```
