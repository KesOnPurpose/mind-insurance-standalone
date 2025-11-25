import { useState } from 'react';
import { GlossaryTooltip } from '@/components/protocol/GlossaryTooltip';
import { LanguageToggle } from '@/components/protocol/LanguageToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/analytics';

// Sample protocol content with tooltip markup {{term||definition}}
const DEMO_CONTENT = {
  clinical: {
    title: 'MIO Protocol Library - Clinical Documentation',
    description: 'Evidence-based psychological intervention system',
    content: `The MIO Protocol Library employs {{identity collision||When your current self-image conflicts with who you need to become}} algorithms for cognitive dissonance detection, {{breakthrough||The moment when old patterns break and transformation becomes possible}} probability matrices based on behavioral indicators, and {{sabotage||Unconscious behaviors that prevent your success}} pattern identification through longitudinal data analysis.

Our methodology incorporates {{neural rewiring||Changing thought patterns at the neurological level}} via cognitive-behavioral restructuring and intervention protocols developed through forensic psychological research.

Each participant receives comprehensive assessments with real-time {{pattern matching||Identifying recurring behaviors and thought processes}} utilizing machine learning models for transformation readiness detection.`
  },
  simplified: {
    title: 'MIO Protocol Library - Simplified',
    description: 'Interactive demonstration of the glossary tooltip system',
    content: `The MIO Protocol Library includes advanced features like {{identity collision||When your current self-image conflicts with who you need to become}} detection, {{breakthrough||The moment when old patterns break and transformation becomes possible}} probability scoring, and {{sabotage||Unconscious behaviors that prevent your success}} pattern recognition.

Our system uses {{neural rewiring||Changing thought patterns at the neurological level}} techniques to help users overcome limiting beliefs through intervention protocols designed by forensic psychology experts.

Each user's journey includes personalized assessments and real-time {{pattern matching||Identifying recurring behaviors and thought processes}} to identify optimal moments for transformation.`
  }
};

// Glossary terms list for display
const GLOSSARY_TERMS = [
  'identity collision',
  'breakthrough',
  'sabotage',
  'neural rewiring',
  'pattern matching'
];

export default function ProtocolDemo() {
  const [languageVariant, setLanguageVariant] = useState<'clinical' | 'simplified'>('simplified');
  const [interactionCount, setInteractionCount] = useState(0);

  const handleLanguageChange = (variant: 'clinical' | 'simplified') => {
    setLanguageVariant(variant);
    trackEvent('language_variant_changed', {
      from_variant: languageVariant,
      to_variant: variant,
      page: 'protocol-demo'
    });
  };

  const handleTooltipInteraction = (term: string, action: 'hover' | 'click') => {
    setInteractionCount(prev => prev + 1);
    trackEvent(action === 'click' ? 'tooltip_clicked' : 'tooltip_hovered', {
      term,
      action,
      language_variant: languageVariant,
      page: 'protocol-demo'
    });
  };

  const currentContent = DEMO_CONTENT[languageVariant];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Protocol Library Demo</h1>
        <p className="text-muted-foreground">
          Interactive demonstration of the Week 5 glossary tooltip system
        </p>
      </div>

      {/* Language Toggle */}
      <div className="mb-6">
        <LanguageToggle
          currentVariant={languageVariant}
          onVariantChange={handleLanguageChange}
          tooltipCount={languageVariant === 'simplified' ? GLOSSARY_TERMS.length : 0}
        />
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Language Variant</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="capitalize">{languageVariant}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tooltip Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{interactionCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Glossary Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{GLOSSARY_TERMS.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Glossary Terms */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{currentContent.title}</CardTitle>
          <CardDescription>{currentContent.description}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <GlossaryTooltip
            text={currentContent.content}
            glossaryTerms={GLOSSARY_TERMS}
            onTooltipInteraction={handleTooltipInteraction}
          />
        </CardContent>
      </Card>

      {/* Glossary Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Glossary Terms</CardTitle>
          <CardDescription>
            Hover or click any underlined term in the content above to see its definition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GLOSSARY_TERMS.map((term, index) => (
              <div key={index} className="p-3 border rounded-lg bg-muted/30">
                <Badge variant="outline" className="font-medium">{term}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How to Use This Demo:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Toggle between <strong>Clinical</strong> and <strong>Simplified</strong> language variants</li>
          <li>Hover over underlined terms to see tooltip definitions (desktop)</li>
          <li>Click/tap on terms to view definitions (mobile-friendly)</li>
          <li>Watch the interaction counter update in real-time</li>
          <li>Notice how simplified variant shows tooltip count badge</li>
        </ol>
      </div>
    </div>
  );
}