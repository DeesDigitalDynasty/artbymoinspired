# Mo — Curated Digital & Physical Art Exhibition Portfolio

An airy, museum-grade digital art exhibition and portfolio for **Mo**, designed to showcase digital and physical artworks through an overlapping CSS Grid masonry layout, inline editable studio metadata, and automatic Google Drive folder synchronization.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions incorporate your confirmed preferences from our initial design review:

- **Confirmed Decision 1 — Google Drive Folder Sync**: The gallery will include a dedicated Google Drive Folder Sync integration using Google OAuth (`drive.readonly`). You can enter or paste any Google Drive Folder ID (or folder link) to automatically pull image files from that folder into the masonry exhibition alongside curated initial artworks.
- **Confirmed Decision 2 — Toggleable Studio Edit Mode**: A quiet **Studio Mode** toggle lets you edit each artwork's **Title, Medium, Art Style, Paint Used, Dimensions, Collection (Digital / Physical), and Curatorial Note** directly on the gallery cards or in the detail view, saving all updates automatically to browser `localStorage`.
- **Confirmed Decision 3 — Minimalist Contact & Direct Email Copy**: The Contact section features a serene, spacious message form paired with a one-click **Copy Studio Email** trigger and instant visual confirmation.

---

## 1. Overview & Core Concept

- **What It Does**: Presents Mo's artistic practice as a calm, spacious digital exhibition. Visitors can explore curated collections of **Digital Art** and **Physical Artworks**, inspect high-resolution pieces in an unobstructed detail lightbox, read collapsible curatorial notes, and reach out for commissions. Mo can toggle **Studio Mode** to customize every artwork's technical specifications or sync new pieces directly from a Google Drive folder.
- **Target Audience / Persona**: Art collectors, gallery curators, commission clients, and creative collaborators browsing on desktop, tablet, and mobile devices.
- **Key Value**: Combines the architectural clarity of an editorial monograph (inspired by your reference template) with an airy, comforting design language where the artwork remains the undisputed focal point.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Landing & Hero Experience**:
   - Visitors arrive at a spacious architectural grid header and split-column hero featuring your uploaded portrait (`/assets/aistudio/2ba826c1-8cd9-45ab-a0d9-2a8a369bb882_25d7b7d9.jpg`) paired with refined editorial typography, a concise introduction to Mo, and a smooth-scroll trigger to the exhibition.
2. **Overlapping CSS Grid Masonry Gallery**:
   - Visitors filter effortlessly between **All Works**, **Physical Artworks**, and **Digital Art**.
   - Artworks are arranged in an intentional, overlapping CSS Grid masonry layout with generous negative space (`24px–32px` minimum padding and structural gaps).
   - Each gallery piece includes a dedicated specification plaque displaying **Medium · Art Style · Paint Used · Dimensions** in clean, unboxed typography.
3. **Studio Edit Mode & Google Drive Sync**:
   - Toggling **Studio Mode** reveals inline editable controls on each artwork plaque (allowing instant edits to medium, art style, paint used, dimensions, and collection) plus a **Google Drive Folder Sync** drawer where the user can sign in with Google, input a Drive Folder ID, and sync artworks directly into the exhibition.
4. **Artwork Detail Lightbox**:
   - Clicking any artwork opens an airy, high-resolution modal view featuring zoom inspection, full technical metadata (`Medium`, `Art Style`, `Paint Used`, `Dimensions`, `Year`), an expandable curatorial note disclosure to keep visual clutter low, and next/previous keyboard and touch navigation.
5. **About ("My Story") & Contact**:
   - Structured after the editorial reference layout with **Evolution** and **Approach** narrative columns (using clean expandable disclosures for deeper reading) followed by a serene Contact section with a minimalist inquiry form and one-click email copy.

### Visual Identity & Theme
- **Aesthetic Direction**: Spacious, calming, gallery-grade minimalism with soft geometry (`20px–24px` border radius on cards, buttons, and inputs) and generous negative space (`24px–32px` minimum container padding and margins).
- **Color Palette & Mood (60-30-10 Discipline)**:
  - **60% Dominant Neutral Canvas**: Warm Alabaster / Soft Cream (`#F7F5F0`) for primary background surfaces and Pure Gallery Ivory (`#FCFBF9`) for elevated cards.
  - **30% Structural Surfaces & Typography**: Deep Slate (`#1E2423`) for primary headings and prose, Muted Sage Slate (`#5A6561`) for metadata captions, and delicate Sage Hairlines (`#E2E7E3`) for architectural grid divisions.
  - **10% Calming Accent Budget**: Soft Sage (`#7D9486`) and Muted Teal (`#3E5C5E`) for interactive focus states, active filter tabs, and primary actions.
- **Typography & Hierarchy**:
  - **Display & Headings**: `Cormorant Garamond` (expressive, high-contrast editorial serif for gallery titles and section headers) paired with `Plus Jakarta Sans` (clean geometric sans-serif for navigation and body readability).
  - **Technical Specifications & Dimensions**: `JetBrains Mono` (`tabular-nums`) for precise artwork dimensions and catalog indices.
