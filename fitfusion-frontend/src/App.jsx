import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UserDashboard from './pages/user/Dashboard';
import UserPreferences from './pages/user/PreferencesNew';
import UserPlans from './pages/user/Plans';
import PlanDetails from './pages/user/PlanDetails';
import ExerciseDetail from './pages/user/ExerciseDetail';
import UserProfile from './pages/user/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import ExerciseManagement from './pages/admin/ExerciseManagement';
import FoodManagement from './pages/admin/FoodManagement';
import UserManagement from './pages/admin/UserManagement';
import RAGControl from './pages/admin/RAGControl';
import Analytics from './pages/admin/Analytics';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  console.log('[ProtectedRoute] Auth check:', { 
    isAuthenticated, 
    user, 
    hasToken: !!localStorage.getItem('token'),
    hasUser: !!localStorage.getItem('user')
  });
  
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user?.role !== 'ROLE_ADMIN') {
    console.log('[ProtectedRoute] Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('[ProtectedRoute] Access granted');
  return children;
};

// Default Redirect Component - redirects based on role
const DefaultRedirect = () => {
  const { user } = useAuthStore();
  
  if (user?.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/preferences" element={
          <ProtectedRoute>
            <UserPreferences />
          </ProtectedRoute>
        } />
        <Route path="/plans" element={
          <ProtectedRoute>
            <UserPlans />
          </ProtectedRoute>
        } />
        <Route path="/plans/:id" element={
          <ProtectedRoute>
            <PlanDetails />
          </ProtectedRoute>
        } />
        <Route path="/exercise/:name" element={
          <ProtectedRoute>
            <ExerciseDetail />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/exercises" element={
          <ProtectedRoute adminOnly>
            <ExerciseManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/foods" element={
          <ProtectedRoute adminOnly>
            <FoodManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute adminOnly>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/rag" element={
          <ProtectedRoute adminOnly>
            <RAGControl />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute adminOnly>
            <Analytics />
          </ProtectedRoute>
        } />
        
        {/* Default Route */}
        <Route path="/" element={
          <ProtectedRoute>
            <DefaultRedirect />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
