import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { COACHES, CoachType } from "@/types/coach";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  coachType?: CoachType;
}

const ChatMessage = ({ role, content, timestamp, coachType = 'nette' }: ChatMessageProps) => {
  const coach = COACHES[coachType];
  const isUser = role === "user";

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
          isUser ? "bg-primary text-primary-foreground" : "bg-card"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold" style={{ color: coach.color }}>
              {coach.name}
            </span>
            <span className="text-xs text-muted-foreground">• {coach.title}</span>
          </div>
        )}
        <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <span
          className={`text-xs mt-2 block ${
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
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
