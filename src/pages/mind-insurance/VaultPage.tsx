import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shield, Trophy, Brain, Mic } from 'lucide-react';
import { useVaultRecordings } from '@/hooks/useVaultRecordings';
import { useVaultPractices } from '@/hooks/useVaultPractices';
import { VaultStats } from '@/components/vault/VaultStats';
import { RecordingList } from '@/components/vault/RecordingList';
import { PatternList } from '@/components/vault/PatternList';
import { VictoryList } from '@/components/vault/VictoryList';

const VaultPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recordings');

  // Voice recordings from voice_recordings table
  const {
    recordings,
    stats: recordingStats,
    isLoading: recordingsLoading,
    error: recordingsError,
    deleteRecording,
    isDeleting
  } = useVaultRecordings();

  // Patterns and victories from daily_practices table
  const {
    data: practicesData,
    isLoading: practicesLoading,
    error: practicesError
  } = useVaultPractices();

  const patterns = practicesData?.patterns || [];
  const victories = practicesData?.victories || [];
  const patternStats = practicesData?.patternStats || { caught: 0, total: 0, successRate: 0 };

  const isLoading = recordingsLoading || practicesLoading;
  const error = recordingsError || practicesError;

  if (error) {
    return (
      <div className="min-h-screen bg-mi-navy">
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-300 hover:text-white hover:bg-mi-navy-light" onClick={() => navigate('/mind-insurance')}>
              <ArrowLeft className="w-4 h-4" />
              Back to Hub
            </Button>
          </div>
          <div className="text-center py-12">
            <p className="text-red-400">Error loading vault data. Please try again.</p>
            <Button variant="outline" className="mt-4 border-mi-cyan/50 text-mi-cyan hover:bg-mi-cyan/10" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Combined stats for the stats grid
  const combinedStats = {
    totalRecordings: recordingStats.totalRecordings,
    totalDuration: recordingStats.totalDuration,
    patternsCaught: patternStats.caught,
    patternsTotal: patternStats.total,
    victoriesCount: victories.length,
  };

  return (
    <div className="min-h-screen bg-mi-navy">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-300 hover:text-white hover:bg-mi-navy-light" onClick={() => navigate('/mind-insurance')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Button>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-mi-cyan flex-shrink-0" />
            Recording Vault
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            Your recordings, patterns, and victories from practices
          </p>
        </div>

        {/* Stats Grid - Updated with patterns and victories */}
        <VaultStats
          stats={recordingStats}
          patternStats={patternStats}
          victoriesCount={victories.length}
          isLoading={isLoading}
        />

        {/* Tabs: Recordings, Patterns, Victories */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full grid grid-cols-3 bg-mi-navy-light border border-mi-cyan/20 h-auto p-1">
            <TabsTrigger value="recordings" className="gap-1 sm:gap-1.5 data-[state=active]:bg-mi-cyan data-[state=active]:text-white text-gray-300 flex-col sm:flex-row py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <Mic className="w-4 h-4" />
              <span className="hidden xs:inline">Recordings</span>
              <span className="xs:hidden text-[10px]">Audio</span>
              <span className="text-[10px] sm:text-xs bg-mi-navy px-1 sm:px-1.5 py-0.5 rounded-full">
                {recordings.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-1 sm:gap-1.5 data-[state=active]:bg-mi-cyan data-[state=active]:text-white text-gray-300 flex-col sm:flex-row py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <Brain className="w-4 h-4" />
              <span>Patterns</span>
              <span className="text-[10px] sm:text-xs bg-mi-navy px-1 sm:px-1.5 py-0.5 rounded-full">
                {patterns.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="victories" className="gap-1 sm:gap-1.5 data-[state=active]:bg-mi-gold data-[state=active]:text-white text-gray-300 flex-col sm:flex-row py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <Trophy className="w-4 h-4" />
              <span>Wins</span>
              <span className="text-[10px] sm:text-xs bg-mi-navy px-1 sm:px-1.5 py-0.5 rounded-full">
                {victories.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Recordings Tab */}
          <TabsContent value="recordings" className="mt-4">
            <RecordingList
              recordings={recordings}
              isLoading={recordingsLoading}
              onDelete={deleteRecording}
              isDeleting={isDeleting}
              emptyMessage="Your voice recordings from Mind Insurance practices will appear here. Complete a practice with voice recording to get started."
            />
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="mt-4">
            <PatternList
              patterns={patterns}
              isLoading={practicesLoading}
            />
          </TabsContent>

          {/* Victories Tab */}
          <TabsContent value="victories" className="mt-4">
            <VictoryList
              victories={victories}
              isLoading={practicesLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VaultPage;
