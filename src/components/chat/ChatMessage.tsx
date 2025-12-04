import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { COACHES, CoachType } from "@/types/coach";
import ReactMarkdown from "react-markdown";
import { GlossaryTooltip } from "@/components/protocol/GlossaryTooltip";
import { useMemo, useCallback } from "react";
import { sanitizeAIResponse } from "@/utils/sanitizeResponse";
import { useProduct } from "@/contexts/ProductContext";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  coachType?: CoachType;
}

const ChatMessage = ({ role, content, timestamp, coachType = 'nette' }: ChatMessageProps) => {
  const { currentProduct } = useProduct();
  const isMindInsurance = currentProduct === 'mind-insurance';
  const coach = COACHES[coachType];
  const isUser = role === "user";

  // Sanitize assistant messages to remove internal codes (tactic codes, etc.)
  const displayContent = useMemo(() => {
    if (isUser) return content;
    return sanitizeAIResponse(content);
  }, [content, isUser]);

  // Extract glossary terms from the content for analytics
  const extractedTerms = useMemo(() => {
    if (isUser) return [];
    const regex = /\{\{([^|]+)\|\|[^}]+\}\}/g;
    const terms: string[] = [];
    let match;
    while ((match = regex.exec(displayContent)) !== null) {
      terms.push(match[1]);
    }
    return terms;
  }, [displayContent, isUser]);

  // Handle tooltip interactions for analytics
  const handleTooltipInteraction = useCallback((term: string, action: 'hover' | 'click') => {
    console.log('[Tooltip]', action, term);
    // Optional: Add analytics tracking here
    // Example: track('tooltip_interaction', { term, action, coach: coachType });
  }, [coachType]);

  // Check if content contains glossary markup
  const hasGlossaryMarkup = useMemo(() => {
    return /\{\{[^|]+\|\|[^}]+\}\}/.test(displayContent);
  }, [displayContent]);

  // Render content with or without glossary tooltips
  const renderContent = () => {
    // For user messages or assistant messages without glossary markup, use ReactMarkdown
    if (isUser || !hasGlossaryMarkup) {
      return (
        <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{displayContent}</ReactMarkdown>
        </div>
      );
    }

    // For assistant messages with glossary markup, use GlossaryTooltip
    // Note: GlossaryTooltip handles the raw text, so we pass the content directly
    return (
      <div className="text-sm leading-relaxed">
        <GlossaryTooltip
          text={displayContent}
          glossaryTerms={extractedTerms}
          onTooltipInteraction={handleTooltipInteraction}
        />
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className={`w-10 h-10 flex-shrink-0`}>
        <div
          className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ background: isUser ? 'hsl(var(--muted))' : coach.gradient }}
        >
          {isUser ? "Y" : coach.avatar}
        </div>
      </Avatar>

      <Card
        className={`p-4 max-w-[80%] ${
          isUser
            ? isMindInsurance
              ? "bg-[#05c3dd] text-white"
              : "bg-primary text-primary-foreground"
            : isMindInsurance
              ? "bg-[#132337] border border-[#05c3dd]/20 text-white"
              : "bg-card"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold" style={{ color: coach.color }}>
              {coach.name}
            </span>
            <span className={`text-xs ${isMindInsurance ? 'text-gray-400' : 'text-muted-foreground'}`}>• {coach.title}</span>
          </div>
        )}
        {renderContent()}
        <span
          className={`text-xs mt-2 block ${
            isUser
              ? isMindInsurance
                ? "text-white/70"
                : "text-primary-foreground/70"
              : isMindInsurance
                ? "text-gray-400"
                : "text-muted-foreground"
          }`}
        >
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </Card>
    </div>
  );
};

export default ChatMessage;
