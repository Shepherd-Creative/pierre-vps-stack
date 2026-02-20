# Technology Stack

**Analysis Date:** 2026-02-20

## Languages

**Primary:**
- TypeScript - Both frontend projects (React)
- JavaScript - Build tooling, configuration
- Bash - Deployment scripts and Docker entrypoints
- YAML - Docker Compose and service configuration

**Secondary:**
- Python - AI/ML projects (LightRAG, Graphiti, deep-eval)
- Go - Supporting services

## Runtime

**Environment:**
- Node.js v20 (Alpine Linux in production)
- Docker/Docker Compose for container orchestration

**Package Manager:**
- npm - Node package management
- Lockfile: package-lock.json present

## Frameworks

**Frontend:**
- React 18.3.1 (personal-website) - Web framework
- Next.js 15.5.3 (chonkie-visualizer) - React framework with server-side features
- Vite 5.4.19 (personal-website) - Build tool and dev server
- React Router v6.30.1 (personal-website) - Client-side routing

**Component & Styling:**
- shadcn/ui (51 components) - Component library built on Radix UI
- Tailwind CSS 3.4+ - Utility-first CSS framework
- Radix UI - Headless component primitives
- Framer Motion 12+ - Animation library
- tsparticles - Particle animation effects

**Form & Validation:**
- react-hook-form 7.61.1 - Form state management
- Zod 3.25.76 - TypeScript-first schema validation
- HookForm Resolvers 3.10.0 - Form validation resolver

**State Management:**
- TanStack React Query 5.83.0 - Server state management (personal-website)
- React hooks (useState, useCallback) - Local state

**Testing:**
- No test framework detected in package.json (testing infrastructure absent)

**Build & Dev:**
- Vite 5.4.19 - Build tool (personal-website)
- Next.js build system (chonkie-visualizer)
- @vitejs/plugin-react-swc - SWC-based React plugin for Vite
- ESLint 8+ - Linting
- TypeScript 5+ - Type checking
- Lovable Tagger - Component tagging for Lovable IDE integration

**Utilities:**
- DOMPurify 3.3.1 - HTML sanitization
- date-fns 3.6.0 - Date manipulation
- Marked 17.0.1 - Markdown parsing
- Recharts 2.15.4 - Chart library
- Sonner 1.7.4 - Toast notifications
- Embla Carousel 8.6.0 - Carousel component
- Vaul 0.9.9 - Drawer/modal component

## Key Dependencies

**Critical:**
- React 18+ - UI framework (core dependency)
- React Router - Enables multi-page navigation (personal-website uses minimal routing: `/` and `404`)
- Radix UI - Unstyled, accessible components (basis for shadcn/ui)
- Tailwind CSS - All styling (no CSS modules or styled-components)

**Infrastructure:**
- Next.js (chonkie-visualizer) - Server-side rendering, API routes
- Vite (personal-website) - Fast build and dev server
- Docker - Container runtime for all services

## Configuration

**Environment:**
- Vite requires `VITE_` prefix for frontend environment variables
- Variables are baked into build at compile time (not runtime)
- `.env` file local-only (never committed)
- `.env.example` provides template with required variables

**Build:**
- `vite.config.ts` - Vite configuration with React plugin and path aliases
- `tsconfig.json` - TypeScript configuration with lenient settings (strict: false)
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node build tools TypeScript config
- `next.config.js` (chonkie-visualizer) - Standalone output, ignores build errors
- `eslint.config.js` (personal-website) - ESLint configuration

**Path Aliases:**
- `@/*` → `./src/*` (configured in both vite.config.ts and tsconfig.json)

## Platform Requirements

**Development:**
- Node.js 20+
- npm 10+
- Docker (for full stack with services)
- Text editor with TypeScript support

**Production:**
- Node.js 20 Alpine (Docker container)
- Nginx (reverse proxy, SSL termination, SPA routing)
- Docker Compose for orchestration
- SSL certificates managed by Certbot

## Package Sizes

**personal-website:**
- 68 dependencies
- 27 devDependencies
- Modern React stack with Vite

**chonkie-visualizer:**
- 28 dependencies
- 12 devDependencies
- Next.js-based application

---

*Stack analysis: 2026-02-20*
