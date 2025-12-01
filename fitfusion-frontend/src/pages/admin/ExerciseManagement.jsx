import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from 'axios';

const ExerciseManagement = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: 'chest',
    difficulty: 'beginner',
    equipmentRequired: [],
    videoUrl: '',
    description: ''
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, filterMuscle, filterDifficulty]);

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/admin/exercises', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExercises(response.data);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterMuscle !== 'all') {
      filtered = filtered.filter(ex => ex.muscleGroup === filterMuscle);
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty === filterDifficulty);
    }

    setFilteredExercises(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingExercise) {
        await axios.put(
          `http://localhost:8080/api/admin/exercises/${editingExercise.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          'http://localhost:8080/api/admin/exercises',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setShowModal(false);
      resetForm();
      fetchExercises();
    } catch (error) {
      console.error('Failed to save exercise:', error);
      alert('Failed to save exercise');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/admin/exercises/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchExercises();
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      alert('Failed to delete exercise');
    }
  };

  const openEditModal = (exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      difficulty: exercise.difficulty,
      equipmentRequired: exercise.equipmentRequired || [],
      videoUrl: exercise.videoUrl || '',
      description: exercise.description || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingExercise(null);
    setFormData({
      name: '',
      muscleGroup: 'chest',
      difficulty: 'beginner',
      equipmentRequired: [],
      videoUrl: '',
      description: ''
    });
  };

  const handleEquipmentChange = (equipment) => {
    const current = formData.equipmentRequired;
    if (current.includes(equipment)) {
      setFormData({
        ...formData,
        equipmentRequired: current.filter(e => e !== equipment)
      });
    } else {
      setFormData({
        ...formData,
        equipmentRequired: [...current, equipment]
      });
    }
  };

  const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const equipmentOptions = ['barbell', 'dumbbell', 'cable machine', 'bench', 'pull-up bar', 'none'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Exercise Management</h1>
            <p className="text-gray-400">Manage your exercise database</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Exercise
          </button>
        </div>
        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={filterMuscle}
              onChange={(e) => setFilterMuscle(e.target.value)}
              className="input"
            >
              <option value="all">All Muscle Groups</option>
              {muscleGroups.map(m => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="input"
            >
              <option value="all">All Difficulties</option>
              {difficulties.map(d => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise List */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Muscle Group</th>
                  <th className="px-6 py-3">Difficulty</th>
                  <th className="px-6 py-3">Equipment</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredExercises.map((exercise) => (
                  <tr key={exercise.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{exercise.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-400">{exercise.muscleGroup}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-400">{exercise.difficulty}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {exercise.equipmentRequired?.join(', ') || 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(exercise)}
                        className="text-primary-400 hover:text-primary-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exercise.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredExercises.length} of {exercises.length} exercises
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Muscle Group</label>
                  <select
                    value={formData.muscleGroup}
                    onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                    className="input"
                  >
                    {muscleGroups.map(m => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="input"
                  >
                    {difficulties.map(d => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Equipment Required</label>
                <div className="grid grid-cols-2 gap-2">
                  {equipmentOptions.map(eq => (
                    <label key={eq} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.equipmentRequired.includes(eq)}
                        onChange={() => handleEquipmentChange(eq)}
                        className="mr-2"
                      />
                      {eq.charAt(0).toUpperCase() + eq.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Video URL</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="input"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  {editingExercise ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ExerciseManagement;
