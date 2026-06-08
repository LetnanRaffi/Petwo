---
name: Serene Morning
colors:
  surface: '#f7f9fe'
  surface-dim: '#d7dadf'
  surface-bright: '#f7f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f9'
  surface-container: '#ebeef3'
  surface-container-high: '#e5e8ed'
  surface-container-highest: '#e0e3e7'
  on-surface: '#181c20'
  on-surface-variant: '#40484b'
  inverse-surface: '#2d3135'
  inverse-on-surface: '#eef1f6'
  outline: '#71787c'
  outline-variant: '#c0c8cb'
  surface-tint: '#346574'
  primary: '#346574'
  on-primary: '#ffffff'
  primary-container: '#a7d8ea'
  on-primary-container: '#2e5f6f'
  inverse-primary: '#9dcee0'
  secondary: '#605e58'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2d9'
  on-secondary-container: '#66645e'
  tertiary: '#6a5c4e'
  on-tertiary: '#ffffff'
  tertiary-container: '#e0cdbc'
  on-tertiary-container: '#645649'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b9eafd'
  primary-fixed-dim: '#9dcee0'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#184d5c'
  secondary-fixed: '#e6e2d9'
  secondary-fixed-dim: '#c9c6be'
  on-secondary-fixed: '#1c1c17'
  on-secondary-fixed-variant: '#484741'
  tertiary-fixed: '#f3dfce'
  tertiary-fixed-dim: '#d6c3b3'
  on-tertiary-fixed: '#231a0f'
  on-tertiary-fixed-variant: '#514538'
  background: '#f7f9fe'
  on-background: '#181c20'
  surface-variant: '#e0e3e7'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

This design system targets lifestyle, wellness, and mindful productivity applications. The brand personality is gentle, optimistic, and nurturing, aiming to evoke a sense of calm and clarity.

The aesthetic blends **Minimalism** with **Glassmorphism**. It utilizes a "warm-light" foundation to avoid the sterile feeling of pure white, creating an inviting environment. By combining soft, organic shapes with translucent layers, the UI feels lightweight and breathable, as if elements are floating in a soft, sunlit atmosphere.

## Colors

The palette is anchored by a soft, pastel sky blue primary color, used for key actions and highlights. The surface foundation is a warm cream (`#FDF9F0`), which provides a cozy, paper-like quality that reduces eye strain compared to pure white. 

Secondary accents use a muted sand tone to ground the palette. Neutral tones are kept in a warm charcoal range to maintain legibility without breaking the soft color harmony. Translucency is a core functional color state, using white at 40-60% opacity for glass effects.

## Typography

The typography system uses **Plus Jakarta Sans** for headlines to provide a friendly, modern, and slightly rounded appearance that complements the soft UI shapes. For body copy and labels, **Be Vietnam Pro** is utilized for its contemporary warmth and exceptional readability at smaller scales.

Line heights are intentionally generous to promote a sense of "airiness" and ease of reading. Headlines use a slight negative letter spacing to feel more cohesive and impactful against the soft background colors.

## Layout & Spacing

The layout follows a **fluid grid** model with soft margins. On desktop, a 12-column grid is used with wide 24px gutters to prevent content density from feeling overwhelming. On mobile, the system collapses to a 4-column grid with 16px side margins.

Spacing is based on an 8px rhythmic scale. Emphasis is placed on "negative space" as a functional element—large `lg` and `xl` spacers are used to separate major content sections, reinforcing the calm, unhurried nature of the design system.

## Elevation & Depth

Depth is achieved through **Glassmorphism** rather than traditional heavy shadows. 

1.  **Base Layer:** The warm cream solid surface.
2.  **Mid Layer (Cards/Containers):** Semi-transparent white (`rgba(255, 255, 255, 0.4)`) with a `20px` backdrop blur and a thin, 1px white border at 50% opacity to define edges.
3.  **Top Layer (Modals/Overlays):** A more opaque white glass (`rgba(255, 255, 255, 0.7)`) with a `40px` backdrop blur and a very soft, diffused primary-tinted shadow (`rgba(167, 216, 234, 0.2)`) to indicate focus.

Avoid black shadows; use subtle color-tinted shadows only when necessary for high-level overlays.

## Shapes

The shape language is organic and inviting. All containers, buttons, and input fields utilize the **Rounded** (level 2) setting. 

- Standard components (Buttons, Inputs): `0.5rem` (8px).
- Content Cards: `1rem` (16px).
- Large Hero Sections or Modals: `1.5rem` (24px).

Avoid sharp corners entirely to maintain the "cozy" and "soft" visual narrative.

## Components

### Buttons
Primary buttons use the pastel sky blue background with dark charcoal text for high contrast. Secondary buttons are "glass" style: transparent backgrounds with a subtle 1px border. All buttons have a high internal padding (minimum 12px vertical, 24px horizontal) to feel "squishy" and accessible.

### Cards & Overlays
Cards must use the glassmorphic treatment: a semi-transparent background with a backdrop blur. No heavy shadows. Information should be grouped using generous whitespace rather than internal dividers.

### Input Fields
Inputs use a slightly more opaque version of the background cream or a very light glass effect. The focus state is a 2px soft sky blue glow.

### Chips & Tags
Chips are pill-shaped and use the tertiary sand color at low opacity. They should feel like soft labels that don't distract from the main content.

### Lists
List items are separated by subtle, low-contrast horizontal lines or simply by vertical spacing. Active list items should use a soft sky blue "blob" indicator or a glass background.