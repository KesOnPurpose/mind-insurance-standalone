/**
 * Sanitize AI responses by removing internal reference codes that users shouldn't see.
 * This includes tactic codes (T123, T456), source references, and other internal markers.
 */

/**
 * Remove tactic codes from AI responses.
 * Patterns handled:
 * - "(Tactic T123)" or "(Tactic T123/T456)"
 * - "Tactic T123" standalone
 * - "(T123)" or "(T123/T456)"
 * - Reference to multiple tactics like "T280/T281"
 */
export function removeTacticCodes(text: string): string {
  if (!text) return text;

  let result = text;

  // Remove "(Tactic T123)" or "(Tactic T123/T456)" patterns
  result = result.replace(/\s*\(Tactic\s+T\d+(?:\/T\d+)*\)/gi, '');

  // Remove standalone "Tactic T123" references
  result = result.replace(/\bTactic\s+T\d+(?:\/T\d+)*/gi, '');

  // Remove "(T123)" or "(T123/T456)" patterns
  result = result.replace(/\s*\(T\d+(?:\/T\d+)*\)/g, '');

  // Remove "T123" codes that appear after colons or in lists (common pattern)
  // But be careful not to remove legitimate uses like "T-shirt"
  result = result.replace(/:\s*T\d+(?:\/T\d+)*/g, ':');

  // Clean up any double spaces left behind
  result = result.replace(/  +/g, ' ');

  // Clean up empty parentheses that might remain
  result = result.replace(/\(\s*\)/g, '');

  return result.trim();
}

/**
 * ANI-200-A: Convert markdown headers to bold text for chat display.
 * Headers (###, ##, #) look oversized in chat bubbles and appear as
 * literal text in the GlossaryTooltip path (which doesn't use ReactMarkdown).
 * Convert them to **bold** which renders well in both paths.
 */
export function convertMarkdownHeaders(text: string): string {
  if (!text) return text;

  // Convert ### Header, ## Header, # Header to **Header**
  // Handles 1-6 hash marks at the start of a line
  return text.replace(/^#{1,6}\s+(.+)$/gm, '**$1**');
}

/**
 * Sanitize AI response content for display to users.
 * Applies all necessary cleaning transformations.
 */
export function sanitizeAIResponse(content: string): string {
  if (!content) return content;

  let sanitized = content;

  // Remove tactic codes
  sanitized = removeTacticCodes(sanitized);

  // ANI-200-A: Convert markdown headers to bold (chat-friendly)
  sanitized = convertMarkdownHeaders(sanitized);

  return sanitized;
}
