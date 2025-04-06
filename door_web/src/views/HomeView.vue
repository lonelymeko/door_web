<script setup>
import { ref, computed, onMounted, onBeforeUnmount,getCurrentInstance } from 'vue'
import { locales } from '/src/utils/locales.js'
// --- Language State ---
const currentLanguage = ref('zh-CN'); // Default language
const instance = getCurrentInstance();
const WEATHER_API_KEY = instance?.appContext.config.globalProperties.WEATHER_API_KEY;
// Translation helper function
const t = (key, replacements = {}) => {
  const lang = currentLanguage.value;
  let translation = locales[lang]?.[key] || locales['zh-CN']?.[key] || key; // Fallback to Chinese, then key

  // Handle replacements like {year}
  Object.keys(replacements).forEach(repKey => {
    translation = translation.replace(`{${repKey}}`, replacements[repKey]);
  });

  return translation;
};

// --- Weather State ---
const weatherInfo = ref(t('weatherLoading')); // Initial state using t()
const rawWeatherData = ref(null);
const WEATHER_STORAGE_KEY = 'userCityId'; // localStorage key for CID
// --- Geolocation Specific State --- // <<< 添加下面这两行
const geolocationStatus = ref('idle'); // idle, pending_permission, pending_regeo, success, error
const geolocationError = ref('');   // Stores specific error message

// // --- Get API Key from Global Properties ---
// const instance = getCurrentInstance();
// const WEATHER_API_KEY = WEATHER_API_KEY;



// Function to change language
const changeLanguage = (lang) => {
  currentLanguage.value = lang;
  // Optionally, save preference to localStorage
  // localStorage.setItem('preferredLang', lang);
  // Also update calendar/date formats if needed
  calendarInfo.value = new Date().toLocaleDateString(lang); // Update calendar format
};
// --- Weather Fetching Logic ---

// --- Weather Icon Mapping Function ---  <-- ADDED
const getWeatherIcon = (weatherCondition) => {
  if (!weatherCondition) return '❓'; // Default for null/undefined
  const condition = String(weatherCondition).toLowerCase(); // Ensure string and lower case

  // Prioritize more specific conditions first if needed
  if (condition.includes('雷阵雨')) return '⛈️';
  if (condition.includes('雷')) return '⚡';
  if (condition.includes('雨夹雪')) return '🌨️';
  if (condition.includes('雪')) return '❄️';
  if (condition.includes('雨')) return '🌧️';
  if (condition.includes('阴')) return '☁️'; // Cloudy
  if (condition.includes('多云')) return '🌥️'; // Partly cloudy
  if (condition.includes('晴')) return '☀️'; // Sunny
  if (condition.includes('雾') || condition.includes('霾')) return '🌫️'; // Fog/Haze
  if (condition.includes('风') || condition.includes('吹')) return '🌬️'; // Windy

  console.warn("未匹配的天气图标:", weatherCondition); // Log unmatched conditions
  return '🌍'; // Generic fallback
}
// --- API Calls using Vite Proxy ---

