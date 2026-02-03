import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageSquare, Phone } from "lucide-react";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatWelcomeScreen from "@/components/chat/ChatWelcomeScreen";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { VoiceInputButton } from "@/components/chat/VoiceInputButton";
import { VoiceCallCard } from "@/components/chat/VoiceCallCard";
import { VoiceTabContent } from "@/components/chat/VoiceTabContent";
import type { ChatMode } from "@/components/chat/ChatSidebar";
import { cn } from "@/lib/utils";
import { CoachType, COACHES } from "@/types/coach";
import { useAuth } from "@/contexts/AuthContext";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useConversationsContext } from "@/contexts/ConversationsContext";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { trackChatError } from "@/services/errorTracker";
import { fetchConversationById } from "@/services/chatHistoryService";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchVoiceCallsForChat,
  subscribeToVoiceCalls,
  type VoiceCallForChat,
  type NetteVoiceCallLog,
} from "@/services/netteVoiceCallService";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  coachType: CoachType;
}

// Union type for chat items (messages + voice calls)
type ChatItem =
  | { type: 'message'; data: Message }
  | { type: 'voice_call'; data: VoiceCallForChat };

// Interface for navigation state from tactic help
interface TacticHelpState {
  tacticContext?: {
    tacticId: string;
    tacticLabel?: string;
    lessonId?: string;
    lessonTitle?: string;
    phaseId?: string;
    phaseTitle?: string;
    programId?: string;
    programTitle?: string;
  };
  initialMessage?: string;
}

interface ChatPageContentProps {
  activeMode: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
}

