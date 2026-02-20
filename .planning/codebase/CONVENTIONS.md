# Coding Conventions

**Analysis Date:** 2026-02-20

## Naming Patterns

**Files:**
- PascalCase for React components: `ChatWidget.tsx`, `AboutSection.tsx`, `Navigation.tsx`
- camelCase for hooks: `useChatbot.ts`, `useScrollPosition.ts`, `useSuggestedQuestions.ts`
- camelCase for utilities and types: `utils.ts`, `chunkVisualization.ts`
- kebab-case for UI component files in `@/components/ui/`: `accordion.tsx`, `slider.tsx`, `dropdown-menu.tsx`
- No suffix like "Component" or "Hook" - rely on directory placement (`/hooks/`, `/components/`)

**Functions:**
- camelCase for all functions, including React components which are PascalCase as component names
- Callback handlers use `handle` prefix: `handleSubmit`, `handleScroll`, `handleChunk`
- Custom hooks follow `use` prefix convention: `useChatbot`, `useScrollPosition`
- Utility functions descriptive: `getChunkColor()`, `getRandomGreeting()`, `scrollToRelevantSection()`

**Variables:**
- camelCase for all variables and constants
- Constants in ALL_CAPS only when they're true compile-time constants: `GREETING_MESSAGES`, `ALL_QUESTIONS`, `DISPLAY_COUNT`
- State variables follow convention: `isLoading`, `hasTransitioned`, `isHeroVisible`
- Refs end with `Ref`: `scrollContainerRef`, `lastUserMessageRef`, `sessionIdRef`

**Types:**
- PascalCase for interfaces and types: `Message`, `ChunkConfig`, `ChunkResponse`, `ConfigPanelProps`
- No `I` prefix for interfaces (modern TypeScript convention)
- Export types when shared between files: `export interface ChunkConfig`, `export type ClassValue`

## Code Style

**Formatting:**
- No explicit Prettier config found in personal-website; ESLint is the primary tool
- Code appears formatted consistently with standard React practices
- 2-space indentation observed in JSX and component code
- Single quotes for strings: `'use client'`, `'TokenChunker'`
- JSX attributes use camelCase: `onConfigChange`, `onSendMessage`, `isHeroVisible`

**Linting:**
- Tool: ESLint 9.32.0 with TypeScript support
- Config: `eslint.config.js` (flat config format)
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins:
  - `eslint-plugin-react-hooks` for hook rules
  - `eslint-plugin-react-refresh` for React Fast Refresh
- Key Rules Enforced:
  - React hooks recommended rules enabled
  - `react-refresh/only-export-components`: warn for non-component exports
  - `@typescript-eslint/no-unused-vars`: OFF (intentionally disabled in config)

**TypeScript Configuration:**
- `strict: false` - Lenient type checking by default
- `noImplicitAny: false` - Allows implicit any types
- `noUnusedLocals: false` - Doesn't enforce unused variable cleanup
- `noUnusedParameters: false` - Allows unused parameters
- `strictNullChecks: false` - Nullable types not enforced
- Target: ES2020
- Module resolution: bundler

## Import Organization

**Order:**
1. React and external library imports first
2. Third-party UI/component libraries (`@radix-ui/*`, `lucide-react`)
3. Application-specific hooks and utilities (`@/hooks/`, `@/lib/`, `@/components/`)
4. Type imports at top or grouped with their usage

**Examples:**
```typescript
// personal-website ChatWidget.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Send, Bot, User, Maximize2, Search, Sparkles } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import LoadingStatus from "./LoadingStatus";
import IntroGreetingMessage from "./IntroGreetingMessage";

// chonkie-visualizer ChunkVisualizer.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChunkConfig, ChunkResponse } from '@/types/chonkie';
```

