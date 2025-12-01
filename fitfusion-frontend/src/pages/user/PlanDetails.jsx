import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Dumbbell, Utensils, Clock, Flame, ChevronRight, CheckCircle, ArrowLeft, User, Target, MapPin, Activity } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

export default function PlanDetails() {
  const { id } = useParams(); // bundleId
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('workout'); // 'workout', 'diet', or 'preferences'
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [planData, setPlanData] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlanDetails();
    fetchCompletions();
  }, [id]);

  const fetchPlanDetails = async () => {
    try {
      const response = await api.get(`/users/plans/${id}`);
      console.log('[PlanDetails] Full API response:', response.data);
      console.log('[PlanDetails] Workout plan:', response.data.workoutPlan);
      console.log('[PlanDetails] Diet plan:', response.data.dietPlan);
      setPlanData(response.data);
    } catch (err) {
      console.error('Failed to fetch plan details:', err);
      setError('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletions = async () => {
    try {
      const response = await api.get(`/users/${user.id}/workout-completions`, {
        params: { planBundleId: id }
      });
      setCompletions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch completions:', err);
    }
  };

  const isExerciseCompleted = (exerciseName) => {
    return completions.some(c => 
      c.weekNumber === selectedWeek && 
      c.dayNumber === selectedDay && 
      c.exerciseName === exerciseName
    );
  };

  const toggleExerciseCompletion = async (exercise, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const exerciseName = exercise.name || exercise.exercise_name;
    const isCompleted = isExerciseCompleted(exerciseName);
    
    try {
      if (isCompleted) {
        // Unmark as complete
        await api.delete(`/users/${user.id}/workout-completions`, {
          params: {
            planBundleId: id,
            weekNumber: selectedWeek,
            dayNumber: selectedDay,
            exerciseName: exerciseName
          }
        });
      } else {
        // Mark as complete
        await api.post(`/users/${user.id}/workout-completions`, {
          planBundleId: parseInt(id),
          weekNumber: selectedWeek,
          dayNumber: selectedDay,
          exerciseName: exerciseName,
          setsCompleted: exercise.sets,
          repsCompleted: exercise.reps || exercise.repetitions,
          durationMinutes: 5, // Estimate per exercise
          caloriesBurned: 50, // Estimate per exercise
          notes: ''
        });
      }
      
      // Refresh completions
      await fetchCompletions();
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
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

  if (error || !planData) {
    return (
      <Layout>
        <div className="card text-center py-12">
          <h3 className="text-xl font-bold mb-2">Plan Not Found</h3>
          <p className="text-gray-400 mb-6">{error || 'This plan could not be loaded'}</p>
          <Link to="/plans" className="btn btn-primary">
            Back to Plans
          </Link>
        </div>
      </Layout>
    );
  }

  // Parse workout and diet plans
  const workoutPlan = planData.workoutPlan?.planJson || {};
  const dietPlan = planData.dietPlan?.planJson || {};
  
  console.log('[PlanDetails] Parsed workoutPlan:', workoutPlan);
  console.log('[PlanDetails] Parsed dietPlan:', dietPlan);
  
  // Get weeks array
  const weeks = workoutPlan.weeks || [];
  const totalWeeks = weeks.length || workoutPlan.total_weeks || 4;
  const daysPerWeek = workoutPlan.frequency_per_week || 5;
  
  // Get current week's data
  const currentWeekData = weeks.find(w => w.week_number === selectedWeek) || weeks[selectedWeek - 1] || {};
  const daysInCurrentWeek = currentWeekData.days || [];
  
  console.log('[PlanDetails] Current week:', selectedWeek, 'Data:', currentWeekData);
  console.log('[PlanDetails] Days in current week:', daysInCurrentWeek);
  
  // Get current day's workout data
  const currentWorkout = daysInCurrentWeek.find(day => day.day_number === selectedDay) || {};
  
  console.log('[PlanDetails] Current workout (week', selectedWeek, 'day', selectedDay, '):', currentWorkout);
  
  // For diet plan, meals are the same every day (not day-specific in current schema)
  const currentDiet = dietPlan.meals ? {
    meals: dietPlan.meals,
    total_calories: dietPlan.total_daily_calories,
    protein: dietPlan.total_daily_protein,
    carbs: dietPlan.daily_totals?.carbs,
    fats: dietPlan.daily_totals?.fats
  } : {};

  console.log('[PlanDetails] Current diet:', currentDiet);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to="/plans" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={20} />
          Back to Plans
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">Your Fitness Plan</h1>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">
              {planData.status || 'Active'}
            </span>
          </div>
          <p className="text-gray-400">
            Created on {new Date(planData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Week Selector */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
              <button
                key={week}
                onClick={() => {
                  setSelectedWeek(week);
                  setSelectedDay(1); // Reset to day 1 when changing weeks
                }}
                className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedWeek === week
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Week {week}
              </button>
            ))}
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex overflow-x-auto gap-3 pb-4 mb-6 scrollbar-hide">
          {Array.from({ length: daysPerWeek + 2 }, (_, i) => i + 1).map((day) => {
            const hasWorkout = daysInCurrentWeek.some(d => d.day_number === day);
            const isRestDay = day > daysPerWeek;
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                  selectedDay === day
                    ? isRestDay
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                    : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-medium opacity-80">
                  {isRestDay ? 'Rest' : 'Day'}
                </span>
                <span className="text-xl font-bold">{day}</span>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/5">
          <button
            onClick={() => setActiveTab('workout')}
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'workout' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Dumbbell size={18} />
              Workout Plan
            </div>
            {activeTab === 'workout' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('diet')}
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'diet' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Utensils size={18} />
              Diet Plan
            </div>
            {activeTab === 'diet' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'preferences' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <User size={18} />
              Preferences
            </div>
            {activeTab === 'preferences' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              key={`${activeTab}-${selectedWeek}-${selectedDay}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'preferences' ? (
                <>
                  {/* Preferences Tab */}
                  {planData.preferencesSnapshot ? (
                    <div className="space-y-6">
                      {/* Personal Info */}
                      <div className="card">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <User size={20} className="text-primary-400" />
                          Personal Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Age</div>
                            <div className="font-bold">{planData.preferencesSnapshot.age || 'N/A'} years</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Gender</div>
                            <div className="font-bold capitalize">{planData.preferencesSnapshot.gender || 'N/A'}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Weight</div>
                            <div className="font-bold">{planData.preferencesSnapshot.weight || 'N/A'} kg</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Height</div>
                            <div className="font-bold">{planData.preferencesSnapshot.height || 'N/A'} cm</div>
                          </div>
                        </div>
                      </div>

                      {/* Fitness Goals */}
                      <div className="card">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <Target size={20} className="text-green-400" />
                          Fitness Goals
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Goal</div>
                            <div className="font-bold capitalize">{(planData.preferencesSnapshot.goal || 'N/A').replace('_', ' ')}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Experience Level</div>
                            <div className="font-bold capitalize">{(planData.preferencesSnapshot.experience_level || 'N/A').replace('_', ' ')}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Duration</div>
                            <div className="font-bold">{planData.preferencesSnapshot.duration_weeks || 'N/A'} weeks</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Frequency</div>
                            <div className="font-bold">{planData.preferencesSnapshot.frequency_per_week || 'N/A'}x per week</div>
                          </div>
                        </div>
                      </div>

                      {/* Workout Preferences */}
                      <div className="card">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <MapPin size={20} className="text-blue-400" />
                          Workout Preferences
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-400 mb-2">Location</div>
                            <div className="font-medium capitalize">{(planData.preferencesSnapshot.workout_location || 'N/A').replace('_', ' ')}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-2">Equipment Available</div>
                            <div className="flex flex-wrap gap-2">
                              {planData.preferencesSnapshot.equipment_list && planData.preferencesSnapshot.equipment_list.length > 0 ? (
                                planData.preferencesSnapshot.equipment_list.map((equipment, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-primary-500/10 text-primary-300 rounded-lg text-sm capitalize">
                                    {equipment}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400">None specified</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-2">Target Muscle Groups</div>
                            <div className="flex flex-wrap gap-2">
                              {planData.preferencesSnapshot.target_muscle_groups && planData.preferencesSnapshot.target_muscle_groups.length > 0 ? (
                                planData.preferencesSnapshot.target_muscle_groups.map((muscle, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg text-sm capitalize">
                                    {muscle}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400">Full body</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Diet Preferences */}
                      <div className="card">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <Activity size={20} className="text-yellow-400" />
                          Diet Preferences
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-400 mb-2">Dietary Preference</div>
                            <div className="font-medium capitalize">{(planData.preferencesSnapshot.dietary_preference || 'N/A').replace('_', ' ')}</div>
                          </div>
                          {planData.preferencesSnapshot.allergies && planData.preferencesSnapshot.allergies.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-400 mb-2">Allergies</div>
                              <div className="flex flex-wrap gap-2">
                                {planData.preferencesSnapshot.allergies.map((allergy, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-red-500/10 text-red-300 rounded-lg text-sm capitalize">
                                    {allergy}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {planData.preferencesSnapshot.excluded_foods && planData.preferencesSnapshot.excluded_foods.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-400 mb-2">Excluded Foods</div>
                              <div className="flex flex-wrap gap-2">
                                {planData.preferencesSnapshot.excluded_foods.map((food, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-orange-500/10 text-orange-300 rounded-lg text-sm capitalize">
                                    {food}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {planData.preferencesSnapshot.medical_conditions && planData.preferencesSnapshot.medical_conditions.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-400 mb-2">Medical Conditions</div>
                              <div className="flex flex-wrap gap-2">
                                {planData.preferencesSnapshot.medical_conditions.map((condition, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-lg text-sm capitalize">
                                    {condition}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card text-center py-12">
                      <p className="text-gray-400">No preferences data available</p>
                    </div>
                  )}
                </>
              ) : activeTab === 'workout' ? (
                <>
                  {!currentWorkout.day_number ? (
                    <div className="card text-center py-12 bg-gradient-to-br from-blue-900/20 to-dark-800 border-blue-500/20">
                      <div className="w-20 h-20 mx-auto mb-4 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <Calendar size={40} className="text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Rest Day</h3>
                      <p className="text-gray-400">Take this day to recover and let your muscles rebuild stronger</p>
                    </div>
                  ) : (
                    <>
                      {currentWorkout.focus && (
                        <div className="card mb-6 bg-gradient-to-br from-primary-900/20 to-dark-800 border-primary-500/20">
                          <h3 className="text-xl font-bold mb-2 text-white">Focus: {currentWorkout.focus}</h3>
                          <div className="flex gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Clock size={14} /> {currentWorkout.duration || '60 min'}</span>
                            {currentWorkout.calories && <span className="flex items-center gap-1"><Flame size={14} /> {currentWorkout.calories} kcal</span>}
                          </div>
                        </div>
                      )}

                      {currentWorkout.exercises && currentWorkout.exercises.length > 0 ? (
                    <div className="space-y-4">
                      {currentWorkout.exercises.map((exercise, index) => (
                        <Link 
                          key={index} 
                          to={`/exercise/${encodeURIComponent(exercise.name || exercise.exercise_name)}`}
                          className="block"
                        >
                          <div className="card hover:border-primary-500/30 transition-all group cursor-pointer">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-lg font-bold text-gray-400 group-hover:text-white group-hover:bg-primary-500/20 transition-colors">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-lg group-hover:text-primary-400 transition-colors">
                                      {exercise.name || exercise.exercise_name}
                                    </h4>
                                    <ChevronRight className="text-gray-500 group-hover:text-primary-400 transition-colors" size={18} />
                                  </div>
                                  <button 
                                    onClick={(e) => toggleExerciseCompletion(exercise, e)}
                                    className={`p-2 rounded-full transition-colors ${
                                      isExerciseCompleted(exercise.name || exercise.exercise_name)
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'hover:bg-green-500/10 text-gray-500 hover:text-green-400'
                                    }`}
                                  >
                                    <CheckCircle 
                                      size={20} 
                                      fill={isExerciseCompleted(exercise.name || exercise.exercise_name) ? 'currentColor' : 'none'}
                                    />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                  <div className="bg-white/5 rounded-lg p-2 text-center">
                                    <div className="text-xs text-gray-400">Sets</div>
                                    <div className="font-bold">{exercise.sets}</div>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-2 text-center">
                                    <div className="text-xs text-gray-400">Reps</div>
                                    <div className="font-bold">{exercise.reps || exercise.repetitions}</div>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-2 text-center">
                                    <div className="text-xs text-gray-400">Rest</div>
                                    <div className="font-bold">{exercise.rest || exercise.rest_period || (exercise.rest_seconds ? `${exercise.rest_seconds}s` : '60s')}</div>
                                  </div>
                                </div>
                                {exercise.notes && (
                                  <p className="text-sm text-gray-400 italic border-l-2 border-primary-500/30 pl-3">
                                    "{exercise.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                      ) : (
                        <div className="card text-center py-12">
                          <p className="text-gray-400">No workout data available for this day</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {currentDiet.total_calories && (
                    <div className="card mb-6 bg-gradient-to-br from-green-900/20 to-dark-800 border-green-500/20">
                      <h3 className="text-xl font-bold mb-4 text-white">Daily Macros</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{Math.round(currentDiet.total_calories)}</div>
                          <div className="text-xs text-gray-400">Calories</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-400">{Math.round(currentDiet.protein)}g</div>
                          <div className="text-xs text-gray-400">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-400">{Math.round(currentDiet.carbs || 0)}g</div>
                          <div className="text-xs text-gray-400">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-yellow-400">{Math.round(currentDiet.fats || 0)}g</div>
                          <div className="text-xs text-gray-400">Fats</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentDiet.meals && Object.keys(currentDiet.meals).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(currentDiet.meals).map(([mealType, mealItems]) => (
                        mealItems && mealItems.length > 0 && (
                          <div key={mealType} className="space-y-2">
                            <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-2">
                              {mealType.replace('_', ' ')}
                            </h4>
                            {mealItems.map((item, index) => (
                              <div key={index} className="card hover:border-green-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-bold text-lg">{item.food_name}</h5>
                                    <p className="text-sm text-gray-400">{item.serving_size}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold">{Math.round(item.calories)} kcal</div>
                                  </div>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-400">
                                  <span>P: {Math.round(item.protein)}g</span>
                                  <span>C: {Math.round(item.carbs)}g</span>
                                  <span>F: {Math.round(item.fats)}g</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="card text-center py-12">
                      <p className="text-gray-400">No diet data available</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-bold mb-4">Plan Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Week</span>
                  <span className="font-medium text-primary-400">Week {selectedWeek} of {totalWeeks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-medium">{totalWeeks} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Frequency</span>
                  <span className="font-medium">{daysPerWeek}x/week</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Workouts</span>
                  <span className="font-medium">{totalWeeks * daysPerWeek} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    planData.status === 'active' ? 'bg-green-500/10 text-green-400' :
                    planData.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                    planData.status === 'abandoned' ? 'bg-gray-500/10 text-gray-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    {planData.status}
                  </span>
                </div>
              </div>
            </div>

            {planData.workoutPlan?.summary && (
              <div className="card bg-gradient-to-br from-primary-600 to-secondary-500 border-none">
                <h3 className="font-bold text-white mb-2">AI Coach Tip</h3>
                <p className="text-sm text-white/80">
                  {planData.workoutPlan.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
