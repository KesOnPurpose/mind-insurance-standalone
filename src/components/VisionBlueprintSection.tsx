// V.I.S.I.O.N. Blueprint Section Component
// Based on Vivid Vision methodology (Cameron Herold) + Mind Insurance framework
// 3-year strategic vision in present tense, shareable with team/stakeholders

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type {
  CEOVisionBlueprint,
  VisionSectionType,
  VisionSynthesizedOutput,
} from '@/types/ceoDashboard';
import {
  VISION_SECTIONS_CONFIG,
  createEmptyVisionBlueprint,
  calculateVisionCompleteness,
} from '@/types/ceoDashboard';
import {
  useSaveVisionBlueprint,
  useSynthesizeVision,
  useResetSynthesisStatus,
} from '@/hooks/useCEODashboard';
import { useVisionBlueprintDirect } from '@/hooks/useVisionBlueprintDirect';
import ReactMarkdown from 'react-markdown';
import {
  Eye,
  Sparkles,
  Save,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Calendar,
  Target,
  BookOpen,
  FileText,
  Heart,
  Mountain,
  Compass,
  ChevronRight,
  Info,
  Cloud,
} from 'lucide-react';

interface VisionBlueprintSectionProps {
  className?: string;
}

// Auto-save debounce delay in ms
const AUTO_SAVE_DELAY = 2000;

