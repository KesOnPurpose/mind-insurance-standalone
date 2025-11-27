import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar, SidebarMode } from './AppSidebar';

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
  if (pathname.startsWith('/chat')) return 'chat';
  if (pathname.startsWith('/roadmap')) return 'roadmap';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/mind-insurance')) return 'mind-insurance';
  if (pathname.startsWith('/model-week')) return 'model-week';
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

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar mode={mode} />
      <SidebarInset>
        <div className="min-h-screen bg-muted/30 flex flex-col">
          {/* Optional Header with gradient */}
          {showHeader && (
            <div
              className="text-white transition-all"
              style={{ background: headerGradient }}
            >
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-3">
                  {/* Sidebar toggle */}
                  <SidebarTrigger className="h-8 w-8 text-white hover:bg-white/20" />
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
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Fixed sidebar trigger for pages without header */}
            {!showHeader && (
              <div className="fixed top-4 left-4 z-50 md:hidden">
                <SidebarTrigger className="h-10 w-10 bg-background shadow-lg border rounded-lg" />
              </div>
            )}
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default SidebarLayout;
