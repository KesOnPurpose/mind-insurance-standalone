// Facts Section Component
// Display extracted facts with verify/correct/delete actions

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { CEOExtractedFact, CEOFactCategory } from '@/types/ceoDashboard';
import { getFactCategoryDisplayName, extractFactsFromConversations } from '@/services/ceoDocumentsService';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  Sparkles,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  User,
  Briefcase,
  Settings,
  Users,
  Target,
  Clock,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface FactsSectionProps {
  facts: CEOExtractedFact[];
  onVerify: (factId: string) => Promise<CEOExtractedFact>;
  onMarkIncorrect: (factId: string) => Promise<void>;
  onDelete: (factId: string) => Promise<void>;
  isLoading: boolean;
  onRefresh?: () => Promise<void>;
}

export function FactsSection({
  facts,
  onVerify,
  onMarkIncorrect,
  onDelete,
  isLoading,
  onRefresh,
}: FactsSectionProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<CEOFactCategory | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  // Handle extract facts from conversations
  const handleExtractFacts = useCallback(async () => {
    setExtracting(true);
    try {
      const result = await extractFactsFromConversations(7); // Last 7 days

      if (result.success) {
        toast({
          title: result.facts_extracted > 0 ? 'Facts Extracted!' : 'No New Facts',
          description: result.facts_extracted > 0
            ? `Extracted ${result.facts_extracted} new facts from your recent conversations.`
            : 'No new facts found in your recent conversations.',
        });

        // Refresh facts list if any were extracted
        if (result.facts_extracted > 0 && onRefresh) {
          await onRefresh();
        }
      } else {
        toast({
          title: 'Extraction Failed',
          description: result.error || 'Failed to extract facts from conversations.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while extracting facts.',
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
    }
  }, [onRefresh, toast]);

  // Category icons
  const getCategoryIcon = (category: CEOFactCategory) => {
    const icons: Record<CEOFactCategory, React.ReactNode> = {
      personal: <User className="h-4 w-4" />,
      business: <Briefcase className="h-4 w-4" />,
      preferences: <Settings className="h-4 w-4" />,
      relationships: <Users className="h-4 w-4" />,
      goals: <Target className="h-4 w-4" />,
      habits: <Clock className="h-4 w-4" />,
      insights: <Lightbulb className="h-4 w-4" />,
    };
    return icons[category] || <MessageSquare className="h-4 w-4" />;
  };

  // Category colors
  const getCategoryColor = (category: CEOFactCategory) => {
    const colors: Record<CEOFactCategory, string> = {
      personal: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      business: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      preferences: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      relationships: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      goals: 'bg-green-500/20 text-green-300 border-green-500/30',
      habits: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      insights: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  // Filter facts
  const filteredFacts =
    selectedCategory === 'all'
      ? facts
      : facts.filter((f) => f.fact_category === selectedCategory);

  // Stats
  const verifiedCount = facts.filter((f) => f.is_verified).length;
  const pendingCount = facts.filter((f) => !f.is_verified).length;
  const highConfidenceCount = facts.filter((f) => f.confidence_score >= 80).length;

  // Handle verify
  const handleVerify = useCallback(
    async (factId: string) => {
      setActionLoading(factId);
      try {
        await onVerify(factId);
      } finally {
        setActionLoading(null);
      }
    },
    [onVerify]
  );

  // Handle mark incorrect
  const handleMarkIncorrect = useCallback(
    async (factId: string) => {
      setActionLoading(factId);
      try {
        await onMarkIncorrect(factId);
      } finally {
        setActionLoading(null);
      }
    },
    [onMarkIncorrect]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    setActionLoading(deleteConfirm);
    try {
      await onDelete(deleteConfirm);
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, onDelete]);

  // Categories for filter
  const categories: (CEOFactCategory | 'all')[] = [
    'all',
    'personal',
    'business',
    'preferences',
    'relationships',
    'goals',
    'habits',
    'insights',
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-mi-navy border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Verified Facts</p>
                <p className="text-2xl font-bold text-green-400">{verifiedCount}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <ShieldCheck className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-mi-gold/10 to-mi-navy border-mi-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-mi-gold">{pendingCount}</p>
              </div>
              <div className="p-3 rounded-full bg-mi-gold/20">
                <AlertTriangle className="h-6 w-6 text-mi-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-mi-cyan/10 to-mi-navy border-mi-cyan/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">High Confidence</p>
                <p className="text-2xl font-bold text-mi-cyan">{highConfidenceCount}</p>
              </div>
              <div className="p-3 rounded-full bg-mi-cyan/20">
                <Sparkles className="h-6 w-6 text-mi-cyan" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Facts Card */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-mi-cyan/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="p-2 rounded-lg bg-mi-cyan/10">
                  <Brain className="h-5 w-5 text-mi-cyan" />
                </div>
                What MIO Knows
                <Badge className="ml-2 bg-mi-cyan/20 text-mi-cyan border-0">
                  {facts.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-white/60 mt-1">
                Facts MIO has learned about you. Verify or correct them.
              </CardDescription>
            </div>
            <Button
              onClick={handleExtractFacts}
              disabled={extracting}
              size="sm"
              className="bg-mi-cyan/20 hover:bg-mi-cyan/30 text-mi-cyan border border-mi-cyan/30"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Extract from Chats
                </>
              )}
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'text-xs',
                  selectedCategory === cat
                    ? 'bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-medium'
                    : 'bg-mi-navy-light border-mi-cyan/30 text-white/70 hover:text-white hover:bg-mi-cyan/10 hover:border-mi-cyan/50'
                )}
              >
                {cat === 'all' ? (
                  <>
                    <Filter className="h-3 w-3 mr-1" />
                    All
                  </>
                ) : (
                  <>
                    {getCategoryIcon(cat)}
                    <span className="ml-1 capitalize">{cat}</span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-mi-cyan animate-spin" />
            </div>
          ) : filteredFacts.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No facts yet</p>
              <p className="text-sm mt-1">
                MIO will learn facts about you from conversations and documents
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFacts.map((fact) => (
                <div
                  key={fact.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all',
                    fact.is_verified
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-mi-navy border-mi-cyan/20 hover:border-mi-cyan/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Fact Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn('border', getCategoryColor(fact.fact_category))}>
                          {getCategoryIcon(fact.fact_category)}
                          <span className="ml-1">
                            {getFactCategoryDisplayName(fact.fact_category)}
                          </span>
                        </Badge>
                        {fact.is_verified && (
                          <Badge className="bg-green-500/20 text-green-300 border-0">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-white/50 text-sm">{fact.fact_key}</p>
                        <p className="text-white font-medium">{fact.fact_value}</p>
                      </div>

                      {/* Confidence Score */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-white/40">Confidence:</span>
                        <Progress
                          value={fact.confidence_score}
                          className="h-1.5 w-24 bg-mi-navy"
                          indicatorClassName={cn(
                            fact.confidence_score >= 80
                              ? 'bg-green-500'
                              : fact.confidence_score >= 50
                              ? 'bg-mi-gold'
                              : 'bg-mi-cyan'
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs font-medium',
                            fact.confidence_score >= 80
                              ? 'text-green-400'
                              : fact.confidence_score >= 50
                              ? 'text-mi-gold'
                              : 'text-mi-cyan'
                          )}
                        >
                          {fact.confidence_score}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      {!fact.is_verified && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVerify(fact.id)}
                          disabled={actionLoading === fact.id}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          {actionLoading === fact.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          <span className="ml-1">Verify</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkIncorrect(fact.id)}
                        disabled={actionLoading === fact.id}
                        className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="ml-1">Incorrect</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(fact.id)}
                        disabled={actionLoading === fact.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-1">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-mi-navy/50 border-mi-cyan/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-mi-gold mt-0.5" />
            <div>
              <p className="text-white/80 text-sm font-medium">How Facts Are Collected</p>
              <p className="text-white/50 text-sm mt-1">
                MIO learns facts about you from your conversations, uploaded documents, and the
                preferences you set in this dashboard. Verified facts help MIO provide more
                accurate and personalized assistance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-mi-navy-light border-mi-cyan/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Fact</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to permanently delete this fact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-mi-cyan/30 text-white hover:bg-mi-cyan/10"
              disabled={!!actionLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!actionLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default FactsSection;
