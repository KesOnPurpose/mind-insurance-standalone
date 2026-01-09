import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, TrendingUp, Target } from 'lucide-react';

const InsightsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mi-navy p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 pt-4 sm:pt-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/mind-insurance')}
            className="mb-4 text-gray-400 hover:text-white hover:bg-mi-navy-light"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>

          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            Weekly Insights
          </h1>
          <p className="text-gray-400">
            Track your mental wellness journey with data-driven insights
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-mi-cyan/20 bg-mi-navy-light shadow-lg">
          <CardHeader className="bg-gradient-to-r from-mi-cyan to-mi-cyan/80 text-white rounded-t-lg">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
              Coming Soon
            </CardTitle>
            <CardDescription className="text-white/80">
              Your personalized insights dashboard is being prepared
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-8">
            <div className="space-y-6">
              {/* Feature Preview */}
              <div className="bg-mi-navy rounded-lg p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-3 text-mi-gold">
                  What to Expect
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <TrendingUp className="h-5 w-5 text-mi-cyan mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-white text-sm sm:text-base">Weekly Progress Tracking</p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Monitor your practice consistency and improvement trends
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Target className="h-5 w-5 text-mi-cyan mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-white text-sm sm:text-base">Personalized Recommendations</p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Get custom practice suggestions based on your patterns
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Brain className="h-5 w-5 text-mi-cyan mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-white text-sm sm:text-base">Behavioral Insights</p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Understand your mental patterns and growth opportunities
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Description */}
              <div className="text-center py-4 sm:py-6">
                <p className="text-gray-300 text-sm sm:text-lg mb-6">
                  Weekly assessments and personalized recommendations based on your practice patterns
                </p>

                <div className="inline-flex items-center gap-2 text-mi-cyan bg-mi-cyan/20 px-4 py-2 rounded-full">
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
                  <span className="font-medium text-sm sm:text-base">In Development</span>
                </div>
              </div>

              {/* Return Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => navigate('/mind-insurance')}
                  className="bg-mi-cyan hover:bg-mi-cyan/80 text-white px-6 sm:px-8 w-full sm:w-auto"
                >
                  Return to Hub
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8 pb-4">
          We're working hard to bring you powerful insights. Check back soon!
        </p>
      </div>
    </div>
  );
};

export default InsightsPage;
