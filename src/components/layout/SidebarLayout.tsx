import { ReactNode, useMemo } from 'react';
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
  if (pathname.startsWith('/mind-insurance')) return 'mind-insurance';
  if (pathname.startsWith('/model-week')) return 'model-week';
  if (pathname.startsWith('/profile')) return 'profile';
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

  // Check if we're in the Mind Insurance section for dark theme
  const isMindInsurance = useMemo(() => {
    return location.pathname.startsWith('/mind-insurance');
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar mode={mode} />

      {/* Fixed sidebar trigger - OUTSIDE SidebarInset for proper fixed positioning */}
      {/* Always visible on both mobile and desktop so users can open sidebar after scrolling */}
      <div className="fixed top-4 left-4 z-50">
        <SidebarTrigger className={cn(
          "h-10 w-10 backdrop-blur-sm shadow-lg border rounded-lg",
          isMindInsurance
            ? "bg-mi-navy-light/80 border-mi-cyan/30 text-mi-cyan hover:bg-mi-navy hover:text-white"
            : "bg-background/80 hover:bg-background"
        )} />
      </div>

      <SidebarInset>
        <div className={cn(
          "min-h-screen flex flex-col",
          isMindInsurance ? "bg-mi-navy" : "bg-muted/30"
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
            <div className="container mx-auto px-4 py-6 pt-16 md:pt-6 max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default SidebarLayout;
