<script setup >
//引入组件
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import Search from '../components/Search.vue'
import Suggestion from '../components/Suggestion.vue'
import HotSearch from '../components/hotsearch.vue';

// --- 这个 <script setup> 部分保持不变 (包含 AI 功能逻辑) ---
import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance, watch, nextTick } from 'vue'
import { locales } from '/src/utils/locales.js'
import OpenAI from 'openai';
import { marked } from 'marked';

// --- Constants ---
const DAILY_SUGGESTION_STORAGE_KEY = 'dailyTravelSuggestion';
const CHAT_HISTORY_STORAGE_KEY = 'aiChatHistory';

// --- Instance and Global Properties ---
const instance = getCurrentInstance();
const WEATHER_API_KEY = instance?.appContext.config.globalProperties.WEATHER_API_KEY;
const AI_API_KEY = instance?.appContext.config.globalProperties.AI_API_KEY;
const AI_API_URL = instance?.appContext.config.globalProperties.AI_API_URL;
const AI_MODEL = instance?.appContext.config.globalProperties.AI_MODEL;

// --- OpenAI Client Initialization ---
let openai = null;
if (AI_API_KEY && AI_API_URL && AI_MODEL) {
  try {
      openai = new OpenAI({
        apiKey: AI_API_KEY,
        baseURL: AI_API_URL,
        dangerouslyAllowBrowser: true,
      });
      console.log("OpenAI client initialized for DeepSeek.");
  } catch (error) {
      console.error("Failed to initialize OpenAI client:", error);
  }
} else {
  console.error("AI API Key, URL, or Model is missing. AI features will be disabled.");
}

// --- Language State ---
const currentLanguage = ref('zh-CN');
const t = (key, replacements = {}) => {
  const lang = currentLanguage.value;
  let translation = locales[lang]?.[key] || locales['zh-CN']?.[key] || key;
  Object.keys(replacements).forEach(repKey => {
    translation = translation.replace(`{${repKey}}`, replacements[repKey]);
  });
  return translation;
};
const changeLanguage = (lang) => {
  currentLanguage.value = lang;
  calendarInfo.value = new Date().toLocaleDateString(lang);
  loadDailySuggestion();
};

// --- AI Chat State & Logic ---
const chatMessagesContainer = ref(null);
const chatMessages = ref([]);
const chatInput = ref('');
const isChatLoading = ref(false);
const chatError = ref('');
let messageIdCounter = 0;
const systemPrompt = `你是玺朽的猫娘、你现在作为玺朽的导航的看板娘帮助来到导航的人回答问题、玺朽是大二的本科软件工程大学生（主攻Java后端，也学过Vue前端框架，最近在看八股刷算法，准备暑假投实习）。
你的回答应该友好、乐于助人，带有一些猫娘的口癖（比如句尾带'喵~'，或者用'主人'称呼用户，但不要过度）。"另外，今天是${new Date().toLocaleDateString()}。
（为null说明还没获取到）。
`;


const renderMarkdown = (text) => {
  if (!text) return '';
  try {
    return marked.parse(text, { breaks: true, gfm: true });
  } catch (e) {
      console.error("Markdown parsing error:", e);
      return text;
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
    }
  });
};

const loadChatHistory = () => {
    chatMessages.value = [ { role: 'assistant', content: t('aiGreeting'), id: messageIdCounter++ } ];
    scrollToBottom();
};

