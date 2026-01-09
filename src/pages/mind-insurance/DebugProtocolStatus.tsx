/**
 * Debug Protocol Status Page
 * Temporary diagnostic page to debug Protocol Unlock Modal issues
 *
 * Access at: /mind-insurance/debug-protocol
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveInsightProtocol, createInsightProtocol } from '@/services/mioInsightProtocolService';
import { hasCompletedFirstEngagement } from '@/services/mioInsightsThreadService';
import { getLatestAssessment } from '@/services/identityCollisionService';
import { useUnstartedProtocol } from '@/hooks/useUnstartedProtocol';

interface DiagnosticResult {
  label: string;
  status: 'pass' | 'fail' | 'warn';
  value: string;
  details?: string;
}

export default function DebugProtocolStatus() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawProtocol, setRawProtocol] = useState<unknown>(null);
  const [creatingProtocol, setCreatingProtocol] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get useUnstartedProtocol hook data for comparison
  const {
    unstartedProtocol,
    isLoading: hookLoading,
    hasUnstartedProtocol,
    isNewUser,
    isReturningUser,
    shouldShowModal,
    showBadge,
  } = useUnstartedProtocol();

  const runDiagnostics = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Check user ID
      results.push({
        label: 'User ID',
        status: 'pass',
        value: user.id,
      });

      // 2. Check Identity Collision Assessment
      try {
        const assessment = await getLatestAssessment(user.id);
        if (assessment) {
          results.push({
            label: 'Identity Collision Assessment',
            status: 'pass',
            value: `Completed - Primary pattern: ${assessment.primaryPattern}`,
            details: `Confidence: ${assessment.confidence}%`,
          });
        } else {
          results.push({
            label: 'Identity Collision Assessment',
            status: 'fail',
            value: 'Not completed',
            details: 'User needs to complete the Identity Collision Assessment first',
          });
        }
      } catch (err) {
        results.push({
          label: 'Identity Collision Assessment',
          status: 'fail',
          value: 'Error checking',
          details: String(err),
        });
      }

      // 3. Check First Engagement
      try {
        const hasFirstEngagement = await hasCompletedFirstEngagement(user.id);
        results.push({
          label: 'First Engagement (MIO Question)',
          status: hasFirstEngagement ? 'pass' : 'warn',
          value: hasFirstEngagement ? 'Completed' : 'NOT completed',
          details: hasFirstEngagement
            ? 'User answered MIO\'s first question'
            : 'User needs to answer MIO\'s question on MIO Insights page. NOTE: Modal can still show for returning users without this.',
        });
      } catch (err) {
        results.push({
          label: 'First Engagement',
          status: 'fail',
          value: 'Error checking',
          details: String(err),
        });
      }

      // 4. Check Active Protocol
      try {
        const protocol = await getActiveInsightProtocol(user.id);
        setRawProtocol(protocol);

        if (protocol) {
          const isUnstarted = protocol.status === 'active' &&
                             protocol.started_at === null &&
                             protocol.days_completed === 0;

          results.push({
            label: 'Active Protocol (mio_weekly_protocols)',
            status: 'pass',
            value: protocol.title || 'Found',
            details: `ID: ${protocol.id}\nStatus: ${protocol.status}\nStarted: ${protocol.started_at || 'NOT STARTED'}\nDays completed: ${protocol.days_completed}`,
          });

          results.push({
            label: 'Protocol Unstarted Check',
            status: isUnstarted ? 'pass' : 'warn',
            value: isUnstarted ? 'Protocol is UNSTARTED (modal should show)' : 'Protocol already started',
            details: `started_at === null: ${protocol.started_at === null}, days_completed === 0: ${protocol.days_completed === 0}`,
          });
        } else {
          results.push({
            label: 'Active Protocol (mio_weekly_protocols)',
            status: 'fail',
            value: 'NO PROTOCOL FOUND',
            details: 'N8n webhook may have failed to create protocol after assessment. Click "Create Test Protocol" below to test.',
          });
        }
      } catch (err) {
        results.push({
          label: 'Active Protocol',
          status: 'fail',
          value: 'Error checking',
          details: String(err),
        });
      }

      setDiagnostics(results);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id) {
      runDiagnostics();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user?.id, authLoading]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warn':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const handleCreateTestProtocol = async () => {
    if (!user?.id) return;

    setCreatingProtocol(true);
    try {
      // Get assessment data for pattern
      const assessment = await getLatestAssessment(user.id);
      const pattern = assessment?.primaryPattern || 'past_prison';

      const result = await createInsightProtocol({
        user_id: user.id,
        title: `Your ${pattern.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Transformation Protocol`,
        insight_summary: 'MIO detected patterns in your assessment that reveal an opportunity for transformation. This 7-day protocol will guide you through rewiring these neural pathways.',
        why_it_matters: 'Your brain has learned certain patterns as protection mechanisms. This protocol helps you replace old patterns with new ones.',
        neural_principle: 'Neuroplasticity: Your brain can form new neural pathways at any age through consistent, intentional practice.',
        day_tasks: [
          { day: 1, task_title: 'Awareness Foundation', task_description: 'Notice when your pattern shows up today. Don\'t try to change it - just observe.', success_criteria: ['Noticed pattern at least once', 'Wrote down the trigger'] },
          { day: 2, task_title: 'Trigger Recognition', task_description: 'Identify the specific triggers that activate your pattern.', success_criteria: ['Listed 3 triggers', 'Identified emotional response'] },
          { day: 3, task_title: 'Pause Practice', task_description: 'When you notice a trigger, pause for 3 breaths before responding.', success_criteria: ['Paused at least twice', 'Noticed the urge to react'] },
          { day: 4, task_title: 'Alternative Response', task_description: 'Choose one alternative response to practice today.', success_criteria: ['Tried new response once', 'Reflected on how it felt'] },
          { day: 5, task_title: 'Repetition Day', task_description: 'Repeat yesterday\'s alternative response multiple times.', success_criteria: ['Used new response 3+ times', 'Getting easier'] },
          { day: 6, task_title: 'Integration', task_description: 'Notice how the new response is starting to feel more natural.', success_criteria: ['New response felt automatic once', 'Less mental effort required'] },
          { day: 7, task_title: 'Celebration & Planning', task_description: 'Celebrate your progress and plan how to maintain this new pattern.', success_criteria: ['Wrote celebration note', 'Created maintenance plan'] },
        ],
        confidence_score: 0.85,
      });

      if (result.success) {
        alert(`✅ Protocol created successfully!\n\nID: ${result.protocol_id}\n\nNow go to the Hub to see the Protocol Unlock Modal.`);
        // Refresh diagnostics
        await runDiagnostics();
      } else {
        alert(`❌ Failed to create protocol: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${String(err)}`);
    } finally {
      setCreatingProtocol(false);
    }
  };

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mi-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center">
        <Card className="p-6 bg-mi-navy-light border-red-500/30">
          <p className="text-white text-center">Not authenticated. Please log in first.</p>
          <Button
            onClick={() => navigate('/auth')}
            className="w-full mt-4 bg-mi-cyan hover:bg-mi-cyan-dark"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mi-navy p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mind-insurance')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Protocol Debug Status</h1>
            <p className="text-gray-400">Diagnosing Protocol Unlock Modal issues</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="p-4 bg-red-500/20 border-red-500/50">
            <p className="text-red-400">{error}</p>
          </Card>
        )}

        {/* useUnstartedProtocol Hook Status */}
        <Card className="p-6 bg-mi-navy-light border-mi-cyan/30">
          <h2 className="text-lg font-semibold text-white mb-4">useUnstartedProtocol Hook Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">isLoading:</span>
              <Badge variant={hookLoading ? 'secondary' : 'outline'}>{String(hookLoading)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">hasUnstartedProtocol:</span>
              <Badge variant={hasUnstartedProtocol ? 'default' : 'destructive'}>{String(hasUnstartedProtocol)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">isNewUser:</span>
              <Badge variant="outline">{String(isNewUser)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">isReturningUser:</span>
              <Badge variant="outline">{String(isReturningUser)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">shouldShowModal:</span>
              <Badge variant={shouldShowModal ? 'default' : 'destructive'} className={shouldShowModal ? 'bg-green-500' : ''}>
                {String(shouldShowModal)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">showBadge:</span>
              <Badge variant="outline">{String(showBadge)}</Badge>
            </div>
          </div>
          {unstartedProtocol && (
            <div className="mt-4 p-3 bg-mi-navy rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Protocol Data:</p>
              <pre className="text-xs text-mi-cyan overflow-auto max-h-40">
                {JSON.stringify(unstartedProtocol, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* Diagnostics */}
        <Card className="p-6 bg-mi-navy-light border-mi-cyan/30">
          <h2 className="text-lg font-semibold text-white mb-4">Diagnostic Checks</h2>
          {loading ? (
            <div className="flex items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mi-cyan"></div>
              Running diagnostics...
            </div>
          ) : (
            <div className="space-y-4">
              {diagnostics.map((result, idx) => (
                <div key={idx} className="border-b border-white/10 pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <p className="text-white font-medium">{result.label}</p>
                      <p className={`text-sm ${result.status === 'pass' ? 'text-green-400' : result.status === 'fail' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {result.value}
                      </p>
                      {result.details && (
                        <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                          {result.details}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Raw Protocol Data */}
        {rawProtocol && (
          <Card className="p-6 bg-mi-navy-light border-mi-cyan/30">
            <h2 className="text-lg font-semibold text-white mb-4">Raw Protocol Data</h2>
            <pre className="text-xs text-gray-300 overflow-auto max-h-96 bg-mi-navy p-4 rounded-lg">
              {JSON.stringify(rawProtocol, null, 2)}
            </pre>
          </Card>
        )}

        {/* Actions */}
        <Card className="p-6 bg-mi-navy-light border-yellow-500/30">
          <h2 className="text-lg font-semibold text-white mb-4">Debug Actions</h2>
          <div className="space-y-4">
            <Button
              onClick={handleCreateTestProtocol}
              disabled={creatingProtocol}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              {creatingProtocol ? 'Creating Protocol...' : 'Create Test Protocol (if missing)'}
            </Button>
            <Button
              onClick={() => navigate('/mind-insurance/mio-insights')}
              variant="outline"
              className="w-full"
            >
              Go to MIO Insights (complete first engagement)
            </Button>
            <Button
              onClick={() => navigate('/mind-insurance')}
              variant="outline"
              className="w-full"
            >
              Go to Hub (should show modal if all checks pass)
            </Button>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-mi-navy-light border-white/10">
          <h2 className="text-lg font-semibold text-white mb-3">How the Protocol Unlock Modal Works</h2>
          <div className="text-sm text-gray-400 space-y-2">
            <p><strong className="text-white">For the modal to appear, you need:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>✅ Completed Identity Collision Assessment</li>
              <li>✅ An active protocol in the database (created by N8n webhook)</li>
              <li>✅ Protocol must have <code className="text-mi-cyan">started_at = null</code> and <code className="text-mi-cyan">days_completed = 0</code></li>
              <li>⚡ Either: First engagement completed (isNewUser) OR no first engagement (isReturningUser)</li>
            </ol>
            <p className="mt-3"><strong className="text-white">If "NO PROTOCOL FOUND":</strong></p>
            <p>The N8n webhook at <code className="text-mi-cyan text-xs">https://n8n-n8n.vq00fr.easypanel.host/webhook/first-protocol-generation</code> may have failed. Click "Create Test Protocol" to manually create one for testing.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
