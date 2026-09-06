# Design

<!-- impeccable:design-schema 1 -->

## World

Operator-grade dark UI inherited from the Q&A Company house style (the
existing "Q&A Clientes" panel), extended for Q&A Laudofy's own surfaces.
Near-black ground, raised panels distinguished by a 1px border seam (never
a shadow), one periwinkle-indigo accent carrying every interactive and
active state. Dense, quiet, built for a small trusted operator audience
doing a repeated real task — not a marketing surface.

Reference evidence: a screenshot of Q&A Clientes (dark/near-black,
indigo-blue accent, sidebar-nav operator layout), supplied directly by the
user as binding brand evidence. No concept-generation round was run — the
direction was pinned by that evidence plus the explicit brief ("preto com
azul", "padrões da empresa"), not selected from open exploration.

## Tokens

Defined in `apps/web/src/index.css` under `@theme` (Tailwind v4 — every
token below is also a generated utility, e.g. `--color-accent-500` ⇒
`bg-accent-500` / `text-accent-500` / `border-accent-500`).

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0a0a0f` | Page ground |
| `--color-bg-inset` | `#050507` | Recessed surfaces: inputs, sidebar, code-like areas |
| `--color-surface` | `#131318` | Cards/panels |
| `--color-surface-raised` | `#191920` | One step up from surface: nested rows, photo cards |
| `--color-surface-hover` | `#1e1e26` | Hover state for surface/raised elements |
| `--color-border` | `#26262f` | Default 1px seam |
| `--color-border-strong` | `#35353f` | Hover/focus border |
| `--color-text` | `#f4f4f6` | Primary text |
| `--color-text-muted` | `#9c9ca8` | Secondary text (7.3:1 on `--color-bg`) |
| `--color-text-faint` | `#7d7d8c` | Placeholder/caption text (4.9:1 on `--color-bg` — contrast-checked; do not darken) |
| `--color-accent-50…700` | `#eef0fe … #4d47bd` | Indigo-periwinkle accent scale; `500` is the primary interactive color, `300` for text-on-dark accent emphasis |
| `--color-success` / `-soft` | `#4ade9a` / 12% tint | Positive status (Ativo, confidence ok) |
| `--color-warning` / `-soft` | `#f5a35c` / 12% tint | Attention (low-confidence photo, Vendido/Alugado status) |
| `--color-danger` / `-soft` | `#f0685f` / 12% tint | Errors |

Font: self-hosted Inter (`@fontsource/inter`, weights 400/500/600/700),
UI density — body text 14–15px, no display face (this is Operate mode;
the brand carries in exact color/spacing/component discipline, not a
distinctive headline font). Radii: `rounded-lg` (8px) inputs/buttons,
`rounded-xl` (12px) cards. Depth comes from the border seam + one-step
surface lightening, never `box-shadow`.

## Components (`apps/web/src/components/ui.tsx`)

- `Button` (`buttonClasses` export for non-`<button>` elements like
  `Link`) — variants `primary` (accent fill), `secondary` (surface +
  border), `ghost`, `danger`; sizes `sm`/`md`; `loading` state.
- `Card` — surface + border + `rounded-xl`.
- `PageHeader` — title/description/actions row, used at the top of every
  screen inside `AppShell`.
- `Badge` — tones `neutral`/`accent`/`success`/`warning`/`danger`, soft-tint
  background + saturated text, used for property/photo/role status.
- `EmptyState`, `Spinner`.

Form fields (`apps/web/src/components/form/fields.tsx`): `TextField`,
`NumberField`, `TextAreaField`, `SelectField` (custom chevron, native
`<select>`), `CheckboxField`/`CheckboxGroupField`/`RecordCheckboxField`
(native checkbox, themed via `accent-accent-500` rather than a rebuilt
control), `PhoneField` (live international formatting), `CurrencyField`
(masked BRL input, `R$` prefix inside the field). All wizard steps and the
admin user form share these — restyling this one file re-themes the whole
form surface area.

## Layout

`AppShell` (`apps/web/src/components/AppShell.tsx`): fixed 264px left
sidebar (brand mark, nav, user card with avatar-initial + role + sign-out)
on `md+`; collapses to a top bar with a full-screen slide-over nav below
`md`. Every authenticated screen renders inside it except `Login`, which is
a centered card on its own (no task to orient inside yet).

`PropertyForm`'s 6-step wizard uses a horizontal numbered-circle stepper
(done = filled accent + check, active = accent outline, upcoming = muted
outline) above a single `Card` holding the active step's fields.

## Patterns

- Status always renders as a `Badge`, never a colored dot or bare word.
- Every async action (`Button loading`) disables and shows a spinner
  in-place rather than a page-level overlay.
- Low-confidence photos in the review grid get an amber card border +
  warning `Badge`, not a separate alert banner — the flag lives on the
  object it describes.
- The AI-generated marketing description (in the wizard's last step, and
  read-only on the property detail page when set) always renders inside an
  accent-tinted card with a `Sparkles` icon and an explicit "gerada por
  IA — opcional" label; this is the one deliberate departure from the
  otherwise-neutral palette, reserved for marking AI-authored content so it
  is never mistaken for a factual field.
- Icons are `lucide-react` throughout, one stroke width (2, 2.25 for
  buttons/emphasis), never emoji or unicode glyphs.

## Open / deferred

- No dedicated empty/error illustration set — `EmptyState` uses a single
  lucide icon at low opacity; acceptable at this density, revisit if the
  product grows more first-run surfaces.
- Mobile sidebar is a full-screen overlay, not a persistent bottom nav;
  fine for the current 2-destination nav (Imóveis / Corretores), reconsider
  if nav grows.
- No automated visual regression / screenshot review ran this pass (no
  browser-screenshot tool available in this environment) — verified via
  TypeScript build, production `vite build`, and the mechanical detector
  (`detect.mjs`, zero findings). Visual confirmation in a real browser is
  still the user's own next step, consistent with how this project has
  been tested throughout.
