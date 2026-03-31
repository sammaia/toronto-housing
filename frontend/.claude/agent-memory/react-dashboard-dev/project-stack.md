---
name: project-stack
description: Stack, installed packages, path aliases, Tailwind config, and key build settings
type: project
---

React 19 + TypeScript 5.9 + Vite 8 + Tailwind CSS v4 + shadcn/ui (manual installs) + Recharts 3 + react-router-dom 7 + axios.

**Path alias:** `@/` maps to `./src/`

**Tailwind v4 note:** Uses `@import "tailwindcss"` and `@theme {}` block in index.css (NOT tailwind.config.js). Dark theme is default on `:root`. Light theme on `.light` class.

**shadcn/ui:** Components are manually written (not CLI-installed). Only `button.tsx` existed initially. Added: card, input, label, separator, avatar, dropdown-menu, tabs, badge, select. All Radix UI primitives are present in node_modules.

**Strict TS:** `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` all enabled. Lucide icon components need `style?: React.CSSProperties` in their prop type when passed style props.

**Why:** Backend is at http://localhost:3001/api/v1.
