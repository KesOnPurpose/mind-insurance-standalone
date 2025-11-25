// Demo page showing Training Materials feature with mock data
// This demonstrates the UI without requiring database connections

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Star,
  Unlock,
  ListChecks,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { KnowledgeChunkCard } from '@/components/documents/KnowledgeChunkCard';
import { ResourcePreviewModal } from '@/components/documents/ResourcePreviewModal';
import type { TacticDocument } from '@/types/documents';
import type { KnowledgeChunk } from '@/types/knowledge';

// Mock documents data
const mockDocuments: TacticDocument[] = [
  {
    id: 1,
    document_name: 'Group Home Business Plan Template.pdf',
    category: 'operations',
    description: 'Comprehensive business plan template specifically designed for group home operations, including financial projections and operational guidelines.',
    document_url: 'https://example.com/business-plan.pdf',
    applicable_states: ['CA', 'TX', 'FL', 'NY'],
    ownership_model: ['llc', 'corporation'],
    applicable_populations: ['adult', 'seniors'],
    difficulty: 'beginner',
    created_at: '2024-01-15',
    created_by: 'admin',
    file_size_kb: 2048,
    file_type: 'pdf',
    download_count: 156,
    view_count: 423,
    avg_rating: 4.5,
    updated_at: '2024-01-15',
    link_type: 'required',
    display_order: 1
  },
  {
    id: 2,
    document_name: 'State Licensing Requirements Guide.docx',
    category: 'legal',
    description: 'State-by-state guide for group home licensing requirements, including application processes and compliance checklists.',
    document_url: 'https://example.com/licensing-guide.docx',
    applicable_states: ['CA', 'TX', 'FL'],
    ownership_model: ['llc'],
    applicable_populations: ['adult'],
    difficulty: 'intermediate',
    created_at: '2024-01-20',
    created_by: 'admin',
    file_size_kb: 1536,
    file_type: 'docx',
    download_count: 89,
    view_count: 267,
    avg_rating: 4.8,
    updated_at: '2024-01-20',
    link_type: 'required',
    display_order: 2
  },
  {
    id: 3,
    document_name: 'Market Analysis Worksheet.pdf',
    category: 'marketing',
    description: 'Interactive worksheet for conducting thorough market analysis in your target area.',
    document_url: 'https://example.com/market-analysis.pdf',
    applicable_states: null,
    ownership_model: null,
    applicable_populations: null,
    difficulty: 'beginner',
    created_at: '2024-01-25',
    created_by: 'admin',
    file_size_kb: 768,
    file_type: 'pdf',
    download_count: 203,
    view_count: 512,
    avg_rating: 4.2,
    updated_at: '2024-01-25',
    link_type: 'recommended',
    display_order: 1
  },
  {
    id: 4,
    document_name: 'Competitor Analysis Template.docx',
    category: 'marketing',
    description: 'Template for analyzing competitors in your local market.',
    document_url: 'https://example.com/competitor-analysis.docx',
    applicable_states: null,
    ownership_model: null,
    applicable_populations: null,
    difficulty: 'beginner',
    created_at: '2024-02-01',
    created_by: 'admin',
    file_size_kb: 512,
    file_type: 'docx',
    download_count: 67,
    view_count: 189,
    avg_rating: 4.0,
    updated_at: '2024-02-01',
    link_type: 'supplemental',
    display_order: 1
  }
];

// Mock knowledge chunks data
const mockKnowledge: KnowledgeChunk[] = [
  {
    id: 'chunk-1',
    chunk_text: `When researching your target market, focus on these key demographics:

1. Aging Population: Look for areas with a growing 65+ population, as they often require assisted living services.
2. Income Levels: Target middle-income neighborhoods where families can afford quality care but not luxury facilities.
3. Healthcare Infrastructure: Proximity to hospitals, clinics, and medical specialists is crucial for resident care.
4. Transportation Access: Ensure good public transportation or easy highway access for staff and family visits.`,
    source_file: 'market-research-guide.md',
    category: 'Market Research',
    tactic_id: 'test-tactic-001',
    week_number: 1,
    priority_level: 'HIGH',
    created_at: '2024-01-10'
  },
  {
    id: 'chunk-2',
    chunk_text: `Competition Analysis Framework:

- Direct Competitors: Other group homes within 5-mile radius
- Indirect Competitors: Nursing homes, assisted living facilities, home health services
- Market Saturation: Calculate beds per 1000 elderly residents
- Pricing Analysis: Document monthly rates and services included`,
    source_file: 'competition-analysis.md',
    category: 'Strategy',
    tactic_id: 'test-tactic-001',
    week_number: 1,
    priority_level: 'HIGH',
    created_at: '2024-01-11'
  },
  {
    id: 'chunk-3',
    chunk_text: `Zoning considerations vary significantly by municipality. Always verify:
- Residential vs Commercial zoning requirements
- Special use permits needed
- Maximum number of residents allowed
- Parking requirements
- ADA compliance standards`,
    source_file: 'zoning-regulations.md',
    category: 'Legal',
    tactic_id: 'test-tactic-001',
    week_number: 2,
    priority_level: 'MEDIUM',
    created_at: '2024-01-12'
  }
];

