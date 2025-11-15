import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestCase {
  agent: 'nette' | 'mio' | 'me';
  question: string;
  expected_topics?: string[];
  expected_handoff?: 'nette' | 'mio' | 'me';
  confidence_threshold?: number;
  expected_chunks?: string[];
  expected_tactic_id?: number;
  expected_week?: number;
}

interface TestScenario {
  name: string;
  user_profile?: Record<string, any>;
  test_cases: TestCase[];
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Week 1 User - Foundation Questions',
    user_profile: { 
      current_week: 1, 
      target_state: 'Ohio',
      timeline_days: 90,
      startup_capital: '$10k-$25k'
    },
    test_cases: [
      { 
        agent: 'nette', 
        question: 'What licensing do I need in Ohio?', 
        expected_topics: ['license', 'ohio', 'state'] 
      },
      { 
        agent: 'nette', 
        question: 'How do I get started with my first group home?', 
        expected_topics: ['tactics', 'week 1', 'onboarding'] 
      },
      { 
        agent: 'nette', 
        question: 'What population should I serve in Ohio?', 
        expected_topics: ['population', 'demographics', 'ohio'] 
      },
    ]
  },
  {
    name: 'Week 8 User - Operations Questions',
    user_profile: { 
      current_week: 8, 
      property_beds: 6,
      target_state: 'Texas',
      license_status: 'in_progress'
    },
    test_cases: [
      { 
        agent: 'nette', 
        question: 'How do I hire and train staff?', 
        expected_topics: ['staffing', 'operations', 'week 8'] 
      },
      { 
        agent: 'nette', 
        question: 'What are the requirements for staff training?', 
        expected_topics: ['training', 'compliance', 'regulations'] 
      },
    ]
  },
  {
    name: 'Cross-Agent Handoffs',
    user_profile: { current_week: 3 },
    test_cases: [
      { 
        agent: 'nette', 
        question: 'I am scared to make the first call to a property owner', 
        expected_handoff: 'mio',
        confidence_threshold: 0.7
      },
      { 
        agent: 'nette', 
        question: 'I keep procrastinating on the licensing paperwork',
        expected_handoff: 'mio',
        confidence_threshold: 0.7
      },
      { 
        agent: 'mio', 
        question: 'How do I calculate ROI on this property?', 
        expected_handoff: 'me',
        confidence_threshold: 0.7
      },
      { 
        agent: 'mio', 
        question: 'What financing options are available?', 
        expected_handoff: 'me',
        confidence_threshold: 0.75
      },
      { 
        agent: 'me', 
        question: 'What are the licensing requirements in my state?', 
        expected_handoff: 'nette',
        confidence_threshold: 0.7
      },
    ]
  },
  {
    name: 'State-Specific Queries',
    user_profile: { target_state: 'Texas' },
    test_cases: [
      { 
        agent: 'nette', 
        question: 'Texas licensing requirements', 
        expected_chunks: ['texas', 'license'] 
      },
      { 
        agent: 'nette', 
        question: 'Ohio zoning laws for group homes', 
        expected_chunks: ['ohio', 'zoning'] 
      },
      { 
        agent: 'nette', 
        question: 'What populations are most common in California?', 
        expected_chunks: ['california', 'population'] 
      },
    ]
  },
  {
    name: 'Tactic Reference Accuracy',
    user_profile: { current_week: 4 },
    test_cases: [
      { 
        agent: 'nette', 
        question: 'Tell me about Week 1 tactics', 
        expected_week: 1 
      },
      { 
        agent: 'nette', 
        question: 'What tactics should I focus on this week?', 
        expected_week: 4 
      },
      { 
        agent: 'nette', 
        question: 'What comes after Week 6?', 
        expected_week: 7 
      },
    ]
  },
  {
    name: 'MIO Pattern Detection',
    user_profile: { 
      current_week: 5,
      avatar_type: 'The Perfectionist',
      primary_pattern: 'analysis_paralysis'
    },
    test_cases: [
      { 
        agent: 'mio', 
        question: 'I keep researching but never take action', 
        expected_topics: ['pattern', 'breakthrough', 'action'] 
      },
      { 
        agent: 'mio', 
        question: 'I am afraid of making the wrong decision',
        expected_topics: ['fear', 'identity', 'collision'] 
      },
    ]
  },
  {
    name: 'ME Financing Queries',
    user_profile: { 
      startup_capital: '$10k-$25k',
      credit_score_range: '650-699',
      real_estate_experience: 'none'
    },
    test_cases: [
      { 
        agent: 'me', 
        question: 'What financing options do I have with bad credit?', 
        expected_topics: ['financing', 'creative', 'credit'] 
      },
      { 
        agent: 'me', 
        question: 'How does seller financing work?', 
        expected_topics: ['seller', 'financing', 'terms'] 
      },
      { 
        agent: 'me', 
        question: 'Can I buy a property with no money down?', 
        expected_topics: ['creative', 'financing', 'strategy'] 
      },
    ]
  }
];