**Path Aliases:**
- `@/` maps to `./src/` (configured in tsconfig.json)
- Used throughout for clean imports: `@/components/ui/card`, `@/hooks/useChatbot`, `@/lib/utils`

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (fetch, API calls)
- Error messages logged to console: `console.error("Chat error:", error)`
- User-facing error messages set in state: `setError('Please enter some text...')`
- Graceful fallbacks provided to users, not raw error exposure

**Example from `useChatbot.ts`:**
```typescript
try {
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ... }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();
  // Handle response...
} catch (error) {
  console.error("Chat error:", error);
  const errorMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: "Sorry, I'm having trouble connecting right now...",
  };
  setMessages((prev) => [...prev, errorMessage]);
} finally {
  setIsLoading(false);
}
```

**Validation:**
- Input validation before processing: `if (!content.trim()) return;`
- Length validation: `if (text.length > 50000) { setError(...) }`
- Null checks before operations: `element?.scrollIntoView()`

## Logging

**Framework:** console (no structured logging library)

**Patterns:**
- `console.error()` for errors: `console.error("Chat error:", error)`
- No debug logging observed in production code
- Error logging includes context string prefix: `"Chat error:"`, `"[specific context]"`
- Silent failure is acceptable for non-critical operations (scroll, visual effects)

## Comments

**When to Comment:**
- Function-level comments rare; code is self-documenting via naming
- Complex algorithms get comments explaining the "why": e.g., Fisher-Yates shuffle in `useSuggestedQuestions.ts`
- State management comments explain non-obvious behavior: `// Only scroll to relevant section if explicitly enabled`

**JSDoc/TSDoc:**
- Minimal use observed
- When present, focuses on parameters and return:
```typescript
/**
 * Get the color classes for a chunk card (background, dark mode, and border)
 */
export function getChunkColor(index: number): string
```

## Function Design

**Size:**
- Most functions under 50 lines
- Complex components (e.g., `ChatWidget.tsx`, `ChunkVisualizer.tsx`) break logic into smaller hooks and helpers
- Hooks like `useChatbot` contain inline async/fetch logic with clear separation

**Parameters:**
- Use destructuring for object parameters, especially props
- Props interfaces explicitly typed: `interface ChatWidgetProps { ... }`
- Optional parameters use defaults: `useScrollPosition(threshold: number = 100)`
- Generic types used for reusable logic: `shuffleArray<T>(array: T[])`

**Return Values:**
- Hooks return objects with named properties: `{ messages, inputValue, setInputValue, sendMessage, isLoading }`
- Components always return JSX
- Utility functions return single values or objects with clear shape

## Module Design

**Exports:**
- Named exports for functions and types: `export const useChatbot = () => {...}`
- Default exports for components: `export default AboutSection;`
- Barrel files observed in `ui/` components but not elsewhere

**Directory Structure Guides Module Design:**
- `hooks/` contains custom React hooks only
- `components/` contains React components (pages and reusable)
- `lib/` contains pure utilities and helper functions
- `types/` (in chonkie) contains shared type definitions
- `constants/` contains configuration values and options

**Interdependencies:**
- Components import from `@/hooks/` and `@/lib/` freely
- Hooks only import from `react`, external libraries, and `@/lib/`
- No circular dependencies observed
- Types are shared via dedicated type files

## Styling Conventions

**Tailwind CSS:**
- Primary styling mechanism across all projects
- No CSS modules or CSS-in-JS (styled-components absent)
- Utility-first approach: `className="py-24 relative"`, `"text-3xl md:text-4xl font-bold"`
- Responsive breakpoints: `md:` prefix for medium and up
- Custom classes via Tailwind config (e.g., `glass-card`, `gradient-text` observed in personal-website)
- Dark mode supported: `dark:bg-blue-900/40`, `dark:text-foreground`

**shadcn/ui:**
- Extensive use of pre-built components from `@/components/ui/`
- All components follow Tailwind + Radix UI pattern
- Do NOT recreate UI components - import from library

---

*Convention analysis: 2026-02-20*
