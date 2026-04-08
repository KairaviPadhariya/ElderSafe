const API_URL = "http://127.0.0.1:8000";

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  return response.json();
};

export const getNotifications = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.json();
};

export const uploadDocument = async (file: File) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/medical-documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
};