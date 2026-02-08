// ============================================================================
// COMPLIANCE ASSESSMENT SERVICE
// ============================================================================
// Manages the guided compliance assessment (Phase 1 Workbook digitization).
// Handles assessment creation, section progress tracking, findings capture,
// and auto-population of binder from assessment completion.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  ComplianceAssessment,
  ComplianceFinding,
  AssessmentSectionProgress,
  AssessmentDetermination,
} from '@/types/compliance';
import { addItemToBinder } from './complianceBinderService';

// ============================================================================
// CONSTANTS
// ============================================================================

// Assessment section IDs following the Phase 1 Workbook structure
export const ASSESSMENT_SECTIONS = {
  MODEL_DEFINITION: '0',
  STATE_LICENSURE: '1.1',
  HOUSING_CATEGORIES: '1.2',
  LOCAL_RULES_OCCUPANCY: '1.3.1',
  LOCAL_RULES_HOUSEHOLD: '1.3.2',
  LOCAL_RULES_ZONING: '1.3.3',
  LOCAL_RULES_PERMITS: '1.3.4',
  LOCAL_RULES_PARKING: '1.3.5',
  LOCAL_RULES_SAFETY: '1.3.6',
  OPERATIONAL_CLASSIFICATION: '1.4',
  PHASE_GATE: '1.5',
} as const;

export const SECTION_ORDER = [
  '0', '1.1', '1.2', '1.3.1', '1.3.2', '1.3.3',
  '1.3.4', '1.3.5', '1.3.6', '1.4', '1.5',
];

export const SECTION_TITLES: Record<string, string> = {
  '0': 'Model Definition',
  '1.1': 'State Licensure Review',
  '1.2': 'State Housing Categories',
  '1.3.1': 'Local Rules: Occupancy Limits',
  '1.3.2': 'Local Rules: Household Definitions',
  '1.3.3': 'Local Rules: Zoning',
  '1.3.4': 'Local Rules: Permits',
  '1.3.5': 'Local Rules: Parking',
  '1.3.6': 'Local Rules: Safety Requirements',
  '1.4': 'Operational Classification',
  '1.5': 'Phase 1 Gate Assessment',
};

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAssessmentInput {
  state_code: string;
  binder_id?: string;
  model_definition?: string;
}

export interface UpdateAssessmentInput {
  model_definition?: string;
  final_determination?: AssessmentDetermination;
  section_progress?: AssessmentSectionProgress;
}

export interface CreateFindingInput {
  assessment_id: string;
  section_id: string;
  research_url?: string;
  pasted_language?: string;
  user_interpretation?: string;
  conclusion?: 'not_subject' | 'may_be_subject' | 'subject' | 'unclear';
  is_flagged?: boolean;
}

export interface UpdateFindingInput {
  research_url?: string;
  pasted_language?: string;
  user_interpretation?: string;
  conclusion?: 'not_subject' | 'may_be_subject' | 'subject' | 'unclear';
  is_flagged?: boolean;
}

export interface AssessmentWithFindings extends ComplianceAssessment {
  findings: ComplianceFinding[];
}

export interface SectionStatus {
  section_id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'complete';
  findings_count: number;
  has_flags: boolean;
}

// ============================================================================
// ASSESSMENT CRUD
// ============================================================================

/**
 * Create a new compliance assessment
 */
export async function createAssessment(
  input: CreateAssessmentInput
): Promise<ComplianceAssessment> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Initialize section progress
  const sectionProgress: AssessmentSectionProgress = {};
  SECTION_ORDER.forEach((sectionId) => {
    sectionProgress[sectionId] = 'not_started';
  });

  const { data, error } = await supabase
    .from('compliance_assessments')
    .insert({
      user_id: user.user.id,
      state_code: input.state_code,
      binder_id: input.binder_id,
      model_definition: input.model_definition,
      section_progress: sectionProgress,
      final_determination: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Create assessment error:', error);
    throw new Error('Failed to create assessment');
  }

  return data;
}

/**
 * Get user's assessments
 */
export async function getUserAssessments(): Promise<ComplianceAssessment[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('compliance_assessments')
    .select('*')
    .eq('user_id', user.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Get assessments error:', error);
    throw new Error('Failed to fetch assessments');
  }

  return data || [];
}

