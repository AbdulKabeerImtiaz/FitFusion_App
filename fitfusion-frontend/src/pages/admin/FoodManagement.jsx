import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from 'axios';

const FoodManagement = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'meat',
    servingDescription: '',
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatsPer100g: 0,
    isVeg: false,
    description: ''
  });

  useEffect(() => {
    fetchFoodItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [foodItems, searchTerm]);

  const fetchFoodItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/admin/food-items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFoodItems(response.data);
    } catch (error) {
      console.error('Failed to fetch food items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = foodItems;
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredItems(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingItem) {
        await axios.put(
          `http://localhost:8080/api/admin/food-items/${editingItem.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          'http://localhost:8080/api/admin/food-items',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setShowModal(false);
      resetForm();
      fetchFoodItems();
    } catch (error) {
      console.error('Failed to save food item:', error);
      alert('Failed to save food item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/admin/food-items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFoodItems();
    } catch (error) {
      console.error('Failed to delete food item:', error);
      alert('Failed to delete food item');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      servingDescription: item.servingDescription || '',
      caloriesPer100g: item.caloriesPer100g || 0,
      proteinPer100g: item.proteinPer100g || 0,
      carbsPer100g: item.carbsPer100g || 0,
      fatsPer100g: item.fatsPer100g || 0,
      isVeg: item.isVeg || false,
      description: item.description || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'meat',
      servingDescription: '',
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatsPer100g: 0,
      isVeg: false,
      description: ''
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Food Item Management</h1>
            <p className="text-gray-400">Manage your food database</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Food Item
          </button>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search food items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Food Items Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Serving</th>
                  <th className="px-6 py-3">Calories</th>
                  <th className="px-6 py-3">Protein</th>
                  <th className="px-6 py-3">Carbs</th>
                  <th className="px-6 py-3">Fats</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.servingDescription || '100g'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.caloriesPer100g || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.proteinPer100g || 0}g</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.carbsPer100g || 0}g</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.fatsPer100g || 0}g</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-primary-400 hover:text-primary-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
          Showing {filteredItems.length} of {foodItems.length} food items
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
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
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    <option value="meat">Meat</option>
                    <option value="veg">Vegetables</option>
                    <option value="fruit">Fruits</option>
                    <option value="rice">Rice</option>
                    <option value="bread">Bread</option>
                    <option value="sabzi">Sabzi</option>
                    <option value="drink">Drinks</option>
                    <option value="snack">Snacks</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Serving Description</label>
                  <input
                    type="text"
                    value={formData.servingDescription}
                    onChange={(e) => setFormData({ ...formData, servingDescription: e.target.value })}
                    className="input"
                    placeholder="e.g., 1 cup, 1 piece"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Calories (per 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.caloriesPer100g}
                    onChange={(e) => setFormData({ ...formData, caloriesPer100g: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g per 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.proteinPer100g}
                    onChange={(e) => setFormData({ ...formData, proteinPer100g: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (g per 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.carbsPer100g}
                    onChange={(e) => setFormData({ ...formData, carbsPer100g: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fats (g per 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.fatsPer100g}
                    onChange={(e) => setFormData({ ...formData, fatsPer100g: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Vegetarian</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  {editingItem ? 'Update' : 'Create'}
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

export default FoodManagement;
