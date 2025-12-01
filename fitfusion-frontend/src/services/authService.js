import api from './api';

export const authService = {
  async login(email, password) {
    console.log('[AuthService] Attempting login for:', email);
    const response = await api.post('/auth/login', { email, password });
    console.log('[AuthService] Login response:', response.data);
    
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('[AuthService] Token and user saved to localStorage');
      console.log('[AuthService] User ID:', response.data.user.id);
      
      // Verify data was actually saved
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      console.log('[AuthService] Verification - Token saved:', !!savedToken);
      console.log('[AuthService] Verification - User saved:', !!savedUser);
      console.log('[AuthService] Verification - Token length:', savedToken?.length);
      console.log('[AuthService] Verification - User data:', savedUser);
    } else {
      console.error('[AuthService] Invalid response structure:', response.data);
    }
    return response.data;
  },

  async register(name, email, password) {
    console.log('[AuthService] Attempting registration for:', email);
    const response = await api.post('/auth/register', { name, email, password });
    console.log('[AuthService] Registration response:', response.data);
    
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('[AuthService] Token and user saved to localStorage');
      console.log('[AuthService] User ID:', response.data.user.id);
    } else {
      console.error('[AuthService] Invalid response structure:', response.data);
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    console.log('[AuthService] getCurrentUser - raw localStorage value:', userStr);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('[AuthService] getCurrentUser - parsed user:', user);
    return user;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'ROLE_ADMIN';
  }
};
