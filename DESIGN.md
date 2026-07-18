---
name: Hoza
description: Precision-built digital products with visible forward momentum.
colors:
  primary-violet: "#8B5CFF"
  primary-action: "#7A46E8"
  primary-action-hover: "#6936D6"
  lavender-signal: "#C8B7FF"
  background-void: "#08050D"
  surface: "#150A22"
  surface-quiet: "#0A0610"
  surface-raised: "#0C0713"
  surface-strong: "#10091A"
  text: "#F5F2FA"
  text-muted: "#8D8498"
  placeholder: "#968EA1"
  success: "#76FFB0"
  error: "#FF9ABA"
  whatsapp: "#128C4A"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 6vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.4rem, 4vw, 4rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Barlow, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Barlow, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  sm: "0.55rem"
  md: "1.2rem"
  pill: "999px"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2rem"
  page: "clamp(1.25rem, 4vw, 5rem)"
components:
  button-primary:
    backgroundColor: "{colors.primary-action}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.95rem 1.2rem"
    height: "3.6rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-action-hover}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.95rem 1.2rem"
    height: "3.6rem"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.95rem 1.2rem"
    height: "3.6rem"
  input:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.9rem 1rem"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "2rem"
---

# Design System: Hoza

## Overview

**Creative North Star: "Precision in Motion"**

Hoza should feel like transport signage engineered for a digital studio: fast to read, hard to misinterpret, and visibly pointed forward. Compressed display type supplies velocity while disciplined body copy and strict spacing preserve credibility.

The system is dark, technical, and energetic without becoming noisy. Motion is brief and purposeful: it reveals state, direction, or progress, then gets out of the way. Responsive layouts must preserve the same decisive hierarchy from wide screens down to 320px.

This system explicitly rejects generic SaaS-template styling, timid visual systems, empty technology claims, unnecessary agency jargon, and decorative complexity that slows comprehension.

**Key Characteristics:**

- Compressed, transport-inspired display typography
- One violet signal color used with restraint
- Tonal depth before shadow or blur
- Direct, accessible actions with visible states
- Motion that communicates speed and precision

## Colors

The Electric Violet Signal palette sets a bright directional accent against near-black violet surfaces and calm, legible neutrals.

### Primary

- **Electric Violet:** Brand marks, active indicators, diagrams, and controlled emphasis.
- **Action Violet:** Primary buttons and conversion controls; its deeper hover state preserves readable contrast.

### Neutral

- **Void:** The foundational page background and visual silence around major statements.
- **Quiet Surface:** Broad section separation without card-like boxing.
- **Raised Surface:** Dialogs, secondary buttons, and contained information.
- **Strong Surface:** Inputs and interactive fields that must remain distinct at rest.
- **Signal White:** Primary text and high-confidence UI labels.
- **Operational Grey:** Supporting copy, metadata, and non-primary labels.

### Named Rules

**The One Signal Rule.** Violet is the only general-purpose accent; success, error, and WhatsApp green are reserved for their semantic roles.

**The Contrast Is a Feature Rule.** Primary actions, placeholders, and field states must meet WCAG 2.2 AA before decorative glow is considered.

## Typography

**Display Font:** Barlow Condensed (with Arial Narrow fallback)  
**Body Font:** Barlow (with Segoe UI fallback)

**Character:** The pairing borrows the economy of highway signage without becoming retro. Display type is machined and urgent; body type remains open, practical, and easy to scan.

### Hierarchy

- **Display** (700, responsive up to 6rem, 0.9 line-height): Hero and section statements, normally uppercase.
- **Headline** (700, responsive up to 4rem, 0.92 line-height): Project names, process steps, and modal titles.
- **Title** (600–700, 1.2–2rem): Service rows, technology groups, and card headings.
- **Body** (400–500, 1rem, 1.5–1.65 line-height): Explanatory copy, capped near 65 characters per line.
- **Label** (600, 0.75rem, 0.08em tracking): Navigation, statuses, and compact operational metadata.

### Named Rules

**The Signage Rule.** Use compressed display type for direction and body type for explanation; never make paragraphs perform like headlines.

**The Compression Limit Rule.** Display tracking never exceeds -0.04em, and mobile headlines must wrap without clipping or horizontal scroll.

## Elevation

Hoza is tonal and structural by default. Surface changes, borders, scale, and directional light establish depth; shadows are reserved for temporary overlays, floating conversion controls, and luminous signal elements. Blur is functional on navigation and modal layers, never a default card treatment.

### Shadow Vocabulary

- **Structural Lift** (`0 4px 8px` with a low-opacity void tone): Floating actions and dialogs only.
- **Signal Glow** (soft violet radiance): Tiny indicators, routes, and hero emphasis only.

### Named Rules

**The Tonal-First Rule.** If a static card needs a large shadow to read as a surface, fix its tone or border instead.

## Components

Components feel direct and tactile: large enough to hit confidently, restrained at rest, decisive in response.

### Buttons

- **Shape:** Fully rounded action capsules (999px) with a minimum height of 3.6rem.
- **Primary:** Action Violet, Signal White, compact uppercase label, and 0.95rem by 1.2rem internal padding.
- **Hover / Focus:** Darken on hover; use a two-pixel Lavender Signal outline on keyboard focus. Active state moves by one pixel, never bounces.
- **Secondary:** Raised Surface with a visible quiet border; violet appears only on hover or focus.

### Chips

- **Style:** Transparent or tonal surface, one-pixel quiet border, compact label typography, and pill shape.
- **State:** Selected chips use violet text or border, not a competing accent fill.

### Cards / Containers

- **Corner Style:** Gently machined corners (1.2rem), never nested stacks of rounded rectangles.
- **Background:** Quiet or Raised Surface based on hierarchy.
- **Shadow Strategy:** Flat at rest; follow the Tonal-First Rule.
- **Border:** One-pixel lavender-derived divider.
- **Internal Padding:** 1.5rem to 2rem, reduced proportionally on narrow screens.

### Inputs / Fields

- **Style:** Strong Surface, one-pixel quiet border, 0.55rem radius, and generous text padding.
- **Focus:** Violet border with a restrained three-pixel tonal ring.
- **Error / Disabled:** Error color is paired with inline explanatory text; disabled controls reduce opacity but retain legibility.

### Navigation

Navigation uses compact uppercase labels, 44px minimum targets, and a restrained underline response. On mobile, the menu becomes a full-viewport layer with trapped focus, background inertness, and one obvious project action.

### Project Showcase

Work cards pair an immersive media field with plainly stated outcome, scope, and delivery notes. Details expand without animated height measurement, preserving stability and reduced-motion behavior.

## Do's and Don'ts

### Do:

- **Do** make forward momentum tangible through directional composition, brief reveal motion, and clear verbs.
- **Do** show business outcomes beside technical capability.
- **Do** keep the path from interest to enquiry direct and keyboard-complete.
- **Do** preserve 44px touch targets, AA contrast, visible focus, and clean reflow at 320px.
- **Do** use tonal hierarchy before adding blur, glow, or shadow.

### Don't:

- **Don't** use generic SaaS-template styling or interchangeable gradient-card layouts.
- **Don't** create timid visual systems with low-contrast actions or ambiguous hierarchy.
- **Don't** make empty technology claims; every capability needs a concrete use or outcome.
- **Don't** use unnecessary agency jargon where direct language can explain the work.
- **Don't** add decorative complexity that slows comprehension.
- **Don't** use continuous scroll animation when a one-time reveal or native behavior communicates the same idea.
