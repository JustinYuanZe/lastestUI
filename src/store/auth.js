import { reactive } from 'vue'

export const auth = reactive({
  isLoggedIn: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  init() {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const user = localStorage.getItem('user')

    if (accessToken && refreshToken && user) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.user = JSON.parse(user)
      this.isLoggedIn = true
    }
  },

  async login(username, password) {
    const demoUser = {
      _id: 'demo_id_' + Date.now(),
      username: username,
      department: 'Demo Department',
      profile: { name: username }
    }

    this.isLoggedIn = true
    this.user = demoUser
    this.accessToken = 'mock_access_token'
    this.refreshToken = 'mock_refresh_token'

    localStorage.setItem('accessToken', this.accessToken)
    localStorage.setItem('refreshToken', this.refreshToken)
    localStorage.setItem('user', JSON.stringify(demoUser))

    return { success: true }
  },

  async register(userData) {
    const demoUser = {
      _id: 'demo_id_' + Date.now(),
      username: userData.username,
      department: userData.department,
      profile: userData.profile || {}
    }

    this.isLoggedIn = true
    this.user = demoUser
    this.accessToken = 'mock_access_token'
    this.refreshToken = 'mock_refresh_token'

    localStorage.setItem('accessToken', this.accessToken)
    localStorage.setItem('refreshToken', this.refreshToken)
    localStorage.setItem('user', JSON.stringify(demoUser))

    return { success: true }
  },

  async logout() {
    this.isLoggedIn = false
    this.user = null
    this.accessToken = null
    this.refreshToken = null

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  },

  async refreshAccessToken() {
    if (!this.refreshToken) {
      this.logout()
      return null
    }
    return this.accessToken
  },

  getAuthHeader() {
    return this.accessToken ? `Bearer ${this.accessToken}` : null
  }
})

auth.init()