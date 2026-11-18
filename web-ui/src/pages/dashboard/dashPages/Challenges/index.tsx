import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle, Calendar, Target } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import api from '@/lib/api';

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  challenge_type: string;
  status: string;
  progress: number;
  start_date: string;
  end_date?: string;
}

export function ChallengeDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newChallengeId, setNewChallengeId] = useState<number | null>(
    (location.state as any)?.newChallengeId ?? null
  );

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

  // Clear the highlight after 2.5 s
  useEffect(() => {
    if (!newChallengeId) return;
    const t = setTimeout(() => {
      setNewChallengeId(null);
      // Wipe state so a back-nav doesn't re-highlight
      navigate(location.pathname, { replace: true, state: {} });
    }, 2500);
    return () => clearTimeout(t);
  }, [newChallengeId]);

  const loadChallenges = async () => {
    try {
      const response = await api.get(`/challenges/user/${user!.id}`);
      setChallenges(response.data);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChallenge = () => {
    navigate('/dashboard/challenges/createchallenge');
  };

  const handleViewChallenge = (challengeId: number) => {
    navigate(`/dashboard/challenges/${challengeId}`);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Challenges</h1>
            <p className="text-muted-foreground mt-1">Track your growth and get coaching from Simon</p>
          </div>
          <Button onClick={handleCreateChallenge}>
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="nm-raised border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {challenges.filter(c => c.status === 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>
          <Card className="nm-raised border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {challenges.filter(c => c.status === 'COMPLETED').length}
              </div>
            </CardContent>
          </Card>
          <Card className="nm-raised border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {challenges.length > 0
                  ? Math.round(challenges.reduce((sum, c) => sum + c.progress, 0) / challenges.length)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenges Grid */}
        {!isLoading && challenges.length === 0 && !newChallengeId ? (
          <Card className="nm-raised border-0 p-12 text-center">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Challenges Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first challenge to start your growth journey</p>
            <Button onClick={handleCreateChallenge}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Challenge
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Processing skeleton — shown while the new challenge is loading */}
            {isLoading && newChallengeId && (
              <Card className="nm-raised border-0 border-2 border-primary/30 animate-pulse">
                <CardHeader>
                  <div className="h-5 w-24 bg-muted rounded mb-2" />
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded mt-1" />
                </CardHeader>
                <CardContent>
                  <div className="h-2 w-full bg-muted rounded mb-4" />
                  <div className="h-4 w-1/2 bg-muted rounded mb-4" />
                  <div className="h-9 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            )}
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className={`nm-raised border-0 hover:brightness-95 dark:hover:brightness-110 transition-all cursor-pointer ${
                  challenge.id === newChallengeId
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-in fade-in duration-500'
                    : ''
                }`}
                onClick={() => handleViewChallenge(challenge.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <StatusBadge status={challenge.status} />
                    <div className="text-sm text-muted-foreground">{challenge.category}</div>
                  </div>
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{challenge.progress}%</span>
                    </div>
                    <ProgressBar value={challenge.progress} />
                  </div>

                  {/* Dates */}
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(challenge.start_date).toLocaleDateString()}</span>
                    {challenge.end_date && (
                      <>
                        <span className="mx-2">→</span>
                        <span>{new Date(challenge.end_date).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewChallenge(challenge.id);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    View & Chat
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
