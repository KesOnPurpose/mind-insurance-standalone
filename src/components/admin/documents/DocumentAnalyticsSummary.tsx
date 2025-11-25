// DocumentAnalyticsSummary Component
// Display KPI cards: Total Documents, Downloads, Views, Most Popular

import { FileText, Download, Eye, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocumentAnalytics } from '@/hooks/useDocumentAnalytics';

export const DocumentAnalyticsSummary = () => {
  const { analytics, isLoading } = useDocumentAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const cards = [
    {
      title: 'Total Documents',
      value: analytics.totalDocuments,
      description: 'Active training materials',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Total Downloads',
      value: analytics.totalDownloads.toLocaleString(),
      description: 'Across all documents',
      icon: Download,
      color: 'text-green-600',
    },
    {
      title: 'Total Views',
      value: analytics.totalViews.toLocaleString(),
      description: 'Document impressions',
      icon: Eye,
      color: 'text-purple-600',
    },
    {
      title: 'Most Popular',
      value: analytics.mostPopularDocument?.name || 'N/A',
      description: analytics.mostPopularDocument
        ? `${analytics.mostPopularDocument.views} views`
        : 'No documents yet',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={String(card.value)}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
