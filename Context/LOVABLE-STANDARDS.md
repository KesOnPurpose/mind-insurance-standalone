# Lovable.dev Development Standards

**Last Updated**: November 2025
**Lovable Version**: v2 (September 2025+)
**Purpose**: Ensure all code maintains full compatibility with Lovable.dev hosting and conventions

---

## Core Tech Stack (REQUIRED)

### Frontend Framework
- **React 18** - Functional components with hooks only (NO class components)
- **TypeScript** - Strict mode enabled, fully typed props and state
- **Vite** - Build tool with hot module reloading
- **Tailwind CSS v3+** - Utility-first CSS framework
- **ShadCN UI** - Copy-paste component system built on Radix UI primitives

### Backend/Database
- **Supabase** (PostgreSQL-based)
  - Project URL: `https://hpyodaugrkctagkrfofj.supabase.co`
  - Row Level Security (RLS) for data isolation
  - Real-time subscriptions
  - Authentication system
  - File storage
  - Edge Functions

---

## Project Structure (STRICT)

```
project-root/
├── index.html                 # Vite entry point (REQUIRED at root)
├── src/
│   ├── main.tsx              # App bootstrap
│   ├── App.tsx               # Root component with routing
│   ├── index.css             # Global styles (Tailwind directives)
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # ShadCN components (DO NOT MODIFY)
│   │   └── [feature]/       # Feature-specific components
│   ├── pages/               # Page-level components
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React Context providers
│   ├── services/            # API/external service calls
│   ├── utils/               # Utility functions and helpers
│   ├── types/               # TypeScript type definitions
│   ├── lib/                 # Third-party library configurations
│   └── assets/              # Static assets (images, fonts)
├── public/                  # Static public files
├── supabase/
│   └── migrations/          # Database schema migrations
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── components.json          # ShadCN UI configuration
├── package.json             # Dependencies
├── .env.example             # Environment template
└── .env.local               # Local environment (git ignored)
```

---

## TypeScript Configuration (ENFORCE)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Critical Rules:**
- `strict: true` is NON-NEGOTIABLE
- Always use `@/` path aliases for imports
- No `any` types without explicit justification

---

## Component Patterns (STANDARD)

### Functional Component Template
```typescript
// 1. Imports (organized)
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

// 2. Type definitions
interface ComponentProps {
  title: string;
  userId: string;
  onSubmit?: (data: FormData) => void;
  className?: string;
}

// 3. Component definition (named export preferred)
export const MyComponent = ({ title, userId, onSubmit, className }: ComponentProps) => {
  // 4. Hooks (always at top)
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<User | null>(null);
  const { user } = useAuth();

  // 5. Effects
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // API call
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // 6. Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic here
  };

  // 7. Conditional rendering helpers (if complex)
  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // 8. Main JSX return
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form content */}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
```

### Custom Hook Template
```typescript
// src/hooks/useCustomHook.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseCustomHookOptions {
  initialValue?: string;
  autoFetch?: boolean;
}

interface UseCustomHookReturn {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useCustomHook = (options: UseCustomHookOptions = {}): UseCustomHookReturn => {
  const { initialValue = '', autoFetch = true } = options;
  const [data, setData] = useState<string | null>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch logic
      const result = await supabase.from('table').select('*');
      setData(result.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch]);

  return { data, isLoading, error, refetch: fetchData };
};
```

---

## Styling Conventions (TAILWIND ONLY)

### DO:
```tsx
// Tailwind utilities
<div className="flex flex-col items-center justify-between p-4 space-y-2">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Title</h1>
  <Button className="w-full md:w-auto">Click me</Button>
</div>
```

### DON'T:
```tsx
// NO custom CSS files
import './MyComponent.css'; // AVOID

// NO inline styles
<div style={{ padding: '16px' }}> // AVOID

// NO CSS-in-JS libraries
const StyledDiv = styled.div`...`; // AVOID
```

### Responsive Design (Mobile-First):
```tsx
<div className="
  w-full              /* Mobile: full width */
  md:w-1/2            /* Tablet: half width */
  lg:w-1/3            /* Desktop: third width */
  p-2                 /* Mobile: small padding */
  md:p-4              /* Tablet: medium padding */
  lg:p-6              /* Desktop: large padding */
">
```