/**
 * Get assessment by ID with all findings
 */
export async function getAssessmentWithFindings(
  assessmentId: string
): Promise<AssessmentWithFindings | null> {
  const { data: assessment, error: assessmentError } = await supabase
    .from('compliance_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (assessmentError) {
    if (assessmentError.code === 'PGRST116') {
      return null;
    }
    console.error('Get assessment error:', assessmentError);
    throw new Error('Failed to fetch assessment');
  }

  const { data: findings, error: findingsError } = await supabase
    .from('compliance_findings')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: true });

  if (findingsError) {
    console.error('Get findings error:', findingsError);
    throw new Error('Failed to fetch findings');
  }

  return {
    ...assessment,
    findings: findings || [],
  };
}

/**
 * Get assessment by state code (most recent)
 */
export async function getAssessmentByState(
  stateCode: string
): Promise<ComplianceAssessment | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('compliance_assessments')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('state_code', stateCode)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Get assessment by state error:', error);
    throw new Error('Failed to fetch assessment');
  }

  return data;
}

/**
 * Get assessment by user ID and state code (for hook usage)
 */
export async function getAssessmentByUserAndState(
  userId: string,
  stateCode: string
): Promise<ComplianceAssessment | null> {
  const { data, error } = await supabase
    .from('compliance_assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('state_code', stateCode)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Get assessment by user and state error:', error);
    throw new Error('Failed to fetch assessment');
  }

  return data;
}

/**
 * Get all findings for an assessment
 */
export async function getAssessmentFindings(
  assessmentId: string
): Promise<ComplianceFinding[]> {
  const { data, error } = await supabase
    .from('compliance_findings')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Get assessment findings error:', error);
    throw new Error('Failed to fetch findings');
  }

  return data || [];
}

/**
 * Update assessment
 */
export async function updateAssessment(
  assessmentId: string,
  input: UpdateAssessmentInput
): Promise<ComplianceAssessment> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.model_definition !== undefined) {
    updateData.model_definition = input.model_definition;
  }

  if (input.final_determination !== undefined) {
    updateData.final_determination = input.final_determination;
  }

  if (input.section_progress !== undefined) {
    updateData.section_progress = input.section_progress;
  }

  const { data, error } = await supabase
    .from('compliance_assessments')
    .update(updateData)
    .eq('id', assessmentId)
    .select()
    .single();

  if (error) {
    console.error('Update assessment error:', error);
    throw new Error('Failed to update assessment');
  }

  return data;
}

/**
 * Delete assessment (and all findings via cascade)
 */
export async function deleteAssessment(assessmentId: string): Promise<void> {
  const { error } = await supabase
    .from('compliance_assessments')
    .delete()
    .eq('id', assessmentId);

  if (error) {
    console.error('Delete assessment error:', error);
    throw new Error('Failed to delete assessment');
  }
}

// ============================================================================
// SECTION PROGRESS
// ============================================================================

/**
 * Update section progress
 */
export async function updateSectionProgress(
  assessmentId: string,
  sectionId: string,
  status: 'not_started' | 'in_progress' | 'complete'
): Promise<ComplianceAssessment> {
  // Get current progress
  const { data: assessment } = await supabase
    .from('compliance_assessments')
    .select('section_progress')
    .eq('id', assessmentId)
    .single();

  const currentProgress = (assessment?.section_progress as AssessmentSectionProgress) || {};
  const updatedProgress = {
    ...currentProgress,
    [sectionId]: status,
  };

  return updateAssessment(assessmentId, { section_progress: updatedProgress });
}

/**
 * Mark section as started
 */
export async function startSection(
  assessmentId: string,
  sectionId: string
): Promise<ComplianceAssessment> {
  return updateSectionProgress(assessmentId, sectionId, 'in_progress');
}

/**
 * Mark section as complete
 */
export async function completeSection(
  assessmentId: string,
  sectionId: string
): Promise<ComplianceAssessment> {
  return updateSectionProgress(assessmentId, sectionId, 'complete');
}

/**
 * Get detailed section statuses
 */
