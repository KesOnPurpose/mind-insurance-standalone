// ============================================================================
// FEAT-GH-016: Preview Button Component
// ============================================================================
// Opens preview in new tab
// ============================================================================

import { Button } from '@/components/ui/button';
import { Eye, ExternalLink } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface PreviewButtonProps {
  programId: string;
  lessonId: string;
  status: 'draft' | 'published';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const PreviewButton = ({
  programId,
  lessonId,
  status,
  variant = 'outline',
  size = 'default',
  showIcon = true,
  className,
}: PreviewButtonProps) => {
  const handlePreview = () => {
    const url = `/programs/${programId}/lessons/${lessonId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePreview}
      className={className}
    >
      {showIcon && (
        status === 'published' ? (
          <Eye className="mr-2 h-4 w-4" />
        ) : (
          <ExternalLink className="mr-2 h-4 w-4" />
        )
      )}
      {status === 'published' ? 'View Live' : 'Preview Draft'}
    </Button>
  );
};

export default PreviewButton;
