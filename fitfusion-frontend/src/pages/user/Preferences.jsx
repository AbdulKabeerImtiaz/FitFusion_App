import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Save, Activity, Scale, Utensils, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import MuscleSelector from '../../components/MuscleSelector';
import EquipmentSelector from '../../components/EquipmentSelector';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const STEPS = [
  { id: 'personal', title: 'About You', icon: Scale },
  { id: 'goals', title: 'Fitness Goals', icon: Activity },
  { id: 'muscles', title: 'Target Muscles', icon: Dumbbell },
  { id: 'diet', title: 'Diet & Health', icon: Utensils },
];

export default function Preferences() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Personal
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    
    // Goals
    goal: 'weight_loss',
    experience_level: 'beginner',
    workout_location: 'gym',
    duration_weeks: 4,
    equipment_list: [],
    
    // Muscles (from MuscleSelector)
    target_muscle_groups: [],
    
    // Diet
    dietary_preference: 'non_veg',
    allergies: [],
    medical_conditions: [],
    excluded_foods: []
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('[Preferences] Starting plan generation');
    console.log('[Preferences] User from Zustand:', user);
    console.log('[Preferences] Token from localStorage:', localStorage.getItem('token'));
    
    setLoading(true);
    setError('');
    
    try {
      console.log('[Preferences] Step 1: Saving preferences for user ID:', user.id);
      
      // Transform snake_case to camelCase for backend
      const preferencesPayload = {
        age: formData.age || null,
        weight: formData.weight || null,
        height: formData.height || null,
        gender: formData.gender,
        goal: formData.goal,
        experienceLevel: formData.experience_level,
        workoutLocation: formData.workout_location,
        durationWeeks: formData.duration_weeks || 4,
        equipmentList: formData.equipment_list || [],
        targetMuscleGroups: formData.target_muscle_groups || [],
        dietaryPreference: formData.dietary_preference,
        allergies: formData.allergies || [],
        medicalConditions: formData.medical_conditions || [],
        excludedFoods: formData.excluded_foods || []
      };
      
      console.log('[Preferences] Preferences payload (camelCase):', preferencesPayload);
      
      // Step 1: Save preferences
      const prefResponse = await api.post(`/users/${user.id}/preferences`, preferencesPayload);
      console.log('[Preferences] Preferences saved successfully:', prefResponse.data);

      // Step 2: Generate plan
      console.log('[Preferences] Step 2: Generating plan for user ID:', user.id);
      const planResponse = await api.post(`/users/${user.id}/generate-plan`);
      console.log('[Preferences] Plan generated successfully:', planResponse.data);
      
      // Step 3: Navigate to plans page
      console.log('[Preferences] Step 3: Navigating to /plans');
      navigate('/plans');
    } catch (err) {
      console.error('[Preferences] Error occurred:', err);
      console.error('[Preferences] Error response:', err.response);
      console.error('[Preferences] Error message:', err.response?.data?.message);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate plan. Please try again.';
      
      // Check if error is about preferences not being updated
      if (errorMessage.includes('update your preferences')) {
        setError('⚠️ ' + errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Setup Your Plan</h1>
          <p className="text-gray-400">Tell us about yourself to get a personalized AI workout plan</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -z-10 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary-600 to-secondary-500 -z-10 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
          
          {STEPS.map((step, index) => {
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
                {/* Step 1: Personal Info */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold mb-4">Personal Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Age</label>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="25"
                          value={formData.age}
                          onChange={(e) => updateField('age', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Gender</label>
                        <select 
                          className="input"
                          value={formData.gender}
                          onChange={(e) => updateField('gender', e.target.value)}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Weight (kg)</label>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="75"
                          value={formData.weight}
                          onChange={(e) => updateField('weight', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Height (cm)</label>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="180"
                          value={formData.height}
                          onChange={(e) => updateField('height', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Fitness Goals */}
                {currentStep === 1 && (
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

                      {/* Equipment Selector - Only for Home */}
                      {formData.workout_location === 'home' && (
                        <div className="md:col-span-2">
                          <EquipmentSelector
                            selectedEquipment={formData.equipment_list}
                            onChange={(equipment) => updateField('equipment_list', equipment)}
                          />
                        </div>
                      )}

                      <div className="md:col-span-2">
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
                    </div>
                  </div>
                )}

                {/* Step 3: Target Muscles */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold mb-4">Target Muscles</h2>
                    <MuscleSelector 
                      selectedMuscles={formData.target_muscle_groups}
                      onChange={(muscles) => updateField('target_muscle_groups', muscles)}
                    />
                  </div>
                )}

                {/* Step 4: Diet & Health */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold mb-4">Diet & Health</h2>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Dietary Preference</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`btn btn-secondary flex items-center gap-2 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              <ChevronLeft size={20} />
              Back
            </button>

            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary flex items-center gap-2 min-w-[200px] justify-center"
              >
                {loading ? (
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