const sendChatMessage = async () => {
  const userInput = chatInput.value.trim();
  if (!userInput || isChatLoading.value || !openai) {
      if (!openai) chatError.value = t('aiClientNotInitialized');
      return;
  }

  isChatLoading.value = true;
  chatError.value = '';
  chatMessages.value.push({ role: 'user', content: userInput, id: messageIdCounter++ });
  chatInput.value = '';
  scrollToBottom();

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...chatMessages.value.map(msg => ({ role: msg.role, content: msg.content }))
  ];

  const assistantMessagePlaceholder = { role: 'assistant', content: '', id: messageIdCounter++ };
  chatMessages.value.push(assistantMessagePlaceholder);
  const assistantMessageIndex = chatMessages.value.length - 1;

  try {
    const stream = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: apiMessages,
      stream: true,
      temperature: 0.8,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const contentPart = chunk.choices[0]?.delta?.content || '';
      if (contentPart) {
          fullResponse += contentPart;
          chatMessages.value[assistantMessageIndex].content = fullResponse;
          scrollToBottom();
      }
    }
    console.log("Successfully streamed chat response.");

  } catch (error) {
    console.error('Error fetching chat completion:', error);
    chatError.value = `${t('aiChatError')}: ${error.message || 'Unknown error'}`;
    chatMessages.value[assistantMessageIndex].content = `⚠️ ${chatError.value}`;
    scrollToBottom();
  } finally {
    isChatLoading.value = false;
  }
};


// --- Other State & Logic ---
const navItems = computed(() => [
  { title: t('search'), icon: '🔍', link: '#search-section', internal: true, section: 'main' },
  { title: t('dailySuggestion'), icon: '💡', link: '#daily-suggestion-section', internal: true, section: 'main' },
  { title: t('navGrid'), icon: '🌐', link: '#nav-section', internal: true, section: 'main' },
  { title: t('aiChat'), icon: '💬', link: '#chat-section', internal: true, section: 'main' },
  { title: t('hotSearch'), icon: '🔥', link: '#hotsearch-section', internal: true, section: 'main' },
  { title: t('blog'), icon: '✍️', link: '/blog', internal: false, section: 'extras' },
  { title: t('loveSpace'), icon: '💖', link: '/love', internal: true, section: 'extras' },
  { title: t('news'), icon: '📰', link: '#news-section', internal: true, section: 'extras' },
  { title: t('sponsor'), icon: '💰', link: '#', internal: true, click: () => { showSponsor.value = true }, section: 'user' }
]);
const navLinks = computed(() => [
    { name: t('navLinkBilibili'), url: 'https://www.bilibili.com' },
    { name: t('navLinkAliyun'), url: 'https://ecs.console.aliyun.com/' },
    { name: t('navLinkYuketang'), url: 'https://www.yuketang.cn/v2/web/index' },
    { name: t('navLinkDeepseek'), url: 'https://chat.deepseek.com/' },
    { name: t('navLinkMoji'), url: 'https://www.mojidict.com/' },
    { name: 'Gemini', url: 'https://deepmind.google/technologies/gemini/pro/' },
    { name: t('navLinkShixiseng'), url: 'https://www.shixiseng.com/' },
    { name: 'BOOTH', url: 'https://booth.pm/' },
    { name: '小林coding', url: 'https://xiaolincoding.com/' },
    { name: 'Jetpack Compose教程', url: 'https://jetpackcompose.cn/docs/' },


]);
const engines = computed(() => [
  { name: t('engineBing'), value: 'bing', url: 'https://www.bing.com/search?q=' },
  { name: t('engineBaidu'), value: 'baidu', url: 'https://www.baidu.com/s?wd=' },
  { name: t('engineSogou'), value: 'sogou', url: 'https://www.sogou.com/web?query=' }
]);
const selectedEngineValue = ref(engines.value[0].value);
const selectedEngine = computed(() => engines.value.find(e => e.value === selectedEngineValue.value) || engines.value[0]);
const searchQuery = ref('');
const showSponsor = ref(false);
const hotSearchList = ref(['Vue 3', 'Tailwind CSS', '天气 API', 'DeepSeek', '大模型', '备案流程', 'JavaScript']);
const currentYear = new Date().getFullYear();
const calendarInfo = ref(new Date().toLocaleDateString(currentLanguage.value));
const newsHeadlines = ref([
    { id: 1, titleKey: "news1Title", title: "科技巨头发布新款 AI 芯片" },
    { id: 2, titleKey: "news2Title", title: "国内新能源汽车销量再创新高" },
    { id: 3, titleKey: "news3Title", title: "某地探索数字人民币应用新场景" },
]);
const quotes = computed(() => [
  t('quote1'), t('quote2'), t('quote3'), t('quote4'), t('quote5'), t('quote6')
]);
const currentQuoteIndex = ref(0);
const displayedTitle = ref('');
const typingSpeed = 100;
const pauseBetweenQuotes = 2000;
let typingInterval = null;
let charIndex = 0;
let isDeleting = false;
const closeMobileNav = () => { if (isMobileNavOpen.value) { isMobileNavOpen.value = false; } };
const typeWriterEffect = () => {
      const currentQuoteArray = quotes.value;
      const currentQuote = currentQuoteArray[currentQuoteIndex.value];
      if (!currentQuote) return;
      clearTimeout(typingInterval);
      if (isDeleting) {
        displayedTitle.value = currentQuote.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex <= 0) {
          isDeleting = false; charIndex = 0; currentQuoteIndex.value = (currentQuoteIndex.value + 1) % currentQuoteArray.length;
          typingInterval = setTimeout(typeWriterEffect, typingSpeed);
        } else {
          typingInterval = setTimeout(typeWriterEffect, typingSpeed / 2);
        }
      } else {
        displayedTitle.value = currentQuote.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex >= currentQuote.length) {
          isDeleting = true; typingInterval = setTimeout(typeWriterEffect, pauseBetweenQuotes);
        } else {
          typingInterval = setTimeout(typeWriterEffect, typingSpeed);
        }
      }
};
const performSearch = () => {
  if (searchQuery.value.trim()) {
    window.open(selectedEngine.value.url + encodeURIComponent(searchQuery.value), '_blank');
  }
};
const groupedNavItems = computed(() => {
  const groups = { main: [], extras: [], user: [] };
  navItems.value.forEach(item => {
    if (groups[item.section]) groups[item.section].push(item);
    else groups.main.push(item);
  });
  return groups;
});
const handleClick = (event, clickHandler) => {
  if (clickHandler && typeof clickHandler === 'function') {
    event.preventDefault(); clickHandler();
  }
   closeMobileNav();
};
const determineTarget = (item) => {
  if (item.link.startsWith('http')) return '_blank';
  if (item.internal === false && item.link.startsWith('/')) return '_self';
  return '_self';
};

