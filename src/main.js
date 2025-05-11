import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app =  createApp(App)
  app.use(router)
  app.mount('#app')
  app.config.globalProperties.WEATHER_API_KEY = ''
  app.config.globalProperties.AI_API_KEY = ''
  app.config.globalProperties.AI_API_KEY = ''
  app.config.globalProperties.AI_API_URL = 'https://api.deepseek.com'
  app.config.globalProperties.AI_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  app.config.globalProperties.AI_MODEL = 'qwen-plus'