// Fetch Adcode using Coordinates via Vite Proxy
const fetchAdcodeFromCoords = async (latitude, longitude) => {
    if (!WEATHER_API_KEY) return null; // Need key

    console.log(`请求 Adcode: lat=${latitude}, lon=${longitude}`);
    geolocationStatus.value = 'pending_regeo';
    weatherInfo.value = t('weatherFetchingAdcode');
    try {
        // Construct URL using the proxy prefix defined in vite.config.js
        // Pass necessary Gaode params (key, location)
        const proxyRegeoUrl = `/proxy-regeo?output=json&location=${longitude},${latitude}&key=${WEATHER_API_KEY}&radius=1000&extensions=base`;

        console.log('调用代理 Regeo URL:', proxyRegeoUrl);
        const response = await fetch(proxyRegeoUrl); // Fetch via Vite proxy

        if (!response.ok) { // Checks if the proxy itself responded ok (e.g., 200)
            throw new Error(`代理 Regeo 请求失败: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('代理 Regeo 响应数据:', data);

        // Check Gaode's internal status
        if (data.status === '1' && data.regeocode) {
            const adcode = data.regeocode.addressComponent?.adcode;
            if (adcode) {
                console.log('从代理获取到 Adcode:', adcode);
                return adcode;
            } else {
                 throw new Error('高德 Regeo 成功，但未找到 Adcode');
            }
        } else {
            throw new Error(`高德 Regeo API 错误: ${data.info || '未知错误'}`);
        }
    } catch (error) {
        console.error('获取 Adcode 失败:', error);
        geolocationStatus.value = 'error';
        geolocationError.value = t('weatherAdcodeError');
        weatherInfo.value = geolocationError.value;
        return null;
    }
};

// Fetch Weather Data using Adcode via Vite Proxy
const fetchWeatherDataByAdcode = async (adcode) => {
    if (!WEATHER_API_KEY || !adcode) return null;

    console.log(`请求天气数据，Adcode: ${adcode}`);
    weatherInfo.value = t('weatherLoading'); // Show specific weather loading
    try {
        // Construct URL using the proxy prefix defined in vite.config.js
        const proxyWeatherUrl = `/proxy-weather?city=${adcode}&key=${WEATHER_API_KEY}`;

        console.log('调用代理 Weather URL:', proxyWeatherUrl);
        const response = await fetch(proxyWeatherUrl); // Fetch via Vite proxy

        if (!response.ok) {
             throw new Error(`代理 Weather 请求失败: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('代理 Weather 响应数据:', data);

        // Check Gaode's internal status
        if (data.status === '1' && data.lives && data.lives.length > 0) {
            console.log('成功获取天气数据:', data.lives[0]);
            rawWeatherData.value = data.lives[0]; // <<< *** STORE WEATHER DATA HERE ***
            geolocationStatus.value = 'success';
            weatherInfo.value = ''; // Clear status message on success
            return data.lives[0];
        } else {
             throw new Error(`高德 Weather API 错误: ${data.info || '未知错误'}`);
        }
    } catch (error) {
        console.error('获取天气数据失败:', error);
        geolocationStatus.value = 'error';
        // Keep the more specific adcode error if it happened earlier
        if (!geolocationError.value) {
            geolocationError.value = t('weatherError'); // General weather error
        }
        weatherInfo.value = geolocationError.value;
        rawWeatherData.value = null; // Clear any stale data
        return null;
    }
};
// --- Geolocation Request Logic ---
const requestLocationAndWeather = () => {
    if (!('geolocation' in navigator)) {
        console.error('浏览器不支持地理位置。');
        geolocationStatus.value = 'error';
        geolocationError.value = t('weatherPositionUnavailable'); // Or a new key for "not supported"
        weatherInfo.value = geolocationError.value;
        return;
    }
    if (!WEATHER_API_KEY) {
         console.error("无法获取天气：缺少高德 API Key。");
         geolocationStatus.value = 'error';
         geolocationError.value = t('weatherError'); // Or a key for "config error"
         weatherInfo.value = geolocationError.value;
         return;
    }

    console.log('请求浏览器地理位置权限...');
    geolocationStatus.value = 'pending_permission';
    weatherInfo.value = t('weatherRequestingPermission');

    navigator.geolocation.getCurrentPosition(
        async (position) => { // Success Callback
            const { latitude, longitude } = position.coords;
            console.log(`获取到坐标: Lat=${latitude}, Lon=${longitude}`);

            // Now get adcode using the coordinates
            const adcode = await fetchAdcodeFromCoords(latitude, longitude);

            if (adcode) {
                // If adcode found, get weather
                await fetchWeatherDataByAdcode(adcode);
            }
            // Errors during adcode/weather fetch are handled within those functions

        },
        (error) => { // Error Callback
            console.error('地理位置错误:', error);
            geolocationStatus.value = 'error';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    geolocationError.value = t('weatherPermissionDenied');
                    break;
                case error.POSITION_UNAVAILABLE:
                    geolocationError.value = t('weatherPositionUnavailable');
                    break;
                case error.TIMEOUT:
                    geolocationError.value = t('weatherPositionTimeout');
                    break;
                default:
                    geolocationError.value = t('weatherPositionUnavailable'); // Generic fallback
                    break;
            }
            weatherInfo.value = geolocationError.value; // Update the main status display
        },
        { // Options
            enableHighAccuracy: false, // Faster, less battery, usually good enough for city level
            timeout: 10000,         // 10 seconds timeout
            maximumAge: 600000      // Allow cached position up to 10 minutes old
        }
    );
};


// --- Add State for Mobile Nav ---
const isMobileNavOpen = ref(false);

// --- State Adjustments (Make them computed based on language) ---

// Define sidebar navigation items using computed
const navItems = computed(() => [
  // Main Section
  { title: t('search'), icon: '🔍', link: '#search-section', internal: true, section: 'main' },
  { title: t('navGrid'), icon: '🌐', link: '#nav-section', internal: true, section: 'main' },
  { title: t('aiChat'), icon: '💬', link: '#chat-section', internal: true, section: 'main' },
  { title: t('hotSearch'), icon: '🔥', link: '#hotsearch-section', internal: true, section: 'main' },
  // Extras Section
  { title: t('blog'), icon: '✍️', link: '/blog', internal: false, section: 'extras' },
  { title: t('loveSpace'), icon: '💖', link: '/love', internal: true, section: 'extras' },
  { title: t('news'), icon: '📰', link: '#news-section', internal: true, section: 'extras' },
  // User Section
  { title: t('sponsor'), icon: '💰', link: '#', internal: true, click: () => { showSponsor.value = true }, section: 'user' }
]);

// Define links for the main content navigation grid
// Note: Translating external site names might be optional
const navLinks = computed(() => [
    { name: t('navLinkBilibili'), url: 'https://www.bilibili.com' },
    { name: t('navLinkAliyun'), url: 'https://ecs.console.aliyun.com/' },
    { name: t('navLinkYuketang'), url: 'https://www.yuketang.cn/v2/web/index' },
    { name: t('navLinkDeepseek'), url: 'https://chat.deepseek.com/' },
    { name: t('navLinkMoji'), url: 'https://www.mojidict.com/' },
]);


// --- Search Engine Config (Make names computed) ---
const engines = computed(() => [
  { name: t('engineBing'), value: 'bing', url: 'https://www.bing.com/search?q=' },
  { name: t('engineBaidu'), value: 'baidu', url: 'https://www.baidu.com/s?wd=' },
  { name: t('engineSogou'), value: 'sogou', url: 'https://www.sogou.com/web?query=' }
]);
// selectedEngine needs to be managed carefully if engines array changes structure
// Simplest: keep track of the *value* and find the corresponding object
const selectedEngineValue = ref(engines.value[0].value);
const selectedEngine = computed(() => engines.value.find(e => e.value === selectedEngineValue.value) || engines.value[0]);

const searchQuery = ref('');

// --- Other State ---
const showSponsor = ref(false);
const hotSearchList = ref(['Vue 3', 'Tailwind CSS', '天气 API', 'DeepSeek', '大模型', '备案流程', 'JavaScript']); // Hot search terms usually aren't translated
const currentYear = new Date().getFullYear();
// const weatherInfo = ref("☀️ 晴朗 25°C"); // Weather might need a more complex solution or API that supports language
const calendarInfo = ref(new Date().toLocaleDateString(currentLanguage.value)); // Use current lang for initial format
const newsHeadlines = ref([ // Example static news - better fetched from an API
    { id: 1, titleKey: "news1Title", title: "科技巨头发布新款 AI 芯片" },
    { id: 2, titleKey: "news2Title", title: "国内新能源汽车销量再创新高" },
    { id: 3, titleKey: "news3Title", title: "某地探索数字人民币应用新场景" },
]);
// Add dummy translations for news placeholders in locales.js if needed
// Example in locales.js:
// 'zh-CN': { ..., news1Title: "科技巨头发布新款 AI 芯片", ... }
// 'en-US': { ..., news1Title: "Tech Giant Releases New AI Chip", ... }
// 'ja-JP': { ..., news1Title: "大手テック企業が新しいAIチップを発表", ... }


// --- Typewriter State & Logic (Use computed for quotes) ---
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

// --- Mobile Nav Methods ---
const toggleMobileNav = () => { isMobileNavOpen.value = !isMobileNavOpen.value; };
const closeMobileNav = () => { if (isMobileNavOpen.value) { isMobileNavOpen.value = false; } }

const typeWriterEffect = () => {
      // Use the computed quotes array
      const currentQuoteArray = quotes.value;
      const currentQuote = currentQuoteArray[currentQuoteIndex.value];
      if (!currentQuote) return;

      clearTimeout(typingInterval);

      if (isDeleting) {
        displayedTitle.value = currentQuote.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex <= 0) {
          isDeleting = false;
          charIndex = 0;
          currentQuoteIndex.value = (currentQuoteIndex.value + 1) % currentQuoteArray.length;
          typingInterval = setTimeout(typeWriterEffect, typingSpeed);
        } else {
          typingInterval = setTimeout(typeWriterEffect, typingSpeed / 2);
        }
      } else {
        displayedTitle.value = currentQuote.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex >= currentQuote.length) {
          isDeleting = true;
          typingInterval = setTimeout(typeWriterEffect, pauseBetweenQuotes);
        } else {
          typingInterval = setTimeout(typeWriterEffect, typingSpeed);
        }
      }
};


