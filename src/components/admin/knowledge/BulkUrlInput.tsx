// ============================================================================
// BULK URL INPUT COMPONENT
// ============================================================================
// Textarea-based input for pasting multiple URLs at once (one per line)
// Auto-detects source type from URL pattern and validates URLs
// ============================================================================

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  KnowledgeSourceType,
  SOURCE_TYPE_CONFIGS,
} from '@/types/knowledgeManagement';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  FolderOpen,
  BookOpen,
  Link,
} from 'lucide-react';

// URL validation patterns for auto-detection
const URL_PATTERNS: Record<KnowledgeSourceType, RegExp> = {
  google_docs: /^https:\/\/docs\.google\.com\/document\//,
  google_drive: /^https:\/\/drive\.google\.com\//,
  notion: /^https:\/\/(www\.)?notion\.so\//,
  file_upload: /^$/, // Won't match any URL
};

export interface ParsedUrl {
  url: string;
  sourceType: KnowledgeSourceType | null;
  isValid: boolean;
  error?: string;
}

export interface BulkUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Detect source type from URL pattern
 */
function detectSourceType(url: string): KnowledgeSourceType | null {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  for (const [type, pattern] of Object.entries(URL_PATTERNS)) {
    if (type !== 'file_upload' && pattern.test(trimmedUrl)) {
      return type as KnowledgeSourceType;
    }
  }
  return null;
}

/**
 * Validate and parse a single URL
 */
function parseUrl(url: string): ParsedUrl {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return { url: trimmedUrl, sourceType: null, isValid: false };
  }

  // Basic URL validation
  try {
    new URL(trimmedUrl);
  } catch {
    return {
      url: trimmedUrl,
      sourceType: null,
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  const sourceType = detectSourceType(trimmedUrl);

  if (!sourceType) {
    return {
      url: trimmedUrl,
      sourceType: null,
      isValid: false,
      error: 'URL must be from Google Docs, Google Drive, or Notion',
    };
  }

  return {
    url: trimmedUrl,
    sourceType,
    isValid: true,
  };
}

/**
 * Parse multiple URLs from textarea content
 */
export function parseUrls(content: string): ParsedUrl[] {
  const lines = content.split('\n');
  const parsed: ParsedUrl[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      parsed.push(parseUrl(trimmed));
    }
  }

  return parsed;
}

/**
 * Get source type counts from parsed URLs
 */
function getSourceTypeCounts(parsedUrls: ParsedUrl[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const parsed of parsedUrls) {
    if (parsed.sourceType) {
      counts[parsed.sourceType] = (counts[parsed.sourceType] || 0) + 1;
    }
  }

  return counts;
}

const SOURCE_ICONS: Record<KnowledgeSourceType, React.ReactNode> = {
  google_drive: <FolderOpen className="h-4 w-4" />,
  google_docs: <FileText className="h-4 w-4" />,
  notion: <BookOpen className="h-4 w-4" />,
  file_upload: <Link className="h-4 w-4" />,
};

export function BulkUrlInput({
  value,
  onChange,
  disabled,
  placeholder = 'Paste URLs here, one per line:\nhttps://docs.google.com/document/d/xxx\nhttps://docs.google.com/document/d/yyy\nhttps://drive.google.com/file/d/zzz',
}: BulkUrlInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Parse URLs and get stats
  const parsedUrls = useMemo(() => parseUrls(value), [value]);
  const validUrls = useMemo(() => parsedUrls.filter((p) => p.isValid), [parsedUrls]);
  const invalidUrls = useMemo(() => parsedUrls.filter((p) => !p.isValid), [parsedUrls]);
  const sourceTypeCounts = useMemo(() => getSourceTypeCounts(validUrls), [validUrls]);

  const hasContent = value.trim().length > 0;
  const hasValidUrls = validUrls.length > 0;
  const hasInvalidUrls = invalidUrls.length > 0;

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="bulk-urls">Paste URLs (one per line)</Label>
        <Textarea
          id="bulk-urls"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'min-h-[200px] font-mono text-sm',
            isFocused && 'ring-2 ring-ring ring-offset-2',
            hasInvalidUrls && hasContent && 'border-yellow-500'
          )}
        />
      </div>

      {/* Validation Summary */}
      {hasContent && (
        <div className="space-y-3">
          {/* Valid URLs */}
          {hasValidUrls && (
            <div className="flex items-start gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">{validUrls.length} valid URL{validUrls.length !== 1 ? 's' : ''} detected</span>
                {Object.keys(sourceTypeCounts).length > 0 && (
                  <ul className="mt-1 text-muted-foreground">
                    {Object.entries(sourceTypeCounts).map(([type, count]) => (
                      <li key={type} className="flex items-center gap-2">
                        {SOURCE_ICONS[type as KnowledgeSourceType]}
                        <span>
                          {count} {SOURCE_TYPE_CONFIGS[type as KnowledgeSourceType]?.label || type}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Invalid URLs */}
          {hasInvalidUrls && (
            <div className="flex items-start gap-2 text-sm text-yellow-600">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">{invalidUrls.length} invalid URL{invalidUrls.length !== 1 ? 's' : ''} (will be skipped)</span>
                <ul className="mt-1 text-xs text-muted-foreground max-h-[100px] overflow-y-auto">
                  {invalidUrls.slice(0, 5).map((invalid, i) => (
                    <li key={i} className="truncate max-w-[400px]">
                      {invalid.url || '(empty line)'}: {invalid.error || 'Invalid'}
                    </li>
                  ))}
                  {invalidUrls.length > 5 && (
                    <li className="text-muted-foreground">...and {invalidUrls.length - 5} more</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* No valid URLs */}
          {!hasValidUrls && hasContent && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>No valid URLs detected. Supported: Google Docs, Google Drive, Notion</span>
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Supported sources: Google Docs, Google Drive folders/files, Notion pages.
        Each URL will be processed separately and added to the queue.
      </p>
    </div>
  );
}

// Export helper for use in parent components
export { parseUrls as parseBulkUrls };
