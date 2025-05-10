<script setup>
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
const AI_API_KEY_ASK = instance?.appContext.config.globalProperties.AI_API_KEY_ASK;
const AI_API_URL = instance?.appContext.config.globalProperties.AI_API_URL;
const AI_API_URL_ASK = instance?.appContext.config.globalProperties.AI_API_URL_ASK;
const AI_MODEL = instance?.appContext.config.globalProperties.AI_MODEL;
const AI_MODEL_ASK = instance?.appContext.config.globalProperties.AI_MODEL_ASK;

// --- OpenAI Client Initialization ---
let openai = null;
let openai_ask = null;
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
if(AI_API_KEY_ASK && AI_API_URL_ASK && AI_MODEL_ASK){
  try {
    openai_ask = new OpenAI({
        apiKey: AI_API_KEY_ASK,
        baseURL: AI_API_URL_ASK,
        dangerouslyAllowBrowser: true,
      });
      console.log("OpenAI client initialized for Ask.");
  } catch (error) {
      console.error("Failed to initialize OpenAI client:", error);
  }
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

// --- Weather State & Logic ---
const weatherInfo = ref(t('weatherLoading'));
const rawWeatherData = ref(null);
const geolocationStatus = ref('idle');
const geolocationError = ref('');
const getWeatherIcon = (weatherCondition) => {
    if (!weatherCondition) return '❓';
    const condition = String(weatherCondition).toLowerCase();
    if (condition.includes('雷阵雨')) return '⛈️';
    if (condition.includes('雷')) return '⚡';
    if (condition.includes('雨夹雪')) return '🌨️';
    if (condition.includes('雪')) return '❄️';
    if (condition.includes('雨')) return '🌧️';
    if (condition.includes('阴')) return '☁️';
    if (condition.includes('多云')) return '🌥️';
    if (condition.includes('晴')) return '☀️';
    if (condition.includes('雾') || condition.includes('霾')) return '🌫️';
    if (condition.includes('风') || condition.includes('吹')) return '🌬️';
    console.warn("未匹配的天气图标:", weatherCondition);
    return '🌍';
};
const fetchAdcodeFromCoords = async (latitude, longitude) => {
    if (!WEATHER_API_KEY) return null;
    geolocationStatus.value = 'pending_regeo';
    weatherInfo.value = t('weatherFetchingAdcode');
    try {
        const proxyRegeoUrl = `/proxy-regeo?output=json&location=${longitude},${latitude}&key=${WEATHER_API_KEY}&radius=1000&extensions=base`;
        const response = await fetch(proxyRegeoUrl);
        if (!response.ok) throw new Error(`Proxy Regeo request failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (data.status === '1' && data.regeocode) {
            const adcode = data.regeocode.addressComponent?.adcode;
            if (adcode) return adcode;
            else throw new Error('Gaode Regeo success, but no Adcode found');
        } else {
            throw new Error(`Gaode Regeo API error: ${data.info || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Failed to get Adcode:', error);
        geolocationStatus.value = 'error';
        geolocationError.value = t('weatherAdcodeError');
        weatherInfo.value = geolocationError.value;
        return null;
    }
};
const fetchWeatherDataByAdcode = async (adcode) => {
    if (!WEATHER_API_KEY || !adcode) return null;
    weatherInfo.value = t('weatherLoading');
    try {
        const proxyWeatherUrl = `/proxy-weather?city=${adcode}&key=${WEATHER_API_KEY}`;
        const response = await fetch(proxyWeatherUrl);
        if (!response.ok) throw new Error(`Proxy Weather request failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (data.status === '1' && data.lives && data.lives.length > 0) {
            rawWeatherData.value = data.lives[0];
            geolocationStatus.value = 'success';
            weatherInfo.value = '';
            return data.lives[0];
        } else {
            throw new Error(`Gaode Weather API error: ${data.info || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Failed to get weather data:', error);
        geolocationStatus.value = 'error';
        if (!geolocationError.value) geolocationError.value = t('weatherError');
        weatherInfo.value = geolocationError.value;
        rawWeatherData.value = null;
        return null;
    }
};
const requestLocationAndWeather = () => {
    if (!('geolocation' in navigator)) {
        geolocationStatus.value = 'error';
        geolocationError.value = t('weatherGeolocationNotSupported');
        weatherInfo.value = geolocationError.value;
        return;
    }
    if (!WEATHER_API_KEY) {
         geolocationStatus.value = 'error';
         geolocationError.value = t('weatherApiKeyMissing');
         weatherInfo.value = geolocationError.value;
         return;
    }
    geolocationStatus.value = 'pending_permission';
    weatherInfo.value = t('weatherRequestingPermission');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            const adcode = await fetchAdcodeFromCoords(latitude, longitude);
            if (adcode) {
                await fetchWeatherDataByAdcode(adcode);
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            geolocationStatus.value = 'error';
            switch (error.code) {
                case error.PERMISSION_DENIED: geolocationError.value = t('weatherPermissionDenied'); break;
                case error.POSITION_UNAVAILABLE: geolocationError.value = t('weatherPositionUnavailable'); break;
                case error.TIMEOUT: geolocationError.value = t('weatherPositionTimeout'); break;
                default: geolocationError.value = t('weatherPositionUnavailable'); break;
            }
            weatherInfo.value = geolocationError.value;
        }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
};

// --- Daily Suggestion State & Logic ---
const dailySuggestionContent = ref('');
const isSuggestionLoading = ref(false);
const suggestionError = ref('');
const suggestionPrompt = ref('');

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const clearOldSuggestions = () => {
    const todayStr = getTodayDateString();
    try {
        const storedData = localStorage.getItem(DAILY_SUGGESTION_STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (parsedData.date !== todayStr) {
                localStorage.removeItem(DAILY_SUGGESTION_STORAGE_KEY);
                console.log("Cleared outdated daily suggestion from localStorage.");
            }
        }
    } catch (e) {
        console.error("Error reading/clearing daily suggestion from localStorage:", e);
        localStorage.removeItem(DAILY_SUGGESTION_STORAGE_KEY);
    }
};

const loadDailySuggestion = () => {
  clearOldSuggestions();
  const todayStr = getTodayDateString();
  try {
    const storedData = localStorage.getItem(DAILY_SUGGESTION_STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.date === todayStr && parsedData.content) {
        dailySuggestionContent.value = parsedData.content;
        suggestionPrompt.value = parsedData.prompt || '';
        console.log("Loaded daily suggestion from localStorage for", todayStr);
        isSuggestionLoading.value = false;
        suggestionError.value = '';
        return true;
      }
    }
  } catch (e) {
    console.error("Error reading daily suggestion from localStorage:", e);
    localStorage.removeItem(DAILY_SUGGESTION_STORAGE_KEY);
  }
  dailySuggestionContent.value = '';
  return false;
};

const saveDailySuggestion = (content, promptUsed) => {
  const todayStr = getTodayDateString();
  const dataToStore = { date: todayStr, content: content, prompt: promptUsed };
  try {
    localStorage.setItem(DAILY_SUGGESTION_STORAGE_KEY, JSON.stringify(dataToStore));
    console.log("Saved daily suggestion to localStorage for", todayStr);
  } catch (e) {
    console.error("Error saving daily suggestion to localStorage:", e);
  }
};


const fetchDailySuggestion = async () => {
  if (!openai_ask) { suggestionError.value = t('aiClientNotInitialized'); return; }
  if (!rawWeatherData.value) { suggestionError.value = t('aiWaitingForWeather'); return; }
  if (isSuggestionLoading.value) return;

  isSuggestionLoading.value = true;
  suggestionError.value = '';
  dailySuggestionContent.value = '';
  const todayStr = getTodayDateString();
  const weather = rawWeatherData.value;
  const prompt = `根据以下信息，为今天 (${todayStr}) 写出详细的出行建议、今日黄历概览（例如：宜、忌、冲、煞、吉神方位等，简洁说明即可）和生活指数（例如：穿衣指数、运动指数、洗车指数等）：\n地点: ${weather.city} (${weather.province})\n天气: ${weather.weather}\n温度: ${weather.temperature}°C\n风向: ${weather.winddirection}\n风力: ${weather.windpower} 级\n湿度: ${weather.humidity}%\n\n请以友好的、略带调侃的语气提供建议，并使用Markdown格式化输出，重点内容适当加粗或使用列表。`;
  suggestionPrompt.value = prompt;

  try {
    const stream = await openai_ask.chat.completions.create({
      model: AI_MODEL_ASK,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const contentPart = chunk.choices[0]?.delta?.content || '';
      if (contentPart) {
        fullContent += contentPart;
        dailySuggestionContent.value = fullContent;
      }
    }
    saveDailySuggestion(fullContent, prompt);
    console.log("Successfully fetched and streamed daily suggestion.");

  } catch (error) {
    console.error('Error fetching daily suggestion:', error);
    suggestionError.value = `${t('aiSuggestionError')}: ${error.message || 'Unknown error'}`;
  } finally {
    isSuggestionLoading.value = false;
  }
};

watch(rawWeatherData, (newData) => {
  if (newData) {
    console.log("Weather data updated, checking/fetching daily suggestion.");
    if (!loadDailySuggestion()) {
      fetchDailySuggestion();
    }
  } else {
    dailySuggestionContent.value = '';
    suggestionError.value = '';
    isSuggestionLoading.value = false;
  }
}, { immediate: false });

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
const toggleMobileNav = () => { isMobileNavOpen.value = !isMobileNavOpen.value; };
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

<template>
  <!-- 这个 <template> 部分保持不变 (包含 AI 功能的 HTML 结构) -->
  <div class="page-container" :class="{ 'mobile-nav-active': isMobileNavOpen }">
    <div v-if="isMobileNavOpen" class="mobile-nav-overlay" @click="closeMobileNav"></div>
    <aside class="sidebar" :class="{ 'mobile-open': isMobileNavOpen }">
        <div class="sidebar-header">
          <img src="/img/avatar.jpg" alt="头像" class="sidebar-avatar">
          <span class="logo">玺朽</span>
          <button class="mobile-close-btn" @click="closeMobileNav">×</button>
        </div>
         <nav class="sidebar-nav">
           <!-- Main Section -->
           <ul class="nav-group">
              <li v-for="(item, index) in groupedNavItems.main" :key="'main-'+item.link+'-'+index" :class="{ active: false }">
                 <router-link v-if="item.internal && item.link.startsWith('/') && item.link !== '/'" :to="item.link" @click="closeMobileNav">
                    <span class="nav-icon">{{ item.icon }}</span>
                    <span class="nav-text">{{ item.title }}</span>
                 </router-link>
                 <a v-else :href="item.link" @click="handleClick($event, item.click)" :target="determineTarget(item)">
                   <span class="nav-icon">{{ item.icon }}</span>
                   <span class="nav-text">{{ item.title }}</span>
                 </a>
              </li>
           </ul>
           <div class="nav-separator"></div>
            <!-- Extras Section -->
             <ul class="nav-group">
              <li v-for="(item, index) in groupedNavItems.extras" :key="'extras-'+item.link+'-'+index" :class="{ active: false }">
                <router-link v-if="item.internal === true && item.link.startsWith('/')" :to="item.link" @click="closeMobileNav">
                  <span class="nav-icon">{{ item.icon }}</span>
                  <span class="nav-text">{{ item.title }}</span>
                </router-link>
                <a v-else :href="item.link" @click="handleClick($event, item.click)" :target="determineTarget(item)">
                  <span class="nav-icon">{{ item.icon }}</span>
                  <span class="nav-text">{{ item.title }}</span>
                </a>
             </li>
             </ul>
             <div class="nav-separator"></div>
             <!-- User Section -->
             <ul class="nav-group">
             <li v-for="(item, index) in groupedNavItems.user" :key="'user-'+item.link+'-'+index" :class="{ active: false }">
                 <a :href="item.link"
                    @click="handleClick($event, item.click)"
                    :target="determineTarget(item)">
                   <span class="nav-icon">{{ item.icon }}</span>
                   <span class="nav-text">{{ item.title }}</span>
                 </a>
             </li>
             </ul>
         </nav>
         <div class="sidebar-footer">
            v1.10 2025-4-20 今日指南和AI聊天<!-- Update version if needed -->
         </div>
    </aside>

    <main class="main-content">
       <header class="top-bar">
            <div class="top-bar-left">
                <button class="mobile-nav-toggle" @click="toggleMobileNav">
                 <span></span><span></span><span></span>
               </button>
               <span class="top-bar-item desktop-only">{{ t('appCenter') }}</span>
               <span class="top-bar-item desktop-only">{{ t('abilityTest') }}</span>
               <span class="top-bar-item desktop-only">{{ t('webPlugin') }}</span>
            </div>
            <div class="top-bar-right">
               <span class="top-bar-item calendar-widget">
                 📅 {{ calendarInfo }}
               </span>
               <span class="top-bar-item weather-widget"> <!-- Use weather-widget class -->
                  <!-- Show detailed weather IF rawWeatherData is available -->
                  <template v-if="rawWeatherData">
                      <span class="weather-icon">{{ getWeatherIcon(rawWeatherData.weather) }}</span>
                      <span class="weather-city mobile-hidden">{{ rawWeatherData.city }}:</span> <!-- Hide city on mobile if needed -->
                      <span class="weather-condition">{{ rawWeatherData.weather }}</span>
                      <span class="weather-temp">{{ rawWeatherData.temperature_float }}{{ t('weatherTempUnit') }}</span>
                      <!-- Optional: Hide details on mobile -->
                      <span class="separator mobile-hidden">|</span>
                      <span class="weather-detail mobile-hidden">{{ t('weatherWindDirection') }}: {{ rawWeatherData.winddirection }}</span>
                      <span class="separator mobile-hidden">|</span>
                      <span class="weather-detail mobile-hidden">{{ t('weatherWind') }}: {{ rawWeatherData.windpower }} {{ t('weatherWindPowerUnit') }}</span>
                      <span class="separator mobile-hidden">|</span>
                      <span class="weather-detail mobile-hidden">{{ t('weatherHumidity') }}: {{ rawWeatherData.humidity_float }}%</span>
                  </template>
                   <!-- Otherwise, show the current status/error message -->
                  <template v-else>
                      <span class="weather-loading-error">{{ weatherInfo }}</span>
                  </template>
               </span>
               <span class="top-bar-item desktop-only">{{ t('checkIn') }}</span>
               <span class="top-bar-item buy-item">{{ t('buyPro') }}</span>
            </div>
      </header>
      <!-- Weather Display Container removed as it's integrated into top-bar now -->

      <div class="content-body">
        <h1 class="main-title">
          {{ displayedTitle }}<span class="cursor">|</span>
        </h1>

        <section id="search-section" class="content-section search-section">
              <div class="search-box">
                 <span class="search-icon">🔍</span>
                 <select v-model="selectedEngineValue" class="search-select">
                    <option v-for="engine in engines" :key="engine.value" :value="engine.value">
                      {{ engine.name }}
                    </option>
                  </select>
                <input type="text" v-model="searchQuery" :placeholder="t('searchPlaceholder')" @keyup.enter="performSearch" class="search-input" />
                <button @click="performSearch" class="search-button">{{ t('searchButton') }}</button>
              </div>
               <div class="language-switch">
                 {{ t('languageSwitch') }}:
                 <a href="#" @click.prevent="changeLanguage('zh-CN')" :class="{ active: currentLanguage === 'zh-CN' }">简体中文</a> |
                 <a href="#" @click.prevent="changeLanguage('en-US')" :class="{ active: currentLanguage === 'en-US' }">English</a> |
                 <a href="#" @click.prevent="changeLanguage('ja-JP')" :class="{ active: currentLanguage === 'ja-JP' }">日本語</a>
               </div>
        </section>

        <!-- Daily Suggestion Section -->
        <section id="daily-suggestion-section" class="content-section daily-suggestion-section">
          <h2 class="section-title">{{ t('dailySuggestionTitle') }}</h2>
          <div v-if="isSuggestionLoading" class="loading-indicator">
             {{ t('aiSuggestionLoading') }} <span class="spinner">⏳</span>
          </div>
          <div v-else-if="suggestionError" class="error-message ai-error">
             ⚠️ {{ suggestionError }}
          </div>
          <!-- Apply suggestion-content class for potential future specific styling -->
          <div v-else-if="dailySuggestionContent" class="suggestion-content">
  <div v-html="renderMarkdown(dailySuggestionContent)"></div>
</div>
           <div v-else-if="!rawWeatherData && geolocationStatus !== 'error'" class="info-message">
              {{ t('aiWaitingForWeather') }}
           </div>
           <div v-else-if="geolocationStatus === 'error' && !rawWeatherData" class="info-message">
              {{ t('aiSuggestionWeatherError') }}
           </div>
           <div v-else class="info-message">
              {{ t('aiSuggestionNotAvailable') }}
           </div>
        </section>

        <!-- Hot Search Section -->
        <section id="hotsearch-section" class="content-section hot-search-section">
           <h2 class="section-title">{{ t('hotSearchTitle') }}</h2>
            <div class="hot-search-tags">
             <span v-for="(term, index) in hotSearchList" :key="index" class="hot-tag">
               {{ term }}
             </span>
           </div>
        </section>

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

<style scoped>
/* --- Add Style for Active Language Link --- */
/* (This was in your original style, keep it) */
.language-switch a {
  text-decoration: none;
  color: #007bff; /* Standard link blue */
  margin: 0 2px;
  transition: color 0.2s ease;
}
.language-switch a:hover {
  color: #e63946; /* Accent color on hover */
  text-decoration: underline;
}
.language-switch a.active {
  color: #e63946; /* Accent color for active language */
  font-weight: bold;
  text-decoration: none;
  cursor: default;
}

/* --- Keep ALL OTHER base CSS from the **very first version** you provided --- */
/* Basic Reset & Font */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
  color: #333;
}

#app {
    height: 100%;
}

.page-container {
  display: flex;
  height: 100%;
  width: 100%;
}

/* Sidebar Styles */
.sidebar {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease-in-out;
}

.sidebar-header {
  padding: 0 15px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  flex-shrink: 0;
}

.sidebar-avatar {
  width: 40px;  /* Adjusted to likely original size */
  height: 40px; /* Adjusted to likely original size */
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.logo {
  font-size: 1.5em;
  font-weight: bold;
  color: #e63946;
}

.sidebar-nav {
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px 0;
}
.sidebar-nav::-webkit-scrollbar { display: none; }
.sidebar-nav { -ms-overflow-style: none; scrollbar-width: none; }

.nav-group {
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0;
}

.nav-separator {
    height: 1px;
    background-color: #e0e0e0;
    margin: 10px 20px;
}

.sidebar-nav li > a,
.sidebar-nav li > router-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  text-decoration: none;
  color: #555;
  transition: background-color 0.2s ease, color 0.2s ease;
  border-radius: 4px;
  margin: 2px 10px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-nav li > a:hover,
.sidebar-nav li > router-link:hover {
  background-color: #f1f3f5;
  color: #e63946;
}

.sidebar-nav li.active > a,
.sidebar-nav li > .router-link-active,
.sidebar-nav li > .router-link-exact-active {
  background-color: #e63946;
  color: #ffffff !important;
}

.sidebar-nav li.active > a .nav-icon,
.sidebar-nav li > .router-link-active .nav-icon,
.sidebar-nav li > .router-link-exact-active .nav-icon,
.sidebar-nav li.active > a .nav-text,
.sidebar-nav li > .router-link-active .nav-text,
.sidebar-nav li > .router-link-exact-active .nav-text {
    color: #ffffff;
}

.nav-icon {
  margin-right: 15px;
  font-size: 1.1em;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.nav-text {
  font-size: 0.95em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 15px 20px;
  font-size: 0.8em;
  color: #aaa;
  text-align: center;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

/* Main Content Area */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  overflow-x: hidden;
}

/* Top Bar */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  height: 60px;
  flex-shrink: 0;
}

.top-bar-left, .top-bar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.top-bar-item {
  font-size: 0.9em;
  color: #555;
  cursor: pointer;
  transition: color 0.2s ease;
  white-space: nowrap;
}
.top-bar-item:hover {
    color: #e63946;
}

.buy-item {
    color: #e63946;
    font-weight: 500;
    background-color: #fee;
    padding: 5px 10px;
    border-radius: 4px;
}

.weather-widget, .calendar-widget {
    font-size: 0.9em;
    color: #333;
    background-color: #e9ecef;
    padding: 5px 10px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
}
.weather-widget .weather-icon { font-size: 1.2em; margin-right: 3px;} /* Slightly adjust icon margin */

/* Content Body */
.content-body {
  flex-grow: 1;
  padding: 30px;
  overflow-y: auto;
}

.main-title {
  font-size: 2.2em;
  font-weight: 500;
  color: #333;
  margin-bottom: 30px;
  min-height: 40px;
  font-family: 'Courier New', Courier, monospace;
  position: relative;
}

.cursor {
  animation: blink 0.7s infinite;
  font-weight: bold;
  position: absolute;
  bottom: 5px;
  margin-left: 3px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.content-section {
  background-color: #ffffff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 1.3em;
  font-weight: 500;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-more {
    font-size: 0.8em;
    color: #777;
    text-decoration: none;
}
.view-more:hover {
    color: #e63946;
}

/* Search Section */
.search-section .search-box {
  display: flex;
  align-items: center;
  border: 1px solid #ced4da;
  border-radius: 25px;
  padding: 5px 10px 5px 15px;
  background-color: #fff;
  margin-bottom: 15px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.search-section .search-icon { font-size: 1.2em; color: #888; margin-right: 10px; }
.search-section .search-select {
    border: none; background: transparent; padding: 8px 5px; margin-right: 5px;
    color: #555; font-size: 0.9em; cursor: pointer; outline: none;
    border-right: 1px solid #eee; -webkit-appearance: none; -moz-appearance: none; appearance: none;
}
.search-section .search-select:focus { outline: none; }
.search-section .search-input { flex-grow: 1; border: none; outline: none; padding: 10px; font-size: 1em; background: transparent; }
.search-section .search-button {
    padding: 8px 20px; background: #e63946; color: white; border: none;
    border-radius: 20px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s ease;
}
.search-section .search-button:hover { background: #d62828; }
.language-switch { text-align: center; font-size: 0.9em; color: #777; margin-top: 10px; }

/* Hot Search */
.hot-search-tags { display: flex; flex-wrap: wrap; gap: 10px; }
.hot-tag {
    background-color: #f1f3f5; padding: 5px 12px; border-radius: 15px;
    font-size: 0.9em; color: #555; cursor: pointer; transition: background-color 0.2s ease, color 0.2s ease;
}
.hot-tag:hover { background-color: #e63946; color: #fff; }

/* Navigation Links */
.nav-links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px; }
.nav-link-card {
    background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px;
    text-align: center; text-decoration: none; color: #333; font-size: 0.95em;
    transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease; font-weight: 500;
    word-break: break-all;
}
.nav-link-card:hover { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); transform: translateY(-2px); color: #e63946; border-color: #e63946; }
.add-link-card { color: #adb5bd; border-style: dashed; display: flex; align-items: center; justify-content: center; font-weight: normal; font-size: 1.8em; }
.add-link-card:hover { color: #e63946; border-color: #e63946; border-style: dashed; }

/* News Feed Placeholder */
.news-feed-placeholder .news-list { list-style: none; padding: 0; }
.news-list li { padding: 8px 0; border-bottom: 1px dashed #eee; }
.news-list li:last-child { border-bottom: none; }
.news-list li a { text-decoration: none; color: #337ab7; font-size: 0.95em; }
.news-list li a:hover { text-decoration: underline; color: #e63946; }

/* Footer */
.main-footer {
  padding: 15px 30px;
  text-align: center;
  font-size: 0.85em;
  color: #888;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
  line-height: 1.6;
}
.main-footer a { color: #666; text-decoration: none; margin: 0 3px; }
.main-footer a:hover { color: #e63946; text-decoration: underline; }
.main-footer .separator { margin: 0 5px; color: #ccc; }

/* Sponsor Modal */
.sponsor-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000; padding: 20px;
}
.modal-content {
  background: white; padding: 30px; border-radius: 12px;
  display: flex; flex-direction: column; gap: 20px;
  max-width: 500px; width: 100%;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}
.sponsor-qr-container {
   display: flex;
   gap: 20px;
   justify-content: center;
   flex-wrap: wrap;
}
.sponsor-qr-container img {
    width: 180px;
    max-width: 45%;
    height: auto;
    border: 1px solid #eee;
}
.close-modal-button {
    padding: 10px 20px; background: #6c757d; color: white; border: none;
    border-radius: 6px; cursor: pointer; align-self: center; margin-top: 10px;
    transition: background-color 0.2s ease;
}
.close-modal-button:hover { background: #5a6268; }


/* Styles for suggestion section elements (loading/error/info) */
/* Keep these simple */
.daily-suggestion-section .loading-indicator,
.daily-suggestion-section .error-message,
.daily-suggestion-section .info-message {
  padding: 15px;
  text-align: center;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px dashed #eee;
  margin-top: 10px;
}
.daily-suggestion-section .error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}
.daily-suggestion-section .spinner {
  display: inline-block;
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/* Basic style for rendered suggestion content */
.suggestion-content {
    line-height: 1.7;
    color: #333;
    margin-top: 10px;
}
/* Keep basic markdown element styles */
.suggestion-content h3 { margin-top: 1.2em; margin-bottom: 0.6em; font-size: 1.1em; border-bottom: 1px solid #eee; padding-bottom: 0.3em;}
.suggestion-content ul, .suggestion-content ol { margin-left: 20px; margin-bottom: 1em; }
.suggestion-content li { margin-bottom: 0.4em; }
.suggestion-content strong { color: #e63946; }
.suggestion-content code { background-color: #f1f3f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em;}
.suggestion-content pre { background-color: #f1f3f5; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 1em;}

/* General AI Info/Error styles (Keep simple) */
.ai-info, .ai-error {
    font-size: 0.85em;
    color: #6c757d;
    padding: 8px 15px;
    margin-top: 5px;
}
.ai-error {
    color: #dc3545;
}
/* Chat specific error display */
.ai-chat-section .chat-error-display {
    padding: 8px 15px;
    font-size: 0.85em;
    text-align: center;
    margin: 5px 10px;
    border-radius: 4px;
}


/* ================================================= */
/* == RE-ADD/MERGE AI CHAT BUBBLE STYLES HERE == */
/* ================================================= */

/* --- UPDATED Styles for AI Chat Section (Bubble Style) --- */
.ai-chat-section .chat-interface {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  min-height: 300px;
  max-height: 60vh; /* Limit max height */
  display: flex;
  flex-direction: column;
  background-color: #fff; /* White background for the whole interface */
  /* Override original simple height if needed: */
  /* height: auto; */ /* Or remove height constraint */
}
.ai-chat-section .chat-messages {
  flex-grow: 1;
  padding: 15px 10px; /* Add some horizontal padding */
  overflow-y: auto;
  background-color: #f8f9fa; /* Light grey for message area */
  display: flex; /* Use flexbox for messages */
  flex-direction: column; /* Stack messages vertically */
  gap: 12px; /* Space between message bubbles */
  /* Remove original simple p tag margin if it exists */
  /* p { margin-bottom: 0; } */
}
/* Remove original p styling if needed */
.ai-chat-section .chat-messages p { margin-bottom: 0; }

.ai-chat-section .chat-message-wrapper {
    display: flex;
    max-width: 85%; /* Limit message width */
    /* This replaces the need for simple p tags */
}
.ai-chat-section .message-user {
    justify-content: flex-end; /* Align user messages to the right */
    margin-left: auto; /* Push user messages to the right */
}
.ai-chat-section .message-assistant {
    justify-content: flex-start; /* Align assistant messages to the left */
    margin-right: auto; /* Push assistant messages to the left */
}

.ai-chat-section .chat-message-bubble {
  padding: 10px 15px;
  border-radius: 18px; /* Rounded bubbles */
  line-height: 1.5;
  word-wrap: break-word; /* Break long words */
  font-size: 0.95em;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  /* This replaces the simple p tag styling */
}
/* Style Markdown elements inside bubbles */
.ai-chat-section .chat-message-bubble p:last-child {
    margin-bottom: 0; /* Remove bottom margin for last p in bubble */
}
.ai-chat-section .chat-message-bubble ul,
.ai-chat-section .chat-message-bubble ol {
    margin-left: 18px; /* Indent lists inside bubbles */
    margin-top: 5px;
    margin-bottom: 5px;
}
.ai-chat-section .chat-message-bubble code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.1em 0.3em;
    border-radius: 3px;
    font-size: 0.9em;
}
.ai-chat-section .chat-message-bubble pre {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 8px 0;
    font-size: 0.85em;
}
.ai-chat-section .bubble-user {
  background-color: #e63946; /* Theme color for user */
  color: #ffffff;
  border-bottom-right-radius: 5px; /* Slightly different corner */
}
.ai-chat-section .bubble-assistant {
  background-color: #e9ecef; /* Light grey for assistant */
  color: #333;
  border-bottom-left-radius: 5px; /* Slightly different corner */
}
/* Typing indicator inside assistant bubble */
.ai-chat-section .typing-indicator {
    display: inline-block;
    margin-left: 5px;
    font-weight: bold;
    animation: typing-blink 1s infinite;
}
@keyframes typing-blink {
    50% { opacity: 0.5; }
}

/* Update Input Area Styling */
.ai-chat-section .chat-input-area {
  display: flex;
  border-top: 1px solid #e0e0e0;
  padding: 12px; /* Slightly more padding */
  background-color: #fff;
}
.ai-chat-section .chat-input-area input {
  flex-grow: 1;
  border: 1px solid #ced4da;
  border-radius: 20px; /* Rounded input */
  padding: 10px 15px; /* Adjusted padding */
  margin-right: 10px;
  outline: none;
  font-size: 0.95em; /* Adjusted font size */
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.ai-chat-section .chat-input-area input:focus {
  border-color: #e63946;
  box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.15);
}
.ai-chat-section .chat-input-area input:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
}
.ai-chat-section .chat-input-area button {
  padding: 10px 20px; /* Adjusted padding */
  background: #e63946;
  color: white;
  border: none;
  border-radius: 20px; /* Rounded button */
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.95em; /* Adjusted font size */
  white-space: nowrap;
}
.ai-chat-section .chat-input-area button:hover:not(:disabled) {
  background: #d62828;
}
.ai-chat-section .chat-input-area button:disabled {
  background-color: #fca5ab;
  cursor: not-allowed;
  opacity: 0.7;
}


/* Mobile Styles (Keep original mobile styles) */
.mobile-nav-toggle { display: none; }
.mobile-close-btn { display: none; }
.mobile-nav-overlay { display: none; }
.desktop-hidden { display: none; }
.desktop-only { display: inline-flex; }
.mobile-hidden { display: inline; }

/* Breakpoint (Keep original breakpoint adjustments BUT add chat bubble adjustments) */
@media (max-width: 768px) {
  .page-container { /* No change needed here */ }

  .sidebar {
    position: fixed; left: -260px; top: 0; bottom: 0; height: 100%;
    z-index: 1001; width: 250px; transition: left 0.3s ease-in-out;
    box-shadow: 2px 0 5px rgba(0,0,0,0.1); border-right: none;
  }
  .sidebar.mobile-open { left: 0; }
  .sidebar-header { justify-content: space-between; }
  .sidebar-avatar { width: 35px; height: 35px; }

  .mobile-nav-toggle {
    display: flex; flex-direction: column; justify-content: space-around;
    width: 30px; height: 25px; background: transparent; border: none;
    cursor: pointer; padding: 0; margin-right: 15px; order: -1;
  }
  .mobile-nav-toggle span { width: 100%; height: 3px; background-color: #555; border-radius: 2px; transition: all 0.3s linear; }
  /* ... hamburger animation ... */
  .page-container.mobile-nav-active .mobile-nav-toggle span:nth-child(1) { transform: rotate(45deg) translate(5px, 6px); }
  .page-container.mobile-nav-active .mobile-nav-toggle span:nth-child(2) { opacity: 0; }
  .page-container.mobile-nav-active .mobile-nav-toggle span:nth-child(3) { transform: rotate(-45deg) translate(5px, -6px); }


  .mobile-close-btn { display: block; background: none; border: none; font-size: 2em; color: #888; cursor: pointer; padding: 0 15px; }

  .mobile-nav-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; display: block; }
  .page-container:not(.mobile-nav-active) .mobile-nav-overlay { display: none; }

  .main-content { width: 100%; margin-left: 0; }

  .top-bar { padding: 0 15px; height: 50px; }
  .top-bar-left, .top-bar-right { gap: 10px; }
  .desktop-only { display: none; }
  .buy-item { padding: 4px 8px; font-size: 0.85em; }
  .weather-widget, .calendar-widget { font-size: 0.8em; padding: 4px 8px; }

  .weather-widget .weather-city,
  .weather-widget .separator, /* Hide separators on mobile */
  .weather-widget .weather-detail {
      display: none; /* Hide detailed weather parts on mobile */
  }

  .content-body { padding: 15px; }
  .main-title { font-size: 1.6em; margin-bottom: 20px; min-height: 30px; }
  .cursor { bottom: 3px; }
  .content-section { padding: 15px; margin-bottom: 20px; }
  .section-title { font-size: 1.1em; margin-bottom: 15px; }

  .search-section .search-box { padding: 3px 8px 3px 10px; border-radius: 20px; max-width: none; }
  .search-section .search-input { padding: 8px; font-size: 0.9em; }
  .search-section .search-button { padding: 6px 15px; font-size: 0.85em; }
  .search-section .search-select { font-size: 0.85em; }
  .language-switch { font-size: 0.8em; margin-top: 15px; }
  .language-switch a { padding: 5px 2px; }

  .nav-links-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
  .nav-link-card { padding: 12px; font-size: 0.85em; }
  .add-link-card { font-size: 1.5em; }

  /* Adjust Chat Bubble Styles on Mobile */
   .ai-chat-section .chat-interface {
        max-height: 55vh; /* Allow slightly more height on mobile */
    }
     .ai-chat-section .chat-messages {
        padding: 10px 8px;
        gap: 10px;
    }
    .ai-chat-section .chat-message-wrapper {
        max-width: 90%; /* Allow slightly wider bubbles on mobile */
    }
     .ai-chat-section .chat-message-bubble {
        padding: 8px 12px;
        font-size: 0.9em; /* Slightly smaller font in bubbles */
     }
     .ai-chat-section .chat-input-area {
        padding: 10px;
     }
     .ai-chat-section .chat-input-area input {
        padding: 8px 12px;
        font-size: 0.9em;
     }
      .ai-chat-section .chat-input-area button {
        padding: 8px 15px;
        font-size: 0.9em;
     }

  .news-list li a { font-size: 0.9em; }

  .main-footer { padding: 15px; font-size: 0.75em; line-height: 1.5; }
  .mobile-hidden { display: none; }
  .desktop-hidden { display: block; content: ''; margin: -0.5em 0; }
  .main-footer a img { height: 12px; }

   .modal-content { padding: 20px; gap: 15px;}
   .sponsor-qr-container { gap: 15px; }
   .sponsor-qr-container img { width: 150px; max-width: 40%; }
   .close-modal-button { padding: 8px 16px; }
}

</style>