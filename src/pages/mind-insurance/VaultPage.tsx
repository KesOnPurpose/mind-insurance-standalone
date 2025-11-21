import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Archive, Mic, Trophy, Lightbulb } from 'lucide-react';

const VaultPage = () => {
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
            Recording Vault
          </h1>
          <p className="text-gray-600">
            Your personal archive of growth and achievements
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Archive className="h-6 w-6" />
              Coming Soon
            </CardTitle>
            <CardDescription className="text-purple-100">
              Your recording vault is being prepared for launch
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Feature Preview */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 text-purple-900">
                  What's Coming
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Mic className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Voice Recording Archive</p>
                      <p className="text-sm text-gray-600">
                        All your practice sessions stored securely in one place
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Trophy className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Victory Collection</p>
                      <p className="text-sm text-gray-600">
                        Celebrate and revisit your breakthrough moments
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Lightbulb className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Pattern Insights</p>
                      <p className="text-sm text-gray-600">
                        Discover trends and patterns across your recordings
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Description */}
              <div className="text-center py-6">
                <p className="text-gray-700 text-lg mb-6">
                  Archive of your voice recordings, patterns, victories, and insights
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

              {/* Vault Preview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">0</div>
                  <p className="text-sm text-gray-600">Total Recordings</p>
                </div>
                <div className="bg-white border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">0</div>
                  <p className="text-sm text-gray-600">Victories Logged</p>
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
          Your vault is being built with care. Available soon!
        </p>
      </div>
    </div>
  );
};

export default VaultPage;