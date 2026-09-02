import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('jwt_token') || null)
  const [loading, setLoading] = useState(true)

  // Configure axios default authorization header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me')
          setUser(res.data)
        } catch (err) {
          console.error('Session expired or invalid token:', err)
          logout()
        }
      }
      setLoading(false)
    }

    fetchCurrentUser()
  }, [token])

  const login = async (credentials) => {
    const res = await axios.post('/api/auth/login', credentials)
    const { accessToken, user: userData } = res.data
    localStorage.setItem('jwt_token', accessToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setToken(accessToken)
    setUser(userData)
    return userData
  }

  const register = async (registerData) => {
    const res = await axios.post('/api/auth/register', registerData)
    const { accessToken, user: userData } = res.data
    localStorage.setItem('jwt_token', accessToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setToken(accessToken)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('jwt_token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const getDashboardPathByRole = (role) => {
    switch (role) {
      case 'ADMIN': return '/admin/dashboard'
      case 'COLLECTOR': return '/collector/dashboard'
      case 'RECYCLER': return '/recycler/dashboard'
      case 'USER':
      default:
        return '/user/dashboard'
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, getDashboardPathByRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
