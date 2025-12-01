import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MuscleSelector({ selectedMuscles, onChange }) {
  const [view, setView] = useState('front'); // 'front' or 'back'

  const toggleMuscle = (muscle) => {
    const newSelection = new Set(selectedMuscles);
    if (newSelection.has(muscle)) {
      newSelection.delete(muscle);
    } else {
      newSelection.add(muscle);
    }
    onChange(Array.from(newSelection));
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Body Viewer */}
      <div className="flex-1 w-full flex flex-col items-center">
        {/* View Toggle */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-xl">
          <button
            onClick={() => setView('front')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'front'
                ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Front View
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'back'
                ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Back View
          </button>
        </div>

        {/* Canvas */}
        <div className="relative w-[300px] h-[500px] md:w-[400px] md:h-[600px]">
          <img
            src={view === 'front' ? '/assets/body_front.png' : '/assets/body_back.png'}
            alt="Body Model"
            className="w-full h-full object-contain"
          />

          {/* SVG Overlay */}
          <svg
            viewBox="0 0 400 600"
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            {view === 'front' ? (
              <g style={{ pointerEvents: 'all' }}>
                {/* Chest */}
                <ellipse
                  cx="200" cy="160" rx="60" ry="50"
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedMuscles.includes('Chest') 
                      ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                      : 'fill-transparent hover:fill-primary-500/20 hover:stroke-primary-500 stroke-transparent'
                  }`}
                  onClick={() => toggleMuscle('Chest')}
                />
                {/* Abs */}
                <rect
                  x="160" y="210" width="80" height="100" rx="15"
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedMuscles.includes('Abs') 
                      ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                      : 'fill-transparent hover:fill-primary-500/20 hover:stroke-primary-500 stroke-transparent'
                  }`}
                  onClick={() => toggleMuscle('Abs')}
                />
                {/* Shoulders (Left & Right) */}
                <g onClick={() => toggleMuscle('Shoulders')} className="cursor-pointer group">
                  <circle
                    cx="130" cy="140" r="35"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Shoulders') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                  <circle
                    cx="270" cy="140" r="35"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Shoulders') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                </g>
                {/* Biceps (Left & Right) */}
                <g onClick={() => toggleMuscle('Biceps')} className="cursor-pointer group">
                  <ellipse
                    cx="100" cy="200" rx="25" ry="45"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Biceps') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                  <ellipse
                    cx="300" cy="200" rx="25" ry="45"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Biceps') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                </g>
                {/* Quadriceps (Left & Right) */}
                <g onClick={() => toggleMuscle('Quadriceps')} className="cursor-pointer group">
                  <rect
                    x="150" y="340" width="40" height="120" rx="15"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Quadriceps') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                  <rect
                    x="210" y="340" width="40" height="120" rx="15"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Quadriceps') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                </g>
              </g>
            ) : (
              <g style={{ pointerEvents: 'all' }}>
                {/* Back/Lats */}
                <rect
                  x="140" y="140" width="120" height="140" rx="20"
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedMuscles.includes('Back') 
                      ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                      : 'fill-transparent hover:fill-primary-500/20 hover:stroke-primary-500 stroke-transparent'
                  }`}
                  onClick={() => toggleMuscle('Back')}
                />
                {/* Triceps (Left & Right) */}
                <g onClick={() => toggleMuscle('Triceps')} className="cursor-pointer group">
                  <ellipse
                    cx="100" cy="200" rx="25" ry="45"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Triceps') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                  <ellipse
                    cx="300" cy="200" rx="25" ry="45"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Triceps') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                </g>
                {/* Glutes */}
                <ellipse
                  cx="200" cy="310" rx="60" ry="35"
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedMuscles.includes('Glutes') 
                      ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                      : 'fill-transparent hover:fill-primary-500/20 hover:stroke-primary-500 stroke-transparent'
                  }`}
                  onClick={() => toggleMuscle('Glutes')}
                />
                {/* Hamstrings (Left & Right) */}
                <g onClick={() => toggleMuscle('Hamstrings')} className="cursor-pointer group">
                  <rect
                    x="150" y="350" width="40" height="120" rx="15"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Hamstrings') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                  <rect
                    x="210" y="350" width="40" height="120" rx="15"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Hamstrings') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                </g>
                {/* Calves (Left & Right) */}
                <g onClick={() => toggleMuscle('Calves')} className="cursor-pointer group">
                  <ellipse
                    cx="170" cy="520" rx="20" ry="50"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Calves') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                  <ellipse
                    cx="230" cy="520" rx="20" ry="50"
                    className={`transition-all duration-200 ${
                      selectedMuscles.includes('Calves') 
                        ? 'fill-primary-500/30 stroke-secondary-500 stroke-2' 
                        : 'fill-transparent group-hover:fill-primary-500/20 group-hover:stroke-primary-500 stroke-transparent'
                    }`}
                  />
                </g>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Selection List */}
      <div className="w-full md:w-80 space-y-6">
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Selected Muscles</h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedMuscles.length === 0 ? (
              <p className="text-gray-400 text-sm italic">
                Click on the body model to select target muscle groups
              </p>
            ) : (
              selectedMuscles.map(muscle => (
                <motion.div
                  key={muscle}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-300 text-sm"
                >
                  <span>{muscle}</span>
                  <button
                    onClick={() => toggleMuscle(muscle)}
                    className="hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </motion.div>
              ))
            )}
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Quick Tips</h4>
            <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
              <li>Select major muscle groups you want to focus on</li>
              <li>Toggle between Front and Back views</li>
              <li>You can select multiple groups</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
