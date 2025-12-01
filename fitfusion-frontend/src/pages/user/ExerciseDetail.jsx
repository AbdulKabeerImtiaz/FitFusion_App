import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Dumbbell, Target, Zap, Video, AlertCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';

export default function ExerciseDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExerciseDetails();
  }, [name]);

  const fetchExerciseDetails = async () => {
    try {
      // Decode the URL-encoded name
      const decodedName = decodeURIComponent(name);
      const response = await api.get(`/exercises/by-name/${encodeURIComponent(decodedName)}`);
      console.log('[ExerciseDetail] Fetched exercise:', response.data);
      setExercise(response.data);
    } catch (err) {
      console.error('Failed to fetch exercise details:', err);
      setError('Failed to load exercise details');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    return url;
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

  if (error || !exercise) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="card text-center py-12">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-bold mb-2">Exercise Not Found</h3>
            <p className="text-gray-400 mb-6">{error || 'This exercise could not be loaded'}</p>
            <button onClick={() => navigate(-1)} className="btn btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(exercise.videoUrl);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={20} />
          Back to Plan
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
              <Dumbbell size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{exercise.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20 capitalize">
                  {exercise.difficulty}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 capitalize">
                  {exercise.muscleGroup}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video */}
            {embedUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-0 overflow-hidden"
              >
                <div className="aspect-video bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title={exercise.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </motion.div>
            )}

            {/* Description */}
            {exercise.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target size={20} className="text-primary-400" />
                  How to Perform
                </h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {exercise.description}
                </p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Equipment Required */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                Equipment Required
              </h3>
              {exercise.equipmentRequired && exercise.equipmentRequired.length > 0 ? (
                <div className="space-y-2">
                  {exercise.equipmentRequired.map((equipment, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                      <span className="capitalize">{equipment}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No equipment needed (bodyweight)</p>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card bg-gradient-to-br from-primary-900/20 to-dark-800 border-primary-500/20"
            >
              <h3 className="font-bold mb-4">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Target Muscle</span>
                  <span className="font-medium capitalize">{exercise.muscleGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Difficulty</span>
                  <span className="font-medium capitalize">{exercise.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exercise ID</span>
                  <span className="font-medium">#{exercise.id}</span>
                </div>
              </div>
            </motion.div>

            {/* Video Link */}
            {exercise.videoUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card"
              >
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Video size={18} className="text-red-400" />
                  Video Tutorial
                </h3>
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors break-all"
                >
                  Watch on YouTube →
                </a>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
