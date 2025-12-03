// ============================================================================
// AGENT SELECTOR COMPONENT
// ============================================================================
// Visual agent selector with colored cards for Nette, MIO, and ME
// ============================================================================

import { cn } from '@/lib/utils';
import { AgentType, AGENT_CONFIGS } from '@/types/knowledgeManagement';
import { Check } from 'lucide-react';

interface AgentSelectorProps {
  value: AgentType;
  onChange: (agent: AgentType) => void;
  disabled?: boolean;
}

export function AgentSelector({ value, onChange, disabled }: AgentSelectorProps) {
  const agents: AgentType[] = ['nette', 'mio', 'me'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {agents.map((agent) => {
        const config = AGENT_CONFIGS[agent];
        const isSelected = value === agent;

        return (
          <button
            key={agent}
            onClick={() => !disabled && onChange(agent)}
            disabled={disabled}
            className={cn(
              'relative p-4 rounded-lg border-2 transition-all text-left',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
              isSelected
                ? 'border-transparent ring-2 ring-offset-2'
                : 'border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              borderColor: isSelected ? config.color : undefined,
              ringColor: isSelected ? config.color : undefined,
            }}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.color }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Agent avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3"
              style={{ background: config.gradient }}
            >
              {config.name[0]}
            </div>

            {/* Agent info */}
            <h3 className="font-semibold text-lg mb-1">{config.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {config.description}
            </p>

            {/* Table indicator */}
            <div className="mt-3 text-xs text-muted-foreground font-mono bg-gray-100 rounded px-2 py-1 inline-block">
              {config.tableName}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Compact version for smaller spaces
interface AgentSelectorCompactProps {
  value: AgentType;
  onChange: (agent: AgentType) => void;
  disabled?: boolean;
}

export function AgentSelectorCompact({ value, onChange, disabled }: AgentSelectorCompactProps) {
  const agents: AgentType[] = ['nette', 'mio', 'me'];

  return (
    <div className="flex gap-2">
      {agents.map((agent) => {
        const config = AGENT_CONFIGS[agent];
        const isSelected = value === agent;

        return (
          <button
            key={agent}
            onClick={() => !disabled && onChange(agent)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
              isSelected
                ? 'border-transparent shadow-sm'
                : 'border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              backgroundColor: isSelected ? `${config.color}15` : undefined,
              borderColor: isSelected ? config.color : undefined,
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: config.gradient }}
            >
              {config.name[0]}
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                isSelected && 'font-semibold'
              )}
              style={{ color: isSelected ? config.color : undefined }}
            >
              {config.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Stats card version showing chunk counts
interface AgentStatCardProps {
  agent: AgentType;
  chunkCount: number;
  lastUpdated?: string;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentStatCard({
  agent,
  chunkCount,
  lastUpdated,
  isSelected,
  onClick,
}: AgentStatCardProps) {
  const config = AGENT_CONFIGS[agent];

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-lg border-2 transition-all text-left w-full',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
        isSelected
          ? 'border-transparent'
          : 'border-gray-200 hover:border-gray-300'
      )}
      style={{
        borderColor: isSelected ? config.color : undefined,
        backgroundColor: isSelected ? `${config.color}08` : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ background: config.gradient }}
        >
          {config.name[0]}
        </div>

        {isSelected && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: config.color }}
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <h3 className="font-semibold mt-3">{config.name}</h3>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: config.color }}>
          {chunkCount.toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground">chunks</span>
      </div>

      {lastUpdated && (
        <p className="text-xs text-muted-foreground mt-1">
          Updated {new Date(lastUpdated).toLocaleDateString()}
        </p>
      )}
    </button>
  );
}