// Inner component that uses sidebar context
function ChatPageContent({ activeMode, onModeChange }: ChatPageContentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();

  // Check for tactic help navigation state
  const tacticHelpState = location.state as TacticHelpState | null;

  // Analytics tracking hooks
  const { trackConversation } = useSession('chat');
  const { trackFeature } = useFeatureUsage('chat_nette', true);

  // Conversation context for sidebar integration
  const {
    activeConversationId,
    isNewConversation,
    setActiveConversation,
    selectConversation,
  } = useConversationContext();

  // Conversations context for creating new conversations (shared with sidebar)
  const { addConversation, updateConversation } = useConversationsContext();

  // GROUPHOME STANDALONE: Nette is the only coach
  const selectedCoach: CoachType = 'nette';

  // Start with empty messages for new chats
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceCalls, setVoiceCalls] = useState<VoiceCallForChat[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // Extended user profile with all fields needed for voice caller identification
  const [userProfile, setUserProfile] = useState<{
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    verified_phone: string | null;
    ghl_contact_id: string | null;
    timezone: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref to preserve messages during state transitions
  const pendingMessagesRef = useRef<Message[]>([]);

  // Track if we've already sent the tactic help message to prevent double-sending
  const [tacticHelpSent, setTacticHelpSent] = useState(false);

  // Auto-send message when arriving from tactic help
  useEffect(() => {
    if (tacticHelpState?.initialMessage && !tacticHelpSent && user?.id) {
      console.log('[TacticHelp] Auto-sending tactic help message:', tacticHelpState.initialMessage);
      setTacticHelpSent(true);
      // Use a small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        handleWelcomeMessage(tacticHelpState.initialMessage!);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [tacticHelpState, tacticHelpSent, user?.id]);

  // Fetch user profile for personalized greeting and voice caller identification
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        // Fetch all fields needed for voice caller identification
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, phone, verified_phone, ghl_contact_id, timezone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[UserProfile] Error fetching profile:', error);
          return;
        }

        setUserProfile(data);
        console.log('[UserProfile] Loaded for voice context:', {
          full_name: data?.full_name,
          email: data?.email,
          phone: data?.verified_phone || data?.phone,
          ghl_contact_id: data?.ghl_contact_id,
          has_voice_context: !!(data?.ghl_contact_id || data?.phone || data?.verified_phone)
        });

        // Note: Phone verification modal trigger moved to parent component
      } catch (error) {
        console.error('[UserProfile] Error:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Fetch voice calls and subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const loadVoiceCalls = async () => {
      try {
        console.log('[VoiceCalls] Fetching voice calls for user:', user.id);
        const calls = await fetchVoiceCallsForChat(user.id);
        console.log('[VoiceCalls] Loaded', calls.length, 'voice calls');
        setVoiceCalls(calls);
      } catch (error) {
        console.error('[VoiceCalls] Error fetching voice calls:', error);
      }
    };

    loadVoiceCalls();

    // Subscribe to real-time voice call updates
    const unsubscribe = subscribeToVoiceCalls(user.id, (newCall: NetteVoiceCallLog) => {
      console.log('[VoiceCalls] New/updated voice call:', newCall.id);
      // Convert NetteVoiceCallLog to VoiceCallForChat
      const callForChat: VoiceCallForChat = {
        id: newCall.id,
        ai_summary: newCall.ai_summary,
        topics_discussed: newCall.topics_discussed,
        call_duration_seconds: newCall.call_duration_seconds,
        direction: newCall.direction,
        full_transcript: newCall.full_transcript,
        parsed_messages: newCall.parsed_messages,
        recording_url: newCall.recording_url,
        synced_to_chat: newCall.synced_to_chat,
        created_at: newCall.created_at,
      };
      setVoiceCalls(prev => {
        // Check if call already exists, update it
        const existingIndex = prev.findIndex(c => c.id === callForChat.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = callForChat;
          return updated;
        }
        // Add new call at the beginning (most recent)
        return [callForChat, ...prev];
      });
    });

    return () => {
      console.log('[VoiceCalls] Cleaning up subscription');
      unsubscribe();
    };
  }, [user?.id]);

  // Combine messages and voice calls into chronological order
  const chatItems: ChatItem[] = useMemo(() => {
    const items: ChatItem[] = [];

    // Add messages
    messages.forEach(msg => {
      items.push({ type: 'message', data: msg });
    });

    // Add voice calls
    voiceCalls.forEach(call => {
      items.push({ type: 'voice_call', data: call });
    });

    // Sort by timestamp (messages use Date, voice calls use string)
    items.sort((a, b) => {
      const getTime = (item: ChatItem): number => {
        if (item.type === 'message') {
          return item.data.timestamp.getTime();
        }
        return new Date(item.data.created_at).getTime();
      };
      return getTime(a) - getTime(b);
    });

    return items;
  }, [messages, voiceCalls]);

  // Load conversation when activeConversationId changes
  useEffect(() => {
    const loadConversation = async () => {
      if (!user?.id) return;

      if (isNewConversation || !activeConversationId) {
        if (pendingMessagesRef.current.length > 0) {
          console.log('[ChatHistory] Preserving pending messages:', pendingMessagesRef.current.length);
          setMessages([...pendingMessagesRef.current]);
          setIsLoadingHistory(false);
          return;
        }
        setMessages([]);
        setIsLoadingHistory(false);
        return;
      }

      if (pendingMessagesRef.current.length > 0) {
        console.log('[ChatHistory] Preserving pending messages for new conversation:', pendingMessagesRef.current.length);
        setMessages([...pendingMessagesRef.current]);
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      console.log('[ChatHistory] Loading conversation:', activeConversationId);

      try {
        const history = await fetchConversationById(user.id, activeConversationId);

        if (history.length > 0) {
          // ANI-200-B: Deduplicate history to prevent transcript doubling.
          // Build a set of "role:content" keys and keep the first occurrence.
          const seen = new Set<string>();
          const deduped = history.filter((msg) => {
            const key = `${msg.role}:${msg.content.trim().substring(0, 200).toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          console.log('[ChatHistory] Loaded', history.length, 'messages, deduped to', deduped.length);
          setMessages(deduped);
        } else {
          console.log('[ChatHistory] No history found for conversation');
          if (pendingMessagesRef.current.length > 0) {
            console.log('[ChatHistory] Using pending messages as fallback');
            setMessages([...pendingMessagesRef.current]);
          } else {
            setMessages([]);
          }
        }
      } catch (error) {
        console.error('[ChatHistory] Error loading history:', error);
        if (pendingMessagesRef.current.length > 0) {
          setMessages([...pendingMessagesRef.current]);
        } else {
          setMessages([]);
        }
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversation();
  }, [user?.id, activeConversationId, isNewConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle message from welcome screen
  const handleWelcomeMessage = async (messageText: string) => {
    if (!messageText.trim() || !user) return;

    const newConversationId = crypto.randomUUID();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
      coachType: selectedCoach
    };

    pendingMessagesRef.current = [userMessage];
    setMessages([userMessage]);
    setActiveConversation(newConversationId);
    await addConversation(newConversationId, messageText, selectedCoach);

    console.log('[Conversation] Started new conversation from welcome:', newConversationId);

    setIsTyping(true);

    try {
      const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-n8n.vq00fr.easypanel.host/webhook/UnifiedChat';

      console.log('[Chat] Welcome message to n8n:', messageText);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          message: messageText,
          agent: selectedCoach,
          conversation_id: newConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Chat] Welcome response:', data);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I'm here to help you. Let me know what you'd like to explore.",
        timestamp: new Date(),
        coachType: selectedCoach
      };

      setMessages(prev => [...prev, aiMessage]);
      pendingMessagesRef.current = [];
      await updateConversation(newConversationId, aiMessage.content, selectedCoach);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending welcome message:', error);
      pendingMessagesRef.current = [];
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      currentConversationId = crypto.randomUUID();
      await addConversation(currentConversationId, input, selectedCoach);
      setActiveConversation(currentConversationId);
      console.log('[Conversation] Started new conversation:', currentConversationId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      coachType: selectedCoach
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput("");
    setIsTyping(true);

    try {
      const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-n8n.vq00fr.easypanel.host/webhook/UnifiedChat';

      console.log('[Chat] Calling n8n webhook:', N8N_WEBHOOK_URL);
      console.log('[Chat] User ID:', user.id);
      console.log('[Chat] Agent:', selectedCoach);

      const payload = {
        user_id: user.id,
        message: messageText,
        agent: selectedCoach,
        conversation_id: currentConversationId,
      };

      console.log('[Chat] Sending payload:', JSON.stringify(payload, null, 2));

      let response;
      try {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (fetchError) {
        console.error('[Chat] Fetch failed:', fetchError);
        throw fetchError;
      }

      console.log('[Chat] Response status:', response.status);

      if (!response.ok) {
        console.error('[Chat] Error response:', response.status, response.statusText);

        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
          });
          setIsTyping(false);
          return;
        }

        if (response.status === 500) {
          const errorText = await response.text();
          if (errorText.includes('select condition') || errorText.includes('user')) {
            toast({
              title: "Profile Not Found",
              description: "Your user profile wasn't found. Please refresh the page and try again.",
              variant: "destructive",
            });
            setIsTyping(false);
            return;
          }
        }

        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Chat] Response data:', data);

      const aiMessageId = (Date.now() + 1).toString();
      const responseAgent = (data.agent || selectedCoach) as CoachType;

      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: data.response || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date(),
        coachType: responseAgent,
      };

      setMessages((prev) => [...prev, aiMessage]);
      await trackConversation();
      await updateConversation(currentConversationId, aiMessage.content, responseAgent);
      setIsTyping(false);
    } catch (error) {
      console.error('[Chat] CAUGHT ERROR in handleSend:', error);

      const errorObj = error instanceof Error ? error : new Error(String(error));
      await trackChatError(
        'nette',
        errorObj,
        currentConversationId,
        {
          message: messageText,
          agent: selectedCoach,
          product: 'grouphome'
        }
      );

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    }
  };

  // Show welcome screen for new conversations (only in chat mode)
  if (activeMode === 'chat' && isNewConversation && messages.length === 0) {
    return (
      <SidebarInset>
        {/* Sticky header with sidebar toggle + mobile mode toggle */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          {/* ANI-010-A: Mobile Chat/Voice toggle — visible only on mobile */}
          {isMobile && onModeChange && (
            <div className="flex items-center ml-auto bg-muted rounded-lg p-0.5">
              <button
                onClick={() => onModeChange('chat')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeMode === 'chat'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                onClick={() => onModeChange('voice')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeMode === 'voice'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <Phone className="h-3.5 w-3.5" />
                Voice
              </button>
            </div>
          )}
        </header>
        <ChatWelcomeScreen
          userName={userProfile?.full_name ?? null}
          onSendMessage={handleWelcomeMessage}
          isLoading={isTyping}
        />
      </SidebarInset>
    );
  }

  // Full chat interface
  return (
    <SidebarInset>
      {/* Sticky header with sidebar toggle + mobile mode toggle */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        {/* ANI-010-A: Mobile Chat/Voice toggle — visible only on mobile */}
        {isMobile && onModeChange && (
          <div className="flex items-center ml-auto bg-muted rounded-lg p-0.5">
            <button
              onClick={() => onModeChange('chat')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeMode === 'chat'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              onClick={() => onModeChange('voice')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeMode === 'voice'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              Voice
            </button>
          </div>
        )}
      </header>
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-white">
        {/* Header - Premium Glassmorphic Banner */}
        <div className="mx-4 mt-4 mb-2">
          <div
            className="text-white transition-all rounded-2xl overflow-hidden shadow-lg"
            style={{
              background: COACHES[selectedCoach].gradient,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 128, 128, 0.15)'
            }}
          >
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={COACHES[selectedCoach].avatar}
                  alt={COACHES[selectedCoach].name}
                  className="w-12 h-12 rounded-full object-cover bg-white/20 backdrop-blur-sm ring-2 ring-white/30"
                />
                <div>
                  <h1 className="text-xl font-semibold">Chat with {COACHES[selectedCoach].name}</h1>
                  <p className="text-white/80 text-sm">{COACHES[selectedCoach].title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Tab Content */}
        {activeMode === 'voice' && (
          <div className="flex-1 container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <VoiceTabContent
                userId={user?.id ?? ''}
                ghlContactId={userProfile?.ghl_contact_id ?? null}
                verifiedPhone={userProfile?.verified_phone ?? null}
                userName={userProfile?.full_name?.split(' ')[0] ?? null}
              />
            </div>
          </div>
        )}

        {/* Text Chat Content */}
        {activeMode === 'chat' && (
          <>
            <div className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Messages and Voice Calls */}
                <div className="space-y-6 mb-6">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading conversation...</span>
                    </div>
                  ) : (
                    chatItems.map((item) => (
                      <div
                        key={item.type === 'message' ? item.data.id : `voice-${item.data.id}`}
                        id={item.type === 'voice_call' ? `voice-${item.data.id}` : undefined}
                      >
                        {item.type === 'message' ? (
                          <ChatMessage
                            role={item.data.role}
                            content={item.data.content}
                            timestamp={item.data.timestamp}
                            coachType={item.data.coachType}
                          />
                        ) : (
                          <VoiceCallCard
                            call={item.data}
                            userTimezone={userProfile?.timezone ?? undefined}
                          />
                        )}
                      </div>
                    ))
                  )}

                  {/* Loading Animation */}
                  {isTyping && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <img
                        src={COACHES[selectedCoach].avatar}
                        alt={COACHES[selectedCoach].name}
                        className="w-16 h-16 rounded-full object-cover animate-pulse"
                      />
                      <p className="text-muted-foreground text-sm">{COACHES[selectedCoach].name} is thinking...</p>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t sticky bottom-0 bg-background">
              <div className="container mx-auto px-4 py-4">
                <div className="max-w-4xl mx-auto">
                  {activeConversationId && (messages.length > 0 || voiceCalls.length > 0) && (
                    <div className="text-xs text-center mb-2 text-muted-foreground">
                      Active conversation • {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                      {voiceCalls.length > 0 && ` • ${voiceCalls.length} voice ${voiceCalls.length === 1 ? 'call' : 'calls'}`}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        placeholder={`Ask ${COACHES[selectedCoach].name} about ${COACHES[selectedCoach].expertise[0].toLowerCase()}...`}
                        className="flex-1 pr-10"
                        disabled={isTyping || isLoadingHistory}
                      />
                      <div className="absolute right-1">
                        <VoiceInputButton
                          onTranscript={(text) => setInput(prev => prev ? `${prev} ${text}` : text)}
                          onTranscriptUpdate={(text) => setInput(text)}
                          disabled={isTyping || isLoadingHistory}
                          variant="default"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleSend}
                      size="icon"
                      disabled={isTyping || isLoadingHistory || !input.trim()}
                      style={{ background: COACHES[selectedCoach].gradient }}
                      className="text-white hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs mt-2 text-center text-muted-foreground">
                    Currently chatting with {COACHES[selectedCoach].name} • {COACHES[selectedCoach].title}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarInset>
  );
}

// Main ChatPage component with providers
const ChatPage = () => {
  const [activeMode, setActiveMode] = useState<ChatMode>('chat');

  return (
    <SidebarProvider defaultOpen={true}>
      <ChatSidebar onModeChange={setActiveMode} />
      <ChatPageContent activeMode={activeMode} onModeChange={setActiveMode} />
    </SidebarProvider>
  );
};

export default ChatPage;