export function VisionBlueprintSection({ className }: VisionBlueprintSectionProps) {
  // Use direct fetch hook - bypasses React Query caching issues
  const { blueprint, isLoading, error, refetch } = useVisionBlueprintDirect();
  const saveBlueprint = useSaveVisionBlueprint();
  const synthesizeVision = useSynthesizeVision();
  const resetStatus = useResetSynthesisStatus();

  // === SERVER-FIRST ARCHITECTURE ===
  // Server data (blueprint) is always the source of truth
  // pendingEdits only holds unsaved changes for each section
  const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({});
  const [visionHorizonEdit, setVisionHorizonEdit] = useState<string | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<'executive' | 'narrative'>('executive');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Refs for auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Server data is the source of truth
  // pendingEdits overlay user's unsaved typing on top of server data
  const serverBlueprint = blueprint || createEmptyVisionBlueprint();

  // Helper to get section content (pending edit overrides server)
  const getSectionContent = useCallback((letter: VisionSectionType): string => {
    return pendingEdits[letter] ?? serverBlueprint.sections[letter].content;
  }, [pendingEdits, serverBlueprint]);

  // Check if we have any unsaved changes
  const hasChanges = Object.keys(pendingEdits).length > 0 || visionHorizonEdit !== null;

  // Build currentBlueprint for rendering (server + pending edits overlay)
  const currentBlueprint = useMemo(() => {
    const result = { ...serverBlueprint };

    // Apply pending vision horizon
    if (visionHorizonEdit) {
      result.visionHorizon = visionHorizonEdit as CEOVisionBlueprint['visionHorizon'];
      const targetDate = new Date();
      const years = parseInt(visionHorizonEdit.split('-')[0]);
      targetDate.setFullYear(targetDate.getFullYear() + years);
      result.targetDate = targetDate.toISOString().split('T')[0];
    }

    // Apply pending section edits
    if (Object.keys(pendingEdits).length > 0) {
      result.sections = { ...result.sections };
      for (const [letter, content] of Object.entries(pendingEdits)) {
        result.sections[letter as VisionSectionType] = {
          ...result.sections[letter as VisionSectionType],
          content,
          lastUpdated: new Date().toISOString(),
        };
      }
    }

    return result;
  }, [serverBlueprint, pendingEdits, visionHorizonEdit]);

  // Calculate completion
  const completion = calculateVisionCompleteness(currentBlueprint);

  // Auto-save function - clears pending edits after successful save
  const performAutoSave = useCallback(
    async () => {
      if (!hasChanges) return;

      try {
        setAutoSaveStatus('saving');
        // Build the blueprint to save (server + pending edits)
        await saveBlueprint.mutateAsync(currentBlueprint);

        // Clear all pending edits - server now has the latest
        setPendingEdits({});
        setVisionHorizonEdit(null);

        setAutoSaveStatus('saved');
        console.log('[VisionBlueprint] Auto-save complete, cleared pending edits');

        // Reset to idle after showing "saved" briefly
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('[VisionBlueprint] Auto-save failed:', error);
        setAutoSaveStatus('idle');
        // Keep pending edits so user doesn't lose their work
      }
    },
    [hasChanges, currentBlueprint, saveBlueprint]
  );

  // Trigger debounced auto-save when pending edits change
  useEffect(() => {
    if (!hasChanges) return;

    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_DELAY);

    // Cleanup on unmount or when deps change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasChanges, performAutoSave]);

  // Update section content - adds to pendingEdits
  const updateSectionContent = useCallback(
    (letter: VisionSectionType, content: string) => {
      setPendingEdits((prev) => ({
        ...prev,
        [letter]: content,
      }));
      setAutoSaveStatus('idle'); // Reset status when user types
    },
    []
  );

  // Update vision horizon - adds to pendingEdits
  const updateVisionHorizon = useCallback(
    (horizon: CEOVisionBlueprint['visionHorizon']) => {
      setVisionHorizonEdit(horizon);
      setAutoSaveStatus('idle');
    },
    []
  );

  // Manual save blueprint (immediate)
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setAutoSaveStatus('saving');
    await saveBlueprint.mutateAsync(currentBlueprint);
    // Clear pending edits after save
    setPendingEdits({});
    setVisionHorizonEdit(null);
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 2000);
  }, [hasChanges, currentBlueprint, saveBlueprint]);

  // Synthesize with AI
  const handleSynthesize = useCallback(async () => {
    // Save first if there are unsaved changes
    if (hasChanges) {
      await saveBlueprint.mutateAsync(currentBlueprint);
      setPendingEdits({});
      setVisionHorizonEdit(null);
    }
    // Use server blueprint for synthesis (which now has our saved changes)
    // The synthesizeVision mutation will save the outputs directly to DB
    // and refetch will bring them into serverBlueprint automatically
    await synthesizeVision.mutateAsync(currentBlueprint);
  }, [currentBlueprint, hasChanges, saveBlueprint, synthesizeVision]);

  // Reset synthesis status to retry
  const handleResetSynthesis = useCallback(async () => {
    await resetStatus.mutateAsync();
  }, [resetStatus]);

  // Copy to clipboard
  const handleCopy = useCallback(async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Download as markdown
  const handleDownload = useCallback((output: VisionSynthesizedOutput) => {
    const blob = new Blob([output.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${output.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Section icons
  const getSectionIcon = (letter: VisionSectionType) => {
    switch (letter) {
      case 'V':
        return <Eye className="h-4 w-4" />;
      case 'I':
        return <Target className="h-4 w-4" />;
      case 'S':
        return <Calendar className="h-4 w-4" />;
      case 'I2':
        return <Heart className="h-4 w-4" />;
      case 'O':
        return <Mountain className="h-4 w-4" />;
      case 'N':
        return <Compass className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  // Get section letter display
  const getSectionLetterDisplay = (letter: VisionSectionType) => {
    if (letter === 'I2') return 'I';
    return letter;
  };

  // Get synthesis status badge
  const getSynthesisStatusBadge = () => {
    const status = currentBlueprint.synthesisStatus;
    switch (status) {
      case 'processing':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Synthesizing...
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Check className="h-3 w-3 mr-1" />
            Synthesized
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Check if synthesis is possible
  const canSynthesize = completion.percentage >= 50 && currentBlueprint.synthesisStatus !== 'processing';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-mi-navy border-purple-500/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Eye className="h-6 w-6 text-purple-400" />
                </div>
                V.I.S.I.O.N. Blueprint
              </CardTitle>
              <CardDescription className="text-white/60 mt-2 max-w-md">
                Your {currentBlueprint.visionHorizon} strategic vision written in present tense.
                Shareable with your team, advisors, and stakeholders.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getSynthesisStatusBadge()}
              {/* Auto-save status indicator */}
              {autoSaveStatus === 'saving' && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <Cloud className="h-3 w-3 mr-1 animate-pulse" />
                  Saving...
                </Badge>
              )}
              {autoSaveStatus === 'saved' && !hasChanges && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Check className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
              {hasChanges && autoSaveStatus !== 'saving' && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveBlueprint.isPending}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {saveBlueprint.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Now
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Vision Horizon Selector */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Vision Horizon:</span>
              <Select
                value={currentBlueprint.visionHorizon}
                onValueChange={(v) =>
                  updateVisionHorizon(v as CEOVisionBlueprint['visionHorizon'])
                }
              >
                <SelectTrigger className="w-32 bg-mi-navy-light border-purple-500/30 text-white h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mi-navy-light border-purple-500/30">
                  <SelectItem value="1-year" className="text-white hover:bg-purple-500/10">
                    1 Year
                  </SelectItem>
                  <SelectItem value="3-year" className="text-white hover:bg-purple-500/10">
                    3 Years
                  </SelectItem>
                  <SelectItem value="5-year" className="text-white hover:bg-purple-500/10">
                    5 Years
                  </SelectItem>
                  <SelectItem value="10-year" className="text-white hover:bg-purple-500/10">
                    10 Years
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Target Date:</span>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                {currentBlueprint.targetDate
                  ? new Date(currentBlueprint.targetDate).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Not set'}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Completion</span>
              <span className="text-purple-400">
                {completion.completed}/{completion.total} sections ({completion.percentage}%)
              </span>
            </div>
            <Progress
              value={completion.percentage}
              className="h-2 bg-mi-navy-light [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-purple-400"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Vision Sections Accordion */}
      <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <BookOpen className="h-5 w-5 text-purple-400" />
            Vision Sections
          </CardTitle>
          <CardDescription className="text-white/60">
            Complete each section to build your comprehensive V.I.S.I.O.N.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['V']} className="space-y-3">
            {(['V', 'I', 'S', 'I2', 'O', 'N'] as VisionSectionType[]).map((letter) => {
              const config = VISION_SECTIONS_CONFIG[letter];
              const section = currentBlueprint.sections[letter];
              const hasContent = section.content && section.content.trim().length >= 100;

              return (
                <AccordionItem
                  key={letter}
                  value={letter}
                  className="border border-purple-500/20 rounded-lg overflow-hidden bg-mi-navy/50"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-purple-500/5 [&[data-state=open]]:bg-purple-500/10">
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg',
                          hasContent
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-mi-navy-light text-white/40'
                        )}
                      >
                        {getSectionLetterDisplay(letter)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{config.title}</span>
                          {hasContent && (
                            <Check className="h-4 w-4 text-green-400" />
                          )}
                        </div>
                        <span className="text-white/50 text-sm">{config.subtitle}</span>
                      </div>
                      <div className="mr-2">
                        {getSectionIcon(letter)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {/* Guiding Questions */}
                    <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-400 text-sm font-medium">
                          Guiding Questions
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {config.guidingQuestions.map((question, idx) => (
                          <li
                            key={idx}
                            className="text-white/60 text-sm pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-purple-400"
                          >
                            {question}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Content Textarea */}
                    <Textarea
                      value={getSectionContent(letter)}
                      onChange={(e) => updateSectionContent(letter, e.target.value)}
                      placeholder={config.placeholder}
                      className="min-h-[200px] bg-mi-navy border-purple-500/20 text-white placeholder:text-white/30 resize-y"
                    />

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-white/40 text-xs">
                        {getSectionContent(letter).length} characters
                        {getSectionContent(letter).length < 100 && ' (minimum 100 for completion)'}
                      </span>
                      {section.lastUpdated && (
                        <span className="text-white/40 text-xs">
                          Last updated:{' '}
                          {new Date(section.lastUpdated).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Synthesize Button */}
      <Card className="bg-gradient-to-r from-purple-900/40 via-mi-navy to-purple-900/40 border-purple-500/30">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-white font-semibold flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                AI Synthesis
              </h3>
              <p className="text-white/60 text-sm mt-1">
                Transform your vision into polished, shareable documents
              </p>
              {currentBlueprint.synthesisStatus === 'failed' && currentBlueprint.synthesisError && (
                <p className="text-red-400 text-sm mt-2">
                  Error: {currentBlueprint.synthesisError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentBlueprint.synthesisStatus === 'failed' && (
                <Button
                  variant="outline"
                  onClick={handleResetSynthesis}
                  disabled={resetStatus.isPending}
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
              <Button
                onClick={handleSynthesize}
                disabled={!canSynthesize || synthesizeVision.isPending}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6"
              >
                {synthesizeVision.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Synthesize with AI
                  </>
                )}
              </Button>
            </div>
          </div>
          {completion.percentage < 50 && (
            <p className="text-yellow-400/80 text-sm mt-3 text-center md:text-left">
              Complete at least 50% of your vision sections to enable AI synthesis
            </p>
          )}
        </CardContent>
      </Card>

      {/* Synthesized Outputs */}
      {currentBlueprint.synthesizedOutputs && currentBlueprint.synthesizedOutputs.length > 0 && (
        <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <FileText className="h-5 w-5 text-purple-400" />
              Synthesized Documents
            </CardTitle>
            <CardDescription className="text-white/60">
              Your V.I.S.I.O.N. transformed into shareable formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeOutputTab}
              onValueChange={(v) => setActiveOutputTab(v as 'executive' | 'narrative')}
            >
              <TabsList className="bg-mi-navy-light border border-purple-500/20 p-1 h-auto">
                <TabsTrigger
                  value="executive"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    'data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg',
                    'data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-purple-500/10'
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Executive Doc
                </TabsTrigger>
                <TabsTrigger
                  value="narrative"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    'data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg',
                    'data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-purple-500/10'
                  )}
                >
                  <Heart className="h-4 w-4" />
                  Inspirational Narrative
                </TabsTrigger>
              </TabsList>

              {currentBlueprint.synthesizedOutputs.map((output) => (
                <TabsContent
                  key={output.id}
                  value={output.outputType}
                  className="mt-4 focus-visible:outline-none"
                >
                  <div className="space-y-4">
                    {/* Output Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{output.title}</h4>
                        <p className="text-white/40 text-sm">
                          Generated:{' '}
                          {new Date(output.generatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(output.content, output.id)}
                          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        >
                          {copiedId === output.id ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(output)}
                          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {/* Output Content */}
                    <div className="p-6 rounded-lg bg-mi-navy border border-purple-500/20 max-h-[500px] overflow-y-auto">
                      <div className="prose prose-invert prose-purple max-w-none prose-headings:text-purple-300 prose-strong:text-white prose-p:text-white/80 prose-li:text-white/80 prose-ul:text-white/80">
                        <ReactMarkdown>{output.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VisionBlueprintSection;
