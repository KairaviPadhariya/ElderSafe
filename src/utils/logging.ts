const API_BASE_URL = 'http://100.50.8.161:8000';

type ActivityLogPayload = {
  action: string;
  description: string;
  activity_type?: string;
  metadata?: Record<string, unknown>;
};

type ContactLogPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

async function parseApiResponse(response: Response) {
  const responseText = await response.text();
  const responseData = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(responseData?.detail || responseData?.message || 'Request failed');
  }

  return responseData;
}

export async function createActivityLog(payload: ActivityLogPayload) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Please log in again to save activity details.');
  }

  const response = await fetch(`${API_BASE_URL}/activity_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseApiResponse(response);
}

export async function logActivitySafely(payload: ActivityLogPayload) {
  try {
    await createActivityLog(payload);
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}

export async function createContactLog(payload: ContactLogPayload) {
  const response = await fetch(`${API_BASE_URL}/contact_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return parseApiResponse(response);
}
