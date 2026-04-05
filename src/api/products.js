const API_BASE = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '')
const ADMIN_API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN || ''
const ADMIN_CSRF_KEY = 'heritage_hues_admin_csrf'

const getCsrfToken = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(ADMIN_CSRF_KEY) || ''
}

const setCsrfToken = (token) => {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(ADMIN_CSRF_KEY, token)
  } else {
    window.localStorage.removeItem(ADMIN_CSRF_KEY)
  }
}

const buildHeaders = (customHeaders = {}) => {
  const headers = { 'Content-Type': 'application/json', ...customHeaders }
  const csrfToken = getCsrfToken()
  if (csrfToken && !headers['X-CSRF-Token']) {
    headers['X-CSRF-Token'] = csrfToken
  }
  if (ADMIN_API_TOKEN) {
    headers['X-Admin-Token'] = ADMIN_API_TOKEN
  }
  return headers
}

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: buildHeaders(options.headers),
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed')
  }

  if (data?.csrf_token) {
    setCsrfToken(data.csrf_token)
  }

  return data
}

export const loginAdmin = (payload) =>
  request('/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const logoutAdmin = () =>
  request('/admin/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  })

export const fetchAdminProfile = () => request('/admin/profile')

export const fetchAdminDashboard = () => request('/admin/dashboard')

export const fetchProducts = () => request('/api/products')

export const calculatePricing = (payload) =>
  request('/api/pricing/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const fetchPricingSettings = () => request('/api/admin/pricing-settings')

export const updatePricingSettings = (payload) =>
  request('/api/admin/pricing-settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const createProduct = (payload) =>
  request('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify({...payload, currency: 'INR'}),
  })

export const updateProduct = (id, payload) =>
  request(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteProduct = (id) =>
  request(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

export const fetchOrders = ({ status = '', payment_status = '' } = {}) => {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (payment_status) params.set('payment_status', payment_status)
  const query = params.toString()
  return request(`/api/admin/orders${query ? `?${query}` : ''}`)
}

export const fetchOrderDetails = (id) =>
  request(`/api/order/${encodeURIComponent(id)}`)

export const updateOrderStatus = (id, payload) =>
  request(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

export const approveUpiPayment = (id) =>
  request(`/api/admin/orders/${encodeURIComponent(id)}/approve-payment`, {
    method: 'POST',
  })

export const softDeleteOrder = (id) =>
  request(`/api/admin/orders/${encodeURIComponent(id)}/soft-delete`, {
    method: 'POST',
  })

export const fetchContactMessages = () => request('/api/admin/contacts')

export const deleteContactMessage = (id) =>
  request(`/api/admin/contacts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

export const fetchReviews = () => request('/api/admin/reviews')

export const deleteReview = (id) =>
  request(`/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

export const fetchUsers = () => request('/api/admin/users')

export const deleteUser = (email) =>
  request(`/api/admin/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  })


export const uploadProductPhotos = async (files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("photos", file);
  });

  const response = await fetch(`${API_BASE}/api/admin/uploads`, {
    method: "POST",
    body: formData,
    credentials: "include", // 🔥 important if using sessions/auth
  });

  // 🔥 Safe response handling (no "Unexpected end of JSON")
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error("Server returned invalid response");
  }

  if (!response.ok) {
    throw new Error(data?.error || "Upload failed");
  }

  return data.photos || [];
};

// export const uploadProductPhotos = async (files) => {
//   const formData = new FormData()
//   files.forEach((file) => formData.append('photos', file))

//   const response = await fetch(`${API_BASE}/api/admin/uploads`, {
//     method: 'POST',
//     credentials: 'include',
//     headers: buildHeaders({}),
//     body: formData,
//   })

//   const data = await response.json().catch(() => ({}))

//   if (!response.ok) {
//     throw new Error(data.error || 'Upload failed')
//   }

//   return Array.isArray(data.photos) ? data.photos : []
// }

export const clearAdminSessionState = () => setCsrfToken('')
