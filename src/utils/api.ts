const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
}

// Function to decode JWT payload (without verification)
function decodeJWT(token: string) {
  const payload = token.split('.')[1];
  const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  return decoded;
}

export { decodeJWT };

export const api = {
  async login(data: LoginData) {
    const formData = new URLSearchParams();
    formData.append('username', data.email.trim());  // OAuth2 uses 'username' for email
    formData.append('password', data.password);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    const responseData = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      throw new Error(responseData?.detail || 'Login failed');
    }

    return responseData;
  },

  async register(data: RegisterData) {
    console.log('Sending register data:', data);
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);
    if (!response.ok) {
      throw new Error(`Registration failed: ${responseText}`);
    }
    return JSON.parse(responseText);
  },

  async getHealth() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  async getCurrentUser() {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}
};
