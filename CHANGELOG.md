# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Admin Produk page** (`/admin/produk`): Complete UX overhaul per `frontend-design` skill
  - **Container**: `contain="4xl"` → `contain="6xl"` (1152px) for comfortable workspace
  - **Search & Filter**: Real-time search (nama/jenis) + dropdown filter by jenis produk
  - **Form as Modal**: Add/Edit in centered modal with backdrop, not inline — preserves list context
  - **Jenis & Satuan**: Standardized `select` dropdowns (kemasan/cetak/stiker/label/box/tas/lainnya | pcs/pack/meter/kg/rim/lusin)
  - **Image Dropzone**: Drag-drop style with preview, file size, remove button — consistent with `/customer/pesan`
  - **ProductCard Redesign**: Sample-card style (no hover lift), gold selection ring, consistent with `/customer/pesan`
  - **Grid**: Responsive `sm:2`, `lg:3`, `xl:4` columns
  - **Empty State**: Illustrated with actionable CTA, contextual messaging for filtered results
  - **Inputs**: Consistent `px-4 py-3 text-base` sizing, cyan focus rings
  - **Tokens**: `ink`/`paper`/`cream`/`gold`/`cyan`/`magenta` — no generic grays
  - **Typography**: Geist scale, no ALL-CAPS, mono for prices
- **Admin Order Detail page** (`/admin/orders/[id]`): Redesigned per `frontend-design` skill — admin print order management
  - **Container**: `contain="3xl"` → `contain="6xl"` (1152px) for comfortable admin workspace
  - **Layout**: Semantic sections, two-column grids (progress+cost, manage+status) on desktop
  - **Order header**: Clean meta bar with order ID (mono), status badge, total (cyan), delete action
  - **Progres produksi**: Gold progress bar + visual timeline with connector lines, numbered stages, icons (✓/●/○), inline status text
  - **Ringkasan biaya**: Clean `dl` with estimasi vs aktual, mono prices, admin disclaimer
  - **Kelola progres**: Unified form with tahap select, keterangan, "Tandai berjalan/selesai" buttons, tracking manual input
  - **Status order**: Pill buttons with ink active state, auto-tracking on change
  - **Riwayat tracking**: Clean timeline with gold first-marker, connector line, no ALL-CAPS
  - **Desain custom**: Article cards with hover, inline spec/price, design preview integrated
  - **Tahap usang**: Inline warning card with cleanup action
  - **Tokens**: `ink`/`paper`/`cream`/`gold`/`cyan`/`magenta` — no generic grays
  - **Typography**: Geist scale (`2xl`/`lg`/`base`/`sm`), Geist Mono for prices/IDs, no ALL-CAPS eyebrows
  - **Restraint**: Gold only on progress bar & key actions; borders only semantic; no decorative blobs
  - **Logic fix**: "Tandai selesai" now updates existing "berjalan" record instead of creating duplicate
- **Customer Order Detail page** (`/customer/orders/[id]`): Redesigned per `frontend-design` skill — print-studio order tracking
  - **Container**: `contain="3xl"` → `contain="6xl"` (1152px) for comfortable detail view
  - **Layout**: Semantic sections with `space-y-6`; two-column grid (progress + cost) on desktop
  - **Order header**: Clean meta bar with order ID (mono), status badge, total (cyan), cancel action
  - **Progres produksi**: Gold progress bar + visual timeline with connector lines, numbered stages, icons (✓/●/○), status text
  - **Ringkasan biaya**: Split estimasi awal vs total aktual; diff highlight (naik/hemat); mono prices; admin disclaimer
  - **Riwayat tracking**: Clean timeline with gold first-marker, no ALL-CAPS, relative time, descriptions
  - **Item pesanan**: Article cards with hover, thumbnail-ready, spec inline, design preview integrated
  - **Tokens**: `ink`/`paper`/`cream`/`gold`/`cyan`/`magenta` — no generic grays
  - **Typography**: Geist scale (`2xl`/`lg`/`base`/`sm`), Geist Mono for prices/IDs, no ALL-CAPS eyebrows
  - **Restraint**: Gold only on progress bar & key numbers; borders only semantic; no decorative blobs
