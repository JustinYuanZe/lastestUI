import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Profile from '../views/Profile.vue'
import CareerTest from '../views/CareerTest.vue'
import Results from '../views/Results.vue'
import About from '../views/About.vue'
import FAQ from '../views/FAQ.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/career-test',
    name: 'CareerTest',
    component: CareerTest
  },
  {
    path: '/results',
    name: 'Results',
    component: Results
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  next()
})

export default router