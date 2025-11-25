// Test page for demonstrating the Training Materials feature
// This page can be accessed without authentication for testing purposes

import { TacticCard } from '@/components/roadmap/TacticCard';
import type { TacticWithProgress } from '@/types/tactic';

// Mock tactic data for testing
const mockTactic: TacticWithProgress = {
  tactic_id: 'test-tactic-001',
  tactic_name: 'Research and Select Target Market',
  category: 'market_research',
  strategy_type: 'Growth',
  description: 'Identify and analyze potential markets for your group home business. This includes demographic research, competition analysis, and regulatory requirements.',
  estimated_time: '2-3 hours',
  status: 'not_started',
  notes: '',
  step_by_step: [
    'Research local demographics and identify areas with high demand for group homes',
    'Analyze competition in your target areas',
    'Review state and local regulations for group home operations',
    'Create a market analysis report with your findings',
    'Select your top 3 target markets based on opportunity and feasibility'
  ],
  // Enriched fields
  cost_min_usd: 0,
  cost_max_usd: 500,
  priority_score: 95,
  difficulty_level: 'intermediate',
  potential_impact_score: 85,
  best_practices: [
    'Focus on areas with aging populations for senior care homes',
    'Look for counties with supportive zoning laws',
    'Consider proximity to hospitals and medical facilities'
  ],
  common_mistakes: [
    'Not checking zoning restrictions before selecting a market',
    'Ignoring local competition and market saturation',
    'Failing to understand state-specific licensing requirements'
  ],
  success_criteria: 'You have identified 3 viable markets with documented demand, reasonable competition, and clear regulatory pathways',
  is_critical_path: true,
  depends_on_tactics: [],
  // Progress fields
  started_at: null,
  completed_at: null,
  last_activity_at: null
};

export default function TestResourcesPage() {
  const handleStart = (tacticId: string) => {
    console.log('Starting tactic:', tacticId);
  };

  const handleComplete = (tacticId: string, notes?: string) => {
    console.log('Completing tactic:', tacticId, notes);
  };

  const handleSaveNotes = (tacticId: string, notes: string) => {
    console.log('Saving notes for tactic:', tacticId, notes);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Training Materials Feature Test
            </h1>
            <p className="text-gray-600">
              This page demonstrates the new collapsible Training Materials section in TacticCard components.
            </p>
            <p className="text-sm text-blue-600 mt-2">
              The Training Materials section will display documents and knowledge chunks linked to this tactic.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Sample Tactic Card with Training Materials</h2>
            <TacticCard
              tactic={mockTactic}
              onStart={handleStart}
              onComplete={handleComplete}
              onSaveNotes={handleSaveNotes}
              showEnrichedFields={true}
              tacticNameMap={{}}
            />
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Feature Highlights</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Training Materials section appears after Step-by-Step Instructions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Collapsible by default - users must click to expand</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Shows count of available resources in the header</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Three tabs: Documents, Knowledge Base, and All Resources</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Documents grouped by link type (Required → Recommended → Supplemental)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Knowledge chunks grouped by priority (HIGH → MEDIUM → LOW)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Click on any resource card to open preview modal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Preview modal shows full metadata and download options for documents</span>
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Document Features</h3>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• PDF/DOCX file type indicators</li>
                <li>• Category badges (Legal, Financial, etc.)</li>
                <li>• State/ownership model filters</li>
                <li>• Download and view counts</li>
                <li>• Direct download from preview</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Knowledge Base Features</h3>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• Source file references</li>
                <li>• Priority level indicators</li>
                <li>• Week number associations</li>
                <li>• Markdown text formatting</li>
                <li>• Full content in preview</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}