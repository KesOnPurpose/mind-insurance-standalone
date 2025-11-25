import React, { useState } from 'react';
import { GlossaryTooltip } from '@/components/protocol/GlossaryTooltip';
import { LanguageToggle } from '@/components/protocol/LanguageToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trackTooltipInteraction } from '@/lib/analytics';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Demo data with tooltip markup
const DEMO_PROTOCOLS = {
  meditation: {
    clinical: "Meditation activates the vagus nerve through vocalization, which shifts neural pathways from fear to faith, creating a neurological state of trust. Regular practice strengthens the prefrontal cortex while reducing amygdala reactivity.",
    simplified: "Meditation activates the {{vagus nerve||your body's built-in relaxation system}} through vocalization, which shifts {{neural pathways||thought highways in your brain}} from fear to faith, creating a neurological state of trust. Regular practice strengthens the {{prefrontal cortex||your brain's command center for making smart choices}} while reducing {{amygdala||your brain's alarm system}} reactivity.",
    tooltipCount: 4,
  },
  visualization: {
    clinical: "Daily visualization strengthens neural pathways associated with goal achievement through neuroplasticity, rewiring the brain via long-term potentiation to recognize and pursue opportunities.",
    simplified: "Daily visualization strengthens {{neural pathways||thought highways in your brain}} associated with goal achievement through {{neuroplasticity||your brain's ability to rewire itself}}, rewiring the brain via {{long-term potentiation||how practice makes brain connections permanent}} to recognize and pursue opportunities.",
    tooltipCount: 3,
  },
  breathing: {
    clinical: "Controlled breathing exercises modulate the autonomic nervous system, reducing cortisol levels and activating parasympathetic responses that promote emotional regulation and stress resilience.",
    simplified: "Controlled breathing exercises modulate the autonomic nervous system, reducing {{cortisol||your body's stress alarm chemical}} levels and activating parasympathetic responses that promote {{emotional regulation||managing your feelings effectively}} and stress resilience.",
    tooltipCount: 2,
  },
};

export function ProtocolLibraryDemo() {
  const [currentVariant, setCurrentVariant] = useState<'clinical' | 'simplified'>('clinical');
  const [selectedProtocol, setSelectedProtocol] = useState<keyof typeof DEMO_PROTOCOLS>('meditation');

  const handleTooltipInteraction = (term: string, action: 'hover' | 'click') => {
    console.log(`Tooltip ${action}:`, term);
    trackTooltipInteraction(action, term, 'demo definition', 'demo-protocol');
  };

  const protocol = DEMO_PROTOCOLS[selectedProtocol];
  const displayText = currentVariant === 'simplified' ? protocol.simplified : protocol.clinical;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Protocol Library Demo</h1>
        <p className="text-muted-foreground text-lg">
          Experience our simplified protocol system with interactive glossary tooltips
        </p>
      </div>

      {/* Language Toggle Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Language Preference</span>
            <LanguageToggle
              currentVariant={currentVariant}
              onVariantChange={setCurrentVariant}
              tooltipCount={currentVariant === 'simplified' ? protocol.tooltipCount : 0}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Toggle between Clinical and Simplified language variants. The simplified version includes
            helpful tooltips for technical terms.
          </p>
        </CardContent>
      </Card>

      {/* Protocol Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Protocol</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedProtocol} onValueChange={(v) => setSelectedProtocol(v as keyof typeof DEMO_PROTOCOLS)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="meditation">Meditation</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="breathing">Breathing</TabsTrigger>
            </TabsList>
            <TabsContent value={selectedProtocol} className="mt-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">
                  {currentVariant === 'clinical' ? 'Clinical Version' : 'Simplified Version'}
                </Badge>
                {currentVariant === 'simplified' && (
                  <Badge variant="secondary">
                    {protocol.tooltipCount} glossary terms
                  </Badge>
                )}
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {currentVariant === 'simplified' ? (
                  <GlossaryTooltip
                    text={displayText}
                    onTooltipInteraction={handleTooltipInteraction}
                  />
                ) : (
                  <p>{displayText}</p>
                )}
              </div>

              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {currentVariant === 'simplified'
                    ? "💡 Hover over or click the underlined terms to see their definitions"
                    : "💡 Switch to Simplified version to see helpful tooltips for technical terms"}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📚 Smart Tooltips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Technical terms are automatically enhanced with user-friendly definitions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Analytics Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every interaction is tracked to optimize content and measure comprehension
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💾 Preference Persistence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Language preferences are saved to your profile for a consistent experience
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Optimization Note */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">📱 Mobile Optimized</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            This interface is fully responsive and touch-friendly. On mobile devices, tap tooltips to open them,
            and tap the close button or anywhere outside to dismiss. All tap targets meet the 44px minimum requirement
            for accessibility.
          </p>
        </CardContent>
      </Card>

      {/* Statistics Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Protocols Available</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">9</p>
              <p className="text-xs text-muted-foreground">Total Glossary Terms</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">Grade 8</p>
              <p className="text-xs text-muted-foreground">Target Reading Level</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-muted-foreground">Mobile Responsive</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}