// --- Methods ---
const performSearch = () => {
  if (searchQuery.value.trim()) {
    window.open(selectedEngine.value.url + encodeURIComponent(searchQuery.value), '_blank');
  }
};

const groupedNavItems = computed(() => {
  const groups = { main: [], extras: [], user: [] };
  // Use the computed navItems which already have translated titles
  navItems.value.forEach(item => {
    if (groups[item.section]) {
      groups[item.section].push(item);
    } else {
      groups.main.push(item); // Default group
    }
  });
  return groups;
});



// --- Lifecycle Hooks ---
onMounted(() => {
  calendarInfo.value = new Date().toLocaleDateString(currentLanguage.value);

  // Request location and subsequently weather
  requestLocationAndWeather();

  // Start typewriter regardless of weather outcome, but ensure it's cleared/reset properly
  console.log("启动打字机效果...");
  clearTimeout(typingInterval);
  currentQuoteIndex.value = 0;
  charIndex = 0;
  isDeleting = false;
  displayedTitle.value = '';
  typeWriterEffect();
});

onBeforeUnmount(() => {
  console.log("组件即将卸载，清除打字机定时器。");
  clearTimeout(typingInterval);
});


const handleClick = (event, clickHandler) => {
  if (clickHandler && typeof clickHandler === 'function') {
    event.preventDefault();
    clickHandler();
  }
   closeMobileNav(); // Close nav on any item click
}

