-- FitFusion Database Schema
-- Version: 1.0
-- Date: 2025-11-21

CREATE DATABASE IF NOT EXISTS fitfusion;
USE fitfusion;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. USER PREFERENCES TEMPLATE
-- ============================================
CREATE TABLE user_preferences_template (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    -- Personal Metrics
    age INT,
    weight FLOAT,
    height FLOAT,
    gender ENUM('male', 'female', 'other'),

    -- Fitness Goals
    goal ENUM('weight_gain', 'weight_loss', 'maintain', 'strength', 'stamina'),
    experience_level ENUM('beginner', 'intermediate', 'advanced'),
    workout_location ENUM('home', 'gym'),

    -- Workout Preferences
    equipment_list JSON,
    target_muscle_groups JSON,
    duration_weeks INT,

    -- Diet Preferences
    dietary_preference ENUM('veg', 'non_veg', 'mixed'),
    excluded_foods JSON,
    allergies JSON,
    medical_conditions JSON,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. WORKOUT PLAN
-- ============================================
CREATE TABLE workout_plan (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plan_json JSON NOT NULL,
    total_weeks INT,
    frequency_per_week INT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. DIET PLAN
-- ============================================
CREATE TABLE diet_plan (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plan_json JSON NOT NULL,
    total_daily_calories INT,
    total_daily_protein INT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. PLAN BUNDLE (MAIN PLAN LIFECYCLE)
-- ============================================
CREATE TABLE plan_bundle (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,

    preferences_snapshot JSON NOT NULL,
    workout_plan_id BIGINT,
    diet_plan_id BIGINT,

    status ENUM('active', 'completed', 'abandoned', 'restored') DEFAULT 'active',

    start_date DATE NOT NULL,
    allowed_change_deadline DATE NOT NULL,
    completed_at DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plan(id),
    FOREIGN KEY (diet_plan_id) REFERENCES diet_plan(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. PLAN HISTORY
-- ============================================
CREATE TABLE plan_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    plan_bundle_id BIGINT NOT NULL,
    
    old_status ENUM('active', 'completed', 'abandoned', 'restored'),
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_bundle_id) REFERENCES plan_bundle(id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. EXERCISE (RAG DATA SOURCE)
-- ============================================
CREATE TABLE exercise (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    muscle_group VARCHAR(50) NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced'),
    equipment_required JSON,
    video_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_muscle_group (muscle_group),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. WORKOUT PLAN EXERCISE (MAPPING)
-- ============================================
CREATE TABLE workout_plan_exercise (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workout_plan_id BIGINT NOT NULL,
    exercise_id BIGINT NOT NULL,

    sets INT,
    reps INT,
    rest_seconds INT,
    day_number INT,

    FOREIGN KEY (workout_plan_id) REFERENCES workout_plan(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id),
    INDEX idx_workout_plan_id (workout_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. USER PROGRESS
-- ============================================
CREATE TABLE user_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    plan_bundle_id BIGINT NOT NULL,

    date DATE NOT NULL,
    weight FLOAT,
    body_fat_pct FLOAT,
    steps INT,
    notes TEXT,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_bundle_id) REFERENCES plan_bundle(id),
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. RAG LOGS
-- ============================================
CREATE TABLE rag_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    plan_bundle_id BIGINT,

    request_payload JSON,
    response_payload JSON,

    model_used VARCHAR(100),
    tokens_used INT,
    duration_ms INT,

    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (plan_bundle_id) REFERENCES plan_bundle(id) ON DELETE SET NULL,
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. FOOD ITEM (RAG DATA SOURCE)
-- ============================================
CREATE TABLE food_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(150) NOT NULL,
    category ENUM('meat', 'veg', 'fruit', 'rice', 'bread', 'sabzi', 'drink', 'snack', 'other') NOT NULL,

    calories_per_100g FLOAT,
    protein_per_100g FLOAT,
    carbs_per_100g FLOAT,
    fats_per_100g FLOAT,

    vitamins JSON,
    minerals JSON,

    serving_description VARCHAR(200),
    is_veg BOOLEAN DEFAULT FALSE,

    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_veg (is_veg)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA - SAMPLE EXERCISES
-- ============================================
INSERT INTO exercise (name, muscle_group, difficulty, equipment_required, description) VALUES
('Push Ups', 'chest', 'beginner', '[]', 'Classic bodyweight chest exercise'),
('Dumbbell Bench Press', 'chest', 'intermediate', '["dumbbells", "bench"]', 'Chest press with dumbbells'),
('Pull Ups', 'back', 'intermediate', '["pull-up bar"]', 'Upper back and biceps exercise'),
('Squats', 'legs', 'beginner', '[]', 'Bodyweight leg exercise'),
('Barbell Squats', 'legs', 'advanced', '["barbell", "squat rack"]', 'Heavy leg compound movement'),
('Bicep Curls', 'arms', 'beginner', '["dumbbells"]', 'Isolated bicep exercise'),
('Plank', 'core', 'beginner', '[]', 'Core stability exercise'),
('Deadlift', 'back', 'advanced', '["barbell"]', 'Full body compound movement'),
('Shoulder Press', 'shoulders', 'intermediate', '["dumbbells"]', 'Overhead shoulder press'),
('Lunges', 'legs', 'beginner', '[]', 'Single leg exercise');

-- ============================================
-- SEED DATA - PAKISTANI FOOD ITEMS
-- ============================================
INSERT INTO food_item (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, is_veg, description) VALUES
('Chicken Breast (grilled)', 'meat', 165, 31, 0, 3.6, FALSE, 'Lean protein source'),
('Basmati Rice (cooked)', 'rice', 130, 2.7, 28, 0.3, TRUE, 'Long grain aromatic rice'),
('Roti (whole wheat)', 'bread', 260, 9, 48, 3, TRUE, 'Traditional flatbread'),
('Daal (lentils)', 'sabzi', 116, 9, 20, 0.4, TRUE, 'Protein-rich lentil curry'),
('Chicken Karahi', 'meat', 220, 18, 8, 14, FALSE, 'Traditional Pakistani chicken curry'),
('Aloo Gosht', 'meat', 180, 12, 15, 9, FALSE, 'Meat and potato curry'),
('Palak Paneer', 'sabzi', 120, 8, 6, 8, TRUE, 'Spinach and cottage cheese'),
('Banana', 'fruit', 89, 1.1, 23, 0.3, TRUE, 'High in potassium'),
('Apple', 'fruit', 52, 0.3, 14, 0.2, TRUE, 'Fiber-rich fruit'),
('Yogurt (plain)', 'drink', 59, 10, 3.6, 0.4, TRUE, 'Probiotic dairy'),
('Almonds', 'snack', 579, 21, 22, 50, TRUE, 'Healthy fats and protein'),
('Eggs (boiled)', 'meat', 155, 13, 1.1, 11, FALSE, 'Complete protein source'),
('Oats', 'other', 389, 17, 66, 7, TRUE, 'High fiber breakfast'),
('Chicken Biryani', 'rice', 200, 12, 25, 7, FALSE, 'Traditional rice dish'),
('Chapati', 'bread', 240, 8, 45, 2.5, TRUE, 'Unleavened flatbread');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- SELECT COUNT(*) as total_exercises FROM exercise;
-- SELECT COUNT(*) as total_food_items FROM food_item;
-- SHOW TABLES;
