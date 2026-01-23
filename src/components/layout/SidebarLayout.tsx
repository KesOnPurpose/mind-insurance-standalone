import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar, SidebarMode } from './AppSidebar';
import { cn } from '@/lib/utils';

interface SidebarLayoutProps {
  children: ReactNode;
  /** Override the auto-detected mode */
  mode?: SidebarMode;
  /** Show a page header with gradient background */
  showHeader?: boolean;
  /** Header title */
  headerTitle?: string;
  /** Header subtitle */
  headerSubtitle?: string;
  /** Header gradient color (CSS gradient string) */
  headerGradient?: string;
}

/**
 * Detect sidebar mode based on current route
 */
function getCurrentMode(pathname: string): SidebarMode {
  // Check more specific resources routes first
  if (pathname === '/resources/calculator') return 'resources-calculator';
  if (pathname === '/resources/documents') return 'resources-documents';
  if (pathname.startsWith('/resources')) return 'resources';
  if (pathname.startsWith('/chat')) return 'chat';
  if (pathname.startsWith('/roadmap')) return 'roadmap';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  // FEAT-GH-010: Programs Hub and nested routes
  if (pathname.startsWith('/programs')) return 'programs';
  if (pathname.startsWith('/mind-insurance')) return 'mind-insurance';
  if (pathname.startsWith('/model-week')) return 'model-week';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'default';
}

/**
 * SidebarLayout - Wrapper component that provides consistent sidebar navigation
 *
 * Replaces AppLayout for pages that should use the new sidebar-first design.
 * Automatically detects the current route and shows context-appropriate sidebar content.
 *
 * Usage:
 * ```tsx
 * <SidebarLayout>
 *   <YourPageContent />
 * </SidebarLayout>
 * ```
 */
export function SidebarLayout({
  children,
  mode: explicitMode,
  showHeader = false,
  headerTitle,
  headerSubtitle,
  headerGradient = 'linear-gradient(135deg, hsl(187 85% 35%), hsl(187 75% 45%))',
}: SidebarLayoutProps) {
  const location = useLocation();
  const mode = explicitMode || getCurrentMode(location.pathname);

  // GROUPHOME STANDALONE: Use light theme for all pages
  const isMindInsurance = false;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar mode={mode} />

      <SidebarInset>
        {/* Sticky header with sidebar toggle */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
        </header>

        <div className={cn(
          "min-h-[calc(100vh-3.5rem)] flex flex-col",
          isMindInsurance ? "bg-mi-navy" : "bg-white"
        )}>
          {/* Optional Header with gradient */}
          {showHeader && (
            <div
              className="text-white transition-all"
              style={{ background: headerGradient }}
            >
              <div className="container mx-auto px-4 py-4">
                <div>
                  {headerTitle && (
                    <h1 className="text-xl font-bold">{headerTitle}</h1>
                  )}
                  {headerSubtitle && (
                    <p className="text-white/90 text-sm">{headerSubtitle}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default SidebarLayout;
