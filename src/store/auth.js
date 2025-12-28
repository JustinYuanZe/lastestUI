import { reactive } from 'vue'

export const auth = reactive({
  isLoggedIn: true,
  
  user: {
    _id: "demo_user_123",
    username: "Demo Student",
    department: "Information Technology",
    profile: { name: "Demo Student" }
  },
  
  accessToken: "fake_token_for_demo",
  refreshToken: "fake_refresh_token",

  init() {
    console.log("👉 Auto-Login activated for Demo");
  },

  async login(username, password) {
    return { success: true }
  },

  async register(userData) {
    return { success: true }
  },

  async logout() {
    console.log("Logout disabled in demo mode");
  },

  async refreshAccessToken() {
    return "fake_token_for_demo";
  },

  getAuthHeader() {
    return "Bearer fake_token_for_demo";
  }
})

auth.init()