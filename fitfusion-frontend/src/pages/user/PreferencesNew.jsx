import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Save, Activity, Utensils, Dumbbell, Eye, Edit, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import MuscleSelector from '../../components/MuscleSelector';
import EquipmentSelector from '../../components/EquipmentSelector';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const EDIT_STEPS = [
  { id: 'goals', title: 'Fitness Goals', icon: Activity },
  { id: 'muscles', title: 'Target Muscles', icon: Dumbbell },
  { id: 'diet', title: 'Diet & Health', icon: Utensils },
];

export default function PreferencesNew() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentPreferences, setCurrentPreferences] = useState(null);
  const [formData, setFormData] = useState({
    // Goals
    goal: 'weight_loss',
    experience_level: 'beginner',
    workout_location: 'gym',
    duration_weeks: 4,
    frequency_per_week: 5,
    equipment_list: [],
    
    // Muscles
    target_muscle_groups: [],
    
    // Diet
    dietary_preference: 'non_veg',
    allergies: [],
    medical_conditions: [],
    excluded_foods: []
  });

  useEffect(() => {
    fetchCurrentPreferences();
  }, []);

  const fetchCurrentPreferences = async () => {
    try {
      const response = await api.get(`/users/${user.id}/preferences`);
      if (response.data) {
        setCurrentPreferences(response.data);
        // Populate form with current preferences
        setFormData({
          goal: response.data.goal || 'weight_loss',
          experience_level: response.data.experienceLevel || 'beginner',
          workout_location: response.data.workoutLocation || 'gym',
          duration_weeks: response.data.durationWeeks || 4,
          frequency_per_week: response.data.frequencyPerWeek || 5,
          equipment_list: response.data.equipmentList || [],
          target_muscle_groups: response.data.targetMuscleGroups || [],
          dietary_preference: response.data.dietaryPreference || 'non_veg',
          allergies: response.data.allergies || [],
          medical_conditions: response.data.medicalConditions || [],
          excluded_foods: response.data.excludedFoods || []
        });
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewPlan = () => {
    setShowConfirmDialog(true);
  };

  const confirmGenerateNewPlan = () => {
    setShowConfirmDialog(false);
    setMode('edit');
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < EDIT_STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleCancelEdit = () => {
    setMode('view');
    setCurrentStep(0);
    setError('');
    // Reset form to current preferences
    if (currentPreferences) {
      setFormData({
        goal: currentPreferences.goal || 'weight_loss',
        experience_level: currentPreferences.experienceLevel || 'beginner',
        workout_location: currentPreferences.workoutLocation || 'gym',
        duration_weeks: currentPreferences.durationWeeks || 4,
        frequency_per_week: currentPreferences.frequencyPerWeek || 5,
        equipment_list: currentPreferences.equipmentList || [],
        target_muscle_groups: currentPreferences.targetMuscleGroups || [],
        dietary_preference: currentPreferences.dietaryPreference || 'non_veg',
        allergies: currentPreferences.allergies || [],
        medical_conditions: currentPreferences.medicalConditions || [],
        excluded_foods: currentPreferences.excludedFoods || []
      });
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    
    try {
      // Get user profile for personal info
      const profileResponse = await api.get(`/users/${user.id}`);
      const profile = profileResponse.data;
      
      // Combine profile data with preferences
      const preferencesPayload = {
        age: profile.age || null,
        weight: profile.weight || null,
        height: profile.height || null,
        gender: profile.gender || 'male',
        goal: formData.goal,
        experienceLevel: formData.experience_level,
        workoutLocation: formData.workout_location,
        durationWeeks: formData.duration_weeks || 4,
        frequencyPerWeek: formData.frequency_per_week || 5,
        equipmentList: formData.equipment_list || [],
        targetMuscleGroups: formData.target_muscle_groups || [],
        dietaryPreference: formData.dietary_preference,
        allergies: formData.allergies || [],
        medicalConditions: formData.medical_conditions || [],
        excludedFoods: formData.excluded_foods || []
      };
      
      // Save preferences
      await api.post(`/users/${user.id}/preferences`, preferencesPayload);

      // Generate plan
      await api.post(`/users/${user.id}/generate-plan`);
      
      // Navigate to plans page
      navigate('/plans');
    } catch (err) {
      console.error('Error generating plan:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate plan. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // VIEW MODE - Show current preferences
  if (mode === 'view') {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Preferences</h1>
              <p className="text-gray-400">Your current fitness and diet preferences</p>
            </div>
            <button
              onClick={handleGenerateNewPlan}
              className="btn btn-primary flex items-center gap-2"
            >
              <Edit size={18} />
              Generate New Plan
            </button>
          </div>

          {!currentPreferences ? (
            <div className="card text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary-500/10 rounded-full flex items-center justify-center">
                <Eye size={40} className="text-primary-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Preferences Set</h3>
              <p className="text-gray-400 mb-6">You haven't set your preferences yet. Generate your first plan to get started!</p>
              <button
                onClick={handleGenerateNewPlan}
                className="btn btn-primary"
              >
                Generate Your First Plan
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Fitness Goals */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <Activity size={20} className="text-primary-400" />
                  </div>
                  <h2 className="text-xl font-bold">Fitness Goals</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Primary Goal</div>
                    <div className="font-bold capitalize">{currentPreferences.goal?.replace('_', ' ')}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Experience Level</div>
                    <div className="font-bold capitalize">{currentPreferences.experienceLevel}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Workout Location</div>
                    <div className="font-bold capitalize">{currentPreferences.workoutLocation}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Duration</div>
                    <div className="font-bold">{currentPreferences.durationWeeks} weeks</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Frequency</div>
                    <div className="font-bold">{currentPreferences.frequencyPerWeek}x per week</div>
                  </div>
                  {currentPreferences.equipmentList && currentPreferences.equipmentList.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4 col-span-2 md:col-span-3">
                      <div className="text-xs text-gray-400 mb-2">Equipment Available</div>
                      <div className="flex flex-wrap gap-2">
                        {currentPreferences.equipmentList.map((eq, idx) => (
                          <span key={idx} className="px-3 py-1 bg-primary-500/10 text-primary-300 rounded-lg text-sm capitalize">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Muscles */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Dumbbell size={20} className="text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold">Target Muscle Groups</h2>
                </div>
                {currentPreferences.targetMuscleGroups && currentPreferences.targetMuscleGroups.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentPreferences.targetMuscleGroups.map((muscle, idx) => (
                      <span key={idx} className="px-4 py-2 bg-blue-500/10 text-blue-300 rounded-lg capitalize">
                        {muscle}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">Full body workout</p>
                )}
              </div>

              {/* Diet & Health */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Utensils size={20} className="text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold">Diet & Health</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Dietary Preference</div>
                    <div className="font-medium capitalize">{currentPreferences.dietaryPreference?.replace('_', ' ')}</div>
                  </div>
                  {currentPreferences.allergies && currentPreferences.allergies.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Allergies</div>
                      <div className="flex flex-wrap gap-2">
                        {currentPreferences.allergies.map((allergy, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-500/10 text-red-300 rounded-lg text-sm capitalize">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentPreferences.medicalConditions && currentPreferences.medicalConditions.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Medical Conditions</div>
                      <div className="flex flex-wrap gap-2">
                        {currentPreferences.medicalConditions.map((condition, idx) => (
                          <span key={idx} className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-lg text-sm capitalize">
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentPreferences.excludedFoods && currentPreferences.excludedFoods.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Excluded Foods</div>
                      <div className="flex flex-wrap gap-2">
                        {currentPreferences.excludedFoods.map((food, idx) => (
                          <span key={idx} className="px-3 py-1 bg-orange-500/10 text-orange-300 rounded-lg text-sm capitalize">
                            {food}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card max-w-md w-full"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Generate New Plan?</h3>
                    <p className="text-gray-400 text-sm">
                      This will create a new workout and diet plan based on your updated preferences. 
                      Your current plan will remain accessible in your plan history.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmGenerateNewPlan}
                    className="btn btn-primary flex-1"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // EDIT MODE - Set preferences for new plan
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Set Your Preferences</h1>
          <p className="text-gray-400">Customize your fitness goals and dietary preferences</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -z-10 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary-600 to-secondary-500 -z-10 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (EDIT_STEPS.length - 1)) * 100}%` }}
          />
          
          {EDIT_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-dark-900 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-lg shadow-primary-500/30' 
                    : 'bg-dark-800 border border-white/10 text-gray-500'
                }`}>
                  <Icon size={18} />
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  isCurrent ? 'text-white' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Form Content */}
        <div className="card min-h-[400px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 1: Fitness Goals */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold mb-4">Fitness Goals</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-gray-400">Primary Goal</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {['weight_loss', 'weight_gain', 'maintain', 'strength', 'stamina'].map((goal) => (
                            <button
                              key={goal}
                              onClick={() => updateField('goal', goal)}
                              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                                formData.goal === goal
                                  ? 'bg-primary-500/20 border-primary-500 text-white'
                                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {goal.replace('_', ' ').toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Experience Level</label>
                        <select 
                          className="input"
                          value={formData.experience_level}
                          onChange={(e) => updateField('experience_level', e.target.value)}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Workout Location</label>
                        <div className="flex gap-3">
                          {['gym', 'home'].map((loc) => (
                            <button
                              key={loc}
                              onClick={() => updateField('workout_location', loc)}
                              className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                                formData.workout_location === loc
                                  ? 'bg-primary-500/20 border-primary-500 text-white'
                                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {loc.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {formData.workout_location === 'home' && (
                        <div className="md:col-span-2">
                          <EquipmentSelector
                            selectedEquipment={formData.equipment_list}
                            onChange={(equipment) => updateField('equipment_list', equipment)}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Plan Duration (weeks)</label>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="4"
                          min="1"
                          max="12"
                          value={formData.duration_weeks}
                          onChange={(e) => updateField('duration_weeks', parseInt(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Frequency (days/week)</label>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="5"
                          min="3"
                          max="7"
                          value={formData.frequency_per_week}
                          onChange={(e) => updateField('frequency_per_week', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Target Muscles */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold mb-4">Target Muscles</h2>
                    <MuscleSelector 
                      selectedMuscles={formData.target_muscle_groups}
                      onChange={(muscles) => updateField('target_muscle_groups', muscles)}
                    />
                  </div>
                )}

                {/* Step 3: Diet & Health */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold mb-4">Diet & Health</h2>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Dietary Preference</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['veg', 'non_veg', 'mixed'].map((diet) => (
                          <button
                            key={diet}
                            onClick={() => updateField('dietary_preference', diet)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                              formData.dietary_preference === diet
                                ? 'bg-primary-500/20 border-primary-500 text-white'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {diet.replace('_', ' ').toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Food Allergies (comma separated)</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Peanuts, Shellfish, Dairy..."
                        value={formData.allergies.join(', ')}
                        onChange={(e) => updateField('allergies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Medical Conditions (comma separated)</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Asthma, Diabetes..."
                        value={formData.medical_conditions.join(', ')}
                        onChange={(e) => updateField('medical_conditions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Excluded Foods (comma separated)</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Broccoli, Mushrooms..."
                        value={formData.excluded_foods.join(', ')}
                        onChange={(e) => updateField('excluded_foods', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            <button
              onClick={currentStep === 0 ? handleCancelEdit : handleBack}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </button>

            {currentStep === EDIT_STEPS.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn btn-primary flex items-center gap-2 min-w-[200px] justify-center"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save & Generate Plan
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn btn-primary flex items-center gap-2"
              >
                Next Step
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
