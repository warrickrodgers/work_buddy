import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle, Calendar, Target } from 'lucide-react';
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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

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
    window.location.href = '/dashboard/challenges/createchallenge';
  };

  const handleViewChallenge = (challengeId: number) => {
    window.location.href = `/dashboard/challenges/${challengeId}`;
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-600">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Challenges</h1>
            <p className="text-slate-600 mt-1">Track your growth and get coaching from Simon</p>
          </div>
          <Button onClick={handleCreateChallenge} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {challenges.filter(c => c.status === 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {challenges.filter(c => c.status === 'COMPLETED').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Progress</CardTitle>
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
        {challenges.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Challenges Yet</h3>
            <p className="text-slate-500 mb-6">Create your first challenge to start your growth journey</p>
            <Button onClick={handleCreateChallenge} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Challenge
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewChallenge(challenge.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      challenge.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      challenge.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {challenge.status}
                    </div>
                    <div className="text-sm text-slate-500">{challenge.category}</div>
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
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold">{challenge.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${challenge.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center text-sm text-slate-600 mb-4">
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