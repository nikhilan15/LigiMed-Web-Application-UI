// LigiMed Frontend API Client Service
const configuredApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

// Use the local API through Vite's proxy during development. Deployments can
// provide VITE_API_BASE_URL without changing application code.
export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV
  ? '/api'
  : 'https://ligimed-web-application-ui.onrender.com/api');

export function getAuthHeaders(): Record<string, string> {
  try {
    const session = JSON.parse(localStorage.getItem('ligimed_session') || '{}');
    return session.token ? { Authorization: `Bearer ${session.token}` } : {};
  } catch {
    return {};
  }
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  for (const [key, value] of Object.entries(getAuthHeaders())) headers.set(key, value);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    return data.success === undefined && !res.ok
      ? { success: false, message: `Request failed (${res.status})` }
      : data;
  } catch {
    return { success: false, message: 'Unable to contact the LigiMed service.' };
  }
}

export async function fetchHealthStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err };
  }
}

export async function sendEmailOTP(email: string) {
  try {
    return await apiRequest('/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  } catch (err) {
    return { success: false, message: 'Unable to contact the authentication service.' };
  }
}

export async function verifyEmailOTP(email: string, otp: string, role: string = 'pharmacy') {
  try {
    return await apiRequest('/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, role })
    });
  } catch (err) {
    return { success: false, message: 'Unable to contact the authentication service.' };
  }
}

export async function loginWithGoogleToken(googleProfile: { email?: string; name?: string; picture?: string; token?: string }) {
  try {
    return await apiRequest('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleProfile)
    });
  } catch (err) {
    return { success: false, message: 'Unable to contact the authentication service.' };
  }
}

export async function loginUser(credentials: { email: string; password: string; role?: string }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
}

export async function registerUser(registrationData: {
  name: string;
  email: string;
  password?: string;
  role: string;
  company_name?: string;
  phone?: string;
}) {
  return apiRequest('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
}

export async function submitKYCVerification(kycData: { gstin?: string; pan?: string; drugLicense?: string; userId?: number }) {
  return apiRequest('/kyc/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kycData)
  });
}

export async function fetchProducts(category?: string, search?: string) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);

  return apiRequest(`/marketplace/products?${params.toString()}`);
}

export async function placeB2BOrder(orderData: { items: any[]; totalAmount: number; paymentMethod?: string; shippingAddress?: string }) {
  return apiRequest('/marketplace/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
}

export async function fetchTracking(trackingNumber: string = 'LM-TRACK-9901') {
  return apiRequest(`/logistics/tracking/${trackingNumber}`);
}

export async function fetchBNPLAccount() {
  return apiRequest('/bnpl/account');
}

export async function fetchInvoices() {
  return apiRequest('/billing/invoices');
}

export async function sendDispatchOTP(orderData: { orderId: string; pharmacyName?: string; pharmacyEmail?: string; otpCode?: string }) {
  try {
    return await apiRequest('/logistics/send-dispatch-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
  } catch (err) {
    return { success: false, message: 'Failed to contact logistics OTP service' };
  }
}

export async function submitPharmacistVerification(orderId: string, verificationData: any) {
  try {
    return await apiRequest(`/marketplace/orders/${orderId}/verify-pharmacist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationData)
    });
  } catch (err) {
    return { success: false, message: 'Failed to submit pharmacist verification' };
  }
}

export async function topUpWallet(amount: number) {
  try {
    return await apiRequest('/bnpl/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
  } catch (err) {
    return { success: false, message: 'Failed to top up wallet' };
  }
}
