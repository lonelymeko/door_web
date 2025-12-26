import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app =  createApp(App)
  app.use(router)
  app.config.globalProperties.WEATHER_API_KEY = 'e0fb247b5bd5bd2a0bd5b90a4e4cc2cf'
  app.config.globalProperties.AI_API_KEY = 'sk-0c04ce65a8554692978702db89f45753'
  app.config.globalProperties.AI_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  app.config.globalProperties.AI_MODEL = 'qwen-plus'
  
  app.mount('#app')
