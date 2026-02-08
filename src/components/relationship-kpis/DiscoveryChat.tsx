/**
 * DiscoveryChat — Inline MIO chat for KPI discovery sessions
 * Slides up from bottom on mobile, side panel on desktop.
 * Handles pre-analysis display, conversation, and insight extraction.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Save, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { usePreAnalysis } from '@/hooks/usePreAnalysis';
import { usePartnerInsights } from '@/hooks/usePartnerInsights';
import { PreAnalysisCard } from '@/components/relationship-kpis/PreAnalysisCard';
import { SessionIntroCard } from '@/components/relationship-kpis/SessionIntroCard';
import { DiscoveryDepthRing, getDepthStageLabel } from '@/components/relationship-kpis/DiscoveryDepthRing';
import { InsightCard } from '@/components/relationship-kpis/InsightCard';
import {
  getOrCreateSession,
  createDeepeningSession,
  updateSession,
  appendMessage,
  sendDiscoveryMessage,
} from '@/services/partnerDiscoveryService';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { RelationshipKPIName } from '@/types/relationship-kpis';
import type {
  PartnerDiscoverySession,
  PartnerInsightCard,
  DiscoveryChatMessage,
  ProposedInsightCard,
  PartnerInsightCardInsert,
} from '@/types/partner-discovery';

// ── KPI Openers (mirrored from Edge Function for instant display) ────────

const KPI_OPENERS: Record<string, string> = {
  affection: "Hey. Let's talk about affection - not the textbook kind, but what it means to YOU. When was the last time you felt truly loved through a simple gesture? What was happening?",
  sexual_fulfillment: "This is a safe space. I want to help you explore what intimacy and desire mean to you specifically. Not what magazines say - what YOUR body and heart actually need to feel connected. What comes to mind when you think about feeling desired?",
  intimate_conversation: "Deep conversation is different for everyone. Some people need eye contact and silence. Others need long walks. When was the last time you felt truly HEARD by your partner? What made that moment different?",
  recreational_companionship: "Quality time means something different to everyone. What activities make you lose track of time with your partner? Or what do you wish you could do together that you haven't tried?",
  honesty_openness: "Trust is built in small moments, not grand gestures. What does it look like when your partner is being completely real with you? What makes you feel safe enough to be vulnerable?",
  physical_attractiveness: "This one's personal, and that's okay. What makes you feel attractive and confident? And honestly - how much does your partner's effort in their appearance affect how connected you feel?",
  financial_support: "Money is one of the most emotionally charged topics in relationships. What does financial security actually FEEL like to you? Not a number - a feeling.",
  domestic_support: "The unsexy truth about relationships is that someone has to do the dishes. What does true partnership at home look like to you? When do you feel supported vs. overwhelmed?",
  family_commitment: "What does your dream family life look like? Not what Instagram shows - what would an ordinary Tuesday look like in the family you're building?",
  admiration: "Everyone wants to feel respected, but admiration hits different. When was the last time you felt your partner was genuinely PROUD of you? What were you doing?",
};

interface DiscoveryChatProps {
  kpiName: RelationshipKPIName;
  onClose: () => void;
  contextCard?: PartnerInsightCard;
}

export function DiscoveryChat({ kpiName, onClose, contextCard }: DiscoveryChatProps) {
  const { user } = useAuth();
  const { data: preAnalysis } = usePreAnalysis(kpiName);
  const { saveInsights } = usePartnerInsights(kpiName);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [session, setSession] = useState<PartnerDiscoverySession | null>(null);
  const [messages, setMessages] = useState<DiscoveryChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [proposedInsights, setProposedInsights] = useState<ProposedInsightCard[]>([]);
  const [showInsightSave, setShowInsightSave] = useState(false);
  const [isSavingInsights, setIsSavingInsights] = useState(false);
  const [showIntroCard, setShowIntroCard] = useState(false);

  const kpiDef = KPI_DEFINITIONS.find((k) => k.name === kpiName);

  // Count complete user→MIO exchange pairs (opener doesn't count)
  const exchangeCount = useMemo(() => {
    let pairs = 0;
    let hasUser = false;
    for (const msg of messages) {
      if (msg.role === 'user') hasUser = true;
      else if (hasUser) { pairs++; hasUser = false; }
    }
    return pairs;
  }, [messages]);

  const insightsReady = showInsightSave && proposedInsights.length > 0;
  const chatStarted = messages.length > 0;
  const isDeepening = !!contextCard;
  const headerSubtitle = isDeepening
    ? 'Going deeper'
    : chatStarted
      ? getDepthStageLabel(exchangeCount, insightsReady)
      : 'Discovery with MIO';

  // Initialize session
  useEffect(() => {
    async function init() {
      if (!user) return;
      try {
        setIsLoading(true);

        if (isDeepening) {
          // Deepening mode: create a new session linked to the card
          const s = await createDeepeningSession(kpiName, contextCard.id);
          setSession(s);
          setMessages([]);
          setShowIntroCard(false);

          // Show MIO deepening opener immediately
          const openerText = `You shared something powerful about "${contextCard.insight_title}": "${contextCard.insight_text}". I'd love to go deeper here. What's come up since you first identified this? Has anything shifted or surfaced?`;
          const openerMessage: DiscoveryChatMessage = {
            role: 'mio',
            content: openerText,
            timestamp: new Date().toISOString(),
          };
          setMessages([openerMessage]);
          // Persist opener
          try {
            await appendMessage(s.id, openerMessage, []);
          } catch (err) {
            console.error('[DiscoveryChat] Failed to save deepening opener:', err);
          }
        } else {
          // Discovery mode: get or create session
          const s = await getOrCreateSession(kpiName);
          setSession(s);
          const history = s.conversation_history || [];
          setMessages(history);

          // Show intro card for brand-new sessions with no messages
          if (history.length === 0) {
            setShowIntroCard(true);
          }

          // If new session, mark in-progress
          if (s.session_status === 'not_started') {
            const updated = await updateSession(s.id, {
              session_status: 'in_progress',
            });
            setSession(updated);
          }
        }
      } catch (err) {
        console.error('[DiscoveryChat] Init error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpiName, user, contextCard?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Begin discovery: show MIO opener instantly (no API call)
  const handleBeginDiscovery = useCallback(async () => {
    setShowIntroCard(false);

    const openerText = KPI_OPENERS[kpiName] ||
      `Let's explore what ${kpiDef?.label || kpiName} means to you. What comes to mind first?`;

    const openerMessage: DiscoveryChatMessage = {
      role: 'mio',
      content: openerText,
      timestamp: new Date().toISOString(),
    };

    setMessages([openerMessage]);

    // Persist opener to DB
    if (session) {
      try {
        await appendMessage(session.id, openerMessage, []);
      } catch (err) {
        console.error('[DiscoveryChat] Failed to save opener:', err);
      }
    }
  }, [kpiName, kpiDef, session]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !session || !user || isSending) return;

    const userMessage: DiscoveryChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setInput('');
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      // Save user message to DB
      const updatedSession = await appendMessage(
        session.id,
        userMessage,
        [...messages, userMessage].slice(0, -1)
      );

      // Call Edge Function
      const response = await sendDiscoveryMessage({
        session_id: session.id,
        user_id: user.id,
        kpi_name: kpiName,
        message: userMessage.content,
        conversation_history: [...messages, userMessage],
        ...(isDeepening && contextCard ? {
          context_card: {
            id: contextCard.id,
            title: contextCard.insight_title,
            text: contextCard.insight_text,
            type: contextCard.insight_type,
          },
        } : {}),
      });

      const mioMessage: DiscoveryChatMessage = {
        role: 'mio',
        content: response.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, mioMessage]);

      // Save MIO response to DB
      await appendMessage(session.id, mioMessage, [...messages, userMessage]);

      // Check if session suggests insights
      if (response.suggested_insights && response.suggested_insights.length > 0) {
        setProposedInsights(response.suggested_insights);
        setShowInsightSave(true);
      }

      // Mark complete if Edge Function says so
      if (response.session_complete) {
        await updateSession(session.id, {
          session_status: 'completed',
          completed_at: new Date().toISOString(),
        });
        setSession((prev) =>
          prev ? { ...prev, session_status: 'completed' } : prev
        );
      }
    } catch (err) {
      console.error('[DiscoveryChat] Send error:', err);
      const errorMessage: DiscoveryChatMessage = {
        role: 'mio',
        content: "I'm having trouble connecting right now. Let's try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }, [input, session, user, kpiName, messages, isSending]);

  const handleSaveInsights = useCallback(async () => {
    if (!session) return;
    setIsSavingInsights(true);
    try {
      const cards: PartnerInsightCardInsert[] = proposedInsights.map((ins) => ({
        session_id: session.id,
        kpi_name: kpiName,
        insight_title: ins.title,
        insight_text: ins.text,
        insight_type: ins.type,
        is_private: true,
        source: isDeepening ? 'mio_deepening' : 'mio_session',
        ...(isDeepening && contextCard ? { parent_card_id: contextCard.id } : {}),
      }));
      await saveInsights(cards);
      setShowInsightSave(false);
      setProposedInsights([]);
    } catch (err) {
      console.error('[DiscoveryChat] Save insights error:', err);
    } finally {
      setIsSavingInsights(false);
    }
  }, [session, proposedInsights, kpiName, saveInsights, isDeepening, contextCard]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[480px] bg-mi-navy border-l border-white/10 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-rose-400" />
            <div>
              <h3 className="text-white text-sm font-medium">
                {kpiDef?.label || kpiName}
              </h3>
              <p className="text-gray-500 text-xs">{headerSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chatStarted && (
              <DiscoveryDepthRing
                exchangeCount={exchangeCount}
                insightsReady={insightsReady}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
            </div>
          ) : (
            <>
              {/* Session intro card (new sessions only) */}
              <AnimatePresence>
                {showIntroCard && (
                  <SessionIntroCard
                    kpiLabel={kpiDef?.label || kpiName}
                    onBegin={handleBeginDiscovery}
                  />
                )}
              </AnimatePresence>

              {/* Pre-analysis card */}
              {preAnalysis && messages.length <= 1 && !showIntroCard && (
                <PreAnalysisCard data={preAnalysis} />
              )}

              {/* Conversation messages */}
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}

              {/* Typing indicator */}
              {isSending && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-rose-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-rose-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-rose-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>MIO is thinking...</span>
                </div>
              )}

              {/* Proposed insight cards */}
              {showInsightSave && proposedInsights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 mt-4"
                >
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4 text-mi-gold" />
                    <span className="text-mi-gold text-xs font-medium uppercase tracking-wide">
                      Insight Cards Ready
                    </span>
                  </div>
                  {proposedInsights.map((ins, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.05] border border-white/10 rounded-lg p-3"
                    >
                      <p className="text-white text-sm font-medium mb-1">
                        {ins.title}
                      </p>
                      <p className="text-gray-400 text-xs">{ins.text}</p>
                    </div>
                  ))}
                  <Button
                    onClick={handleSaveInsights}
                    disabled={isSavingInsights}
                    className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-0"
                  >
                    {isSavingInsights ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save {proposedInsights.length} Insight Card{proposedInsights.length !== 1 ? 's' : ''}
                  </Button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input — hidden while intro card is visible */}
        {!showIntroCard && (
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              placeholder="Share what's on your mind..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isSending}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 flex-1"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-0 flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function MessageBubble({ message }: { message: DiscoveryChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-rose-500/20 text-white rounded-br-md'
            : 'bg-white/[0.05] text-gray-200 rounded-bl-md'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="h-3 w-3 text-rose-400" />
            <span className="text-rose-400 text-xs font-medium">MIO</span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}
