# DESIGN.md — Claude Design System
> Inspired by Anthropic's Claude · Warm terracotta accent · Clean editorial layout

This file was added via `npx getdesign@latest add claude` and adapted for UPSC Prelims Test.

---

## Philosophy
- **Warm & intellectual** — cream backgrounds, warm shadows, terracotta accents
- **Editorial clarity** — generous whitespace, serif headings, high contrast body text
- **Calm confidence** — no loud gradients, no aggressive neon; quiet premium

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--background` | `#FAF7F2` | Page background, sidebar |
| `--background-secondary` | `#FFFFFF` | Cards, panels |
| `--background-tertiary` | `#F3EEE8` | Hover states, subtle fills |
| `--foreground` | `#1A1A1A` | Primary text |
| `--foreground-secondary` | `#374151` | Secondary text |
| `--muted` | `#6B7280` | Placeholder, meta text |
| `--muted-light` | `#9CA3AF` | Labels, captions |
| `--border` | `#E5E0DA` | Default borders |
| `--border-light` | `#EDE9E3` | Light separators |
| `--accent` | `#C4784A` | Terracotta — primary CTA, active states |
| `--accent-hover` | `#B06838` | Hover state for accent |
| `--accent-soft` | `rgba(196,120,74,0.10)` | Soft accent fills |
| `--accent-glow` | `rgba(196,120,74,0.20)` | Glow / shadow |
| `--dark-card` | `#1C1C1C` | Dark UI mockup cards |
| `--dark-card-secondary` | `#262626` | Dark card inner panels |
| `--success` | `#10b981` | Correct answers |
| `--danger` | `#ef4444` | Wrong answers / errors |
| `--warning` | `#eab308` | Caution states |

---

## Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display / Hero | Fraunces (serif) | 700–900 | H1 headings, hero text |
| Body | Manrope (sans) | 400–600 | All body & UI text |
| Mono | JetBrains Mono | 400 | Code, scores, counters |
| Display Alt | Teko | 400–600 | Large stat numbers |

**Scale (rem):**
- `text-xs` — 0.75rem / labels
- `text-sm` — 0.875rem / meta
- `text-base` — 1rem / body
- `text-lg` — 1.125rem / lead
- `text-2xl` — 1.5rem / section sub-heads
- `text-4xl` — 2.25rem / section heads
- `text-6xl` — 3.75rem / hero
- `text-8xl` — 6rem / display numbers

---

## Spacing & Radius

- Base unit: **8px**
- Card radius: `16px` (rounded-2xl)
- Large card: `24px` (rounded-3xl)
- Pill: `9999px` (rounded-full)
- Button padding: `px-8 py-4` for large, `px-4 py-2` for small

---

## Shadows

```css
--shadow-sm:  0 1px 3px rgba(0,0,0,0.06);
--shadow:     0 4px 16px rgba(0,0,0,0.08);
--shadow-lg:  0 8px 32px rgba(0,0,0,0.10);
--shadow-glow: 0 0 24px rgba(196,120,74,0.18);
```

---

## Components

### Button — Primary (Terracotta)
```html
<button class="rounded-full bg-[#C4784A] px-8 py-4 text-base font-bold text-white hover:bg-[#B06838] transition-all hover:shadow-[0_4px_16px_rgba(196,120,74,0.35)]">
  CTA Text
</button>
```

### Button — Ghost
```html
<button class="rounded-full border-2 border-[#1A1A1A] px-8 py-4 text-base font-bold text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all">
  Ghost CTA
</button>
```

### Card
```html
<div class="rounded-2xl border border-[#E5E0DA] bg-white p-6 shadow-sm hover:shadow transition-shadow">
  Content
</div>
```

### Badge / Pill
```html
<span class="rounded-full border border-[#E0DBD4] bg-white px-4 py-1.5 text-sm font-medium text-[#1A1A1A]">
  Label
</span>
```

---

## Motion

- Default easing: `ease` (cubic-bezier(0.25, 0, 0, 1))
- Fast transitions: `150ms` (hover color, border)
- Medium: `300ms` (sidebar collapse, modal)
- Slow: `500ms–700ms` (bar chart animations)
- Fade-up: `opacity: 0 → 1` + `translateY(8px → 0)` over `400ms`

---

## Grid Background

```css
background-size: 48px 48px;
background-image:
  linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px);
```
Used on landing pages and auth screens for subtle texture.

---

## Do ✅ / Don't ❌

| ✅ Do | ❌ Don't |
|---|---|
| Use `#C4784A` as the single accent color | Add blue, purple, or green as hero accents |
| Pair Fraunces for headings with Manrope for body | Mix too many typefaces |
| Keep backgrounds warm (cream, not stark white) | Use cold grays or stark `#FFFFFF` as page bg |
| Add subtle hover glows on CTAs | Use aggressive neon shadows |
| Use `italic` in hero headings for warmth | Overuse italics in body copy |
| Section labels: uppercase, tracked, muted | Skip section hierarchy |
