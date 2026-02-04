# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

**TRH-Platform** is a Next.js 15 web application for managing blockchain rollup infrastructure (Thanos stacks, rollups, and backup systems). Built with React 19, TypeScript, Tailwind CSS, and shadcn/ui, it provides a comprehensive dashboard for blockchain operators.

## Development Commands

### Setup
```bash
npm install          # Install dependencies
```

### Running
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint (uses Next.js linter)
```

### Running Single Tests
Note: This project does not currently have a test runner configured (no Jest/Vitest). Tests should be added using the TDD workflow if implementing new features.

### Environment Setup
Create a `.env.local` file from `.env.example`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Codebase Architecture

### Feature-Based Organization

The application follows a **vertical slice/feature-based architecture** where each business domain is self-contained under `/src/features/`:

```
/src/features/
├── auth/                    # Authentication feature
├── configuration/           # Configuration management (API keys, AWS credentials, RPC URLs)
│   ├── api-keys/
│   ├── aws-credentials/
│   ├── rpc-management/
│   └── shared/
├── integrations/            # Bridges and explorers integrations
└── rollup/                  # Main rollup management (largest feature)
    ├── api/                 # TanStack Query hooks (queries.ts, mutations.ts)
    ├── components/          # Feature-specific React components
    ├── context/             # React Context (rollup creation wizard state)
    ├── hooks/               # Custom hooks (useCreateRollup, etc.)
    ├── services/            # API service functions (rollupService.ts)
    ├── schemas/             # Zod validation schemas
    └── utils/               # Utility functions
