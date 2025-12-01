import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Calendar, Activity, TrendingUp, Award, Edit2, Save, X } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    createdAt: ''
  });

  const [editData, setEditData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    completedPlans: 0,
    totalWorkouts: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/${user.id}`);
      setProfileData(response.data);
      setEditData({ 
        ...editData, 
        name: response.data.name,
        age: response.data.age || '',
        weight: response.data.weight || '',
        height: response.data.height || '',
        gender: response.data.gender || 'male'
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const plansResponse = await api.get(`/users/${user.id}/plans`);
      const plans = plansResponse.data;
      
      const activePlans = plans.filter(p => p.status === 'active').length;
      const completedPlans = plans.filter(p => p.status === 'completed').length;
      
      // Calculate total workouts (sum of all weeks * frequency)
      const totalWorkouts = plans.reduce((sum, plan) => {
        const weeks = plan.workoutPlan?.totalWeeks || 0;
        const frequency = plan.workoutPlan?.frequencyPerWeek || 0;
        return sum + (weeks * frequency);
      }, 0);

      setStats({
        totalPlans: plans.length,
        activePlans,
        completedPlans,
        totalWorkouts
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validate
      if (!editData.name.trim()) {
        setError('Name is required');
        setSaving(false);
        return;
      }

      // If changing password, validate
      if (editData.newPassword) {
        if (!editData.currentPassword) {
          setError('Current password is required to change password');
          setSaving(false);
          return;
        }
        if (editData.newPassword !== editData.confirmPassword) {
          setError('New passwords do not match');
          setSaving(false);
          return;
        }
        if (editData.newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          setSaving(false);
          return;
        }
      }

      // Update profile
      const updatePayload = {
        name: editData.name,
        age: editData.age ? parseInt(editData.age) : null,
        weight: editData.weight ? parseFloat(editData.weight) : null,
        height: editData.height ? parseFloat(editData.height) : null,
        gender: editData.gender
      };

      if (editData.newPassword) {
        updatePayload.currentPassword = editData.currentPassword;
        updatePayload.newPassword = editData.newPassword;
      }

      const response = await api.put(`/users/${user.id}`, updatePayload);
      
      setProfileData(response.data);
      setUser({ ...user, name: response.data.name });
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      
      // Clear password fields
      setEditData({
        ...editData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditData({
      name: profileData.name,
      age: profileData.age || '',
      weight: profileData.weight || '',
      height: profileData.height || '',
      gender: profileData.gender || 'male',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account settings and view your progress</p>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-6"
          >
            {success}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Profile Information</h2>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn btn-sm bg-white/5 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="btn btn-sm btn-primary flex items-center gap-2"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="btn btn-sm bg-white/5 hover:bg-white/10 flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="input w-full"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <User size={20} className="text-primary-400" />
                      <span className="font-medium">{profileData.name}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <Mail size={20} className="text-primary-400" />
                    <span className="font-medium">{profileData.email}</span>
                    <span className="ml-auto text-xs text-gray-500">(Cannot be changed)</span>
                  </div>
                </div>

                {/* Member Since */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Member Since</label>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <Calendar size={20} className="text-primary-400" />
                    <span className="font-medium">
                      {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <User size={20} className="text-primary-400" />
                <h2 className="text-xl font-bold">Personal Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Age */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Age</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editData.age}
                      onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                      className="input w-full"
                      placeholder="25"
                    />
                  ) : (
                    <div className="p-3 bg-white/5 rounded-lg">
                      <span className="font-medium">{profileData.age || 'Not set'} {profileData.age && 'years'}</span>
                    </div>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gender</label>
                  {editMode ? (
                    <select
                      value={editData.gender}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      className="input w-full"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-white/5 rounded-lg">
                      <span className="font-medium capitalize">{profileData.gender || 'Not set'}</span>
                    </div>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Weight (kg)</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editData.weight}
                      onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
                      className="input w-full"
                      placeholder="75"
                      step="0.1"
                    />
                  ) : (
                    <div className="p-3 bg-white/5 rounded-lg">
                      <span className="font-medium">{profileData.weight || 'Not set'} {profileData.weight && 'kg'}</span>
                    </div>
                  )}
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Height (cm)</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editData.height}
                      onChange={(e) => setEditData({ ...editData, height: e.target.value })}
                      className="input w-full"
                      placeholder="180"
                      step="0.1"
                    />
                  ) : (
                    <div className="p-3 bg-white/5 rounded-lg">
                      <span className="font-medium">{profileData.height || 'Not set'} {profileData.height && 'cm'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password */}
            {editMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h2 className="text-xl font-bold mb-6">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={editData.currentPassword}
                      onChange={(e) => setEditData({ ...editData, currentPassword: e.target.value })}
                      className="input w-full"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">New Password</label>
                    <input
                      type="password"
                      value={editData.newPassword}
                      onChange={(e) => setEditData({ ...editData, newPassword: e.target.value })}
                      className="input w-full"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={editData.confirmPassword}
                      onChange={(e) => setEditData({ ...editData, confirmPassword: e.target.value })}
                      className="input w-full"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Leave password fields empty if you don't want to change your password
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Stats */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="card bg-gradient-to-br from-primary-600 to-secondary-500">
              <div className="flex items-center gap-3 mb-2">
                <Activity size={24} className="text-white" />
                <h3 className="font-bold text-white">Total Plans</h3>
              </div>
              <p className="text-4xl font-bold text-white">{stats.totalPlans}</p>
              <p className="text-sm text-white/80 mt-1">Generated plans</p>
            </div>

            <div className="card bg-gradient-to-br from-green-600 to-emerald-500">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={24} className="text-white" />
                <h3 className="font-bold text-white">Active Plans</h3>
              </div>
              <p className="text-4xl font-bold text-white">{stats.activePlans}</p>
              <p className="text-sm text-white/80 mt-1">Currently following</p>
            </div>

            <div className="card bg-gradient-to-br from-blue-600 to-cyan-500">
              <div className="flex items-center gap-3 mb-2">
                <Award size={24} className="text-white" />
                <h3 className="font-bold text-white">Completed</h3>
              </div>
              <p className="text-4xl font-bold text-white">{stats.completedPlans}</p>
              <p className="text-sm text-white/80 mt-1">Finished programs</p>
            </div>

            <div className="card">
              <h3 className="font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Workouts</span>
                  <span className="font-bold">{stats.totalWorkouts} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="font-bold text-green-400">
                    {stats.totalPlans > 0 
                      ? Math.round((stats.completedPlans / stats.totalPlans) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Status</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