- **Customer Pesan page**: Redesigned per `frontend-design` skill — intentional, print-studio aesthetic
  - **Design tokens**: `ink`/`paper`/`cream`/`gold`/`cyan`/`magenta` — no generic grays
  - **Typography**: Geist variable, deliberate scale (`text-3xl`/`2xl`/`xl`), Geist Mono for prices/specs, no ALL-CAPS eyebrows
  - **Layout**: Single-column form with sticky quote aside (desktop); product sample cards (`sm:2`, `lg:3`) with gold selection ring, no hover lift
  - **Product selection**: Sample-card vernacular — thumbnail, name, price in mono; gold ring = selected, no shadow
  - **Form sections**: Semantic `<section>` + `<h3>` with print icons (FileText, Upload); labels in sentence case
  - **Dropzone**: "Siap cetak" CTA, drag-area, live preview, file size, remove button, print-ready language
  - **Quote card (sticky)**: Gold-accented border, cream surface, table-like `dl`, mono prices, "Total final dikonfirmasi admin"
  - **Empty state**: Illustrated with Package icon, actionable microcopy
  - **Linkage status**: Color-coded cards (magenta/green) with icons, clear hierarchy
  - **Microcopy**: Active, specific — "Kirim pesanan", "Siap cetak", "Spesifikasi", "Ringkasan harga"
  - **Restraint**: One memorable element (gold ring + sticky quote), no decorative blobs/gradients, borders only for semantic separation
- **Unauthorized page**: Enhanced UX with diagnostic info, fallback navigation, and help link
  - Added current user role display for clarity
  - Added `BackLink` to return to previous page (using `document.referrer`)
  - Added "Hubungi admin" link for users needing access
  - Converted page to client component to access auth context
- **UI Components**: Extended `BackLink` to accept optional `className` prop for flexible styling
- **Login & Register pages**: Improved accessibility, visual consistency, and desktop UX
  - Unified eyebrow styling to neutral `text-moon-ink` (removed confusing color variance)
  - Refactored form fields: label + input separated with `htmlFor`/`id` for full clickable area
  - Added auto-focus on email input on mount
  - Register: added `SuccessBox` feedback before redirect
  - Register: added visible password hint ("Minimal 6 karakter")
  - Desktop optimizations: responsive card padding (`md:p-6`), increased form gap (`md:gap-5`), larger heading (`md:text-3xl`), base body text (`md:text-base`), repositioned background blur decorations for better centering on wide screens
- **Container widths**: Standardized public page containers from `max-w-md` (448px) to `max-w-lg` (512px) for better desktop readability
- **Card component**: Added responsive padding (`p-5 md:p-6`) as default, removed manual `md:p-8` overrides
- **DashboardShell topbar**: Unified height to `h-16` (64px) matching Navbar for consistent header rhythm
- **Form field spacing**: Standardized grid gaps to `gap-4 sm:gap-5` across all forms (EstimasiForm, admin/produk, admin/orders, customer/pesan, customer/estimasi, admin/owner dashboards)
- **Typography scale**: Unified responsive heading sizes across pages
  - Page titles (h1): `text-2xl md:text-3xl`
  - Section titles (h2): `text-lg` / `text-xl sm:text-2xl`
  - Eyebrow text: `text-xs` consistently
  - Body text: `text-sm md:text-base`
  - DashboardHero, PageHeader, DashboardShell, SectionHead, and all page headings updated
- **Card grid spacing**: Standardized skeleton and content grids to `gap-4 sm:gap-5` for consistent vertical rhythm
- **Focus/Accessibility**: Verified consistent `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-blue` pattern across all interactive elements; `prefers-reduced-motion` respected in globals.css

### Fixed
- **DashboardHero JSX**: Fixed malformed JSX structure (missing opening `<div>`, extra closing `</div>`)
- **Unauthorized page loading state**: Fixed container width inconsistency (`max-w-md` → `max-w-lg`)

### Improved
- **Mobile UX**: Global CSS ensures `font-size: 16px` on inputs/selects/textareas ≤639px to prevent iOS Safari auto-zoom
- **Visual hierarchy**: Consistent brand color usage (moon-yellow, moon-blue, moon-pink, moon-ink) with proper contrast ratios
- **Responsive design**: All pages now have proper `sm:`, `md:`, `lg:` breakpoints for tablet and desktop