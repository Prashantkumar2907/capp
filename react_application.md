# Modern React Application Architecture & Best Practices

> This document is a comprehensive guide for building scalable, maintainable React applications.
> Use it as a reference when building new React projects to replicate proven architecture patterns, styling systems, animation practices, and reusable component patterns.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Build & Configuration](#3-build--configuration)
4. [File Structure & Conventions](#4-file-structure--conventions)
5. [Styling System](#5-styling-system)
6. [Routing](#6-routing)
7. [State Management](#7-state-management)
8. [API Layer](#8-api-layer)
9. [Component Architecture](#9-component-architecture)
10. [Animation Patterns](#10-animation-patterns)
11. [Form Handling](#11-form-handling)
12. [Authentication & Security](#12-authentication--security)
13. [Key Application Patterns](#13-key-application-patterns)
14. [Responsive Design System](#14-responsive-design-system)
15. [Reusable Components Reference](#15-reusable-components-reference)

---

## 1. Project Overview

| Aspect           | Detail                                                                  |
|------------------|-------------------------------------------------------------------------|
| **Framework**    | React 19+ (with StrictMode)                                             |
| **Build Tool**   | Vite 7+ with `@vitejs/plugin-react`                                     |
| **Language**      | TypeScript 5.7+ (strict mode, ES2022 target, bundler moduleResolution)  |
| **Deployment**    | Cloud-ready (Vercel, AWS, Docker, etc.)                                 |
| **Architecture**  | Modular domain-driven design with clear separation of concerns           |

---

## 2. Tech Stack & Dependencies

### Core

| Package             | Version | Purpose                  |
|---------------------|---------|--------------------------|
| `react` / `react-dom` | 19.2   | Core UI framework        |
| `typescript`          | 5.7    | Type safety              |
| `vite`                | 7.1    | Build & dev server       |

### UI Component Libraries

| Library                    | Purpose                                                  |
|----------------------------|----------------------------------------------------------|
| **Radix UI** (`radix-ui`)   | Headless primitives: Dialog, Tooltip, Select, Popover, Accordion |
| **Base UI** (`@base-ui/react`) | Additional headless components                          |
| **React Aria Components**   | Accessible date pickers, calendar, date fields           |
| **shadcn/ui** (new-york style) | Pre-built components generated into `@/components/addons/` |
| **Lucide React**            | Primary icon set for shadcn components                   |
| **@iconify/react**          | Secondary icon set (Material Symbols, Hugeicons, Fluent, etc.) |

### State Management & Routing

| Library               | Purpose                                           |
|-----------------------|---------------------------------------------------|
| **Redux Toolkit** ^2.10 | Global state management                          |
| **React-Redux** ^9.2    | React bindings for Redux                         |
| **redux-persist** ^6.0   | Selective persistence (sessionStorage + localStorage) |
| **TanStack Router** ^1.132 | File-based routing with auto code-splitting    |

### Data Fetching

| Library                    | Purpose                            |
|----------------------------|------------------------------------|
| **TanStack React Query** ^5.90 | Server state, caching, mutations |
| **Axios** ^1.13               | HTTP client with interceptors     |

### Tables & Forms

| Library                     | Purpose                          |
|-----------------------------|----------------------------------|
| **TanStack React Table** ^8.21 | Headless table with custom CSS |
| **React Hook Form** ^7.66     | Form state management          |
| **Zod** ^4.1                   | Schema validation              |
| **@hookform/resolvers** ^5.2   | Zod → RHF bridge              |

### Styling & Animation

| Library                        | Purpose                              |
|--------------------------------|--------------------------------------|
| **Tailwind CSS** ^4.0           | CSS-native utility-first styling     |
| **tailwind-merge** + **clsx**   | Class merging & conditional classes  |
| **class-variance-authority** (CVA) | Component variant system          |
| **tw-animate-css**              | Animation utility classes            |
| **Motion** ^12.34 (Framer Motion) | Declarative animations             |

### Date/Time

| Library                    | Purpose                            |
|----------------------------|------------------------------------|
| **date-fns** ^4.1           | Date formatting & manipulation    |
| **@internationalized/date**  | Calendar support (React Aria)    |
| **react-day-picker** ^9.11   | Calendar picker component        |

### Other Key Packages

| Package                          | Purpose                           |
|----------------------------------|-----------------------------------|
| `crypto-js`                      | Encryption utilities              |
| `driver.js`                      | Guided product tours              |
| `react-google-recaptcha-v3`      | Login protection                  |
| `react-markdown` + `remark-gfm`  | Markdown rendering (chatbot)     |
| `react-phone-number-input`       | International phone input         |
| `react-speech-recognition`       | Voice-to-text for scribe module   |
| `tinycolor2`                     | Color manipulation                |
| `@lottiefiles/dotlottie-react`   | Loading animations                |
| `web-vitals`                     | Performance reporting             |

### Testing

| Library                     | Purpose                |
|-----------------------------|------------------------|
| **Vitest** ^3.0              | Test runner            |
| **@testing-library/react**   | Component testing      |
| **jsdom**                    | DOM environment        |

---

## 3. Build & Configuration

### Vite Config (`vite.config.ts`)

```ts
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 11 named chunks for optimal loading
          'markdown-bundle': ['react-markdown', 'remark-gfm', ...],
          tanstack: ['@tanstack/react-query', '@tanstack/react-table', ...],
          'phone-utils': ['react-phone-number-input', 'libphonenumber-js'],
          'date-libs': ['date-fns', '@internationalized/date', ...],
          'react-aria': ['react-aria-components'],
          'ui-kit': ['radix-ui', '@base-ui/react', 'lucide-react'],
          motion: ['motion'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
          lottie: ['@lottiefiles/dotlottie-react'],
          crypto: ['crypto-js'],
          tour: ['driver.js'],
        },
      },
    },
  },
})
```

### TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### ESLint (`eslint.config.js`)

- Flat config format extending `@tanstack/eslint-config`
- Includes `@tanstack/eslint-plugin-query` for React Query best practices

### Prettier (`prettier.config.js`)

- No semicolons, single quotes, trailing commas everywhere

---

## 4. File Structure & Conventions

### Directory Layout

```
src/
├── api/                    # Domain-organized API layer
│   ├── apiClient.ts        # Shared axios instance
│   ├── module1/            # Feature/domain 1
│   │   ├── types.ts
│   │   ├── services.ts
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   └── queryKeys.ts
│   ├── module2/            # Feature/domain 2
│   ├── module3/            # Feature/domain 3
│   └── auth/               # Authentication API
│       ├── types.ts
│       ├── services.ts
│       └── mutations.ts
├── components/
│   ├── addons/             # shadcn/ui base components (generated)
│   ├── Common/             # Shared reusable components
│   │   ├── Buttons/        # ActionBtn, IconButton, etc.
│   │   ├── Inputs/         # TextInput, Select, DatePicker, etc.
│   │   ├── Icons/          # Icon components
│   │   ├── Layout/         # Layout utilities
│   │   ├── Modals/         # Modal components
│   │   ├── Notification/   # Toast, banner components
│   │   ├── Pagination/     # Pagination utilities
│   │   ├── Tables/         # Table components
│   │   ├── Loading/        # Skeleton loaders, spinners
│   │   └── ...             # Other shared components
│   ├── Feature1/           # Feature-specific components
│   │   ├── Feature1Page.tsx
│   │   ├── Feature1Form.tsx
│   │   └── ...
│   ├── Feature2/           # Feature-specific components
│   ├── Forms/              # Standalone form components
│   └── Pages/              # Page-level components
├── config/                 # App configuration
│   ├── routeConfig.ts
│   ├── uiConfig.ts
│   ├── theme.ts            # Theme configuration
│   └── index.ts
├── constants/              # Static values
├── data/                   # Mock data files
├── hooks/                  # Custom React hooks
│   ├── useApi.ts           # Generic API hook
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── useWindowSize.ts
│   ├── usePrevious.ts
│   └── ...
├── lib/
│   └── utils.ts            # cn() utility (twMerge + clsx)
├── providers/
│   ├── AppProvider.tsx
│   └── ThemeProvider.tsx
├── redux/
│   ├── store.ts            # Store configuration
│   ├── hooks.ts            # Typed hooks
│   ├── features/           # Domain slices
│   │   ├── auth/
│   │   ├── ui/
│   │   ├── module1/
│   │   ├── module2/
│   │   └── ...
│   └── utils/              # Redux utilities
├── routes/                 # TanStack Router file-based routes
│   ├── __root.tsx
│   ├── index.tsx
│   ├── auth/
│   ├── dashboard/
│   └── ...
├── services/               # Business logic services
├── types/                  # TypeScript types per domain
├── utils/                  # Utility functions
│   ├── api.utils.ts
│   ├── string.utils.ts
│   ├── date.utils.ts
│   ├── validation.utils.ts
│   └── ...
├── workers/                # Web Workers (optional)
├── main.tsx                # App entry point
├── styles.css              # Tailwind v4 CSS + theme
└── routeTree.gen.ts        # Auto-generated route tree
```

### Naming Conventions

| Type               | Convention                      | Example                        |
|--------------------|---------------------------------|--------------------------------|
| Components         | PascalCase                      | `ActionBtn.tsx`, `HomeLayout.tsx` |
| Hooks              | camelCase with `use` prefix     | `useGhostMode.ts`              |
| Redux slices       | camelCase with `Slice` suffix   | `authSlice.ts`                  |
| API services       | camelCase with `Service` concept | `eligibilityService`           |
| Types              | PascalCase interfaces           | `PatientPaymentRecord`          |
| Type files         | `.types.ts` suffix              | `paymentPostings.types.ts`      |
| Constants          | SCREAMING_SNAKE_CASE            | `PAYMENTS_LIST_MOCK_DATA`       |
| Config files       | camelCase                       | `inactivityConfig.ts`           |

---

## 5. Styling System

### Tailwind CSS v4 (CSS-native)

No `tailwind.config.js` — everything configured in `src/styles.css` via `@theme` blocks:

```css
@import 'tailwindcss';
@plugin 'tw-animate-css';

@theme {
  /* Font Families */
  --font-sans: 'Outfit', ui-sans-serif, system-ui, sans-serif;
  --font-numbers: 'Space Mono', monospace;
  --font-mono: source-code-pro, Menlo, Monaco, Consolas, monospace;

  /* Brand Colors */
  --color-brand-primary: #34b6b3;
  --color-brand-primary-dark: #0da0b8;

  /* Semantic Text Colors */
  --color-text-primary: #1a2f3c;
  --color-text-secondary: #596d7b;
  --color-text-tertiary: #9ca3af;
  --color-text-inverse: #ffffff;

  /* Background Tokens */
  --color-background-app: #ffffff;
  --color-background-secondary: #f9fafb;
  --color-background-tertiary: #f3f4f6;

  /* Status Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Extended Breakpoints */
  --breakpoint-3xl: 120rem;  /* 1920px */
  --breakpoint-4xl: 160rem;  /* 2560px */

  /* Reduced Base Font Scale (optimized for data-dense UI) */
  --text-xs: 0.625rem;       /* ~10px */
  --text-sm: 0.75rem;        /* ~12px */
  --text-base: 0.875rem;     /* ~14px */
  --text-lg: 1rem;           /* ~16px */
  --text-xl: 1.125rem;       /* ~18px */
  --text-2xl: 1.25rem;       /* ~20px */
}
```

### shadcn/ui Theme (oklch color system)

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0.004 285.823);
  --primary: oklch(0.205 0.042 265.755);
  --secondary: oklch(0.97 0.001 286.375);
  --muted: oklch(0.97 0.001 286.375);
  --accent: oklch(0.97 0.001 286.375);
  --destructive: oklch(0.577 0.245 27.325);
  /* ... dark mode variants too */
}
```

### `cn()` Utility Pattern (`src/lib/utils.ts`)

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Custom CSS Systems

```css
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

/* Ghost Mode — PII blur */
.ghost-mode [data-pii] { filter: blur(4px); user-select: none; }
.ghost-mode [class*="patient"], .ghost-mode [id*="member-id"] { filter: blur(4px); }

/* Custom Animations */
@keyframes shine { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes sparkle { 0%,100% { transform: scale(1) rotate(0deg); opacity: 0.7; } 50% { transform: scale(1.2) rotate(10deg); opacity: 1; } }

/* Table Design System */
.table-wrapper { @apply w-full; }
.th { @apply px-3 py-2 text-xs font-semibold text-gray-500 uppercase; }
.td { @apply px-3 py-2.5 text-sm text-gray-900; }
```

---

## 6. Routing

### TanStack Router (File-Based)

- Auto-generated route tree via `@tanstack/router-plugin/vite`
- Auto code-splitting enabled
- Route tree generated into `src/routeTree.gen.ts`

### Router Config (`src/main.tsx`)

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,       // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})
```

### Route Structure

```
/                              → Landing/login page
/auth/login                    → Login
/auth/signup                   → Sign up
/auth/forgot-password          → Password reset

/dashboard                     → Main dashboard (auth-guarded)
  /dashboard/overview          → Dashboard overview
  /dashboard/analytics         → Analytics
  /dashboard/settings          → Settings

/app                           → authenticated app shell
  /app/feature1                → Feature 1
  /app/feature1/details/:id    → Feature 1 details
  /app/feature2                → Feature 2
  /app/feature2/form           → Feature 2 form
  /app/profile                 → User profile
  /app/help                    → Help/documentation

/public/:id                    → Public pages (no auth required)
/404                           → Not found
/error                         → Error page
```

### Auth Guards

```ts
// /app route — beforeLoad hook
beforeLoad: ({ context }) => {
  if (!isAuthenticated) throw redirect({ to: '/auth/login' })
  if (!user) throw redirect({ to: '/auth/signup' })
}

// Public routes — no guards needed
// @ route (index) — auto-redirect based on auth status
```

---

## 7. State Management

### Redux Toolkit Store (`src/redux/store.ts`)

**Typical slices** organized by domain:

| Slice         | Persisted? | Storage        | Purpose                                  |
|---------------|------------|----------------|------------------------------------------|
| `auth`        | Yes        | sessionStorage | Tokens, userId, isAuthenticated          |
| `user`        | Yes        | sessionStorage | User profile, preferences                |
| `ui`          | No         | —              | Global UI state (modals, sidebars, etc.) |
| `theme`       | Yes        | localStorage   | Dark/light mode, color scheme            |
| `module1`     | No         | —              | Feature module 1 state                   |
| `module2`     | No         | —              | Feature module 2 state                   |
| `notifications` | No       | —              | Toast/alert notifications               |
| `filters`     | Yes        | localStorage   | Persisted filter preferences             |

**Add more slices as needed per feature module.**

### Reset Mechanism

```ts
// Selective reset — reset only specified slices
dispatch(resetState(['module1', 'module2']))

// Full purge — clear state + persisted storage (with exceptions)
purgeAndReset({ except: ['theme', 'preferences'] })
```

### Typed Hooks (`src/redux/hooks.ts`)

```ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

---

## 8. API Layer

### Axios Setup (`src/api/apiClient.ts`)

```ts
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Response interceptor:
// - 401 / "Token expired" → purgeAndReset() + redirect to /?session=expired
// - Attaches friendlyMessage for all HTTP errors (400-504)
// - Offline detection: pings /favicon.ico to check connectivity
```

### Service Pattern

Each API domain has consistent structure:

```
api/domainName/
├── types.ts       # Request/Response types
├── services.ts    # Service object with API methods
├── queries.ts     # React Query hooks (useXxx)
├── mutations.ts   # Mutation hooks (useXxxMutation)
└── queryKeys.ts   # (optional) Structured query key builders
```

### Service Method Pattern

```ts
// services.ts
export const eligibilityService = {
  getAppointments: async (params: AppointmentParams, token: string) => {
    const formData = new FormData()
    formData.append('customer', params.customer)
    formData.append('userId', params.userId)
    // ...
    const { data } = await axiosInstance.post('/api/v1/endpoint', formData, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    })
    return data
  },
}
```

### Query Hook Pattern

```ts
// queries.ts
export const useAppointments = (globalSearch?: string) => {
  const token = useAppSelector(selectAccessToken)
  const authUserId = useAppSelector((state) => state.auth.userId)
  const selectedCustomer = useAppSelector((state) => state.customer.selectedCustomer)

  return useQuery({
    queryKey: ['domain', 'resource', authUserId, selectedCustomer?.id, ...],
    queryFn: async () => {
      const response = await service.getResource(params, token as string)
      return response
    },
    enabled: !!token && !!authUserId && !!selectedCustomer,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
```

### Mutation Hook Pattern

```ts
// mutations.ts
export const useUpdateResource = (callbacks?: {
  onMutate?: () => void
  onSuccess?: (data: Response) => void
  onError?: (error: unknown) => void
}) => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Payload) => {
      return await service.updateResource(payload, token as string)
    },
    onMutate: () => {
      dispatch(showToast({ type: 'loading', title: 'Saving...', persist: true }))
      callbacks?.onMutate?.()
    },
    onSuccess: (data) => {
      dispatch(hideToast())
      dispatch(showToast({ type: 'success', title: 'Saved' }))
      queryClient.invalidateQueries({ queryKey: ['domain', 'resource'] })
      callbacks?.onSuccess?.(data)
    },
    onError: (error) => {
      dispatch(hideToast())
      dispatch(showToast({ type: 'error', title: 'Failed', body: error.message }))
      callbacks?.onError?.(error)
    },
  })
}
```

---

## 9. Component Architecture

### Reusable Components

#### Buttons (`components/Common/Buttons/`)

**ActionBtn** — Icon + label button:
```tsx
<ActionBtn
  icon="lucide:user"
  label="Invite"
  onClick={handler}
  className="bg-white hover:bg-gray-100"
  disabled={false}
/>
```

**IconButton** — Icon-only button (compact):
```tsx
<IconButton
  icon="lucide:edit"
  onClick={handler}
  variant="ghost"
  size="sm"
/>
```

**PrimaryButton** — Main action button

**SecondaryButton** — Secondary action button

**DangerButton** — Destructive action button

#### Inputs (`components/Common/Inputs/`)

- **SearchInput** — Debounced search with loading indicator
- **TextInput** — Standard text input with label and feedback
- **SelectInput** — Dropdown select with label
- **ComboboxSelectInput** — Searchable dropdown (shadcn Combobox)
- **DatePicker** / **DateRangePicker** — Date selection
- **PhoneNumberInput** — International phone with country code
- **DualRangeSlider** — Double-handle range slider

#### shadcn/ui Base (`components/addons/`)

**Button** — CVA-based with variants:
```tsx
// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default (h-9), sm (h-8), lg (h-10), icon (size-9)
<Button variant="outline" size="sm">Click me</Button>
```

Also includes: Dialog, Input, Textarea, Select, Tooltip, Accordion, Popover, Table, Calendar, Combobox, RadioGroup, Slider, Switch, Label, Pagination, DateField

### Layout System (`components/Layout/`)

```tsx
// Typical authenticated app shell
<AppLayout>
  <Header />                        {/* Top navigation */}
  <Sidebar />                       {/* Side navigation */}
  <NotificationBanner />            {/* Global notifications */}
  <InactivityWarning />             {/* Auto-logout warning (optional) */}
  <Modal id="global-modal" />       {/* Global overlay modal */}
  <TooltipProvider>
    <Outlet />                      {/* Route content */}
  </TooltipProvider>
  <Footer />                        {/* Footer (optional) */}
</AppLayout>
```

**Module-specific layouts:**
```tsx
// Feature-specific layout wrapping that feature's pages
<Feature1Layout>
  <Feature1Header />
  <Feature1Sidebar />
  <Outlet />
</Feature1Layout>
```

### Page Component Pattern

```tsx
// Typical page structure
const PaymentPostingsPage = () => {
  // 1. Redux selectors
  const dispatch = useAppDispatch()
  const data = useAppSelector(state => state.payments.xxx)

  // 2. React Query hooks
  const { data, isLoading } = usePaymentsList(...)
  const { mutate } = useUpdatePayment()

  // 3. Local state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 4. Effects
  useEffect(() => { ... }, [deps])

  // 5. Handlers
  const handleAction = () => { ... }

  // 6. Render
  return (
    <div className="relative w-full min-w-0 h-full flex flex-col">
      <header>...</header>
      <main className="relative flex-1 min-h-0">
        <AnimatePresence>
          {isModalOpen && <Modal />}
        </AnimatePresence>
        {/* Content */}
      </main>
    </div>
  )
}
```

---

## 10. Animation Patterns

### Motion (Framer Motion) Usage

Import from `motion/react`:

```tsx
import { motion, AnimatePresence } from 'motion/react'
```

### Panel Slide-in

```tsx
<AnimatePresence>
  {isPanelOpen && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Panel content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Fade In/Out

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
```

### Toast Slide-down

```tsx
<motion.div
  initial={{ opacity: 0, y: -16 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -16 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
/>
```

### Menu Scale-in from Origin

```tsx
<motion.aside
  initial={{ opacity: 0, scale: 0, x: -16, y: -12 }}
  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
  exit={{ opacity: 0, scale: 0, x: -16, y: -12 }}
  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
  style={{ transformOrigin: 'top left' }}
/>
```

### Layout Animation (Width Change)

```tsx
<motion.div
  layout
  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  style={{ width: isExpanded ? 440 : '100%' }}
/>
```

### CSS Animations

```css
@keyframes shine {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
  50% { transform: scale(1.2) rotate(10deg); opacity: 1; }
}
```

---

## 11. Form Handling

### React Hook Form + Zod Pattern

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => { ... }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput {...register('name')} error={errors.name?.message} />
      <TextInput {...register('email')} error={errors.email?.message} />
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Voice Input Hook

```tsx
const { isListening, startListening, stopListening, transcript } = useVoiceRecording()
// Uses react-speech-recognition with continuous mode, en-IN locale
```

---

## 12. Authentication & Security

### Auth Flow

1. **Login**: credentials (email/password, OAuth, etc.) + optional security (reCAPTCHA, 2FA)
2. Server returns `accessToken`, `refreshToken`, `userId`, user profile
3. Redux `setCredentials` stores tokens in sessionStorage
4. Activity tracking initialized (if needed)

### Token Refresh (Web Worker Pattern - Optional)

For long-running applications, use a Web Worker to refresh tokens in the background:

```
┌──────────────────────┐          ┌────────────────────────┐
│   Main Thread         │          │   Web Worker            │
│   useTokenRefresh()   │ ◄──────► │   tokenRefreshWorker   │
│                       │ postMsg  │   setInterval(refresh)  │
│   Dispatches to Redux │ ◄─────── │   Every (timeout-60s)   │
└──────────────────────┘          └────────────────────────┘
```

- Worker runs a `setInterval` in dedicated thread
- Sends message to main thread at scheduled intervals
- Main thread posts request to `/api/refresh` and updates Redux
- Useful for keeping sessions alive without user interaction

### Session Expiry

- Axios interceptor catches 401 / "Token expired" errors
- Calls `purgeAndReset()` to clear state + persisted storage
- Redirects to `/auth/login?reason=session-expired` or similar

### Security Best Practices

- Never store tokens in localStorage (use sessionStorage or memory)
- Sanitize sensitive data in console (password, tokens, keys)
- Use HTTPS for all API calls
- Implement CSRF protection if required
- Validate user input server-side

---

## 13. Key Application Patterns

### Data Masking/Privacy Mode (Optional)

For applications handling sensitive data, implement a privacy toggle:

```css
.privacy-mode [data-sensitive] { filter: blur(4px); user-select: none; }
.privacy-mode [class*="email"], .privacy-mode [id*="phone"] { filter: blur(4px); }
```

JS-level masking example:

```tsx
const { isPrivacyMode, maskData } = usePrivacyToggle()
// maskData('john@email.com', 'email') → 'j███@████.com'
// maskData('123-45-6789', 'ssn') → '███-██-6789'
```

### Toast/Notification System

```tsx
// Show loading notification
dispatch(showNotification({
  type: 'loading',    // 'success' | 'error' | 'loading' | 'info'
  title: 'Saving...',
  message: 'Please wait',
  persist: true,      // Don't auto-dismiss
}))

// Update with success
dispatch(hideNotification())
dispatch(showNotification({ type: 'success', title: 'Saved!', message: 'Data updated.' }))
```

### User Activity Tracking (Optional)

For applications requiring session management:

```tsx
// useActivityTracker() — listens to mousedown, keydown, scroll, touchstart
// Debounced → dispatches lastActivityTimestamp

// useInactivityMonitor() — polls periodically
// If inactive > threshold → show warning modal with countdown
// If countdown reaches 0 → auto-logout
```

### Feature Tours (Optional)

Using driver.js or similar:

```tsx
const { startTour, skipTour } = useFeatureTour({
  tourId: 'onboarding',
  steps: [
    { element: '#header', popover: { title: 'Welcome', description: '...' } },
    { element: '#sidebar', popover: { title: 'Navigation', description: '...' } },
  ],
  config: { allowClose: true, showProgress: true },
})
```

### Network Status Monitoring (Optional)

For offline-capable applications:

```tsx
const { isOnline, connectionSpeed } = useNetworkStatus()
// Ping-based detection (not just navigator.onLine)
// Show OfflineBanner when disconnected
```

### Theme Switching

```tsx
const { theme, setTheme } = useTheme()
// 'light' | 'dark' | 'system'
// Persists to localStorage
// Updates CSS variables and DOM attributes
```

---

## 14. Responsive Design System

### 7-Tier Breakpoint System

| Breakpoint | Width    | Use Case              |
|------------|----------|-----------------------|
| Default    | < 640px  | Mobile base styles    |
| `sm`       | 640px    | Small tablets         |
| `md`       | 768px    | Tablets               |
| `lg`       | 1024px   | Small desktops        |
| `xl`       | 1280px   | Standard desktops     |
| `2xl`      | 1536px   | Large desktops        |
| **`3xl`**  | **1920px** | Full HD monitors    |
| **`4xl`**  | **2560px** | 4K / Ultra-wide     |

### Text Scaling Pattern

```tsx
// Nearly all text uses 5-7 tier responsive sizes
className="text-xs lg:text-sm xl:text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl"

// Compact variant
className="text-[10px] xl:text-[11.5px] 3xl:text-[13.5px] 4xl:text-[15.5px]"
```

### Spacing Pattern

```tsx
// Padding/margins increase at 3xl/4xl
className="px-3 lg:px-4 xl:px-5 2xl:px-5 3xl:px-6 4xl:px-7"
className="py-2 3xl:py-2.5 4xl:py-3"
```

### Icon Sizing Pattern

```tsx
className="w-5 h-5 sm:w-5 md:w-6 lg:w-6 xl:w-7 2xl:w-7 3xl:w-8 4xl:w-9"
```

### Table Cell Clamp

```css
.td { font-size: clamp(0.7rem, 0.367rem + 0.521vw, 1.2rem); }
```

---

## 15. Reusable Components Reference

### Quick Copy-Paste Patterns

#### Skeleton Loading

```tsx
<div className="animate-pulse">
  <div className="h-6 bg-gray-200 rounded w-1/2" />
  <div className="h-4 bg-gray-100 rounded w-full mt-2" />
  <div className="h-4 bg-gray-100 rounded w-5/6 mt-2" />
</div>
```

#### Status Badge

```tsx
<span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">
  <Icon icon="lucide:check" className="h-3.5 w-3.5" />
  Active
</span>
```

#### Card with Accent

```tsx
<div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
  <div className="flex items-center gap-2">
    <Icon icon="lucide:activity" className="w-4 h-4 text-brand-primary" />
    <h3 className="text-sm font-semibold text-slate-700">Title</h3>
  </div>
  <p className="mt-1 text-xs text-slate-500">Description</p>
</div>
```

#### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-10 text-slate-400">
  <Icon icon="lucide:search-x" className="w-8 h-8 mb-2" />
  <p className="text-sm font-medium">No results found</p>
  <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
</div>
```

#### Button with Tooltip

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
      <Icon icon="lucide:edit" className="w-[55%] h-[55%]" />
    </button>
  </TooltipTrigger>
  <TooltipContent side="left" className="dark px-2 py-1 text-sm">
    Edit
  </TooltipContent>
</Tooltip>
```

#### Rounded Tab System

```tsx
<button
  onClick={() => setActiveTab(tab.key)}
  className={cn(
    'text-left rounded-xl border transition-all duration-200 px-4 py-1',
    tab.bgColor,
    isActive
      ? `ring-2 ${tab.ringColor} border-transparent shadow-md`
      : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5',
  )}
>
  <Icon icon={tab.icon} className={cn('w-4 h-4', tab.color)} />
  <span className={cn('text-sm font-semibold', tab.softText)}>{tab.label}</span>
  <span className={cn('text-xs', tab.color)}>{count}</span>
</button>
```

#### Rounded Pill Button

```tsx
<button className="px-4 py-2.5 text-sm font-semibold rounded-full border border-amber-400 text-amber-800 bg-amber-100 ring-2 ring-amber-200/70 shadow-xs hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Apply
</button>
```

---

## Additional Resources

- **Vite Docs**: https://vitejs.dev/
- **React Docs**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/
- **TanStack Router**: https://tanstack.com/router/
- **TanStack Query**: https://tanstack.com/query/
- **Redux Toolkit**: https://redux-toolkit.js.org/
- **shadcn/ui**: https://ui.shadcn.com/
- **Motion (Framer Motion)**: https://motion.dev/

---

> This document provides architectural guidance and best practices for building scalable React applications. Adapt patterns to your project's specific needs.
