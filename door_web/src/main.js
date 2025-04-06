import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app =  createApp(App)
  app.use(router)
  app.mount('#app')
  app.config.globalProperties.WEATHER_API_KEY = 'e0fb247b5bd5bd2a0bd5b90a4e4cc2cf'

