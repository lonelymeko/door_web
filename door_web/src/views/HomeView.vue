<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import dompurify from 'dompurify'
import axios from 'axios'

const navItems = [
  { title: 'bilibili', link: 'https://www.bilibili.com', internal: false },
  { title: '服务器实例', link: 'https://ecs.console.aliyun.com/', internal: false },
  { title: '个人博客', link: '/blog' },
  { title: '雨课堂', link: 'https://www.yuketang.cn/v2/web/index', internal: false },
  { title: 'deepseek', link: 'https://chat.deepseek.com/', internal: false },
  { title: '玺朽的砂糖', link: '/love', internal: true },
  { title: 'moji词典', link: 'https://www.mojidict.com/', internal: false },
  { title: '赞助我', link: '#', internal: true, click: () => { showSponsor.value = true } }
]

const externalNavItems = computed(() => navItems.filter(item => !item.internal))

const engines = [
  { name: '必应', value: 'bing', url: 'https://www.bing.com/search?q=' },
  { name: '百度', value: 'baidu', url: 'https://www.baidu.com/s?wd=' },
  { name: '搜狗', value: 'sogou', url: 'https://www.sogou.com/web?query=' }
]

const selectedEngine = ref(engines[0])
const searchQuery = ref('')
const showSponsor = ref(false)
const hotSearchList = ref([...Array(10)].map((_,i) => ({ title: `热搜条目 ${i + 1}` })))
const chatMessages = ref([])
const userInput = ref('')
const isLoading = ref(false)

const renderMarkdown = (content) => {
  return dompurify.sanitize(marked.parse(content))
}

const sendMessage = async () => {
  if (!userInput.value.trim()) return

  const newMessage = {
    role: 'user',
    content: userInput.value,
    timestamp: new Date().toISOString()
  }

  chatMessages.value.push(newMessage)
  const loadingMessage = {
    role: 'assistant',
    content: '思考中...',
    isLoading: true,
    timestamp: new Date().toISOString()
  }
  chatMessages.value.push(loadingMessage)

  userInput.value = ''
  isLoading.value = true

  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个乐于助人的助手' },
        { role: 'user', content: newMessage.content }
      ],
      stream: true
    }, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    })

    let fullResponse = ''
    chatMessages.value.pop() // 移除loading消息
    const assistantMessage = {
      role: 'assistant',
      content: '',
      isLoading: false,
      timestamp: new Date().toISOString()
    }
    chatMessages.value.push(assistantMessage)

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim())
      lines.forEach(line => {
        const message = line.replace(/^data: /, '')
        if (message === '[DONE]') return

        try {
          const parsed = JSON.parse(message)
          if (parsed.choices[0].delta.content) {
            fullResponse += parsed.choices[0].delta.content
            assistantMessage.content = fullResponse
          }
        } catch (e) {
          console.error('解析错误:', e)
        }
      })
    })

    response.data.on('end', () => {
      isLoading.value = false
    })

  } catch (error) {
    console.error('请求失败:', error)
    chatMessages.value.pop()
    chatMessages.value.push({
      role: 'assistant',
      content: '请求出错，请稍后再试',
      isLoading: false,
      timestamp: new Date().toISOString()
    })
    isLoading.value = false
  }
}

const performSearch = () => {
  window.open(selectedEngine.value.url + encodeURIComponent(searchQuery.value))
}
</script>


<template>
  <div class="container">
    <!-- 导航栏 -->
    <nav class="nav-bar">
      <a v-for="(item, index) in externalNavItems" :key="index" :href="item.link" target="_blank">
        {{ item.title }}
      </a>
      <router-link v-for="(item, index) in navItems.filter(item => item.internal)" :key="index + externalNavItems.length" :to="item.link" @click="item.click?.()">{{ item.title }}</router-link>
    </nav>

    <!-- 大标题 -->
    <h1 class="main-title">玺朽的导航</h1>

    <!-- 搜索引擎 -->
    <div class="search-engine">
      <select v-model="selectedEngine">
        <option v-for="engine in engines" :key="engine.value" :value="engine">
          {{ engine.name }}
        </option>
      </select>
      <input type="text" v-model="searchQuery" @keyup.enter="performSearch">
      <button @click="performSearch">搜索</button>
    </div>

    <!-- 热搜列表 -->
    <div class="hot-search">
      <h3>今日热搜</h3>
      <ul>
        <li v-for="(item, index) in hotSearchList" :key="index">
          {{ index + 1 }}. {{ item.title }}
        </li>
      </ul>
    </div>

    <!-- 赞助弹窗 -->
    <div class="sponsor-modal" v-if="showSponsor">
      <div class="modal-content">
        <img src="/img/alipay.jpg" alt="支付宝">
        <img src="/img/weixin.jpg" alt="微信">
        <button @click="showSponsor = false">关闭</button>
      </div>
    </div>
  </div>
</template>



<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.nav-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.main-title {
  text-align: center;
  font-family: 'Microsoft YaHei', sans-serif;
  color: #2c3e50;
  background-image: url('/img/banner.jpg');
  background-size: cover;
  padding: 80px 20px;
  margin: 20px 0;
  border-radius: 12px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.search-engine {
  display: flex;
  gap: 10px;
  margin: 40px 0;
}

select, input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.hot-search ul {
  list-style: none;
  padding: 0;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.hot-search li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.sponsor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-content img {
  width: 300px;
  height: auto;
  border: 2px solid #ddd;
  border-radius: 8px;
}
</style>