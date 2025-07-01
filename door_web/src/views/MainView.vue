<template>
  <div class="page-container">
    <Sidebar 
      :is-mobile-nav-open="isMobileNavOpen" 
      :grouped-nav-items="groupedNavItems"
      @close-mobile-nav="closeMobileNav"
      @handle-click="handleClick"
      @determine-target="determineTarget"
    />

    <main class="main-content">
      <Header />
      <div class="content-body">
        <h1 class="main-title">
          {{ displayedTitle }}<span class="cursor">|</span>
        </h1>
        <Search 
          
          :current-language="currentLanguage"
          @change-language="changeLanguage"
        />
        <Suggestion
          :raw-weather-data="rawWeatherData"
          :geolocation-status="geolocationStatus"
          :current-language="currentLanguage"
          :openai="openai"
          :ai-model="AI_MODEL"
          @update:suggestion="handleSuggestionUpdate"
        />
        <HotSearch :current-language="currentLanguage" />
        <Connect />
        <AIChat />
        <News />
      </div>
      <Footer />
    </main>
    <div class="sponsor-modal" v-if="showSponsor">
      <div class="modal-content">
        <p style="text-align: center; font-weight: bold;">{{ t('sponsorThanks') }}</p>
        <div class="sponsor-qr-container">
          <img src="/img/alipay.jpg" alt="支付宝">
          <img src="/img/weixin.jpg" alt="微信">
        </div>
        <button @click="showSponsor = false" class="close-modal-button">{{ t('sponsorClose') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
//引入组件
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'
import Search from '../components/Search.vue'
import Suggestion from '../components/Suggestion.vue'
import HotSearch from '../components/hotsearch.vue'
import Connect from '../components/connect.vue'
import AIChat from '../components/ai-chat.vue'
import News from '../components/News.vue'

// --- 语言状态 ---
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { locales } from '/src/utils/locales.js'

const currentLanguage = ref('zh-CN')
const t = (key, replacements = {}) => {
  const lang = currentLanguage.value
  let translation = locales[lang]?.[key] || locales['zh-CN']?.[key] || key
  Object.keys(replacements).forEach(repKey => {
    translation = translation.replace(`{${repKey}}`, replacements[repKey])
  })
  return translation
}

const changeLanguage = (lang) => {
  currentLanguage.value = lang
}

// --- 导航项 ---
const isMobileNavOpen = ref(false);
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

// --- 赞助弹窗 ---
const showSponsor = ref(false);
const closeMobileNav = () => { if (isMobileNavOpen.value) { isMobileNavOpen.value = false; } };
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

// --- 生命周期钩子 ---
onMounted(() => {
  calendarInfo.value = new Date().toLocaleDateString(currentLanguage.value);
  loadChatHistory();
  loadDailySuggestion();
  requestLocationAndWeather();
  console.log("启动打字机效果...");
  clearTimeout(typingInterval);
  typeWriterEffect();
});

onBeforeUnmount(() => {
  console.log("组件即将卸载，清除打字机定时器。");
  clearTimeout(typingInterval);
});
</script>

<style scoped>
@import '../assets/css/main.css';
</style>
