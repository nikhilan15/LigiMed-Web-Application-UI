// LigiMed Frontend API Client Service
const API_BASE_URL = 'http://localhost:3000/api';

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
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Unable to contact the authentication service.' };
  }
}

export async function verifyEmailOTP(email: string, otp: string, role: string = 'pharmacy') {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, role })
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Unable to contact the authentication service.' };
  }
}

export async function loginWithGoogleToken(googleProfile: { email?: string; name?: string; picture?: string; token?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleProfile)
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Unable to contact the authentication service.' };
  }
}

export async function loginUser(credentials: { email: string; password: string; role?: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return await res.json();
}

export async function registerUser(registrationData: {
  name: string;
  email: string;
  password?: string;
  role: string;
  company_name?: string;
  phone?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  return await res.json();
}

export async function submitKYCVerification(kycData: { gstin?: string; pan?: string; drugLicense?: string; userId?: number }) {
  const res = await fetch(`${API_BASE_URL}/kyc/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kycData)
  });
  return await res.json();
}

export async function fetchProducts(category?: string, search?: string) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE_URL}/marketplace/products?${params.toString()}`);
  return await res.json();
}

export async function placeB2BOrder(orderData: { items: any[]; totalAmount: number; paymentMethod?: string; shippingAddress?: string }) {
  const res = await fetch(`${API_BASE_URL}/marketplace/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return await res.json();
}

export async function fetchTracking(trackingNumber: string = 'LM-TRACK-9901') {
  const res = await fetch(`${API_BASE_URL}/logistics/tracking/${trackingNumber}`);
  return await res.json();
}

export async function fetchBNPLAccount() {
  const res = await fetch(`${API_BASE_URL}/bnpl/account`);
  return await res.json();
}

export async function fetchInvoices() {
  const res = await fetch(`${API_BASE_URL}/billing/invoices`);
  return await res.json();
}

export async function sendDispatchOTP(orderData: { orderId: string; pharmacyName?: string; pharmacyEmail?: string; otpCode?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/logistics/send-dispatch-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Failed to contact logistics OTP service' };
  }
}
