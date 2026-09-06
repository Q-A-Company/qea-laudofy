# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Corretores (real estate brokers) of a single real estate agency (imobiliária)
in Rio de Janeiro (Barra da Tijuca / Recreio dos Bandeirantes region), plus
one admin (agency manager). ~15 total users. Brokers register properties and
photograph them in the field on their phones as often as at a desk — mobile
use is routine, not an edge case. The admin manages broker accounts and can
see/manage every property; brokers see/manage only their own.

## Product Purpose

Q&A Laudofy replaces a paper/manual-Word workflow the agency already uses
(a real physical intake form, "Ficha de Imóvel") with a digital tool that:
generates the same laudo document automatically from a structured form
(preserving the original document's exact layout/formatting), organizes
property photos by room/environment with AI-assisted classification the
broker reviews and corrects, and optionally drafts a marketing description
from the property's characteristics (never from technical/factual fields).
Success = a broker can register a property, upload its photos, and walk
away with a correctly organized, ready-to-send laudo in minutes instead of
manually filling and formatting a Word document by hand.

## Positioning

Not a generic real-estate CRM or listing site — an internal production tool
built around one agency's actual paper form, mapped field-for-field, so the
generated laudo is indistinguishable in structure from what the agency
already sends today. The AI does classification/drafting assistance only;
every factual field (address, size, price, owner) comes only from what the
broker typed, never from generative AI.

## Operating Context

- Brokers fill a multi-step form covering: location/type, logistics &
  owner contact, physical characteristics, commercial terms/pricing,
  amenities, and a free-text + optional AI-assisted marketing description.
- CEP (Brazilian postal code) auto-fills address/neighborhood via ViaCEP.
- Monetary fields need real currency input (reais + centavos), not bare
  numbers.
- Photos are uploaded in bulk (a whole property shoot at once, from a
  phone in the field), queued for async AI classification against a fixed,
  admin-configurable taxonomy of ~28 room/environment types, then reviewed
  by the broker: bulk-accept suggestions, per-photo dropdown override (or
  free-typed custom room name), drag-to-reorder within a room, low-
  confidence photos flagged for priority review. Photos are numbered
  continuously across the whole property ("1 - Sala", "2 - Sala",
  "3 - Fachada"), never restarting per room.
- The generated laudo is a .docx (source of truth) and, when available,
  a converted PDF; broker chooses which to download. A special rule: when
  a property is also for rent, the laudo's "Motivo da venda" field must
  show a red/bold "LOCAÇÃO: (R$ valor) + Taxas" line before the broker's
  own text.
- Rooms captured include agency-specific categories beyond generic
  real-estate taxonomy (e.g. distinguishing Suíte Master vs a regular
  Suíte's own bathroom/closet, "Hall 2º Pavimento" for duplex/triplex
  units) — these came directly from how this agency actually shoots and
  organizes property photos, not a generic template.

## Capabilities and Constraints

- Two roles only: `admin` (sees/manages every property, creates broker
  accounts) and `corretor` (sees/manages only their own properties). No
  self-serve signup; admin creates accounts.
- Single-tenant today (one agency) but the data model keeps an
  organization id so a future multi-agency version would not need a
  destructive migration — that future is not being built now.
- AI usage is deliberately split and labeled: a vision classifier suggests
  a room per photo (broker always confirms/can override); a text
  generator drafts an optional marketing blurb from non-identifying
  characteristics only. Neither ever writes a factual/technical field.
- Backend AI providers are pluggable (mock ⇄ real Claude) behind one
  interface; which is active is an environment/ops concern, invisible to
  the UI beyond loading/pending states.

## Brand Commitments

Product name: **Q&A Laudofy**, the second internal tool built under the
**Q&A Company** house brand (their existing admin tool "Q&A Clientes" is
the closest sibling: dark/near-black background, a periwinkle-blue accent
for actions and active nav state, dense sidebar-nav operator layout,
understated status pills). The visual reference for that house style was
a screenshot of the Q&A Clientes admin panel, provided directly by the
user — treat it as binding brand evidence for the redesign, not as a
feature spec to copy (that panel is an unrelated multi-tenant billing
admin; Q&A Laudofy's own screens/flows are unrelated to it). User's
explicit brief for the redesign: professional, not "looking AI-generated",
following the black+blue house style.

## Evidence on Hand

- The real intake form this product replaces:
  `LAUDO DIGITAL 2025.docx` (repo root) — the literal document being
  digitized; the generated laudo must preserve its structure exactly.
- Brand reference: a screenshot of the existing "Q&A Clientes" admin
  panel (dark theme, blue accent), supplied by the user in conversation
  (not saved as a repo asset).
- No logo file, product screenshots, or marketing copy exist yet for
  Q&A Laudofy itself.

## Product Principles

1. Factual data only ever comes from what the broker typed — AI assists
   classification and drafting, never invents or edits technical fields.
2. Mobile-field use is a primary scenario, not a secondary breakpoint —
   the broker is often standing in the property, one-handed, on a phone.
3. The generated document's fidelity to the real paper form is
   non-negotiable; visual/UX changes to the app itself must never touch
   the laudo template's own layout logic.
4. Small, known user base (~15 people, two roles) — favor clarity and a
   dense, operator-grade interface over consumer-app hand-holding.
5. New surfaces inherit the Q&A Company house visual language rather than
   inventing a separate identity per internal tool.

## Accessibility & Inclusion

No specific standard was mandated. Given routine one-handed mobile field
use in variable outdoor lighting, treat comfortable touch targets and
strong text/background contrast as load-bearing for this product, not
optional polish.
