import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, TrendingUp, Target } from 'lucide-react';

const InsightsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/mind-insurance/hub')}
            className="mb-4 text-purple-700 hover:text-purple-900 hover:bg-purple-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Weekly Insights
          </h1>
          <p className="text-gray-600">
            Track your mental wellness journey with data-driven insights
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Coming Soon
            </CardTitle>
            <CardDescription className="text-purple-100">
              Your personalized insights dashboard is being prepared
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Feature Preview */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 text-purple-900">
                  What to Expect
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Weekly Progress Tracking</p>
                      <p className="text-sm text-gray-600">
                        Monitor your practice consistency and improvement trends
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Target className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Personalized Recommendations</p>
                      <p className="text-sm text-gray-600">
                        Get custom practice suggestions based on your patterns
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Brain className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Behavioral Insights</p>
                      <p className="text-sm text-gray-600">
                        Understand your mental patterns and growth opportunities
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Description */}
              <div className="text-center py-6">
                <p className="text-gray-700 text-lg mb-6">
                  Weekly assessments and personalized recommendations based on your practice patterns
                </p>

                <div className="inline-flex items-center gap-2 text-purple-600 bg-purple-100 px-4 py-2 rounded-full">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span className="font-medium">In Development</span>
                </div>
              </div>

              {/* Return Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => navigate('/mind-insurance/hub')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  Return to Hub
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          We're working hard to bring you powerful insights. Check back soon!
        </p>
      </div>
    </div>
  );
};

export default InsightsPage;