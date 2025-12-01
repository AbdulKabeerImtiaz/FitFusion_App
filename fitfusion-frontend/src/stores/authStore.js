import { create } from 'zustand';
import { authService } from '../services/authService';

const initialUser = authService.getCurrentUser();
const initialAuth = authService.isAuthenticated();

console.log('[AuthStore] Initializing with:', { 
  user: initialUser, 
  isAuthenticated: initialAuth,
  hasToken: !!localStorage.getItem('token'),
  hasUserData: !!localStorage.getItem('user')
});

export const useAuthStore = create((set) => ({
  user: initialUser,
  isAuthenticated: initialAuth,
  
  setUser: (user) => {
    console.log('[AuthStore] setUser called with:', user);
    set({ user, isAuthenticated: true });
  },
  
  logout: () => {
    console.log('[AuthStore] logout called');
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: () => {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    console.log('[AuthStore] checkAuth called:', { user, isAuthenticated });
    set({ user, isAuthenticated });
  }
}));
