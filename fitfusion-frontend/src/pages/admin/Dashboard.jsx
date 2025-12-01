import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ragStatus, setRagStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, ragRes] = await Promise.all([
        axios.get('http://localhost:8080/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8080/api/admin/rag/status', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStats(statsRes.data);
      setRagStatus(ragRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your fitness platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Total Exercises"
            value={stats?.totalExercises || 0}
            icon="💪"
            color="green"
          />
          <StatCard
            title="Total Food Items"
            value={stats?.totalFoodItems || 0}
            icon="🍽️"
            color="yellow"
          />
          <StatCard
            title="Plans Generated"
            value={stats?.totalPlans || 0}
            icon="📋"
            color="purple"
          />
        </div>

        {/* Exercise Distribution */}
        {stats?.exercisesByMuscleGroup && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-4">Exercise Distribution by Muscle Group</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(stats.exercisesByMuscleGroup).map(([muscle, count]) => (
                <div key={muscle} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="capitalize font-medium">{muscle}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RAG Service Status */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">RAG Service Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Status:</span>
              <span className={`font-medium ${ragStatus?.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                {ragStatus?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Vector Count:</span>
              <span className="font-medium">{ragStatus?.vector_count || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Last Indexed:</span>
              <span className="font-medium text-sm">
                {ragStatus?.last_indexed_at ? new Date(ragStatus.last_indexed_at).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="Manage Exercises"
            description="Add, edit, or remove exercises"
            icon="💪"
            onClick={() => navigate('/admin/exercises')}
          />
          <ActionCard
            title="Manage Food Items"
            description="Add, edit, or remove food items"
            icon="🍽️"
            onClick={() => navigate('/admin/foods')}
          />
          <ActionCard
            title="Manage Users"
            description="View and manage user accounts"
            icon="👥"
            onClick={() => navigate('/admin/users')}
          />
          <ActionCard
            title="RAG Control"
            description="Manage RAG service and indexing"
            icon="🔄"
            onClick={() => navigate('/admin/rag')}
          />
          <ActionCard
            title="Analytics"
            description="View system analytics and insights"
            icon="📊"
            onClick={() => navigate('/admin/analytics')}
          />
          <ActionCard
            title="System Logs"
            description="View system logs and errors"
            icon="📝"
            onClick={() => navigate('/admin/logs')}
          />
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
  };

  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]} border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ title, description, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="card text-left hover:border-primary-500/50 transition-all group"
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  );
};

export default AdminDashboard;
