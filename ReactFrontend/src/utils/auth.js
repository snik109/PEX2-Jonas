// Helper functions for authentication

let onUnauthorizedCallback = null

export function setOnUnauthorizedCallback(callback) {
  onUnauthorizedCallback = callback
}

export function isLoggedIn() {
  return !!localStorage.getItem('token')
}

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function logout() {
  localStorage.removeItem('token')
}

/**
 * Wrapper around fetch that automatically handles 401 errors
 * by logging out the user and triggering redirect to login
 */
export async function fetchWithAuth(url, options = {}) {
  const token = getToken()
  
  const headers = {
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })
    
    // Check for 401 Unauthorized
    if (response.status === 401) {
      logout()
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback()
      }
      // Return a rejected promise so caller can handle it
      throw new Error('Unauthorized')
    }
    
    return response
  } catch (error) {
    throw error
  }
}
