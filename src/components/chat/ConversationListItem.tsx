import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, MoreHorizontal, Pencil, Archive, Check, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ConversationMetadata } from '@/services/conversationMetadataService';
import { COACHES, CoachType } from '@/types/coach';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ConversationListItemProps {
  conversation: ConversationMetadata;
  isActive: boolean;
  onClick: () => void;
  onRename: (newTitle: string) => Promise<boolean>;
  onArchive: () => Promise<boolean>;
  userTimezone?: string;
}

// Format relative time with optional timezone
function formatRelativeTime(dateString: string, userTimezone?: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (userTimezone) {
    options.timeZone = userTimezone;
  }
  return date.toLocaleDateString('en-US', options);
}

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
  onRename,
  onArchive,
  userTimezone,
}: ConversationListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Check if we're in the Mind Insurance section for dark theme
  const isMindInsurance = useMemo(() => {
    return location.pathname.startsWith('/mind-insurance');
  }, [location.pathname]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(conversation.title);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || editTitle === conversation.title) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    const success = await onRename(editTitle.trim());
    setIsSubmitting(false);

    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onArchive();
  };

  const coach = COACHES[conversation.coach_type as CoachType] || COACHES.nette;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors',
        isActive
          ? isMindInsurance
            ? 'bg-mi-navy text-white'
            : 'bg-sidebar-accent text-sidebar-accent-foreground'
          : isMindInsurance
            ? 'hover:bg-mi-navy/50'
            : 'hover:bg-sidebar-accent/50'
      )}
      onClick={isEditing ? undefined : onClick}
    >
      {/* Coach Avatar */}
      <img
        src={coach.avatar}
        alt={coach.name}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-6 text-sm py-0 px-1"
              disabled={isSubmitting}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleSaveEdit}
              disabled={isSubmitting}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <p className={cn(
              "text-sm font-medium truncate",
              isMindInsurance && "text-white"
            )}>
              {conversation.title}
            </p>
            {conversation.preview_text && (
              <p className={cn(
                "text-xs truncate mt-0.5",
                isMindInsurance ? "text-gray-400" : "text-muted-foreground"
              )}>
                {conversation.preview_text}
              </p>
            )}
          </>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            "text-xs",
            isMindInsurance ? "text-gray-500" : "text-muted-foreground"
          )}>
            {formatRelativeTime(conversation.last_message_at, userTimezone)}
          </span>
          {conversation.message_count > 0 && (
            <span className={cn(
              "text-xs flex items-center gap-0.5",
              isMindInsurance ? "text-gray-500" : "text-muted-foreground"
            )}>
              <MessageSquare className="h-3 w-3" />
              {conversation.message_count}
            </span>
          )}
        </div>
      </div>

      {/* Actions Menu (visible on hover or when active) */}
      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                isActive && 'opacity-100'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleStartEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleArchive}
              className="text-destructive focus:text-destructive"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