const determineTarget = (item) => {
  if (item.link.startsWith('http')) return '_blank';
  if (item.internal === false && item.link.startsWith('/')) return '_self';
  return '_self';
}

</script>

<template>
  <div class="page-container" :class="{ 'mobile-nav-active': isMobileNavOpen }">
    <!-- Overlay -->
    <div v-if="isMobileNavOpen" class="mobile-nav-overlay" @click="closeMobileNav"></div>

    <!-- Sidebar -->
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
             <router-link v-if="item.internal && item.link.startsWith('/')" :to="item.link" @click="closeMobileNav">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-text">{{ item.title }}</span> <!-- Title is now computed -->
             </router-link>
              <a v-else :href="item.link" @click="handleClick($event, item.click)" :target="determineTarget(item)">
               <span class="nav-icon">{{ item.icon }}</span>
               <span class="nav-text">{{ item.title }}</span> <!-- Title is now computed -->
             </a>
           </li>
        </ul>
        <div class="nav-separator"></div>
         <!-- Extras Section -->
         <ul class="nav-group">
          <li v-for="(item, index) in groupedNavItems.extras" :key="'extras-'+item.link+'-'+index" :class="{ active: false }">
            <router-link v-if="item.internal === true && item.link.startsWith('/')" :to="item.link" @click="closeMobileNav">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.title }}</span> <!-- Title is now computed -->
            </router-link>
            <a v-else :href="item.link" @click="handleClick($event, item.click)" :target="determineTarget(item)">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.title }}</span> <!-- Title is now computed -->
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
               <span class="nav-text">{{ item.title }}</span> <!-- Title is now computed -->
             </a>
         </li>
         </ul>
      </nav>
      <div class="sidebar-footer">
        v1.0.3 <!-- Version bump -->
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Top Bar -->
       <header class="top-bar">
            <div class="top-bar-left">
                <button class="mobile-nav-toggle" @click="toggleMobileNav">
                 <span></span><span></span><span></span>
               </button>
               <!-- Use t() for top bar items -->
               <span class="top-bar-item desktop-only">{{ t('appCenter') }}</span>
               <span class="top-bar-item desktop-only">{{ t('abilityTest') }}</span>
               <span class="top-bar-item desktop-only">{{ t('webPlugin') }}</span>
            </div>
            <div class="top-bar-right">
               <span class="top-bar-item calendar-widget">
                 📅 {{ calendarInfo }} <!-- Calendar format updates automatically -->
               </span>
               <span class="top-bar-item desktop-only">{{ t('checkIn') }}</span>
               <span class="top-bar-item buy-item">{{ t('buyPro') }}</span>
            </div>
      </header>
  <!-- Weather Display Container -->
  <div class="weather-display-container">
          <!-- Show detailed weather IF rawWeatherData is available -->
          <div v-if="rawWeatherData" class="weather-content">
              <span class="weather-icon">{{ getWeatherIcon(rawWeatherData.weather) }}</span>
              <span class="weather-city">{{ rawWeatherData.city }}:</span>
              <span class="weather-condition">{{ rawWeatherData.weather }}</span>
              <span class="weather-temp">{{ rawWeatherData.temperature_float }}{{ t('weatherTempUnit') }}</span>
              <span class="separator mobile-hidden">|</span>
              <span class="weather-detail">{{ t('weatherWindDirection') }}: {{ rawWeatherData.winddirection }}</span>
              <span class="separator mobile-hidden">|</span>
              <span class="weather-detail">{{ t('weatherWind') }}: {{ rawWeatherData.windpower }} {{ t('weatherWindPowerUnit') }}</span>
               <span class="separator mobile-hidden">|</span>
              <span class="weather-detail">{{ t('weatherHumidity') }}: {{ rawWeatherData.humidity_float }}%</span>
          </div>
          <!-- Otherwise, show the current status/error message -->
          <div v-else class="weather-loading-error">
              {{ weatherInfo }}
          </div>
      </div>
      <!-- ======================================== -->

      <!-- Content Body -->
      <div class="content-body">
        <!-- Title with Typewriter Effect -->
        <h1 class="main-title">
          {{ displayedTitle }}<span class="cursor">|</span>
        </h1>

        <!-- Search Section -->
        <section id="search-section" class="content-section search-section">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                 <!-- Use computed engines -->
                 <select v-model="selectedEngineValue" class="search-select">
                    <option v-for="engine in engines" :key="engine.value" :value="engine.value">
                      {{ engine.name }} <!-- Name is now computed -->
                    </option>
                  </select>
                <input
                  type="text"
                  v-model="searchQuery"
                  :placeholder="t('searchPlaceholder')"
                  @keyup.enter="performSearch"
                  class="search-input"
                />
                <button @click="performSearch" class="search-button">{{ t('searchButton') }}</button>
              </div>
               <!-- Language Switcher -->
               <div class="language-switch">
                 {{ t('languageSwitch') }}:
                 <a href="#" @click.prevent="changeLanguage('zh-CN')" :class="{ active: currentLanguage === 'zh-CN' }">简体中文</a> |
                 <a href="#" @click.prevent="changeLanguage('en-US')" :class="{ active: currentLanguage === 'en-US' }">English</a> |
                 <a href="#" @click.prevent="changeLanguage('ja-JP')" :class="{ active: currentLanguage === 'ja-JP' }">日本語</a>
               </div>
        </section>

        <!-- Hot Search Section -->
        <section id="hotsearch-section" class="content-section hot-search-section">
           <h2 class="section-title">{{ t('hotSearchTitle') }}</h2>
           <div class="hot-search-tags">
             <!-- Hot search terms usually remain in their original language -->
             <span v-for="(term, index) in hotSearchList" :key="index" class="hot-tag">
               {{ term }}
             </span>
           </div>
        </section>

         <!-- Navigation Links Section -->
        <section id="nav-section" class="content-section">
           <h2 class="section-title">{{ t('navGridTitle') }}</h2>
           <div class="nav-links-grid">
               <!-- Use computed navLinks -->
               <a v-for="(link, index) in navLinks" :key="'grid-'+link.url+'-'+index" :href="link.url" target="_blank" class="nav-link-card">
                   {{ link.name }} <!-- Name is now computed -->
               </a>
               <a href="#" class="nav-link-card add-link-card" @click.prevent>{{ t('addLink') }}</a>
           </div>
        </section>

        <!-- AI Chat Placeholder Section -->
        <section id="chat-section" class="content-section ai-chat-placeholder">
          <h2 class="section-title">{{ t('aiChatTitle') }}</h2>
          <div class="chat-interface">
            <div class="chat-messages">
              <p>{{ t('aiGreeting') }}</p> <!-- Use t() -->
            </div>
            <div class="chat-input-area">
              <input type="text" :placeholder="t('chatInputPlaceholder')" />
              <button>{{ t('chatSendButton') }}</button> <!-- Use t() -->
            </div>
          </div>
        </section>

        <!-- News Feed Placeholder Section -->
        <section id="news-section" class="content-section news-feed-placeholder">
           <h2 class="section-title">{{ t('newsTitle') }} <a href="#" class="view-more">{{ t('viewMore') }}</a></h2>
          <ul class="news-list">
             <!-- Example for news titles if keys were added -->
             <li v-for="item in newsHeadlines" :key="item.id">
               <a href="#">{{ item.titleKey ? t(item.titleKey) : item.title }}</a>
             </li>
          </ul>
        </section>

      </div>

       <!-- Footer -->
       <footer class="main-footer">
          <!-- Use t() and pass year as replacement -->
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

    <!-- Sponsor Modal -->
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


