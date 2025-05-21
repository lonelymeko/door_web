import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import LoveView from '../views/LoveView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MainView
    },
    {
      path: '/love',
      name: 'love',
      component: LoveView
    }
  ]
})