export default function TestResourcesDemo() {
  const [showSteps, setShowSteps] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [selectedResource, setSelectedResource] = useState<TacticDocument | KnowledgeChunk | null>(null);
  const [resourceType, setResourceType] = useState<'document' | 'knowledge'>('document');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const totalResources = mockDocuments.length + mockKnowledge.length;

  const handleDocumentPreview = (document: TacticDocument) => {
    setSelectedResource(document);
    setResourceType('document');
    setIsPreviewOpen(true);
  };

  const handleKnowledgePreview = (chunk: KnowledgeChunk) => {
    setSelectedResource(chunk);
    setResourceType('knowledge');
    setIsPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Training Materials Feature Demo
            </h1>
            <p className="text-gray-600">
              Live demonstration with mock data showing how documents and knowledge chunks are displayed
            </p>
          </div>

          {/* Mock Tactic Card */}
          <Card className="p-4">
            <div className="flex gap-3">
              <CheckCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />

              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base leading-tight">
                      Research and Select Target Market
                    </h3>
                    <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 text-xs">
                      <Star className="w-3 h-3 mr-1 fill-amber-400" />
                      Critical
                    </Badge>
                  </div>
                  <Badge className="bg-blue-500 text-white">
                    market_research
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    2-3 hours
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <FileText className="w-3 h-3" />
                    {totalResources} Training Materials
                  </span>
                  <span className="flex items-center gap-1 font-medium text-emerald-600">
                    <DollarSign className="w-3 h-3" />
                    $500
                  </span>
                </div>

                <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-destructive mb-1">Common Mistakes</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Not checking zoning restrictions before selecting a market</li>
                        <li>• Ignoring local competition and market saturation</li>
                        <li>• Failing to understand state-specific licensing requirements</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSteps(!showSteps)}
                    className="w-full justify-between text-left h-auto py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                  >
                    <span className="flex items-center gap-2 text-emerald-700">
                      <ListChecks className="w-4 h-4" />
                      <span className="font-semibold text-xs">Step-by-Step Instructions (5 steps)</span>
                    </span>
                    {showSteps ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-emerald-600" />
                    )}
                  </Button>

                  {showSteps && (
                    <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <ol className="space-y-3">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <p className="text-xs text-emerald-900">Research local demographics and identify areas with high demand</p>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <p className="text-xs text-emerald-900">Analyze competition in your target areas</p>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          <p className="text-xs text-emerald-900">Review state and local regulations</p>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                          <p className="text-xs text-emerald-900">Create a market analysis report</p>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                          <p className="text-xs text-emerald-900">Select your top 3 target markets</p>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* Training Materials Section - THE NEW FEATURE */}
                <div className="mb-3">
                  <Collapsible open={showResources} onOpenChange={setShowResources}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between text-left h-auto py-2 px-3 bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        <span className="flex items-center gap-2 text-blue-700">
                          <FileText className="w-4 h-4" />
                          <span className="font-semibold text-xs">
                            Training Materials ({totalResources} resources)
                          </span>
                        </span>
                        {showResources ? (
                          <ChevronUp className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Tabs defaultValue="documents" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="documents" className="gap-2">
                              <FileText className="h-3 w-3" />
                              <span>Documents ({mockDocuments.length})</span>
                            </TabsTrigger>
                            <TabsTrigger value="knowledge" className="gap-2">
                              <BookOpen className="h-3 w-3" />
                              <span>Knowledge ({mockKnowledge.length})</span>
                            </TabsTrigger>
                            <TabsTrigger value="all" className="gap-2">
                              <Layers className="h-3 w-3" />
                              <span>All ({totalResources})</span>
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="documents" className="mt-4">
                            <div className="space-y-4">
                              {/* Required Documents */}
                              <div>
                                <h4 className="text-sm font-semibold text-destructive mb-2">Required (2)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {mockDocuments.filter(d => d.link_type === 'required').map(doc => (
                                    <DocumentCard key={doc.id} document={doc} onPreview={handleDocumentPreview} />
                                  ))}
                                </div>
                              </div>

                              {/* Recommended Documents */}
                              <div>
                                <h4 className="text-sm font-semibold text-yellow-600 mb-2">Recommended (1)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {mockDocuments.filter(d => d.link_type === 'recommended').map(doc => (
                                    <DocumentCard key={doc.id} document={doc} onPreview={handleDocumentPreview} />
                                  ))}
                                </div>
                              </div>

                              {/* Supplemental Documents */}
                              <div>
                                <h4 className="text-sm font-semibold text-blue-600 mb-2">Supplemental (1)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {mockDocuments.filter(d => d.link_type === 'supplemental').map(doc => (
                                    <DocumentCard key={doc.id} document={doc} onPreview={handleDocumentPreview} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="knowledge" className="mt-4">
                            <div className="space-y-4">
                              {/* HIGH Priority */}
                              <div>
                                <h4 className="text-sm font-semibold text-destructive mb-2">High Priority (2)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {mockKnowledge.filter(k => k.priority_level === 'HIGH').map(chunk => (
                                    <KnowledgeChunkCard key={chunk.id} chunk={chunk} onPreview={handleKnowledgePreview} />
                                  ))}
                                </div>
                              </div>

                              {/* MEDIUM Priority */}
                              <div>
                                <h4 className="text-sm font-semibold text-yellow-600 mb-2">Medium Priority (1)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {mockKnowledge.filter(k => k.priority_level === 'MEDIUM').map(chunk => (
                                    <KnowledgeChunkCard key={chunk.id} chunk={chunk} onPreview={handleKnowledgePreview} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="all" className="mt-4">
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                                  <FileText className="h-4 w-4" />
                                  Training Documents ({mockDocuments.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {mockDocuments.map(doc => (
                                    <DocumentCard key={doc.id} document={doc} onPreview={handleDocumentPreview} />
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                                  <BookOpen className="h-4 w-4" />
                                  Knowledge Base ({mockKnowledge.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {mockKnowledge.map(chunk => (
                                    <KnowledgeChunkCard key={chunk.id} chunk={chunk} onPreview={handleKnowledgePreview} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    Start
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Preview Modal */}
          <ResourcePreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            resource={selectedResource}
            resourceType={resourceType}
          />
        </div>
      </div>
    </div>
  );
}