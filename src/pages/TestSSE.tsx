import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSSE() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TestSSE ${timestamp}] ${message}`);
  };

  // Helper function to check if JSON is complete
  const isCompleteJson = (str: string): boolean => {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\') {
        escape = true;
        continue;
      }

      if (char === '"' && !escape) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{' || char === '[') depth++;
      if (char === '}' || char === ']') depth--;
    }

    return depth === 0 && !inString;
  };

  const testSSEStream = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResponse("");
    setLogs([]);
    addLog("Starting SSE test...");

    try {
      const CHAT_URL = `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/mio-chat`;

      addLog(`Sending request to: ${CHAT_URL}`);

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: 'test-user-123',
          message: input,
          current_agent: 'nette',
          conversation_id: 'test-conv-' + Date.now(),
        }),
      });

      addLog(`Response status: ${response.status}`);

      if (!response.ok) {
        addLog(`Error: ${response.status} ${response.statusText}`);
        setResponse(`Error: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        addLog("No reader available");
        setLoading(false);
        return;
      }

      let textBuffer = '';
      let incompleteDataLine = '';
      let streamDone = false;
      let chunkCount = 0;
      let bufferHits = 0;
      let parseErrors = 0;
      let fullContent = '';

      addLog("Starting to read stream...");

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) {
          addLog(`Stream done after ${chunkCount} chunks`);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        addLog(`Chunk #${chunkCount}: ${chunk.substring(0, 100)}...`);
        textBuffer += chunk;

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;

          // Handle buffered incomplete data line
          if (incompleteDataLine) {
            line = incompleteDataLine + line;
            incompleteDataLine = '';
          }

          if (!line.startsWith("data: ")) {
            addLog(`Skipping non-data line: ${line.substring(0, 50)}`);
            continue;
          }

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            addLog("Received [DONE] signal");
            streamDone = true;
            break;
          }

          // Check if JSON is complete before parsing
          if (!isCompleteJson(jsonStr)) {
            bufferHits++;
            addLog(`Incomplete JSON detected (buffer hit #${bufferHits})`);
            incompleteDataLine = line;
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            addLog(`Successfully parsed: ${JSON.stringify(parsed).substring(0, 100)}...`);

            const content = parsed.choices?.[0]?.delta?.content;
            if (content !== undefined) {
              fullContent += content;
              setResponse(fullContent);
            }
          } catch (err) {
            parseErrors++;
            addLog(`Parse error #${parseErrors}: ${err}`);
          }
        }
      }

      // Log final statistics
      addLog(`=== Stream Statistics ===`);
      addLog(`Total chunks: ${chunkCount}`);
      addLog(`Buffer hits: ${bufferHits}`);
      addLog(`Parse errors: ${parseErrors}`);
      addLog(`Final content length: ${fullContent.length}`);
      addLog(`=== Test Complete ===`);

    } catch (error) {
      addLog(`Fatal error: ${error}`);
      setResponse(`Error: ${error}`);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>SSE Streaming Test - JSON Parse Error Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your message to test SSE streaming..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  testSSEStream();
                }
              }}
            />
            <Button onClick={testSSEStream} disabled={loading}>
              {loading ? "Streaming..." : "Test SSE"}
            </Button>
          </div>

          {response && (
            <div className="border rounded p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Response:</h3>
              <p className="whitespace-pre-wrap">{response}</p>
            </div>
          )}

          <div className="border rounded p-4 bg-gray-900 text-gray-100 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2 text-white">Console Logs:</h3>
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, idx) => (
                <div key={idx} className={
                  log.includes('error') || log.includes('Error') ? 'text-red-400' :
                  log.includes('buffer hit') ? 'text-yellow-400' :
                  log.includes('Successfully') ? 'text-green-400' :
                  log.includes('===') ? 'text-cyan-400 font-bold' :
                  'text-gray-300'
                }>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}