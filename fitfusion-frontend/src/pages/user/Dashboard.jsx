import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Flame, Clock, Play, ChevronRight, Plus, Target } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({
    workoutsCompleted: 0,
    caloriesBurned: 0,
    minutesExercised: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get(`/users/${user.id}/plans`);
      setPlans(response.data || []);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/users/${user.id}/stats`, {
        params: { period: 'week' }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const statsDisplay = [
    { label: 'Workouts', value: stats.workoutsCompleted || 0, icon: Activity, color: 'from-blue-500 to-cyan-500' },
    { label: 'Kcal Burned', value: formatNumber(stats.caloriesBurned || 0), icon: Flame, color: 'from-orange-500 to-red-500' },
    { label: 'Minutes', value: stats.minutesExercised || 0, icon: Clock, color: 'from-purple-500 to-pink-500' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // Show onboarding for new users without plans
  if (plans.length === 0) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">
              Welcome to FitFusion, <span className="gradient-text">{user?.name || 'Champion'}</span>! 👋
            </h1>
            <p className="text-gray-400">Let's get you started on your fitness journey</p>
          </motion.div>

          {/* Onboarding Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card text-center py-16 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 blur-3xl rounded-full -mr-48 -mt-48" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-full flex items-center justify-center">
                <Target size={48} className="text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Fitness?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create your personalized AI-powered workout and diet plan in just a few minutes. 
                Our intelligent system will design a plan tailored specifically to your goals and preferences.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/preferences" className="btn btn-primary inline-flex items-center gap-2">
                  <Plus size={20} />
                  Generate Your First Plan
                </Link>
                <Link to="/profile" className="btn btn-secondary inline-flex items-center gap-2">
                  Complete Your Profile
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              { title: 'AI-Powered Plans', desc: 'Get personalized workouts based on your goals', icon: Activity },
              { title: 'Custom Nutrition', desc: 'Meal plans tailored to your dietary needs', icon: Flame },
              { title: 'Track Progress', desc: 'Monitor your journey and celebrate wins', icon: Clock },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="card text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-xl flex items-center justify-center">
                  <feature.icon size={32} className="text-primary-400" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Show regular dashboard for users with plans
  const latestPlan = plans[0];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user?.name || 'Champion'}</span>! 👋
          </h1>
          <p className="text-gray-400">Ready to crush your fitness goals today?</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsDisplay.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:border-primary-500/30 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-lg group-hover:bg-white/10 transition-colors">
                  This Week
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Active Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-3xl rounded-full -mr-32 -mt-32" />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-xl font-bold mb-1">Your Active Plan</h2>
              <p className="text-gray-400 text-sm">
                Created {new Date(latestPlan.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/20">
              ACTIVE
            </span>
          </div>

          <div className="flex gap-4 relative z-10">
            <Link to={`/plans/${latestPlan.id}`} className="btn btn-primary flex items-center gap-2">
              <Play size={18} fill="currentColor" />
              View Plan
            </Link>
            <Link to="/preferences" className="btn btn-secondary">
              Generate New Plan
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