interface TestResult {
  scenario: string;
  test_case: string;
  passed: boolean;
  details: Record<string, any>;
  response_time_ms?: number;
  cache_hit?: boolean;
  rag_metrics?: {
    chunks_retrieved: number;
    avg_similarity: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario_name, run_all = true } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const results: TestResult[] = [];
    
    // Filter scenarios if specific one requested
    const scenariosToRun = run_all 
      ? TEST_SCENARIOS 
      : TEST_SCENARIOS.filter(s => s.name === scenario_name);

    console.log(`[Test Suite] Running ${scenariosToRun.length} scenarios...`);

    for (const scenario of scenariosToRun) {
      console.log(`\n[Scenario] ${scenario.name}`);
      
      for (const testCase of scenario.test_cases) {
        console.log(`  [Test] ${testCase.question.substring(0, 50)}...`);
        
        const startTime = performance.now();
        
        // Call mio-chat edge function with test data
        const { data: response, error } = await supabaseClient.functions.invoke('mio-chat', {
          body: {
            message: testCase.question,
            user_id: 'test-user-id',
            current_agent: testCase.agent,
            user_context: scenario.user_profile || {},
            conversation_id: `test-${Date.now()}`
          }
        });

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        if (error) {
          results.push({
            scenario: scenario.name,
            test_case: testCase.question,
            passed: false,
            details: { error: error.message },
            response_time_ms: responseTime
          });
          continue;
        }

        // Analyze response
        const passed = analyzeTestCase(testCase, response, scenario.user_profile || {});
        
        results.push({
          scenario: scenario.name,
          test_case: testCase.question,
          passed,
          details: {
            response_preview: response.substring(0, 200),
            expected: testCase.expected_topics || testCase.expected_handoff || testCase.expected_week,
            ...extractMetrics(response)
          },
          response_time_ms: responseTime
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Generate summary
    const summary = {
      total_tests: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      pass_rate: (results.filter(r => r.passed).length / results.length * 100).toFixed(2) + '%',
      avg_response_time: (results.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / results.length).toFixed(0) + 'ms',
      scenarios_run: scenariosToRun.map(s => s.name)
    };

    console.log('\n[Summary]', summary);

    return new Response(
      JSON.stringify({ 
        summary, 
        results,
        timestamp: new Date().toISOString()
      }, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[Test Suite] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function analyzeTestCase(
  testCase: TestCase, 
  response: string, 
  userProfile: Record<string, any>
): boolean {
  const responseLower = response.toLowerCase();

  // Check for expected topics
  if (testCase.expected_topics) {
    const foundTopics = testCase.expected_topics.filter(topic => 
      responseLower.includes(topic.toLowerCase())
    );
    return foundTopics.length >= testCase.expected_topics.length * 0.7; // 70% match threshold
  }

  // Check for handoff suggestions
  if (testCase.expected_handoff) {
    const hasHandoff = responseLower.includes('would you like to talk to') || 
                       responseLower.includes('might be better suited') ||
                       responseLower.includes(testCase.expected_handoff);
    return hasHandoff;
  }

  // Check for week references
  if (testCase.expected_week) {
    const weekPattern = new RegExp(`week\\s*${testCase.expected_week}`, 'i');
    return weekPattern.test(response);
  }

  // Check for chunk relevance (basic keyword check)
  if (testCase.expected_chunks) {
    const foundChunks = testCase.expected_chunks.filter(chunk => 
      responseLower.includes(chunk.toLowerCase())
    );
    return foundChunks.length >= testCase.expected_chunks.length * 0.5; // 50% match
  }

  return true; // Default pass if no specific expectations
}

function extractMetrics(response: string): Record<string, any> {
  // Try to extract metrics if they're included in response metadata
  return {
    response_length: response.length,
    has_formatting: response.includes('**') || response.includes('*'),
    has_bullet_points: response.includes('•') || response.includes('-'),
  };
}
