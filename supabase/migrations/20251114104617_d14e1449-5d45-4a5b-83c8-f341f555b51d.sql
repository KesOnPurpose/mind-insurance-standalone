-- Phase 0: Foundation - Create tables and add filtering columns

-- 1. Create user_onboarding table for GHFN assessment results
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Assessment Scores
  financial_score DECIMAL(5,2),
  market_score DECIMAL(5,2),
  operational_score DECIMAL(5,2),
  mindset_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  
  -- Readiness Level (calculated from overall_score)
  readiness_level TEXT CHECK (readiness_level IN ('foundation_building', 'accelerated_learning', 'fast_track', 'expert_implementation')),
  
  -- User Responses (storing raw assessment data)
  capital_available TEXT CHECK (capital_available IN ('less-5k', '5k-15k', '15k-30k', '30k-50k', 'more-50k')),
  credit_score_range TEXT CHECK (credit_score_range IN ('below-580', '580-650', '650-700', '700-750', 'above-750')),
  income_stability TEXT CHECK (income_stability IN ('unstable', 'somewhat-stable', 'stable', 'very-stable')),
  creative_financing_knowledge TEXT CHECK (creative_financing_knowledge IN ('none', 'basic', 'intermediate', 'advanced')),
  
  licensing_familiarity TEXT CHECK (licensing_familiarity IN ('not-familiar', 'somewhat-familiar', 'very-familiar')),
  target_populations TEXT[], -- ['seniors', 'adults-with-disabilities', 'youth', etc.]
  market_demand_research TEXT CHECK (market_demand_research IN ('none', 'some', 'extensive')),
  revenue_understanding TEXT CHECK (revenue_understanding IN ('none', 'basic', 'good', 'excellent')),
  
  caregiving_experience TEXT CHECK (caregiving_experience IN ('no-experience', 'some-experience', 'extensive-experience', 'licensed-professional')),
  time_commitment TEXT CHECK (time_commitment IN ('part-time', 'full-time', 'flexible')),
  support_team TEXT CHECK (support_team IN ('none', 'family', 'planning-to-hire', 'already-have-team')),
  property_management_comfort TEXT CHECK (property_management_comfort IN ('uncomfortable', 'somewhat-comfortable', 'comfortable', 'experienced')),
  
  primary_motivation TEXT,
  commitment_level INTEGER CHECK (commitment_level >= 1 AND commitment_level <= 10),
  timeline TEXT CHECK (timeline IN ('within-3-months', 'within-6-months', 'within-year', 'exploring')),
  
  -- Metadata
  assessment_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_onboarding
CREATE POLICY "Users can view own onboarding data"
  ON public.user_onboarding
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data"
  ON public.user_onboarding
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data"
  ON public.user_onboarding
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_onboarding_user_id ON public.user_onboarding(user_id);

-- 2. Create agent_conversations table for three-agent system
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Agent Information
  agent_type TEXT NOT NULL CHECK (agent_type IN ('nette', 'mio', 'me')),
  
  -- Message Data
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  
  -- Handoff Information
  is_handoff BOOLEAN DEFAULT FALSE,
  handoff_from_agent TEXT CHECK (handoff_from_agent IN ('nette', 'mio', 'me')),
  handoff_reason TEXT,
  handoff_context JSONB,
  
  -- Conversation Metadata
  conversation_turn INTEGER DEFAULT 1,
  session_id UUID, -- Groups messages in same conversation session
  
  -- User Context (snapshot at time of message)
  user_context JSONB, -- Includes assessment scores, progress, current week, etc.
  
  -- Semantic Analysis
  message_embedding vector(1536), -- For similarity matching
  detected_intent TEXT,
  confidence_score DECIMAL(3,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance Metrics
  response_time_ms INTEGER,
  tokens_used INTEGER
);

-- Enable RLS on agent_conversations
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_conversations
CREATE POLICY "Users can view own conversations"
  ON public.agent_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.agent_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_agent_conversations_user_id ON public.agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_session_id ON public.agent_conversations(session_id);
CREATE INDEX idx_agent_conversations_agent_type ON public.agent_conversations(agent_type);
CREATE INDEX idx_agent_conversations_created_at ON public.agent_conversations(created_at DESC);

-- 3. Add filtering columns to gh_tactic_instructions
ALTER TABLE public.gh_tactic_instructions
  ADD COLUMN IF NOT EXISTS capital_required TEXT CHECK (capital_required IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS target_populations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS priority_tier INTEGER CHECK (priority_tier >= 1 AND priority_tier <= 3);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_tactic_capital_required ON public.gh_tactic_instructions(capital_required);
CREATE INDEX IF NOT EXISTS idx_tactic_experience_level ON public.gh_tactic_instructions(experience_level);
CREATE INDEX IF NOT EXISTS idx_tactic_priority_tier ON public.gh_tactic_instructions(priority_tier);

-- Create trigger for updated_at on user_onboarding
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();