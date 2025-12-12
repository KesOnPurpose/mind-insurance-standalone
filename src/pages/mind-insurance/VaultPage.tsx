import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Trophy, Brain, Mic, ClipboardCheck, Sparkles } from 'lucide-react';
import { useVaultRecordings } from '@/hooks/useVaultRecordings';
import { useVaultPractices } from '@/hooks/useVaultPractices';
import { useVaultAssessments } from '@/hooks/useVaultAssessments';
import { useAuth } from '@/contexts/AuthContext';
import {
  useUserInvitations,
  usePendingInvitationsCount,
  useHasAnyInvitations,
  ASSESSMENT_INFO,
  type AssessmentInvitation,
} from '@/hooks/useAssessmentInvitations';
import { VaultStats } from '@/components/vault/VaultStats';
import { RecordingList } from '@/components/vault/RecordingList';
import { PatternList } from '@/components/vault/PatternList';
import { VictoryList } from '@/components/vault/VictoryList';
import { AssessmentList } from '@/components/vault/AssessmentList';

const VaultPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Assessments from various assessment tables
  const {
    data: assessmentsData,
    isLoading: assessmentsLoading,
  } = useVaultAssessments();

  // Assessment invitations - for showing/hiding Assessments tab
  const { data: hasInvitations } = useHasAnyInvitations(user?.id);
  const { data: pendingCount } = usePendingInvitationsCount(user?.id);
  const { data: invitations } = useUserInvitations(user?.id);

  // Get pending invitations for the banner
  const pendingInvitations = invitations?.filter(inv => inv.status === 'pending') || [];

  // Show assessments tab if user has invitations OR has completed assessments
  const showAssessmentsTab = hasInvitations || (assessmentsData?.assessments?.length ?? 0) > 0;

  const patterns = practicesData?.patterns || [];
  const victories = practicesData?.victories || [];
  const patternStats = practicesData?.patternStats || { caught: 0, total: 0, successRate: 0 };
  const assessments = assessmentsData?.assessments || [];

  const isLoading = recordingsLoading || practicesLoading || assessmentsLoading;
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

        {/* Assessment Invitation Banner - shows when user has pending invitations */}
        {pendingInvitations.length > 0 && (
          <div className="bg-gradient-to-r from-mi-cyan/20 to-mi-gold/20 border border-mi-cyan/40 rounded-lg p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-mi-cyan/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-mi-cyan" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-medium text-white">
                  {pendingInvitations.length === 1
                    ? 'You have a new assessment ready'
                    : `You have ${pendingInvitations.length} assessments ready`}
                </h3>
                <p className="text-sm text-gray-400">
                  {pendingInvitations[0].reason || ASSESSMENT_INFO[pendingInvitations[0].assessment_type as keyof typeof ASSESSMENT_INFO]?.description || 'Unlock deeper insights about your patterns'}
                </p>
              </div>
              <Button
                onClick={() => {
                  const firstPending = pendingInvitations[0];
                  const info = ASSESSMENT_INFO[firstPending.assessment_type as keyof typeof ASSESSMENT_INFO];
                  if (info?.path) {
                    navigate(info.path);
                  } else {
                    setActiveTab('assessments');
                  }
                }}
                className="bg-mi-cyan hover:bg-mi-cyan/90 text-white shrink-0"
              >
                {pendingInvitations.length === 1 ? 'Take Assessment' : 'View Assessments'}
              </Button>
            </div>
          </div>
        )}

        {/* Tabs: Recordings, Patterns, Victories */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full grid grid-cols-3 sm:grid-cols-4 bg-mi-navy-light border border-mi-cyan/20 h-auto p-1">
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
            {showAssessmentsTab && (
              <TabsTrigger value="assessments" className="gap-1 sm:gap-1.5 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-300 relative flex-col sm:flex-row py-2 px-1 sm:px-3 text-xs sm:text-sm col-span-3 sm:col-span-1">
                <ClipboardCheck className="w-4 h-4" />
                <span>Assessments</span>
                <span className="text-[10px] sm:text-xs bg-mi-navy px-1 sm:px-1.5 py-0.5 rounded-full">
                  {assessments.length}
                </span>
                {(pendingCount ?? 0) > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center bg-mi-gold text-black text-[10px] sm:text-xs font-bold border-0">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
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

          {/* Assessments Tab - Only rendered if tab is shown */}
          {showAssessmentsTab && (
            <TabsContent value="assessments" className="mt-4">
              <AssessmentList
                assessments={assessments}
                isLoading={assessmentsLoading}
                pendingInvitations={pendingInvitations}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default VaultPage;
