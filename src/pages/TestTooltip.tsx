import { GlossaryTooltip } from "@/components/protocol/GlossaryTooltip";
import ChatMessage from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TestTooltip = () => {
  // Sample messages with glossary markup
  const testMessages = [
    {
      id: "1",
      role: "assistant" as const,
      content: "Your behavior has been {{inconsistent||not steady or regular}} with your goals. Let's work on creating more {{alignment||arrangement in correct relative positions}} between your actions and aspirations.",
      timestamp: new Date(),
      coachType: 'mio' as const
    },
    {
      id: "2",
      role: "user" as const,
      content: "I understand. I need to be more consistent.",
      timestamp: new Date(),
      coachType: 'mio' as const
    },
    {
      id: "3",
      role: "assistant" as const,
      content: "Perfect! Remember, {{breakthrough||a sudden, dramatic, and important discovery or development}} moments come from maintaining {{persistence||firm or obstinate continuance in a course of action despite difficulty}}. Your {{identity collision||the conflict between who you are and who you're becoming}} work is showing progress.",
      timestamp: new Date(),
      coachType: 'mio' as const
    }
  ];

  const handleTooltipInteraction = (term: string, action: 'hover' | 'click') => {
    console.log('[Test Page Tooltip]', action, term);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="container mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Glossary Tooltip Test Page</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Direct GlossaryTooltip Component</h2>
            <div className="bg-card p-6 rounded-lg">
              <GlossaryTooltip
                text="This demonstrates the {{GlossaryTooltip||A React component that renders interactive tooltips for glossary terms}} component. Terms like {{hover||to remain suspended over a place or object}} and {{click||press and release a button quickly}} are automatically converted to tooltips."
                onTooltipInteraction={handleTooltipInteraction}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">ChatMessage Component with Tooltips</h2>
            <div className="space-y-4">
              {testMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  coachType={message.coachType}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-card p-6 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Open browser console to see tooltip interaction logs</p>
              <div className="space-y-1">
                <p>✓ Underlined terms should be visible</p>
                <p>✓ Hovering shows tooltip with definition</p>
                <p>✓ Mobile tap behavior (resize window to test)</p>
                <p>✓ No raw {`{{...}}`} markup visible</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TestTooltip;