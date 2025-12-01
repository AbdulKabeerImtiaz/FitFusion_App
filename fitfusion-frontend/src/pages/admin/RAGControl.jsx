import { useState, useEffect } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from 'axios';

const RAGControl = () => {
  const [ragStatus, setRagStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    fetchRagStatus();
  }, []);

  const fetchRagStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/admin/rag/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRagStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch RAG status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    if (!confirm('Are you sure you want to trigger a full reindex? This may take a few minutes.')) return;
    
    setReindexing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8080/api/admin/rag/reindex',
        { mode: 'full' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Reindexing started successfully. This will take a few minutes.');
      // Wait a bit then refresh status
      setTimeout(() => {
        fetchRagStatus();
        setReindexing(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to trigger reindex:', error);
      alert('Failed to trigger reindex');
      setReindexing(false);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">RAG Service Control</h1>
          <p className="text-gray-400">Manage vector indexing and embeddings</p>
        </div>
        {/* Status Card */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Service Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="font-medium">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                ragStatus?.status === 'healthy' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {ragStatus?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="font-medium">Index Exists</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                ragStatus?.index_exists 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {ragStatus?.index_exists ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="font-medium">Vector Count</span>
              <span className="text-lg font-semibold">{ragStatus?.vector_count || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="font-medium">Last Indexed</span>
              <span className="text-sm text-gray-400">
                {ragStatus?.last_indexed_at 
                  ? new Date(ragStatus.last_indexed_at).toLocaleString() 
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="font-medium">Embedding Model</span>
              <span className="text-sm text-gray-400">{ragStatus?.embedding_model || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="font-medium">LLM Model</span>
              <span className="text-sm text-gray-400">{ragStatus?.llm_model || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <h3 className="font-medium mb-2">Manual Reindex</h3>
              <p className="text-sm text-gray-400 mb-4">
                Trigger a full reindex of all exercises and food items. This will recreate all embeddings
                and may take a few minutes to complete.
              </p>
              <button
                onClick={handleReindex}
                disabled={reindexing}
                className={`btn flex items-center gap-2 ${
                  reindexing ? 'opacity-50 cursor-not-allowed' : 'btn-primary'
                }`}
              >
                <RefreshCw size={16} className={reindexing ? 'animate-spin' : ''} />
                {reindexing ? 'Reindexing...' : 'Trigger Reindex'}
              </button>
            </div>

            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <h3 className="font-medium mb-2">Refresh Status</h3>
              <p className="text-sm text-gray-400 mb-4">
                Refresh the current status of the RAG service to see the latest information.
              </p>
              <button
                onClick={fetchRagStatus}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Activity size={16} />
                Refresh Status
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="card mt-6 bg-blue-500/10 border-blue-500/30">
          <h3 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <Activity size={20} />
            About RAG Service
          </h3>
          <p className="text-sm text-gray-300">
            The RAG (Retrieval-Augmented Generation) service automatically reindexes when you add, update,
            or delete exercises and food items through the admin panel. Manual reindexing is only needed
            if you've made direct database changes or if you suspect the index is out of sync.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default RAGControl;
