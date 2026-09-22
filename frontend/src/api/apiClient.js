/**
 * SMART E-WASTE MANAGEMENT SYSTEM — UNIFIED API CLIENT
 * Encapsulates Axios HTTP configuration, token resolution, and type-aligned endpoint callers.
 * 
 * Reuses existing Axios architecture. Does NOT introduce new external libraries.
 */

import axios from 'axios';

// 1. Create a dedicated Axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor: Automatically attach active JWT token from either key
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Standardized error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired or invalid token
      console.warn('API returned 401 Unauthorized.');
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from an Axios error response
 */
export function getApiErrorMessage(error, defaultMsg = 'An unexpected error occurred. Please try again.') {
  if (!error) return defaultMsg;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return defaultMsg;
}

// =============================================================================
// PUBLIC MARKETPLACE API
// =============================================================================
export const marketplaceApi = {
  /**
   * Search and browse approved listings
   */
  searchListings(params = {}) {
    return apiClient.get('/api/marketplace/listings', { params });
  },

  /**
   * Get single listing details
   */
  getListingDetail(id) {
    return apiClient.get(`/api/marketplace/listings/${id}`);
  },

  /**
   * Get transparent circular device journey (zero donor PII)
   */
  getDeviceJourney(id) {
    return apiClient.get(`/api/marketplace/listings/${id}/journey`);
  },
};

// =============================================================================
// CUSTOMER CART API
// =============================================================================
export const cartApi = {
  getCart() {
    return apiClient.get('/api/marketplace/cart');
  },

  addToCart(listingId) {
    return apiClient.post('/api/marketplace/cart/items', null, {
      params: { listingId },
    });
  },

  removeFromCart(listingId) {
    return apiClient.delete(`/api/marketplace/cart/items/${listingId}`);
  },

  clearCart() {
    return apiClient.delete('/api/marketplace/cart');
  },
};

// =============================================================================
// CUSTOMER ORDER API
// =============================================================================
export const orderApi = {
  checkout(createOrderDto) {
    return apiClient.post('/api/marketplace/orders', createOrderDto);
  },

  getMyOrders() {
    return apiClient.get('/api/marketplace/orders');
  },

  getOrderDetail(id) {
    return apiClient.get(`/api/marketplace/orders/${id}`);
  },

  cancelOrder(id, reason = 'Cancelled by customer') {
    return apiClient.post(`/api/marketplace/orders/${id}/cancel`, null, {
      params: { reason },
    });
  },
};

// =============================================================================
// RECYCLER FACILITY WORKFLOW API
// =============================================================================
export const recyclerApi = {
  // Physical Assessment & Jobs
  getPendingAssessments() {
    return apiClient.get('/api/recycler/requests/pending-assessment');
  },

  submitAssessment(requestId, createAssessmentDto) {
    return apiClient.post(`/api/recycler/requests/${requestId}/assessment`, createAssessmentDto);
  },

  getAssessment(requestId) {
    return apiClient.get(`/api/recycler/requests/${requestId}/assessment`);
  },

  getRestorationJobs(status) {
    return apiClient.get('/api/recycler/restorations', {
      params: status ? { status } : {},
    });
  },

  startRestorationJob(jobId) {
    return apiClient.patch(`/api/recycler/restorations/${jobId}/start`);
  },

  completeRestorationJob(jobId, updateProgressDto) {
    return apiClient.patch(`/api/recycler/restorations/${jobId}/complete`, updateProgressDto);
  },

  submitQualityCheck(jobId, submitQcDto) {
    return apiClient.post(`/api/recycler/restorations/${jobId}/quality-check`, submitQcDto);
  },

  // Marketplace Listings Management
  getCandidates() {
    return apiClient.get('/api/recycler/marketplace/candidates');
  },

  createListingDraft(createDraftDto) {
    return apiClient.post('/api/recycler/marketplace/listings', createDraftDto);
  },

  getCenterListings(status) {
    return apiClient.get('/api/recycler/marketplace/listings', {
      params: status ? { status } : {},
    });
  },

  getListingDetail(id) {
    return apiClient.get(`/api/recycler/marketplace/listings/${id}`);
  },

  updateListingDraft(id, updateDraftDto) {
    return apiClient.put(`/api/recycler/marketplace/listings/${id}`, updateDraftDto);
  },

  submitForApproval(id) {
    return apiClient.post(`/api/recycler/marketplace/listings/${id}/submit`);
  },

  withdrawListing(id) {
    return apiClient.post(`/api/recycler/marketplace/listings/${id}/withdraw`);
  },

  fulfillOrder(orderId, status) {
    return apiClient.post(`/api/recycler/marketplace/orders/${orderId}/fulfill`, null, {
      params: { status },
    });
  },
};

// =============================================================================
// ADMIN MARKETPLACE API
// =============================================================================
export const adminApi = {
  getAllListings(status) {
    return apiClient.get('/api/admin/marketplace/listings', {
      params: status ? { status } : {},
    });
  },

  reviewListing(id, listingApprovalDto) {
    return apiClient.post(`/api/admin/marketplace/listings/${id}/review`, listingApprovalDto);
  },

  getAllOrders(status) {
    return apiClient.get('/api/admin/marketplace/orders', {
      params: status ? { status } : {},
    });
  },
};

export default apiClient;