export async function getSectionStatuses(
  assessmentId: string
): Promise<SectionStatus[]> {
  const assessment = await getAssessmentWithFindings(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  const progress = (assessment.section_progress as AssessmentSectionProgress) || {};

  return SECTION_ORDER.map((sectionId) => {
    const sectionFindings = assessment.findings.filter(
      (f) => f.section_id === sectionId
    );

    return {
      section_id: sectionId,
      title: SECTION_TITLES[sectionId] || sectionId,
      status: progress[sectionId] || 'not_started',
      findings_count: sectionFindings.length,
      has_flags: sectionFindings.some((f) => f.is_flagged),
    };
  });
}

/**
 * Get next incomplete section
 */
export async function getNextIncompleteSection(
  assessmentId: string
): Promise<string | null> {
  const statuses = await getSectionStatuses(assessmentId);
  const incomplete = statuses.find(
    (s) => s.status === 'not_started' || s.status === 'in_progress'
  );
  return incomplete?.section_id || null;
}

/**
 * Calculate overall assessment progress (0-100)
 */
export function calculateProgress(
  sectionProgress: AssessmentSectionProgress
): number {
  const totalSections = SECTION_ORDER.length;
  const completedSections = SECTION_ORDER.filter(
    (s) => sectionProgress[s] === 'complete'
  ).length;

  return Math.round((completedSections / totalSections) * 100);
}

// ============================================================================
// FINDINGS CRUD
// ============================================================================

/**
 * Create a new finding
 */
export async function createFinding(
  input: CreateFindingInput
): Promise<ComplianceFinding> {
  const { data, error } = await supabase
    .from('compliance_findings')
    .insert({
      assessment_id: input.assessment_id,
      section_id: input.section_id,
      research_url: input.research_url,
      pasted_language: input.pasted_language,
      user_interpretation: input.user_interpretation,
      conclusion: input.conclusion,
      is_flagged: input.is_flagged ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('Create finding error:', error);
    throw new Error('Failed to create finding');
  }

  // Auto-start section if not started
  const { data: assessment } = await supabase
    .from('compliance_assessments')
    .select('section_progress')
    .eq('id', input.assessment_id)
    .single();

  const progress = (assessment?.section_progress as AssessmentSectionProgress) || {};
  if (progress[input.section_id] === 'not_started') {
    await startSection(input.assessment_id, input.section_id);
  }

  return data;
}

/**
 * Get findings for a section
 */
export async function getSectionFindings(
  assessmentId: string,
  sectionId: string
): Promise<ComplianceFinding[]> {
  const { data, error } = await supabase
    .from('compliance_findings')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('section_id', sectionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Get section findings error:', error);
    throw new Error('Failed to fetch findings');
  }

  return data || [];
}

/**
 * Update a finding
 */
export async function updateFinding(
  findingId: string,
  input: UpdateFindingInput
): Promise<ComplianceFinding> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.research_url !== undefined) {
    updateData.research_url = input.research_url;
  }
  if (input.pasted_language !== undefined) {
    updateData.pasted_language = input.pasted_language;
  }
  if (input.user_interpretation !== undefined) {
    updateData.user_interpretation = input.user_interpretation;
  }
  if (input.conclusion !== undefined) {
    updateData.conclusion = input.conclusion;
  }
  if (input.is_flagged !== undefined) {
    updateData.is_flagged = input.is_flagged;
  }

  const { data, error } = await supabase
    .from('compliance_findings')
    .update(updateData)
    .eq('id', findingId)
    .select()
    .single();

  if (error) {
    console.error('Update finding error:', error);
    throw new Error('Failed to update finding');
  }

  return data;
}

/**
 * Delete a finding
 */
export async function deleteFinding(findingId: string): Promise<void> {
  const { error } = await supabase
    .from('compliance_findings')
    .delete()
    .eq('id', findingId);

  if (error) {
    console.error('Delete finding error:', error);
    throw new Error('Failed to delete finding');
  }
}

/**
 * Toggle finding flag
 */
export async function toggleFindingFlag(
  findingId: string
): Promise<ComplianceFinding> {
  const { data: existing } = await supabase
    .from('compliance_findings')
    .select('is_flagged')
    .eq('id', findingId)
    .single();

  return updateFinding(findingId, { is_flagged: !existing?.is_flagged });
}

