const API_BASE_URL = "http://34.233.187.127:8000";

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

function decodeJWT(token: string) {
  const payload = token.split('.')[1];
  const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  return decoded;
}

export { decodeJWT };

export const api = {
  async login(data: LoginData) {
    const formData = new URLSearchParams();
    formData.append('username', data.email.trim());
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
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Registration failed: ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : null;
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
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  }
};