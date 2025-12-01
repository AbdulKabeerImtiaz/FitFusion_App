// Build timestamp: 2025-11-30T13:05:00
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Dumbbell, Utensils, ChevronRight, Plus } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function Plans() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get(`/users/${user.id}/plans`);
      console.log('[Plans] Fetched plans:', response.data);
      setPlans(response.data);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Plans</h1>
            <p className="text-gray-400">View and manage your AI-generated fitness plans</p>
          </div>
          <Link to="/preferences" className="btn btn-primary flex items-center gap-2">
            <Plus size={20} />
            Generate New Plan
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {plans.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
              <Dumbbell size={40} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Plans Yet</h3>
            <p className="text-gray-400 mb-6">Generate your first AI-powered fitness plan to get started</p>
            <Link to="/preferences" className="btn btn-primary inline-flex items-center gap-2">
              <Plus size={20} />
              Create Your First Plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan, index) => {
              console.log('[Plans] Rendering plan:', index, 'ID:', plan.id, 'Full object:', plan);
              
              // Get status badge styling
              const getStatusBadge = (status) => {
                const statusLower = (status || 'active').toLowerCase();
                switch(statusLower) {
                  case 'active':
                    return 'bg-green-500/10 text-green-400 border-green-500/20';
                  case 'completed':
                    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  case 'abandoned':
                    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                  case 'restored':
                    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                  default:
                    return 'bg-primary-500/10 text-primary-300 border-primary-500/20';
                }
              };
              
              return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card hover:border-primary-500/30 transition-all group">
                  <Link to={`/plans/${plan.id}`} className="block">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-primary-400 transition-colors">
                          {plan.planType || 'Fitness Plan'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar size={14} />
                          <span>Created {formatDate(plan.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-500 group-hover:text-primary-400 transition-colors" size={20} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Dumbbell size={16} className="text-primary-400" />
                          <span className="text-xs text-gray-400">Workout</span>
                        </div>
                        <p className="font-bold">
                          {plan.workoutPlan ? 'Included' : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Utensils size={16} className="text-green-400" />
                          <span className="text-xs text-gray-400">Diet</span>
                        </div>
                        <p className="font-bold">
                          {plan.dietPlan ? 'Included' : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <span className="text-gray-400">Bundle ID: {plan.id}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize ${getStatusBadge(plan.status)}`}>
                        {plan.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
