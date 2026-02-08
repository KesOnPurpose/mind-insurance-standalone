// ============================================================================
// SHARED BINDER PAGE
// ============================================================================
// Public page for viewing shared compliance binders via token link.
// No authentication required - access controlled by share link token.
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  FileText,
  Download,
  Shield,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Lock,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { validateShareToken, type SharedBinderAccess } from '@/services/shareLinksService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48 mb-8" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================================
// INVALID/EXPIRED LINK STATE
// ============================================================================

function InvalidLinkState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Link Invalid or Expired</h1>
          <p className="text-muted-foreground mb-6">
            This share link is no longer valid. It may have expired or been deactivated
            by the owner.
          </p>
          <p className="text-sm text-muted-foreground">
            If you need access to this binder, please contact the person who shared
            it with you.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SharedBinderPage() {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [sharedData, setSharedData] = useState<SharedBinderAccess | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'documents'>('content');

  // Fetch shared binder data
  useEffect(() => {
    async function fetchSharedBinder() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await validateShareToken(token);
        setSharedData(data);
      } catch (error) {
        console.error('Failed to validate share token:', error);
        setSharedData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSharedBinder();
  }, [token]);

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Invalid/expired link
  if (!sharedData) {
    return <InvalidLinkState />;
  }

  const { binder, items, documents, permissions } = sharedData;

  // Combine items into sections for display
  const groupedItems = items.reduce((acc, item) => {
    const section = item.section_type || 'general';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">{binder.name}</h1>
                <Badge variant="outline">{binder.state_code}</Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Shared compliance binder • Read-only access
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                View Only
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Permission Indicators */}
      <div className="border-b bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Access:</span>
            <Badge variant={permissions.view_sections ? 'default' : 'outline'} className="text-xs">
              {permissions.view_sections ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
              Binder Content
            </Badge>
            <Badge variant={permissions.view_documents ? 'default' : 'outline'} className="text-xs">
              {permissions.view_documents ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
              Documents
            </Badge>
            <Badge variant={permissions.view_notes ? 'default' : 'outline'} className="text-xs">
              {permissions.view_notes ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
              Notes
            </Badge>
            <Badge variant={permissions.download_documents ? 'default' : 'outline'} className="text-xs">
              {permissions.download_documents ? <Download className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              Downloads
            </Badge>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'content'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              Binder Content
            </button>
            {permissions.view_documents && documents.length > 0 && (
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'documents'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Documents ({documents.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'content' && permissions.view_sections && (
          <Card>
            <CardContent className="p-6">
              {/* Model Definition */}
              {binder.model_definition && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-3">Model Definition</h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {binder.model_definition}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Binder Items by Section */}
              {Object.entries(groupedItems).map(([sectionType, sectionItems]) => (
                <div key={sectionType} className="mb-8">
                  <h2 className="text-lg font-semibold mb-3 capitalize">
                    {sectionType.replace(/_/g, ' ')}
                  </h2>
                  <div className="space-y-4">
                    {sectionItems.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 bg-muted/30"
                      >
                        {item.title && (
                          <h3 className="font-medium mb-2">{item.title}</h3>
                        )}
                        {item.regulation_code && (
                          <Badge variant="outline" className="mb-2 text-xs">
                            {item.regulation_code}
                          </Badge>
                        )}
                        {item.chunk_content && (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item.chunk_content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {permissions.view_notes && item.user_notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                            <p className="text-sm">{item.user_notes}</p>
                          </div>
                        )}
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            View Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {Object.keys(groupedItems).length === 0 && !binder.model_definition && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content has been added to this binder yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'documents' && permissions.view_documents && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents have been uploaded.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {doc.document_type.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      {permissions.download_documents ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Download Disabled
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Access Message */}
        {activeTab === 'content' && !permissions.view_sections && (
          <Card>
            <CardContent className="py-12 text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                You don't have permission to view the binder content.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <p>
            This binder is shared via{' '}
            <span className="font-medium">Grouphome4Newbies</span> Compliance Hub
          </p>
          <p className="mt-1">
            <a
              href="https://grouphome4newbies.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn more about our compliance solutions
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
