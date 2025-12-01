import { useState, useEffect } from 'react';
import { TrendingUp, Users, Activity } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from 'axios';

const Analytics = () => {
  const [engagement, setEngagement] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const [engagementRes, statsRes] = await Promise.all([
        axios.get('http://localhost:8080/api/admin/analytics/user-engagement', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8080/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setEngagement(engagementRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-400">System insights and metrics</p>
        </div>
        {/* User Engagement */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-6">User Engagement</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Users"
              value={engagement?.totalUsers || 0}
              icon="👥"
              color="blue"
            />
            <MetricCard
              title="Users with Plans"
              value={engagement?.usersWithPlans || 0}
              icon="📋"
              color="green"
            />
            <MetricCard
              title="Active Users"
              value={engagement?.activeUsers || 0}
              icon="⚡"
              color="yellow"
            />
            <MetricCard
              title="Engagement Rate"
              value={`${(engagement?.engagementRate || 0).toFixed(1)}%`}
              icon="📊"
              color="purple"
            />
          </div>
        </div>

        {/* Content Statistics */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-6">Content Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="text-3xl font-bold text-blue-400">{stats?.totalExercises || 0}</div>
              <div className="text-sm text-gray-400 mt-1">Total Exercises</div>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="text-3xl font-bold text-green-400">{stats?.totalFoodItems || 0}</div>
              <div className="text-sm text-gray-400 mt-1">Total Food Items</div>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <div className="text-3xl font-bold text-purple-400">{stats?.totalPlans || 0}</div>
              <div className="text-sm text-gray-400 mt-1">Plans Generated</div>
            </div>
          </div>
        </div>

        {/* Exercise Distribution */}
        {stats?.exercisesByMuscleGroup && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-6">Exercise Distribution by Muscle Group</h2>
            <div className="space-y-4">
              {Object.entries(stats.exercisesByMuscleGroup)
                .sort((a, b) => b[1] - a[1])
                .map(([muscle, count]) => {
                  const percentage = ((count / stats.totalExercises) * 100).toFixed(1);
                  return (
                    <div key={muscle}>
                      <div className="flex justify-between mb-1">
                        <span className="capitalize font-medium">{muscle}</span>
                        <span className="text-gray-400">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-600 to-secondary-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Workout Completions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Workout Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <div className="text-2xl font-bold">{stats?.totalCompletions || 0}</div>
              <div className="text-sm text-gray-400 mt-1">Total Workout Completions</div>
            </div>
            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <div className="text-2xl font-bold">
                {stats?.totalCompletions && engagement?.activeUsers 
                  ? (stats.totalCompletions / engagement.activeUsers).toFixed(1)
                  : 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">Avg Completions per Active User</div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="card mt-8 bg-green-500/10 border-green-500/30">
          <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
            <Activity size={20} />
            System Health
          </h3>
          <p className="text-sm text-gray-300">
            All systems operational. Database contains {stats?.totalExercises} exercises and {stats?.totalFoodItems} food items.
            {engagement?.totalUsers} users registered with {engagement?.activeUsers} active users.
          </p>
        </div>
      </div>
    </Layout>
  );
};

const MetricCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
  };

  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]} border`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm mt-1 text-gray-400">{title}</div>
    </div>
  );
};

export default Analytics;