---

## ShadCN UI Usage (STRICT)

### Available Components (use these first):
- Accordion, Alert, AlertDialog
- Avatar, Badge, Button
- Calendar, Card, Carousel
- Checkbox, Collapsible, Combobox
- Command, ContextMenu, DataTable
- DatePicker, Dialog, Drawer
- DropdownMenu, Form, HoverCard
- Input, InputOTP, Label
- Menubar, NavigationMenu, Pagination
- Popover, Progress, RadioGroup
- ResizablePanels, ScrollArea, Select
- Separator, Sheet, Skeleton
- Slider, Sonner (toasts), Switch
- Table, Tabs, Textarea
- Toast, Toggle, ToggleGroup, Tooltip

### Adding New ShadCN Components:
```bash
npx shadcn@latest add [component-name]
```

### Import Pattern:
```typescript
// Always from @/components/ui/
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
```

---

## State Management (CONTEXT API)

### React Context Pattern (NOT Redux):
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    // Login logic
  };

  const logout = async () => {
    // Logout logic
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## Supabase Integration Patterns

### Client Setup:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Query Patterns:
```typescript
// In a service file: src/services/userService.ts
import { supabase } from '@/lib/supabase';

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Real-time Subscriptions:
```typescript
// In a component or hook
useEffect(() => {
  const subscription = supabase
    .channel('table-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        // Handle real-time update
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## Routing (React Router DOM)

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
```

---

## Error Handling (COMPREHENSIVE)

### Component Error Boundaries:
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Async Error Handling:
```typescript
try {
  const result = await apiCall();
  // Success handling
} catch (error) {
  if (error instanceof Error) {
    console.error('Operation failed:', error.message);
    // Show user-friendly toast
    toast.error('Failed to complete operation. Please try again.');
  }
}
```

---

## Performance Optimization

### Lazy Loading:
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));

// In routing
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### Memoization:
```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive computations
const expensiveValue = useMemo(() => computeExpensive(data), [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);

// Memoize components
export const ExpensiveComponent = memo(({ data }: Props) => {
  // Component logic
});
```

---

## Environment Variables

### Pattern (Vite-specific):
```bash
# .env.local (git ignored)
VITE_SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_NAME=Your App Name
```

### Access in Code:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const appName = import.meta.env.VITE_APP_NAME || 'Default Name';
```

**CRITICAL**: All client-side env vars MUST be prefixed with `VITE_`

---

## Accessibility Requirements (WCAG AA)

- All interactive elements must be keyboard accessible
- Color contrast ratio minimum 4.5:1
- Form inputs must have associated labels
- Images must have alt text
- ARIA attributes where semantic HTML insufficient
- Focus management for modals/dialogs

```tsx
// Good accessibility
<Button
  onClick={handleSubmit}
  aria-label="Submit contact form"
  disabled={isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>

<img
  src={userAvatar}
  alt={`Profile picture of ${userName}`}
  className="w-10 h-10 rounded-full"
/>
```

---

## Git Commit Conventions

```
feat: Add user profile editing
fix: Resolve login redirect loop
refactor: Extract authentication logic to hook
style: Update button colors for consistency
docs: Add API documentation
test: Add unit tests for user service
chore: Update dependencies
```

---

## Security Best Practices

- Never expose service role keys in client code
- Use RLS policies for all Supabase tables
- Validate all user inputs
- Sanitize data before rendering (XSS prevention)
- Use parameterized queries (handled by Supabase client)
- Implement CSRF protection where needed
- Rate limit API calls

---

## Final Checklist (Before Every Commit)

- [ ] TypeScript strict mode passes (`npx tsc --noEmit`)
- [ ] No console errors in browser
- [ ] Mobile responsive (test at 375px, 768px, 1440px)
- [ ] Accessibility checks pass
- [ ] ShadCN components used consistently
- [ ] Tailwind utilities only (no custom CSS)
- [ ] @/ import aliases used
- [ ] Error handling implemented
- [ ] Loading states present
- [ ] Environment variables prefixed with VITE_