/* --- Keep ALL existing CSS from the previous correct version --- */
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
  padding: 0 15px; /* 稍微调整 padding 以适应头像 */
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  height: 60px;
  display: flex;
  align-items: center;
  /* justify-content: center; <-- 从 center 改为 space-between 或 flex-start */
  justify-content: flex-start; /* 让元素从左开始排列 */
  gap: 10px; /* 在头像和 Logo 之间添加间距 */
  flex-shrink: 0;
}

/* --- 新增头像样式 --- */
.sidebar-avatar {
  width: 80px; /* 头像宽度 */
  height: 80px; /* 头像高度 */
  border-radius: 50%; /* 圆形 */
  object-fit: cover; /* 保证图片不变形 */
  flex-shrink: 0; /* 防止头像被压缩 */
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
}

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

/* AI Chat Placeholder */
.ai-chat-placeholder .chat-interface { border: 1px solid #e0e0e0; border-radius: 6px; height: 300px; display: flex; flex-direction: column; }
.chat-messages { flex-grow: 1; padding: 15px; overflow-y: auto; background-color: #f8f9fa; }
.chat-messages p { margin-bottom: 10px; font-size: 0.9em; line-height: 1.5; }
.chat-input-area { display: flex; border-top: 1px solid #e0e0e0; padding: 10px; background-color: #fff; }
.chat-input-area input { flex-grow: 1; border: 1px solid #ced4da; border-radius: 4px; padding: 8px 10px; margin-right: 10px; outline: none; }
.chat-input-area input:focus { border-color: #e63946; box-shadow: 0 0 0 2px rgba(230, 57, 70, 0.2); }
.chat-input-area button { padding: 8px 15px; background: #e63946; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s ease; }
.chat-input-area button:hover { background: #d62828; }

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


.weather-widget {
  font-size: 0.85em; /* Slightly smaller font maybe */
  white-space: normal; /* Allow wrapping if needed */
  /* Add any other specific styles */
   max-width: 300px; /* Prevent it from getting too wide */
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap; /* Or allow wrapping: white-space: normal; */
   text-align: right; /* Align text to the right */
}
    /* Ensure the loading/error message style is reasonable */
    .weather-loading-error {
      color: #888;
      padding: 5px 0; /* Match padding if needed */
      font-style: italic; /* Optional: make it italic */
    }
/* Mobile Styles */
.mobile-nav-toggle { display: none; }
.mobile-close-btn { display: none; }
.mobile-nav-overlay { display: none; }
.desktop-hidden { display: none; }
.desktop-only { display: inline-flex; }
.mobile-hidden { display: inline; }

/* Breakpoint */
@media (max-width: 768px) {
  .page-container { /* No change needed here */ }

  /* Sidebar Mobile */
  .sidebar {
    position: fixed; left: -260px; top: 0; bottom: 0; height: 100%;
    z-index: 1001; width: 250px; transition: left 0.3s ease-in-out;
    box-shadow: 2px 0 5px rgba(0,0,0,0.1); border-right: none;
  }
  .sidebar.mobile-open { left: 0; }
  .sidebar-header { justify-content: space-between; }

  /* Mobile Nav Toggle (Hamburger) */
  .mobile-nav-toggle {
    display: flex; flex-direction: column; justify-content: space-around;
    width: 30px; height: 25px; background: transparent; border: none;
    cursor: pointer; padding: 0; margin-right: 15px; order: -1;
  }
  .mobile-nav-toggle span { width: 100%; height: 3px; background-color: #555; border-radius: 2px; transition: all 0.3s linear; }
  .page-container.mobile-nav-active .mobile-nav-toggle span:nth-child(1) { transform: rotate(45deg) translate(5px, 6px); }
  .page-container.mobile-nav-active .mobile-nav-toggle span:nth-child(2) { opacity: 0; }
  .page-container.mobile-nav-active .mobile-nav-toggle span:nth-child(3) { transform: rotate(-45deg) translate(5px, -6px); }

  .mobile-close-btn { display: block; background: none; border: none; font-size: 2em; color: #888; cursor: pointer; padding: 0 15px; }

  .mobile-nav-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; display: block; }
  .page-container:not(.mobile-nav-active) .mobile-nav-overlay { display: none; }

  /* Adjust Main Content */
  .main-content { width: 100%; margin-left: 0; }

  /* Adjust Top Bar */
  .top-bar { padding: 0 15px; height: 50px; }
  .top-bar-left, .top-bar-right { gap: 10px; }
  .desktop-only { display: none; }
  .buy-item { padding: 4px 8px; font-size: 0.85em; }
  .weather-widget, .calendar-widget { font-size: 0.8em; padding: 4px 8px; }

  /* Adjust Content Body */
  .content-body { padding: 15px; }
  .main-title { font-size: 1.6em; margin-bottom: 20px; min-height: 30px; }
  .cursor { bottom: 3px; }
  .content-section { padding: 15px; margin-bottom: 20px; }
  .section-title { font-size: 1.1em; margin-bottom: 15px; }

  /* Adjust Search */
  .search-section .search-box { padding: 3px 8px 3px 10px; border-radius: 20px; max-width: none; }
  .search-section .search-input { padding: 8px; font-size: 0.9em; }
  .search-section .search-button { padding: 6px 15px; font-size: 0.85em; }
  .search-section .search-select { font-size: 0.85em; }
  .language-switch { font-size: 0.8em; margin-top: 15px; }
   /* Make language links slightly larger tap target on mobile */
  .language-switch a { padding: 5px 2px; }

  /* Adjust Nav Grid */
  .nav-links-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
  .nav-link-card { padding: 12px; font-size: 0.85em; }
  .add-link-card { font-size: 1.5em; }

  /* Adjust Chat Placeholder */
  .ai-chat-placeholder .chat-interface { height: 250px; }
  .chat-input-area input { padding: 6px 8px; }
  .chat-input-area button { padding: 6px 10px; }

  /* Adjust News Feed */
  .news-list li a { font-size: 0.9em; }

  /* Adjust Footer */
  .main-footer { padding: 15px; font-size: 0.75em; line-height: 1.5; }
  .mobile-hidden { display: none; }
  .desktop-hidden { display: block; content: ''; margin: -0.5em 0; }
  .main-footer a img { height: 12px; }

  /* Adjust Sponsor Modal */
   .modal-content { padding: 20px; gap: 15px;}
   .sponsor-qr-container { gap: 15px; }
   .sponsor-qr-container img { width: 150px; max-width: 40%; }
   .close-modal-button { padding: 8px 16px; }
   .weather-widget {
        font-size: 0.75em;
        max-width: 150px; /* Adjust for smaller screens */
    }
}

</style>