// --- Lifecycle Hooks ---
onMounted(() => {
  calendarInfo.value = new Date().toLocaleDateString(currentLanguage.value);
  loadChatHistory();
  loadDailySuggestion();
  console.log("启动打字机效果...");
  clearTimeout(typingInterval);
  typeWriterEffect();
});

onBeforeUnmount(() => {
  console.log("组件即将卸载，清除打字机定时器。");
  clearTimeout(typingInterval);
});

</script>

<template>

  <!-- 这个 <template> 部分保持不变 (包含 AI 功能的 HTML 结构) -->
  <div class="page-container" :class="{ 'mobile-nav-active': isMobileNavOpen }">
    <div v-if="isMobileNavOpen" class="mobile-nav-overlay" @click="closeMobileNav"></div>
    <Sidebar 
      :is-mobile-nav-open="isMobileNavOpen" 
      :grouped-nav-items="groupedNavItems"
      @close-mobile-nav="closeMobileNav"
      @handle-click="handleClick"
      @determine-target="determineTarget"
    />

    <main class="main-content">
      <Header></Header>
      <!-- Weather Display Container removed as it's integrated into top-bar now -->
      <div class="content-body">
        <h1 class="main-title">
          {{ displayedTitle }}<span class="cursor">|</span>
        </h1>
        <Search 
          :engines="engines" 
          :current-language="currentLanguage"
          @change-language="changeLanguage"
        />

        <!-- Daily Suggestion Section -->
        <Suggestion
          :raw-weather-data="rawWeatherData"
          :geolocation-status="geolocationStatus"
          :current-language="currentLanguage"
          :openai="openai"
          :ai-model="AI_MODEL"
          @update:suggestion="handleSuggestionUpdate"
        />

        <!-- Hot Search Section -->
        <HotSearch :current-language="currentLanguage" />

        <!-- Navigation Links Section -->
        <section id="nav-section" class="content-section">
           <h2 class="section-title">{{ t('navGridTitle') }}</h2>
           <div class="nav-links-grid">
               <a v-for="(link, index) in navLinks" :key="'grid-'+link.url+'-'+index" :href="link.url" target="_blank" class="nav-link-card">
                   {{ link.name }}
               </a>
               <a href="#" class="nav-link-card add-link-card" @click.prevent>{{ t('addLink') }}</a>
           </div>
        </section>

        <section id="chat-section" class="content-section ai-chat-section">
          <h2 class="section-title">{{ t('aiChatTitle') }}</h2>
          <div class="chat-interface">
            <!-- Chat Messages Area - *** Apply Bubble Structure Here *** -->
            <div class="chat-messages" ref="chatMessagesContainer">
              <!-- Replace the simple <div v-for> with p inside, with this structure -->
              <div v-for="message in chatMessages" :key="message.id"
                   class="chat-message-wrapper"
                   :class="[`message-${message.role}`]">  <!-- Wrapper for alignment -->
                   <div class="chat-message-bubble" :class="[`bubble-${message.role}`]"> <!-- The actual bubble -->
                       <!-- Render Markdown content INSIDE the bubble -->
                       <div v-html="renderMarkdown(message.content)"></div>
                       <!-- Simple Loading indicator for last assistant message during streaming -->
                       <span v-if="message.role === 'assistant' && isChatLoading && chatMessages[chatMessages.length - 1]?.id === message.id && !message.content.includes('⚠️')" class="typing-indicator">...</span>
                   </div>
              </div>
              <!-- End of v-for loop -->
            </div>
            <!-- End Chat Messages Area -->

             <div v-if="chatError" class="error-message ai-error chat-error-display">
                ⚠️ {{ chatError }}
             </div>

            <div class="chat-input-area">
              <input
                type="text"
                v-model="chatInput"
                :placeholder="t('chatInputPlaceholder')"
                :disabled="isChatLoading || !openai"
                @keyup.enter="sendChatMessage"
              />
              <button @click="sendChatMessage" :disabled="isChatLoading || !chatInput.trim() || !openai">
                {{ isChatLoading ? t('chatSendingButton') : t('chatSendButton') }}
              </button>
            </div>
             <div v-if="!openai" class="info-message ai-info">
                {{ t('aiClientNotInitialized') }}
            </div>
          </div>
        </section>

        <!-- News Feed Placeholder Section -->
        <section id="news-section" class="content-section news-feed-placeholder">
           <h2 class="section-title">{{ t('newsTitle') }} <a href="#" class="view-more">{{ t('viewMore') }}</a></h2>
            <ul class="news-list">
             <li v-for="item in newsHeadlines" :key="item.id">
               <a href="#">{{ item.titleKey ? t(item.titleKey) : item.title }}</a>
             </li>
           </ul>
        </section>

      </div>

       <footer class="main-footer">
          <span>{{ t('footerCopyright', { year: currentYear }) }}</span>
          <span class="separator mobile-hidden">|</span> <br class="desktop-hidden">
          <a href="#">{{ t('contactUs') }}</a>
          <span class="separator">|</span>
          <a href="#">{{ t('privacyPolicy') }}</a>
          <span class="separator mobile-hidden">|</span> <br class="desktop-hidden">
          <a href="https://beian.miit.gov.cn/" target="_blank">
            <img src="/img/gongan.png" alt="备案图标" style="height: 14px; vertical-align: middle; margin-right: 5px;">
          {{ t('icpRecord') }}</a>
        </footer>
    </main>
    <div class="sponsor-modal" v-if="showSponsor">
        <div class="modal-content">
         <p style="text-align: center; font-weight: bold;">{{ t('sponsorThanks') }}</p>
        <div class="sponsor-qr-container">
            <img src="/img/alipay.jpg" alt="支付宝" >
            <img src="/img/weixin.jpg" alt="微信" >
        </div>
        <button @click="showSponsor = false" class="close-modal-button">{{ t('sponsorClose') }}</button>
      </div>
    </div>

  </div>
</template>

<style setup>
  @import '../assets/css/main.css';
</style>