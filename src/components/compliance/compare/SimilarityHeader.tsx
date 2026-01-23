// ============================================================================
// SIMILARITY HEADER COMPONENT
// ============================================================================
// Displays the similarity score and key differences at the top of the
// state comparison view. This is the "Quick Insight" that tells users
// what they need to know BEFORE they scroll through details.
// ============================================================================

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { CompareResult, StateCode, STATE_NAMES } from '@/types/compliance';
import { STATE_NAMES as StateNames } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface SimilarityHeaderProps {
  compareResult: CompareResult;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SimilarityHeader({ compareResult, isLoading }: SimilarityHeaderProps) {
  const {
    states,
    similarityScore,
    keyDifferences,
    hasMajorDifferences,
  } = compareResult;

  // Get state names for display
  const stateNames = useMemo(() => {
    return states.map((s) => s.state_name || StateNames[s.state_code] || s.state_code);
  }, [states]);

  // Determine the insight message based on similarity score
  const insightMessage = useMemo(() => {
    if (states.length === 2) {
      const [stateA, stateB] = stateNames;
      if (similarityScore >= 95) {
        return `${stateA} and ${stateB} have nearly identical requirements`;
      }
      if (similarityScore >= 85) {
        return `${stateA} and ${stateB} are highly similar`;
      }
      if (similarityScore >= 70) {
        return `${stateA} and ${stateB} share common frameworks with notable differences`;
      }
      if (similarityScore >= 50) {
        return `${stateA} and ${stateB} have significant regulatory differences`;
      }
      return `${stateA} and ${stateB} have very different regulatory environments`;
    }

    // Multiple states
    if (similarityScore >= 85) {
      return `These states have highly similar compliance requirements`;
    }
    if (similarityScore >= 70) {
      return `These states share common frameworks with some variations`;
    }
    if (similarityScore >= 50) {
      return `These states have notable differences in their requirements`;
    }
    return `These states have significantly different regulatory approaches`;
  }, [states, stateNames, similarityScore]);

  // Determine color scheme based on similarity
  const scoreColor = useMemo(() => {
    if (similarityScore >= 85) return 'text-green-600';
    if (similarityScore >= 70) return 'text-blue-600';
    if (similarityScore >= 50) return 'text-amber-600';
    return 'text-red-600';
  }, [similarityScore]);

  const progressColor = useMemo(() => {
    if (similarityScore >= 85) return 'bg-green-500';
    if (similarityScore >= 70) return 'bg-blue-500';
    if (similarityScore >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }, [similarityScore]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="mb-6 animate-pulse">
        <CardContent className="p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="h-2 bg-gray-200 rounded w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-l-4 border-l-primary shadow-md">
      <CardContent className="p-6">
        {/* Header with icon */}
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Quick Insight</h3>
        </div>

        {/* Similarity score display */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-700">{insightMessage}</p>
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {similarityScore}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full ${progressColor} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${similarityScore}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Similarity score based on regulatory requirements, thresholds, and documentation
          </p>
        </div>

        {/* High similarity alert */}
        {similarityScore >= 95 && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              These states have very similar requirements. If you're compliant in one,
              you're likely well-prepared for the other with minor adjustments.
            </AlertDescription>
          </Alert>
        )}

        {/* Low similarity alert */}
        {similarityScore < 50 && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              These states have significantly different regulatory environments.
              Review each state's requirements carefully before expanding operations.
            </AlertDescription>
          </Alert>
        )}

        {/* Key differences section */}
        {keyDifferences.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-gray-500" />
              <h4 className="text-sm font-medium text-gray-700">Key Differences</h4>
              <Badge variant="secondary" className="text-xs">
                {keyDifferences.length}
              </Badge>
            </div>

            <ul className="space-y-2">
              {keyDifferences.map((diff, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{diff}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No differences message */}
        {keyDifferences.length === 0 && similarityScore >= 90 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              No significant regulatory differences detected between these states.
              The compliance frameworks are highly aligned.
            </p>
          </div>
        )}

        {/* State badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Comparing:</span>
          {states.map((state) => (
            <Badge
              key={state.state_code}
              variant="outline"
              className="font-medium"
            >
              {state.state_name || state.state_code}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SimilarityHeader;
