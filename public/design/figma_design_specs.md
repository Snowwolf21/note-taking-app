# Figma Design System & UI Specification: Note-Taking App

This document outlines the complete Figma design specifications, color tokens, typography scales, component states, keyboard accessibility shortcuts, and layout guidelines for the Note-Taking Web Application.

---

## 🎨 Color Palette & Themes

### 1. Dark Theme (Default)
- **Background Main**: `#0F172A` (Slate 900)
- **Panel Surface**: `#1E293B` (Slate 800)
- **Card Background**: `#334155` (Slate 700)
- **Primary Accent**: `#06B6D4` (Cyan 500) / `#38BDF8` (Sky 400)
- **Secondary Accent**: `#8B5CF6` (Violet 500)
- **Text Main**: `#F8FAFC` (Slate 50)
- **Text Muted**: `#94A3B8` (Slate 400)
- **Border / Divider**: `#334155` (Slate 700)
- **Focus Outline**: `#38BDF8` (2px solid)

### 2. Light Theme
- **Background Main**: `#F8FAFC` (Slate 50)
- **Panel Surface**: `#FFFFFF` (Pure White)
- **Card Background**: `#F1F5F9` (Slate 100)
- **Primary Accent**: `#0284C7` (Sky 600)
- **Secondary Accent**: `#7C3AED` (Violet 600)
- **Text Main**: `#0F172A` (Slate 900)
- **Text Muted**: `#64748B` (Slate 500)
- **Border / Divider**: `#E2E8F0` (Slate 200)

### 3. Sepia Theme
- **Background Main**: `#FBF7EE`
- **Panel Surface**: `#F4EFE6`
- **Card Background**: `#EBE3D5`
- **Primary Accent**: `#C2410C` (Warm Amber)
- **Text Main**: `#431407`

### 4. Slate Theme
- **Background Main**: `#181E29`
- **Panel Surface**: `#242D3D`
- **Primary Accent**: `#3B82F6` (Royal Blue)
- **Text Main**: `#E2E8F0`

---

## 🔤 Typography Tokens

### Font Families
1. **Sans-serif (Default)**: `Inter`, system-ui, -apple-system, sans-serif
2. **Serif**: `Lora`, Georgia, serif
3. **Monospace**: `Fira Code`, monospace

### Typography Scale
- **Display / H1**: 24px (1.5rem) | Bold | Line-height: 1.25
- **Section Heading / H2**: 20px (1.25rem) | SemiBold | Line-height: 1.3
- **Subheading / H3**: 16px (1rem) | Medium | Line-height: 1.4
- **Body Text**: 14px (0.875rem) | Regular | Line-height: 1.5
- **Small / Metadata**: 12px (0.75rem) | Regular | Line-height: 1.4

---

## ⌨️ Accessibility & Keyboard Navigation Specs

- **Focus Ring**: High-contrast 2px outline with `2px` offset (`ring-2 ring-cyan-500 ring-offset-2`).
- **Keyboard Shortcuts**:
  - `Cmd / Ctrl + N`: Create new note
  - `Cmd / Ctrl + S`: Save active note
  - `/`: Focus search input
  - `Esc`: Close open modal / dialog
  - `Tab / Shift+Tab`: Sequential item traversal
  - `Enter / Space`: Activate focused element
- **Form Validation**: `aria-invalid="true"`, `aria-describedby="[error-id]"` for screen readers.

---

## 📱 Responsive Layout Grids

- **Desktop (>= 1024px)**: 3-column split view
  - Sidebar: 240px fixed
  - Note List: 320px fixed
  - Note Editor: Flex 1 (fluid)
- **Tablet (768px - 1023px)**: 2-column split view with collapsible sidebar toggle drawer
- **Mobile (< 768px)**: Single container view with tabbed navigation and drawer menu
