import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '../../../../context/AuthContext';

type AudienceType = 'individual' | 'team' | 'organization';
type ChallengeType = 'habit' | 'skill' | 'behavior' | 'performance' | 'accountability';
type Category = 'Communication' | 'Productivity' | 'Leadership' | 'Culture' | 'Skills' | 'Process';

interface ChallengeFormData {
  title: string;
  description: string;
  category: Category | '';
  audienceType: AudienceType | '';
  employeeId: string;
  teamId: string;
  startDate: string;
  endDate: string;
  successCriteria: string;
  metrics: string;
  challengeType: ChallengeType | '';
  aiNotes: string;
}

export function CreateChallenge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ChallengeFormData, string>>>({});
  
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    category: '',
    audienceType: '',
    employeeId: '',
    teamId: '',
    startDate: '',
    endDate: '',
    successCriteria: '',
    metrics: '',
    challengeType: '',
    aiNotes: ''
  });

  const handleChange = (field: keyof ChallengeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ChallengeFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.audienceType) newErrors.audienceType = 'Audience type is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.successCriteria.trim()) newErrors.successCriteria = 'Success criteria is required';
    if (!formData.challengeType) newErrors.challengeType = 'Challenge type is required';

    if (formData.audienceType === 'individual' && !formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required for individual challenges';
    }
    if (formData.audienceType === 'team' && !formData.teamId.trim()) {
      newErrors.teamId = 'Team ID is required for team challenges';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) return;

    setIsSubmitting(true);

    try {
      const response = await api.post('/challenges', {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category.toUpperCase(),
        challenge_type: formData.challengeType.toUpperCase(),
        audience_type: formData.audienceType.toUpperCase(),
        employee_id: formData.employeeId || null,
        team_id: formData.teamId || null,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        success_criteria: formData.successCriteria,
        metrics: formData.metrics || null,
        ai_notes: formData.aiNotes || null
      });

      console.log('Challenge created:', response.data); // Add logging
      
      // Navigate using React Router instead of window.location
      navigate('/dashboard/challenges', { 
        state: { refresh: true, newChallengeId: response.data.id } 
      });
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      // More detailed error message
      if (error.response) {
        alert(`Failed to create challenge: ${error.response.data.error || 'Unknown error'}`);
      } else {
        alert('Failed to create challenge. Please check your network connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create New Challenge</h1>
            <p className="text-slate-600 mt-1">Define a growth opportunity for individuals, teams, or your organization</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core details about the challenge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="my-3">Challenge Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Improve Daily Standup Engagement"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="my-3">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Explain what this challenge is and why it matters..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="my-3">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`w-full h-10 px-3 rounded-md border ${errors.category ? 'border-red-500' : 'border-slate-200'} bg-white`}
                  >
                    <option value="">Select category</option>
                    <option value="Communication">Communication</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Culture">Culture</option>
                    <option value="Skills">Skills</option>
                    <option value="Process">Process</option>
                  </select>
                  {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="challengeType" className="my-3">Challenge Type *</Label>
                  <select
                    id="challengeType"
                    value={formData.challengeType}
                    onChange={(e) => handleChange('challengeType', e.target.value)}
                    className={`w-full h-10 px-3 rounded-md border ${errors.challengeType ? 'border-red-500' : 'border-slate-200'} bg-white`}
                  >
                    <option value="">Select type</option>
                    <option value="habit">Habit Building</option>
                    <option value="skill">Skill Development</option>
                    <option value="behavior">Behavior Change</option>
                    <option value="performance">Performance Improvement</option>
                    <option value="accountability">Accountability</option>
                  </select>
                  {errors.challengeType && <p className="text-sm text-red-600 mt-1">{errors.challengeType}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>Who is this challenge for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="audienceType" className="my-3">Audience Type *</Label>
                <select
                  id="audienceType"
                  value={formData.audienceType}
                  onChange={(e) => handleChange('audienceType', e.target.value)}
                  className={`w-full h-10 px-3 rounded-md border ${errors.audienceType ? 'border-red-500' : 'border-slate-200'} bg-white`}
                >
                  <option value="">Select audience</option>
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="organization">Organization-wide</option>
                </select>
                {errors.audienceType && <p className="text-sm text-red-600 mt-1">{errors.audienceType}</p>}
              </div>

              {formData.audienceType === 'individual' && (
                <div>
                  <Label htmlFor="employeeId" className="my-3">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    placeholder="Enter employee identifier"
                    value={formData.employeeId}
                    onChange={(e) => handleChange('employeeId', e.target.value)}
                    className={errors.employeeId ? 'border-red-500' : ''}
                  />
                  {errors.employeeId && <p className="text-sm text-red-600 mt-1">{errors.employeeId}</p>}
                </div>
              )}

              {formData.audienceType === 'team' && (
                <div>
                  <Label htmlFor="teamId" className="my-3">Team ID *</Label>
                  <Input
                    id="teamId"
                    placeholder="Enter team identifier"
                    value={formData.teamId}
                    onChange={(e) => handleChange('teamId', e.target.value)}
                    className={errors.teamId ? 'border-red-500' : ''}
                  />
                  {errors.teamId && <p className="text-sm text-red-600 mt-1">{errors.teamId}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>When does this challenge take place?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="my-3">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className={errors.startDate ? 'border-red-500' : ''}
                  />
                  {errors.startDate && <p className="text-sm text-red-600 mt-1">{errors.startDate}</p>}
                </div>

                <div>
                  <Label htmlFor="endDate" className="my-3">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave blank for ongoing challenges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success & Metrics</CardTitle>
              <CardDescription>How will progress be measured?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="successCriteria" className="my-3">Success Criteria *</Label>
                <Textarea
                  id="successCriteria"
                  placeholder="Describe what completion or success looks like..."
                  value={formData.successCriteria}
                  onChange={(e) => handleChange('successCriteria', e.target.value)}
                  className={`min-h-[80px] ${errors.successCriteria ? 'border-red-500' : ''}`}
                />
                {errors.successCriteria && <p className="text-sm text-red-600 mt-1">{errors.successCriteria}</p>}
              </div>

              <div>
                <Label htmlFor="metrics" className="my-3">Measurable KPIs (Optional)</Label>
                <Textarea
                  id="metrics"
                  placeholder="e.g., 'Increase meeting attendance by 20%', 'Reduce response time to under 2 hours'"
                  value={formData.metrics}
                  onChange={(e) => handleChange('metrics', e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-slate-500 mt-1">Specific, quantifiable measures of progress</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Coach Context</CardTitle>
              <CardDescription>Additional context for Simon to provide better guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="aiNotes" className="my-3">AI Notes (Optional)</Label>
                <Textarea
                  id="aiNotes"
                  placeholder="Any additional context, constraints, or special considerations the AI should know about..."
                  value={formData.aiNotes}
                  onChange={(e) => handleChange('aiNotes', e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-slate-500 mt-1">This information helps the AI provide more relevant coaching and insights</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Challenge
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}