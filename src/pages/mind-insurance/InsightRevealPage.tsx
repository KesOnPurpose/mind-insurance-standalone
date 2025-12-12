/**
 * InsightRevealPage
 * Phase 27: Full-screen "Insight Reveal" experience
 * Phase 29: Added swipeable 4-part card UI for mobile-friendly insight reveal
 *
 * This page creates a ritual moment when MIO delivers a new weekly insight.
 * Users see (swipeable cards):
 * 1. The Pattern - What MIO detected
 * 2. Why It Happens - Accessible neuroscience
 * 3. Your Protocol - 7-day plan preview
 * 4. The Question - Perspective shift
 * 5. "Start Day 1" CTA
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Brain, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProtocolById,
  markInsightViewed,
  startProtocol,
} from '@/services/mioInsightProtocolService';
import type { MIOInsightProtocolWithProgress } from '@/types/protocol';
import { SwipeableInsightCards } from '@/components/mind-insurance/SwipeableInsightCards';

export default function InsightRevealPage() {
  const { protocolId } = useParams<{ protocolId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [protocol, setProtocol] = useState<MIOInsightProtocolWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    async function loadProtocol() {
      if (!protocolId) return;

      setLoading(true);
      const data = await getProtocolById(protocolId);
      setProtocol(data);

      // Mark as viewed
      if (data && !data.insight_viewed_at) {
        await markInsightViewed(protocolId);
      }

      setLoading(false);
    }

    loadProtocol();
  }, [protocolId]);

  const handleStartDay1 = async () => {
    if (!protocol) return;

    setIsStarting(true);
    await startProtocol(protocol.id);

    // Navigate to protocol detail page to complete Day 1
    navigate(`/mind-insurance/protocol/${protocol.id}`);
  };

  const handleSaveForLater = () => {
    navigate('/mind-insurance');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
        <p className="text-slate-400 mb-4">Protocol not found</p>
        <Button variant="outline" onClick={() => navigate('/mind-insurance')}>
          Back to Mind Insurance
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            New Insight
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Intro Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center"
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 text-sm uppercase tracking-wider"
          >
            MIO has discovered something about you
          </motion.p>
        </motion.div>

        {/* Insight Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            {protocol.title}
          </h1>
        </motion.div>

        {/* Swipeable Insight Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <SwipeableInsightCards
            protocol={protocol}
            showNavigation={true}
            onViewAllDays={() => navigate(`/mind-insurance/protocol/${protocol.id}`)}
          />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="space-y-3 pt-2"
        >
          <Button
            onClick={handleStartDay1}
            disabled={isStarting}
            className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
          >
            {isStarting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
              </motion.div>
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            Start Day 1
          </Button>

          <Button
            variant="ghost"
            onClick={handleSaveForLater}
            className="w-full text-slate-400 hover:text-white"
          >
            Save for Later
          </Button>
        </motion.div>

        {/* Confidence Score (subtle) */}
        {protocol.confidence_score && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-center text-xs text-slate-500"
          >
            MIO confidence: {Math.round(protocol.confidence_score * 100)}%
          </motion.div>
        )}
      </div>
    </div>
  );
}
