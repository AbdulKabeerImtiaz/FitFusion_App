import { motion } from 'framer-motion';
import { Dumbbell, Activity, Target, Zap, Wind, Heart } from 'lucide-react';

const EQUIPMENT_OPTIONS = [
  { id: 'dumbbells', name: 'Dumbbells', icon: Dumbbell, color: 'from-blue-500 to-cyan-500' },
  { id: 'resistance_bands', name: 'Resistance Bands', icon: Wind, color: 'from-purple-500 to-pink-500' },
  { id: 'pull_up_bar', name: 'Pull-up Bar', icon: Activity, color: 'from-orange-500 to-red-500' },
  { id: 'yoga_mat', name: 'Yoga Mat', icon: Heart, color: 'from-green-500 to-emerald-500' },
  { id: 'kettlebell', name: 'Kettlebell', icon: Target, color: 'from-yellow-500 to-orange-500' },
  { id: 'jump_rope', name: 'Jump Rope', icon: Zap, color: 'from-indigo-500 to-purple-500' },
  { id: 'bench', name: 'Bench', icon: Dumbbell, color: 'from-red-500 to-pink-500' },
  { id: 'bodyweight', name: 'Bodyweight Only', icon: Activity, color: 'from-gray-500 to-gray-700' },
];

export default function EquipmentSelector({ selectedEquipment, onChange }) {
  const toggleEquipment = (equipmentId) => {
    const newSelection = selectedEquipment.includes(equipmentId)
      ? selectedEquipment.filter(id => id !== equipmentId)
      : [...selectedEquipment, equipmentId];
    onChange(newSelection);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Available Equipment</h3>
        <span className="text-sm text-gray-400">
          {selectedEquipment.length} selected
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {EQUIPMENT_OPTIONS.map((equipment) => {
          const Icon = equipment.icon;
          const isSelected = selectedEquipment.includes(equipment.id);
          
          return (
            <motion.button
              key={equipment.id}
              onClick={() => toggleEquipment(equipment.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {/* Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${equipment.color} bg-opacity-10 flex items-center justify-center`}>
                <Icon size={24} className="text-white" />
              </div>

              {/* Name */}
              <p className="text-sm font-medium text-center">{equipment.name}</p>
            </motion.button>
          );
        })}
      </div>

      {selectedEquipment.length === 0 && (
        <p className="text-sm text-gray-400 text-center italic py-4">
          Select the equipment you have available at home
        </p>
      )}
    </div>
  );
}
