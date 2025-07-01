import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HOMEView.vue'
import LoveView from '../views/LoveView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/love',
      name: 'love',
      component: LoveView
    }
  ]
})