```

Each feature contains:
- **api/** - TanStack Query hooks with cache management
- **components/** - React components (may have sub-folders for complex features)
- **services/** - Functions that call the API layer
- **schemas/** - Zod validation schemas for type safety
- **hooks/** - Custom React hooks
- **context/** - React Context when needed
- **index.ts** - Barrel exports for clean imports

### Layer Architecture (Data Flow)

```
Pages (app/) → Features (components) → Hooks (api/) → Services → API Client (lib/api.ts)
```

**Example Flow:**
1. **Page** (`/src/app/rollup/page.tsx`) - Thin wrapper, uses `AuthenticatedLayout`
2. **Feature Component** (`RollupManagement.tsx`) - Uses query hooks, composes UI
3. **Query Hook** (`useRollups()` from `rollup/api/queries.ts`) - TanStack Query with caching
4. **Service** (`rollupService.ts`) - Calls API helpers
5. **API Client** (`lib/api.ts`) - Axios instance with auth, base config

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `/src/app/` | Next.js App Router pages and layouts |
| `/src/features/` | Business logic organized by domain feature |
| `/src/components/` | Shared reusable UI components (auth, layout, molecules, ui primitives) |
| `/src/providers/` | React Context providers (auth, TanStack Query, toast) |
| `/src/lib/` | Core utilities (API client, helper functions) |
| `/middleware.ts` | Route protection and authentication redirects |

## State Management

### Server State (API Data): TanStack Query
- All API data fetching, caching, and synchronization
- **Provider:** `QueryClientProvider` in `src/providers/query-provider.tsx`
- **Config:** 1 minute stale time, 10 minute cache time, 1 automatic retry
- **Query Keys:** Organized via key factories (e.g., `rollupKeys.all`, `rollupKeys.thanosStack(id)`)
- **Invalidation:** Mutations invalidate cache by key after success

Example query pattern:
```ts
export const useRollups = () => {
  return useQuery({
    queryKey: rollupKeys.all,
    queryFn: getRollups,
    staleTime: QUERY_STALE_TIME,
  });
};
```

### Global Client State: React Context
- **AuthProvider** (`src/providers/auth-provider.tsx`) - User authentication state
- **RollupCreationProvider** (`src/features/rollup/context/RollupCreationContext.tsx`) - Multi-step form state

### Local State: Component useState
- React `useState` for UI state (modals, filters, toggles)
- **React Hook Form** for complex forms with Zod validation

## API Integration Pattern

### Centralized API Client (`/src/lib/api.ts`)

Axios instance with:
- Base URL from `NEXT_PUBLIC_API_BASE_URL` environment variable
- Request interceptor: Injects JWT token from cookie
- Response interceptor: Handles 401/403 errors
- Typed helper functions: `apiGet<T>()`, `apiPost<T>()`, `apiPut<T>()`, `apiPatch<T>()`, `apiDelete<T>()`

### Service Layer Pattern

Services are located in `features/*/services/`:

```ts
// Example: src/features/rollup/services/rollupService.ts
export const getRollups = async (): Promise<Rollup[]> => {
  const response = await apiGet<GetRollupsResponse>("/stacks/thanos");
  return response.data.stacks;
};
```

### Query/Mutation Hooks Pattern

Located in `features/*/api/`:

**Queries** (`queries.ts`):
```ts
export const useRollups = () => {
  return useQuery({
    queryKey: rollupKeys.all,
    queryFn: getRollups,
    staleTime: QUERY_STALE_TIME,
  });
};
```

**Mutations** (`mutations.ts`):
```ts
export const useDeployRollupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deployRollup,
    onSuccess: () => {
      toast.success("Rollup deployed!");
      queryClient.invalidateQueries({ queryKey: rollupKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
};
```

## Component Structure

### Three-Tier Hierarchy

1. **UI Components** (`/src/components/ui/`)
   - shadcn/ui primitives: Button, Dialog, Select, Input, Card, etc.
   - Built with Radix UI + class-variance-authority
   - No business logic, fully reusable

2. **Molecule Components** (`/src/components/molecules/`)
   - Composed from UI primitives
   - Feature-agnostic, reusable
   - Examples: Sidebar, PasswordInput, SaveApiKeyDialog

3. **Feature Components** (`/src/features/*/components/`)
   - Business logic integrated
   - Feature-specific
   - Sub-folders for complex features: `detail/`, `tabs/`, `steps/`

### Component Patterns

- **Page components** use `"use client"` directive (required for hooks, context)
- Props interfaces defined inline or in separate `.tsx` files
- Export via barrel files (`index.ts`) for cleaner imports
- Icons are separate components in `/src/components/icon/`

Example import pattern:
```ts
import { RollupManagement } from "@/features/rollup/components/RollupManagement";
import { Button } from "@/components/ui/button";
```

## Styling & UI

### Framework & Tools
- **Tailwind CSS 4** with CSS variables for theming
- **shadcn/ui** component library (new-york style)
- **Class Variance Authority** for component variants
- **tailwind-merge** (`cn` utility) for conditional class merging

### Custom Branding
- Brand colors and tokens defined in `/src/app/globals.css` as CSS variables
- Dark mode support via CSS custom properties
- Animation classes via `tw-animate-css` package

### Tailwind Configuration
- Uses PostCSS integration with `@tailwindcss/postcss` v4
- No separate `tailwind.config.js` (uses PostCSS plugin config)

## Type Safety & Validation

### Zod Schemas
- All API request/response types validated with Zod
- Located in `features/*/schemas/`
- Type inference: `type MyType = z.infer<typeof mySchema>`

Example:
```ts
// src/features/auth/schemas.ts
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;
```

### Form Validation
- **React Hook Form** for form state management
- **@hookform/resolvers** integrates Zod schema validation
- Pattern: form validation through schema validation

## Authentication & Route Protection

### Middleware-Based Protection (`/middleware.ts`)
- Checks for `auth-token` cookie
- Redirects unauthenticated users to `/auth`
- Redirects authenticated users away from `/auth` page
- Protected routes: All except `/auth` and `/not-found`

### Client-Side Protection
- `AuthenticatedLayout` wrapper ensures user is logged in
- `RequireRole` component for role-based access control
- `ProtectedRoute` wrapper for component-level protection

### Authentication State
- Stored in `AuthProvider` context (`src/providers/auth-provider.tsx`)
- JWT token stored in `auth-token` cookie (HTTP-only)
- Token injected via API client request interceptor

## Error Handling & User Feedback

### Toast Notifications
- **Library:** `react-hot-toast`
- **Provider:** `ToasterProvider` in root layout
- **Pattern:** Toast feedback in mutation `onSuccess`/`onError` callbacks

Usage:
```ts
toast.loading("Processing...");
toast.success("Success!");
toast.error("An error occurred");
```

### Error Transformation
- API errors handled in response interceptor
- Error messages transformed via `handleApiError()` utility
- Mutations show user-friendly error toasts

## Multi-Step Forms (Rollup Creation)

The rollup creation wizard uses a **Context-based approach** to persist state across multiple pages:

- **Context:** `RollupCreationContext` stores form data across steps
- **Pages:** `/app/rollup/create/` splits wizard into sub-pages
- **Validation:** Each step validates using Zod schemas before advancing
- **Submission:** Final step submits complete form via mutation

Pattern location: `/src/features/rollup/context/RollupCreationContext.tsx`

## Deployment & Environment Variables

### Runtime Environment Variables
- Uses `next-runtime-env` for runtime configuration
- Variables must be prefixed with `NEXT_PUBLIC_` to be accessible in browser
- Read from environment at runtime (supports dynamic config changes)

### Required Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Git & Version Control

**Main Branch:** `main` (for creating PRs)

Commits follow conventional commit format (feature, fix, chore, etc.).

## TypeScript Configuration

- **Target:** ES2017
- **Module Resolution:** `bundler` (Next.js 15 compatible)
- **Path Alias:** `@/*` maps to `/src/*`
- **Strict Mode:** Enabled (`strict: true`)
- **Plugin:** Next.js TypeScript plugin for App Router support

## Architecture Decision: When to Add Code

### Adding a New Feature

1. **Create feature directory** under `/src/features/feature-name/`
2. **Organize by layers:** `api/`, `components/`, `services/`, `schemas/`, `hooks/`
3. **Create service** for API calls
4. **Create queries/mutations** for data fetching
5. **Create components** that use hooks
6. **Create page** in `/src/app/` that imports feature component
7. **Add route protection** in middleware if needed

### Adding a New Component

- **Reusable, no logic?** → `/src/components/ui/` or `/src/components/molecules/`
- **Feature-specific?** → `/src/features/feature-name/components/`
- **Business logic?** → Feature component, not UI component

### Adding API Endpoints

1. **Define schema** in `features/*/schemas/`
2. **Add service function** in `features/*/services/`
3. **Add query/mutation hook** in `features/*/api/queries.ts` or `mutations.ts`
4. **Use hook in component**, not the service directly

## Code Quality

### Linting
```bash
npm run lint                              # Run ESLint
```

Uses Next.js built-in ESLint configuration with `eslint` v9.

### Testing
- Project lacks Jest/Vitest configuration currently
- When implementing new features, use TDD approach
- Add test infrastructure as needed

## Useful References

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Zod Documentation](https://zod.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com)
