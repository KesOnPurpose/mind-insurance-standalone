// ============================================================================
// KNOWLEDGE SOURCE INPUT COMPONENT
// ============================================================================
// Tabbed interface for different knowledge source types:
// - Google Drive
// - Google Docs
// - Notion
// - File Upload
// ============================================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  KnowledgeSourceType,
  SOURCE_TYPE_CONFIGS,
} from '@/types/knowledgeManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FolderOpen,
  FileText,
  BookOpen,
  Upload,
  Link,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';

interface KnowledgeSourceInputProps {
  value: {
    sourceType: KnowledgeSourceType;
    sourceUrl?: string;
    sourceTitle?: string;
    content?: string;
    file?: File;
  };
  onChange: (value: {
    sourceType: KnowledgeSourceType;
    sourceUrl?: string;
    sourceTitle?: string;
    content?: string;
    file?: File;
  }) => void;
  disabled?: boolean;
}

const SOURCE_ICONS: Record<KnowledgeSourceType, React.ReactNode> = {
  google_drive: <FolderOpen className="h-4 w-4" />,
  google_docs: <FileText className="h-4 w-4" />,
  notion: <BookOpen className="h-4 w-4" />,
  file_upload: <Upload className="h-4 w-4" />,
};

export function KnowledgeSourceInput({
  value,
  onChange,
  disabled,
}: KnowledgeSourceInputProps) {
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleSourceTypeChange = (newType: KnowledgeSourceType) => {
    onChange({
      ...value,
      sourceType: newType,
      sourceUrl: undefined,
      content: undefined,
      file: undefined,
    });
    setUrlError(null);
  };

  const validateUrl = (url: string, sourceType: KnowledgeSourceType): boolean => {
    const config = SOURCE_TYPE_CONFIGS[sourceType];
    if (!config.validationPattern) return true;
    return config.validationPattern.test(url);
  };

  const handleUrlChange = (url: string) => {
    setUrlError(null);

    if (url && !validateUrl(url, value.sourceType)) {
      setUrlError(`Please enter a valid ${SOURCE_TYPE_CONFIGS[value.sourceType].label} URL`);
    }

    onChange({
      ...value,
      sourceUrl: url,
    });
  };

  const handleFileChange = (file: File | null) => {
    onChange({
      ...value,
      file: file || undefined,
      sourceTitle: file?.name,
    });
  };

  const handleTextChange = (text: string) => {
    onChange({
      ...value,
      content: text,
    });
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={value.sourceType}
        onValueChange={(v) => handleSourceTypeChange(v as KnowledgeSourceType)}
      >
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(SOURCE_TYPE_CONFIGS).map(([key, config]) => (
            <TabsTrigger
              key={key}
              value={key}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              {SOURCE_ICONS[key as KnowledgeSourceType]}
              <span className="hidden sm:inline">{config.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Google Drive Tab */}
        <TabsContent value="google_drive" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="drive-url">Google Drive URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="drive-url"
                type="url"
                placeholder={SOURCE_TYPE_CONFIGS.google_drive.placeholder}
                value={value.sourceUrl || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={disabled}
                className={cn('pl-10', urlError && 'border-destructive')}
              />
            </div>
            {urlError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {urlError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Share link to a folder or file from Google Drive
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="drive-title">Title (optional)</Label>
            <Input
              id="drive-title"
              placeholder="Document title"
              value={value.sourceTitle || ''}
              onChange={(e) => onChange({ ...value, sourceTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </TabsContent>

        {/* Google Docs Tab */}
        <TabsContent value="google_docs" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="docs-url">Google Docs URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="docs-url"
                type="url"
                placeholder={SOURCE_TYPE_CONFIGS.google_docs.placeholder}
                value={value.sourceUrl || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={disabled}
                className={cn('pl-10', urlError && 'border-destructive')}
              />
            </div>
            {urlError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {urlError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Paste the share link from any Google Doc
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="docs-title">Title (optional)</Label>
            <Input
              id="docs-title"
              placeholder="Document title"
              value={value.sourceTitle || ''}
              onChange={(e) => onChange({ ...value, sourceTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </TabsContent>

        {/* Notion Tab */}
        <TabsContent value="notion" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="notion-url">Notion Page URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="notion-url"
                type="url"
                placeholder={SOURCE_TYPE_CONFIGS.notion.placeholder}
                value={value.sourceUrl || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={disabled}
                className={cn('pl-10', urlError && 'border-destructive')}
              />
            </div>
            {urlError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {urlError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Share link to a Notion page or database
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notion-title">Title (optional)</Label>
            <Input
              id="notion-title"
              placeholder="Page title"
              value={value.sourceTitle || ''}
              onChange={(e) => onChange({ ...value, sourceTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </TabsContent>

        {/* File Upload Tab */}
        <TabsContent value="file_upload" className="space-y-4 pt-4">
          <FileUploadZone
            file={value.file || null}
            onFileChange={handleFileChange}
            disabled={disabled}
          />

          <div className="space-y-2">
            <Label htmlFor="upload-title">Title (optional)</Label>
            <Input
              id="upload-title"
              placeholder="Document title"
              value={value.sourceTitle || ''}
              onChange={(e) => onChange({ ...value, sourceTitle: e.target.value })}
              disabled={disabled}
            />
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="direct-text">Or paste text directly</Label>
            <Textarea
              id="direct-text"
              placeholder="Paste knowledge content here..."
              value={value.content || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              disabled={disabled}
              className="mt-2 min-h-[150px]"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Validation indicator */}
      {value.sourceType !== 'file_upload' && value.sourceUrl && !urlError && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Valid URL format
        </div>
      )}
    </div>
  );
}

// Simplified version for quick URL input
interface QuickSourceInputProps {
  sourceType: KnowledgeSourceType;
  sourceUrl: string;
  onUrlChange: (url: string) => void;
  disabled?: boolean;
}

export function QuickSourceInput({
  sourceType,
  sourceUrl,
  onUrlChange,
  disabled,
}: QuickSourceInputProps) {
  const config = SOURCE_TYPE_CONFIGS[sourceType];

  return (
    <div className="relative">
      <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="url"
        placeholder={config.placeholder}
        value={sourceUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        disabled={disabled}
        className="pl-10"
      />
    </div>
  );
}