- **Interactive Feedback & Motion**:
  - Subtle, fluid transitions using Framer Motion (`motion/react`) restricted to compositor-friendly `opacity` and `transform` properties (`cubic-bezier(0.16, 1, 0.3, 1)`), gentle hover scale on artworks, and smooth layout transitions when switching collection filters.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Overlapping CSS Grid Masonry with Responsive Fallback**
  - *Chosen Approach*: Use a 12-column CSS Grid on desktop and tablet with intentional row/column spans and subtle vertical/horizontal offsets (`translate` / grid row overlaps) that collapses cleanly into a spacious single-column flow on mobile viewports.
  - *Why*: Preserves the bespoke editorial look of overlapping gallery frames on large screens while guaranteeing zero horizontal overflow or cramped cards on mobile devices.
- **Decision 2: Local Persistence + Live Google Drive Folder Sync**
  - *Chosen Approach*: Seed the portfolio with a curated collection of artworks stored in `localStorage`, and merge synced files from the user-specified Google Drive Folder ID via the Google Drive v3 REST API (`https://www.googleapis.com/drive/v3/files`). Any inline metadata edits made in Studio Mode are persisted locally by artwork ID.
  - *Why*: Ensures the portfolio loads instantaneously for every visitor while giving Mo frictionless control over images and technical labels without needing a complex backend CMS.
- **Decision 3: Progressive Disclosure for Long Text**
  - *Chosen Approach*: Keep visible card labels ultra-concise (icons, tooltips, and 1-line specification plaques) and wrap longer curatorial descriptions or biography essays inside smooth expandable accordions and scrollable detail cards.
  - *Why*: Reduces visual text density by ~70% so the artwork commands full attention.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Mo Portfolio Application                          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Top Bar Navigation (3-Zone Contract)                              │  │
│  │ [MO.]  ────  [Works · About · Contact · Studio Mode]  ──── [Sync] │  │
│  └───────────────┬───────────────────────────────────┬───────────────┘  │
│                  │                                   │                  │
│                  ▼                                   ▼                  │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │ Architectural Hero Section    │   │ Google Drive Sync Drawer      │  │
│  │ • Portrait Asset (2ba826c1…)  │   │ • Firebase Google OAuth       │  │
│  │ • Editorial Intro & Story     │   │ • Folder ID Input & Auto-Sync │  │
│  │ • Quick Scroll to Collection  │   │ • Drive v3 Image Fetcher      │  │
│  └───────────────┬───────────────┘   └───────────────┬───────────────┘  │
│                  │                                   │                  │
│                  └─────────────────┬─────────────────┘                  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Portfolio State & Persistence Layer (localStorage + Drive Merge)  │  │
│  └───────────────┬───────────────────────────────────┬───────────────┘  │
│                  │                                   │                  │
│                  ▼                                   ▼                  │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │ Overlapping Masonry Gallery   │   │ Artwork Detail Lightbox Modal │  │
│  │ • Filter: All / Digital / Phys│   │ • High-Res Image & Zoom       │  │
│  │ • CSS Grid Overlap Layout     │   │ • Full Spec Plaque & Edit     │  │
│  │ • Inline Editable Spec Plaque │   │ • Accordion Curatorial Notes  │  │
│  │   (Medium, Style, Paint, Dim) │   │ • Prev / Next Navigation      │  │
│  └───────────────┬───────────────┘   └───────────────────────────────┘  │
│                  │                                                      │
│                  ▼                                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Editorial About ("Who Am I") & Minimalist Contact Section         │  │
│  │ • Evolution & Approach Collapsible Cards                          │  │
│  │ • Minimalist Commission Form + One-Click Direct Email Copy        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **`ArtworkItem`**:
  - `id`: Unique identifier (local seed ID or Google Drive file ID)
  - `title`: Artwork title
  - `category`: `'physical' | 'digital'`
  - `imageUrl`: Local asset path or Google Drive content/thumbnail URL
  - `medium`: e.g., `"Mixed Media on Linen"`, `"Digital Painting"`
  - `artStyle`: e.g., `"Contemporary Figurative"`, `"Neo-Expressionism"`
  - `paintUsed`: e.g., `"Heavy-Body Acrylic & Oil Pastel"`, `"Procreate Custom Impasto Brushes"`
  - `dimensions`: e.g., `"120 × 90 cm"`, `"4000 × 5000 px"`
  - `year`: Creation year
  - `description`: Brief curatorial description (collapsible in UI)
  - `gridSpan`: Layout preset controlling the overlapping CSS Grid placement (`'tall' | 'wide' | 'featured' | 'offset'`)

### Interactive Component & State Mapping
- **Collection Filter Controls**: Switching between *All Works*, *Physical Artworks*, and *Digital Art* animates the masonry grid using Framer Motion `AnimatePresence` and layout transitions.
- **Inline Studio Editor**: When `isStudioMode` is active, clicking any field on an artwork's specification plaque (`medium`, `artStyle`, `paintUsed`, `dimensions`, `title`, or `category`) allows immediate inline editing with automatic `localStorage` persistence and a Reset-to-Default option.
- **Google Drive Folder Sync**: Uses Firebase Auth with `GoogleAuthProvider` (`https://www.googleapis.com/auth/drive.readonly`) and in-memory access token caching to query `https://www.googleapis.com/drive/v3/files?q='<folderId>'+in+parents+and+mimeType+contains+'image/'`, automatically mapping Drive images into editable `ArtworkItem` entries.
- **Minimalist Contact Form**: Validates visitor name, email, and message, triggers a calm confirmation state upon submission, and provides a one-click email copy button with a transient toast notification.
