/**
 * Know Your Partner — 3-tab page replacing Learning Hub
 * Tabs: Discover | Their World | Gift Ideas
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2, Sparkles, Dna } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useDiscoverySessions } from '@/hooks/useDiscoverySessions';
import { DiscoverTab } from '@/components/relationship-kpis/DiscoverTab';
import { MyInsightsTab } from '@/components/relationship-kpis/MyInsightsTab';
import { TheirWorldTab } from '@/components/relationship-kpis/TheirWorldTab';
import { GiftIdeasTab } from '@/components/relationship-kpis/GiftIdeasTab';
import { DiscoveryChat } from '@/components/relationship-kpis/DiscoveryChat';
import { RelationshipDNA } from '@/components/relationship-kpis/RelationshipDNA';
import type { RelationshipKPIName } from '@/types/relationship-kpis';
import type { PartnerInsightCard } from '@/types/partner-discovery';

export default function LearningYourPartnerPage() {
  const navigate = useNavigate();
  const {
    cardData,
    isLoading,
    completedCount,
    dnaUnlocked,
    reload,
  } = useDiscoverySessions();

  const [activeTab, setActiveTab] = useState('discover');
  const [activeChatKpi, setActiveChatKpi] = useState<RelationshipKPIName | null>(null);
  const [deepeningCard, setDeepeningCard] = useState<PartnerInsightCard | null>(null);
  const [showDNA, setShowDNA] = useState(false);

  const handleStartChat = (kpiName: RelationshipKPIName) => {
    setActiveChatKpi(kpiName);
  };

  const handleCloseChat = () => {
    setActiveChatKpi(null);
    reload();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-rose-400" />
            <h1 className="text-xl font-semibold text-white">Know Your Partner</h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
          </div>
        </div>
      </div>
    );
  }

  // DNA Profile view
  if (showDNA) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDNA(false)}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Discovery
          </Button>
          <RelationshipDNA />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/relationship-kpis')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Heart className="h-6 w-6 text-rose-400" />
            <h1 className="text-xl font-semibold text-white">Know Your Partner</h1>
          </div>
          {dnaUnlocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDNA(true)}
              className="text-purple-400 hover:text-purple-300 gap-1"
            >
              <Dna className="h-4 w-4" />
              <span className="hidden sm:inline">Relationship DNA</span>
            </Button>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-5 ml-[52px]">
          Build a living user manual for each other.
        </p>

        {/* Progress indicator */}
        {completedCount > 0 && (
          <div className="flex items-center gap-2 mb-4 ml-[52px]">
            <Sparkles className="h-4 w-4 text-mi-gold" />
            <span className="text-sm text-gray-400">
              {completedCount}/10 KPIs explored
              {completedCount >= 5 && !dnaUnlocked && ' — DNA Profile unlocking soon!'}
              {dnaUnlocked && ' — Relationship DNA unlocked!'}
            </span>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 w-full justify-start mb-6">
            <TabsTrigger
              value="discover"
              className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300 text-gray-400"
            >
              Discover
            </TabsTrigger>
            <TabsTrigger
              value="my-insights"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 text-gray-400"
            >
              My Insights
            </TabsTrigger>
            <TabsTrigger
              value="their-world"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-gray-400"
            >
              Their World
            </TabsTrigger>
            <TabsTrigger
              value="gift-ideas"
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-gray-400"
            >
              Gift Ideas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            <DiscoverTab
              cardData={cardData}
              onStartChat={handleStartChat}
            />
          </TabsContent>

          <TabsContent value="my-insights">
            <MyInsightsTab onGoDeeper={setDeepeningCard} />
          </TabsContent>

          <TabsContent value="their-world">
            <TheirWorldTab />
          </TabsContent>

          <TabsContent value="gift-ideas">
            <GiftIdeasTab />
          </TabsContent>
        </Tabs>

        {/* Inline Discovery Chat */}
        {activeChatKpi && (
          <DiscoveryChat
            kpiName={activeChatKpi}
            onClose={handleCloseChat}
          />
        )}

        {/* Deepening Chat */}
        {deepeningCard && (
          <DiscoveryChat
            kpiName={deepeningCard.kpi_name}
            contextCard={deepeningCard}
            onClose={() => { setDeepeningCard(null); reload(); }}
          />
        )}
      </div>
    </div>
  );
}
