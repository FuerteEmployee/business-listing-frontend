# UI Design System & Component Reference Report

This report outlines the standardized UI components and design patterns established for the **Business Listing Platform**. Use this as a reference guide to maintain consistency across all new features and modules.

---

## 🎨 1. Core Design Tokens

### **Color Palette**
The system uses a "Premium Modern" palette with dynamic opacity support via CSS variables.

| Token | CSS Variable | Hex/Value | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `--color-primary` | `#4f46e5` (Indigo) | Main actions, branding, active states. |
| **Secondary** | `--color-secondary` | `#f97316` (Orange) | Secondary highlights, warnings, conversion paths. |
| **Surface** | `bg-white` | `#ffffff` | Card and modal backgrounds. |
| **Background**| `bg-slate-50` | `#f8fafc` | Global page background. |
| **Text (Body)** | `text-slate-600` | `#475569` | Standard readability. |
| **Text (Hero)** | `text-slate-900` | `#0f172a` | Headers and high-contrast labels. |

---

## 🔘 2. Standardized Component Library

### **Buttons (`Button.jsx`)**
- **Variants**: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`. (Note: `gradient` is deprecated for primary actions).
- **Standard**: All **"Create"** or **"Launch"** actions must use the `primary` variant (Solid Indigo) for maximum clarity and professional aesthetic.
- **Corner Radius**: `rounded-2xl` (for a soft, premium feel).
- **Interaction**: Features `active:scale-95` tactile feedback.

### **Status Badges (`Badge.jsx`)**
- **Features**: Supports a "Live Dot" indicator.
- **Variants**: `success`, `warning`, `danger`, `info`, `premium`.

### **Loading Systems (`Loading.jsx`)**
- **Spinner**: `Loader2` from Lucide with `animate-spin`.
- **Skeleton**: Adaptive placeholders (Text, Circle, Card).
- **Full Page Loader**: `backdrop-blur-md` overlay for critical state transitions.

---

## 📝 3. Form & Input Patterns

### **Interactive Elements**
Standardized inputs use **Indigo focus rings** and **Slate-200 borders**.

- **Components**: `FormInput`, `FormSelect`, `FormTextarea`.
- **Focus State**: `focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500`.

---

## 🚀 4. Recommended Expansion Components

To further enhance the platform's professional feel, the following components are recommended for implementation:

### **A. Steppers / Progress Wizards**
- **Purpose**: Guide users through multi-step flows (Onboarding, Product Setup).
- **Design**: Horizontal or Vertical indicators with `Completed/Active/Pending` states.

### **B. Toggles & Switches**
- **Purpose**: Modern "On/Off" sliding controls for settings.
- **Design**: Pill-shaped indigo toggles (replaces standard checkboxes for settings).

### **C. Accordions / Expandable Cards**
- **Purpose**: Hide secondary information (FAQs, Detail Logs) until requested.
- **Design**: Smooth `max-height` transitions with chevron indicators.

### **D. Standardized Empty States**
- **Purpose**: Provide a professional look when no data is available.
- **Design**: Large icon + Title + "Call to Action" primary button.

### **E. Tooltips & Popovers**
- **Purpose**: Explain complex features on hover/click without cluttering the UI.
- **Design**: Floating cards with `backdrop-blur-sm` and high-contrast text.

### **F. Premium Data Table (UI Level)**
- **Purpose**: Promote the existing `admin/DataTable` to a global `ui/` component.
- **Features**: Server-side pagination, multi-sort, and row-selection by default.

### **G. Tag Input System**
- **Purpose**: Allow users to add/remove metadata keywords easily.
- **Design**: Inline badges within a special input field.

---

## 🧩 5. Visual Consistency Check

1. **Large Headlines**: Headers should be `font-black` and uppercase for a bold look.
2. **Generous White Space**: Use `p-8` (32px) or `space-y-12` (48px) to let content breathe.
3. **Soft Corners**: Avoid sharp corners; use `rounded-[32px]` or `rounded-[48px]` for large containers.
4. **Subtle Details**: Use `tracking-widest` and `uppercase` for small utility text/labels.

---

## 👥 6. Identity & Role Standards

To simplify the user management experience, the platform unifies business-related roles to ensure clarity and data integrity.

### **Unified Business Role: "Merchant"**
- **Definition**: A **Merchant** is the primary owner or representative of a business listing.
- **Unification**: The previously separate **"Company Owner"** and **"Merchant"** roles are now consolidated into a single **"Merchant / Owner"** identity in the UI.
- **Requirement**: Use the value `Merchant` for all backend data transactions involving these users.
- **UI Label**: Displayed as **"Merchant / Owner"** in creation forms and **"Merchants & Owners"** in filters.

---

> [!TIP]
> All core components are live-interactive on the project's **[UI Gallery](http://localhost:5173/admin/ui-gallery)**.