// ============================================================================
// PHASE GATE DETERMINATION
// ============================================================================

/**
 * Analyze findings to determine phase gate outcome
 */
export async function analyzeForPhaseGate(
  assessmentId: string
): Promise<{
  determination: AssessmentDetermination;
  flags: ComplianceFinding[];
  subjectFindings: ComplianceFinding[];
  mayBeSubjectFindings: ComplianceFinding[];
  clearFindings: ComplianceFinding[];
}> {
  const assessment = await getAssessmentWithFindings(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  const flags = assessment.findings.filter((f) => f.is_flagged);
  const subjectFindings = assessment.findings.filter(
    (f) => f.conclusion === 'subject'
  );
  const mayBeSubjectFindings = assessment.findings.filter(
    (f) => f.conclusion === 'may_be_subject' || f.conclusion === 'unclear'
  );
  const clearFindings = assessment.findings.filter(
    (f) => f.conclusion === 'not_subject'
  );

  // Determine outcome
  let determination: AssessmentDetermination = 'pending';

  if (flags.length > 0 || subjectFindings.length > 0) {
    // Has definite issues that need addressing
    determination = 'address_gaps';
  } else if (mayBeSubjectFindings.length > 0) {
    // Has uncertain areas - needs professional review
    determination = 'address_gaps';
  } else if (clearFindings.length > 0) {
    // All clear findings
    determination = 'proceed';
  }

  return {
    determination,
    flags,
    subjectFindings,
    mayBeSubjectFindings,
    clearFindings,
  };
}

/**
 * Complete phase gate and set final determination
 */
export async function completePhaseGate(
  assessmentId: string,
  manualDetermination?: AssessmentDetermination
): Promise<ComplianceAssessment> {
  const analysis = await analyzeForPhaseGate(assessmentId);

  const determination = manualDetermination || analysis.determination;

  // Update assessment with determination
  const updated = await updateAssessment(assessmentId, {
    final_determination: determination,
  });

  // Mark phase gate section as complete
  await completeSection(assessmentId, ASSESSMENT_SECTIONS.PHASE_GATE);

  return updated;
}

// ============================================================================
// BINDER INTEGRATION
// ============================================================================

/**
 * Export assessment findings to binder
 */
export async function exportFindingsToBinder(
  assessmentId: string,
  binderId: string,
  options: {
    includeFlagged?: boolean;
    includeNotSubject?: boolean;
    includeInterpretations?: boolean;
  } = {}
): Promise<number> {
  const {
    includeFlagged = true,
    includeNotSubject = false,
    includeInterpretations = true,
  } = options;

  const assessment = await getAssessmentWithFindings(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Filter findings based on options
  let findingsToExport = assessment.findings;

  if (!includeFlagged) {
    findingsToExport = findingsToExport.filter((f) => !f.is_flagged);
  }

  if (!includeNotSubject) {
    findingsToExport = findingsToExport.filter(
      (f) => f.conclusion !== 'not_subject'
    );
  }

  // Add each finding to binder
  let addedCount = 0;

  for (const finding of findingsToExport) {
    // Determine section type for binder
    const sectionType = mapSectionToBinder(finding.section_id);

    // Build content from finding
    let content = finding.pasted_language || '';
    if (includeInterpretations && finding.user_interpretation) {
      content += `\n\n**My Interpretation:**\n${finding.user_interpretation}`;
    }

    // Build title
    const sectionTitle = SECTION_TITLES[finding.section_id] || finding.section_id;
    const title = `Assessment Finding: ${sectionTitle}`;

    try {
      await addItemToBinder({
        binder_id: binderId,
        section_type: sectionType,
        title,
        chunk_content: content,
        source_url: finding.research_url,
        user_notes: finding.user_interpretation,
        regulation_code: finding.conclusion
          ? `Conclusion: ${formatConclusion(finding.conclusion)}`
          : undefined,
      });
      addedCount++;
    } catch (error) {
      console.error('Failed to add finding to binder:', error);
      // Continue with other findings
    }
  }

  return addedCount;
}

/**
 * Map assessment section to binder section type
 */
function mapSectionToBinder(sectionId: string): string {
  if (sectionId === '0') return 'model_definition';
  if (sectionId === '1.1') return 'licensure';
  if (sectionId === '1.2') return 'licensure';
  if (sectionId.startsWith('1.3')) return 'local_rules';
  if (sectionId === '1.4') return 'operational';
  if (sectionId === '1.5') return 'notes';
  return 'notes';
}

/**
 * Format conclusion for display
 */
function formatConclusion(conclusion: string): string {
  const map: Record<string, string> = {
    not_subject: 'Not Subject to Regulation',
    may_be_subject: 'May Be Subject to Regulation',
    subject: 'Subject to Regulation',
    unclear: 'Requires Further Review',
  };
  return map[conclusion] || conclusion;
}

// ============================================================================
// TEMPLATES & GUIDANCE
// ============================================================================

/**
 * Section guidance interface matching component expectations
 */
export interface SectionGuidanceResult {
  instruction: string;
  research_prompt: string;
  capture_prompt: string;
  warning?: string;
}

/**
 * Get section guidance text
 * @param sectionId - The section ID (e.g., '0', '1.1', '1.2', etc.)
 * @param stateCode - The state code for state-specific guidance
 * @param modelDefinition - The user's model definition for context
 */
export function getSectionGuidance(
  sectionId: string,
  stateCode?: string,
  modelDefinition?: string
): SectionGuidanceResult {
  const stateDisplay = stateCode || 'your state';
  const modelContext = modelDefinition
    ? `Based on your model: "${modelDefinition}"`
    : 'Define your housing model first.';

  const guidance: Record<string, SectionGuidanceResult> = {
    '0': {
      instruction:
        'Write one sentence that defines your housing model. This is the foundation of your compliance analysis.',
      research_prompt:
        'Think about what services you provide (or don\'t provide), who your residents are, and what makes your model unique.',
      capture_prompt:
        'Write a clear, one-sentence definition of your housing model that distinguishes it from licensed care facilities.',
    },
    '1.1': {
      instruction:
        `Research what triggers licensure requirements in ${stateDisplay}. Focus on the specific criteria that determine whether your housing model requires a license.`,
      research_prompt:
        `Search for "${stateDisplay} residential care facility licensing requirements" or visit your state's health/human services agency website.`,
      capture_prompt:
        `Paste the relevant language about what triggers licensure in ${stateDisplay}, then explain why your model IS or IS NOT subject to these requirements.`,
      warning:
        'This is a critical section. If you provide ANY personal care services (help with bathing, dressing, medication management, etc.), you may need a license.',
    },
    '1.2': {
      instruction:
        `Determine if ${stateDisplay} has special housing categories (rooming house, boarding house, etc.) that might apply to your model.`,
      research_prompt:
        `Search for "${stateDisplay} rooming house laws" or "${stateDisplay} boarding house requirements" to see if special rules apply.`,
      capture_prompt:
        'Paste any relevant definitions for rooming/boarding houses and explain whether your model fits these categories.',
    },
    '1.3.1': {
      instruction:
        'Research your local occupancy limits. Many jurisdictions limit the number of unrelated adults who can live together.',
      research_prompt:
        'Check your city/county municipal code or zoning ordinance for "occupancy limits" or "unrelated persons" restrictions.',
      capture_prompt:
        'Paste the occupancy limit rules and note how many residents you plan to have compared to the limit.',
      warning:
        'FHA protections may override local occupancy limits for protected classes. Document your findings carefully.',
    },
    '1.3.2': {
      instruction:
        'Understand how your jurisdiction defines "household" and "family" for zoning purposes.',
      research_prompt:
        'Look up your city\'s zoning code definition of "family" or "household" - this often determines who can live together.',
      capture_prompt:
        'Paste the family/household definition and explain how your residents would be classified under this definition.',
    },
    '1.3.3': {
      instruction:
        'Research zoning requirements for your property and intended use.',
      research_prompt:
        'Find your property\'s zoning designation and check what uses are permitted. Look for "single-family residential" or "multi-family" definitions.',
      capture_prompt:
        'Document your property\'s zoning, what uses are permitted, and whether group housing is allowed or requires special permission.',
      warning:
        'Zoning violations can result in fines or forced closure. Verify zoning compliance before signing a lease or purchasing.',
    },
    '1.3.4': {
      instruction:
        'Identify any permits required for your operation.',
      research_prompt:
        'Contact your city\'s business licensing department or search for rental property registration requirements.',
      capture_prompt:
        'List all permits/licenses required and their costs, noting which ones you\'ve already obtained or need to apply for.',
    },
    '1.3.5': {
      instruction:
        'Research parking requirements for your property type and occupancy.',
      research_prompt:
        'Check your city\'s zoning code for parking requirements based on the number of residents or units.',
      capture_prompt:
        'Document the parking requirements and how many spaces your property provides. Note if a variance is needed.',
    },
    '1.3.6': {
      instruction:
        'Identify safety requirements including fire, building, and health codes.',
      research_prompt:
        'Contact your local fire marshal and building department to understand inspection requirements for your occupancy level.',
      capture_prompt:
        'List all safety requirements (smoke detectors, fire extinguishers, exits, etc.) and your compliance status.',
      warning:
        'Fire safety requirements often increase when housing more than a certain number of unrelated persons. Verify thresholds.',
    },
    '1.4': {
      instruction:
        `Match your operational features against regulatory categories. ${modelContext}`,
      research_prompt:
        'Review the list of services that trigger licensure and compare them to what you actually provide.',
      capture_prompt:
        'Create a comparison: list regulated services in one column and note whether you provide them. Explain your classification.',
    },
    '1.5': {
      instruction:
        'Review all your findings to determine if you can proceed with confidence or need to address gaps first.',
      research_prompt:
        'Review all flagged items and uncertain conclusions from previous sections.',
      capture_prompt:
        'This is automatically calculated based on your section findings. Review the summary and make your final determination.',
    },
  };

  return (
    guidance[sectionId] || {
      instruction: 'Complete this section by researching the relevant requirements.',
      research_prompt: 'Research the applicable regulations for this topic.',
      capture_prompt: 'Document your findings and interpretation.',
    }
  );
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get assessment statistics
 */
export async function getAssessmentStats(assessmentId: string): Promise<{
  total_findings: number;
  flagged_findings: number;
  subject_findings: number;
  may_be_subject_findings: number;
  not_subject_findings: number;
  unclear_findings: number;
  completion_percentage: number;
  sections_complete: number;
  sections_in_progress: number;
  sections_not_started: number;
}> {
  const assessment = await getAssessmentWithFindings(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  const progress = (assessment.section_progress as AssessmentSectionProgress) || {};

  return {
    total_findings: assessment.findings.length,
    flagged_findings: assessment.findings.filter((f) => f.is_flagged).length,
    subject_findings: assessment.findings.filter((f) => f.conclusion === 'subject').length,
    may_be_subject_findings: assessment.findings.filter((f) => f.conclusion === 'may_be_subject').length,
    not_subject_findings: assessment.findings.filter((f) => f.conclusion === 'not_subject').length,
    unclear_findings: assessment.findings.filter((f) => f.conclusion === 'unclear').length,
    completion_percentage: calculateProgress(progress),
    sections_complete: Object.values(progress).filter((s) => s === 'complete').length,
    sections_in_progress: Object.values(progress).filter((s) => s === 'in_progress').length,
    sections_not_started: Object.values(progress).filter((s) => s === 'not_started').length,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Constants
  ASSESSMENT_SECTIONS,
  SECTION_ORDER,
  SECTION_TITLES,
  // Assessment CRUD
  createAssessment,
  getUserAssessments,
  getAssessmentWithFindings,
  getAssessmentByState,
  updateAssessment,
  deleteAssessment,
  // Section Progress
  updateSectionProgress,
  startSection,
  completeSection,
  getSectionStatuses,
  getNextIncompleteSection,
  calculateProgress,
  // Findings CRUD
  createFinding,
  getSectionFindings,
  updateFinding,
  deleteFinding,
  toggleFindingFlag,
  // Phase Gate
  analyzeForPhaseGate,
  completePhaseGate,
  // Binder Integration
  exportFindingsToBinder,
  // Templates & Guidance
  getSectionGuidance,
  // Statistics
  getAssessmentStats,
};
