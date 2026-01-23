// ============================================================================
// COMPLIANCE BINDER PAGE
// ============================================================================
// Dedicated page for the user's digital compliance binder.
// "$100M Apple-Simple" redesign with 3-tab layout.
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Shield,
} from 'lucide-react';
import { ComplianceBinder } from '@/components/compliance/binder';
import { useBinderList } from '@/hooks/useComplianceBinder';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceBinderPage() {
  const navigate = useNavigate();
  const { binders, isLoading, error } = useBinderList();

  // Get the user's primary binder (first one, or create prompt)
  const primaryBinder = binders?.[0];

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compliance')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Hub
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compliance')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Hub
          </Button>
        </div>

        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error.message}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - No binder yet
  if (!primaryBinder) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compliance')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Hub
          </Button>
        </div>

        {/* Page Title */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <FolderOpen className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Compliance Binder</h1>
            <p className="text-muted-foreground">
              Your digital compliance portfolio - everything to show officials with confidence.
            </p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Start Building Your Binder</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Complete your state assessment to create your personalized compliance
              binder with official requirements for your state.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate('/compliance/assessment')}>
                <Plus className="h-4 w-4 mr-1.5" />
                Complete Assessment
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/compliance?tab=library')}
              >
                Browse State Library
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main binder view
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/compliance')}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Hub
        </Button>
      </div>

      {/* Compliance Binder Component (handles everything internally) */}
      <ComplianceBinder binderId={primaryBinder.id} />
    </div>
  );
}
