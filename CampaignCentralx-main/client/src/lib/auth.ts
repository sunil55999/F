// Simple token-based authentication for MVP
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  
  // Try to get from localStorage
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('auth_token');
  }
  
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
