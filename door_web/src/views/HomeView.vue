<script setup>
import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance, defineAsyncComponent } from 'vue'
import { locales } from '/src/utils/locales.js'

// Composables
import { useWindowManager } from '../composables/useWindowManager.js';
import { useWeather } from '../composables/useWeather.js';
import { useAI } from '../composables/useAI.js';
import { useFileSystem } from '../composables/useFileSystem.js';

// Components
import DesktopIcons from '../components/desktop/DesktopIcons.vue';
import Taskbar from '../components/desktop/Taskbar.vue';
import StartMenu from '../components/desktop/StartMenu.vue';
import WindowFrame from '../components/windows/WindowFrame.vue';
import WeatherWidget from '../components/windows/WeatherWidget.vue';
import ChatWidget from '../components/windows/ChatWidget.vue';
import SaveDialog from '../components/modals/SaveDialog.vue';
import AddLinkModal from '../components/modals/AddLinkModal.vue';

// Async Components
const Notepad = defineAsyncComponent(() => import('../components/Notepad.vue'));
const Paint = defineAsyncComponent(() => import('../components/Paint.vue'));

// --- Instance and Global Properties ---
const instance = getCurrentInstance();
const globalProps = instance?.appContext.config.globalProperties || {};

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

// --- Composables Initialization ---
const { 
  windows, zIndexCounter, createAppWindow, openWebWindow, navigateIframe, 
  openWindow, closeWindow, minimizeWindow, toggleMinimize, handleMaximize, 
  focusWindow, startDrag, loadWindowsState, saveWindowsState 
} = useWindowManager();

const { 
  weatherInfo, rawWeatherData, geolocationStatus, geolocationError, 
  getWeatherIcon, requestLocationAndWeather 
} = useWeather(globalProps.WEATHER_API_KEY, t);

const { 
  dailySuggestionContent, isSuggestionLoading, suggestionError, loadDailySuggestion, 
  fetchDailySuggestion, chatMessages, chatInput, isChatLoading, chatError, 
  renderMarkdown, loadChatHistory, sendChatMessage, openai 
} = useAI(globalProps, t);

const { 
  userFiles, loadUserFiles, saveFile, customLinks, loadCustomLinks, addCustomLink,
  deleteFile, renameFile, iconPositions, saveIconPosition, loadIconPositions
} = useFileSystem();


// --- Local State ---
const startMenuOpen = ref(false);
const showCalendar = ref(false);
const showSaveDialog = ref(false);
const showAddLinkModal = ref(false);
const saveDialogData = ref({
  content: null,
  type: 'notepad',
  filename: 'Untitled',
  sourceWindowId: null,
  x: 100,
  y: 100
});

const calendarInfo = ref(new Date().toLocaleDateString(currentLanguage.value));
const hotSearchList = ref(['do']);
const newsHeadlines = ref([{ id: 1, title: "Loading...", url: "#" }]);
const isDraggingIcon = ref(false); // New state to track icon dragging

// --- Search Engines ---
const engines = computed(() => [
  { name: t('engineBing'), value: 'bing', url: 'https://www.bing.com/search?q=' },
  { name: t('engineBaidu'), value: 'baidu', url: 'https://www.baidu.com/s?wd=' },
  { name: t('engineSogou'), value: 'sogou', url: 'https://www.sogou.com/web?query=' },
  { name: 'DuckDuckGo', value: 'duckduckgo', url: 'https://html.duckduckgo.com/html/?q=' },
]);
const selectedEngineValue = ref(engines.value[0].value);
const selectedEngine = computed(() => engines.value.find(e => e.value === selectedEngineValue.value) || engines.value[0]);
const searchQuery = ref('');

const performSearch = () => {
  if (searchQuery.value.trim()) {
    const engine = selectedEngine.value;
    window.open(engine.url + encodeURIComponent(searchQuery.value), '_blank');
  }
};

// --- Navigation Links ---
const navLinks = computed(() => [
    { name: t('navLinkBilibili'), url: 'https://www.bilibili.com' },
    { name: t('navLinkAliyun'), url: 'https://ecs.console.aliyun.com/' },
    { name: t('navLinkVolcengine'), url: 'https://console.volcengine.com/' },
    { name: t('navLinkYuketang'), url: 'https://www.yuketang.cn/v2/web/index' },
    { name: t('navLinkShixiseng'), url: 'https://www.shixiseng.com/' },
    { name: t('navLinkMoji'), url: 'https://www.mojidict.com/' },
    { name: 'Gemini', url: 'https://gemini.google.com/' },
    { name: 'Grok', url: 'https://grok.com/' },
    { name: 'Claude', url: 'https://claude.ai/' },
    { name: 'ChatGPT', url: 'https://chat.openai.com/' },
    { name: 'Github Copilot', url: 'https://github.com/copilot' },
    { name: t('navLinkDeepseek'), url: 'https://chat.deepseek.com/' },
    { name: 'BOOTH', url: 'https://booth.pm/' },
    { name: '小林coding', url: 'https://xiaolincoding.com/' },
    { name: 'Jetpack Compose', url: 'https://jetpackcompose.cn/docs/' },
    { name: 'Flutter', url: 'https://flutter.dev.cn/' },
    { name: 'Vue.js', url: 'https://cn.vuejs.org/' },
    { name: 'React', url: 'https://react.docschina.org/' },
    { name: 'UI Prompt', url: 'https://www.uiprompt.site/zh/styles'},
    ...customLinks.value
]);

// --- Actions ---
const changeLanguage = (lang) => {
  currentLanguage.value = lang;
  calendarInfo.value = new Date().toLocaleDateString(lang);
  loadDailySuggestion();
  // Update window titles
  const updateTitle = (id, newTitle) => {
      const w = windows.value.find(win => win.id === id);
      if(w) w.title = newTitle;
  }
  updateTitle('weather', t('calendarWidget') || '天气日期');
  updateTitle('hotsearch', t('hotSearchTitle'));
  updateTitle('news', t('newsTitle'));
  updateTitle('suggestion', t('dailySuggestionTitle'));
  updateTitle('chat', t('aiChatTitle'));
  updateTitle('sponsor', t('sponsor'));
};

const toggleStartMenu = () => {
  startMenuOpen.value = !startMenuOpen.value;
  if(startMenuOpen.value) showCalendar.value = false;
};

const toggleCalendar = () => {
    showCalendar.value = !showCalendar.value;
    if(showCalendar.value) startMenuOpen.value = false;
};

const closeStartMenu = (e) => {
    if (startMenuOpen.value && !e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
        startMenuOpen.value = false;
    }
    if (showCalendar.value && !e.target.closest('.calendar-flyout') && !e.target.closest('.taskbar-tray')) {
        showCalendar.value = false;
    }
};

const handleSaveRequest = (content, type, currentTitle, windowId) => {
  const win = windows.value.find(w => w.id === windowId);
  
  // Center the dialog relative to the window
  const dialogWidth = 350;
  const dialogHeight = 200; 
  
  let x = 100;
  let y = 100;
  
  if (win) {
      x = win.x + (win.width - dialogWidth) / 2;
      y = win.y + (win.height - dialogHeight) / 2;
  }
  
  saveDialogData.value = {
    content,
    type,
    filename: currentTitle.replace(/ - (Notepad|Paint)$/i, '') || 'Untitled',
    sourceWindowId: windowId,
    x: x,
    y: y
  };
  showSaveDialog.value = true;
};

const confirmSave = (target) => {
  const { content, type, filename, sourceWindowId } = saveDialogData.value;
  const fullTitle = `${filename} - ${type === 'notepad' ? 'Notepad' : 'Paint'}`;
  
  if (target === 'desktop') {
    const newFile = {
      id: `file-${Date.now()}`,
      title: fullTitle,
      type,
      content,
      createdAt: new Date().toISOString()
    };
    
    saveFile(newFile);
    
    // Update window title if it's currently open
    const win = windows.value.find(w => w.id === sourceWindowId);
    if (win) {
      win.title = fullTitle;
      win.content = content;
      saveWindowsState();
    }
  } else if (target === 'download') {
    const blob = new Blob([content], { type: type === 'notepad' ? 'text/plain' : 'image/png' });
    const link = document.createElement('a');
    
    if (type === 'paint') {
       link.href = content;
    } else {
       link.href = URL.createObjectURL(blob);
    }
    
    link.download = filename + (type === 'notepad' ? '.txt' : '.png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  showSaveDialog.value = false;
};

const openFile = (file) => {
  createAppWindow(file.type, file.content, file.title);
};

const desktopIconsList = computed(() => {
  const baseIcons = [
    { id: 'icon-recycle-bin', title: t('recycleBin') || '回收站', icon: '🗑️', action: () => {} }, // Added Recycle Bin
    { id: 'icon-weather', title: t('calendarWidget') || '天气日期', icon: '🌤️', action: () => toggleCalendar() },
    { id: 'icon-notepad', title: 'Notepad', icon: '📝', action: () => createAppWindow('notepad') },
    { id: 'icon-paint', title: 'Paint', icon: '🎨', action: () => createAppWindow('paint') },
    { id: 'icon-bilibili', title: 'Bilibili Live', icon: '📺', action: () => openWindow('bilibili') },
    { id: 'icon-suggestion', title: t('dailySuggestionTitle'), icon: '💡', action: () => openWindow('suggestion') },
    { id: 'icon-hotsearch', title: t('hotSearchTitle'), icon: '🔥', action: () => openWindow('hotsearch') },
    { id: 'icon-news', title: t('newsTitle'), icon: '📰', action: () => openWindow('news') },
    { id: 'icon-chat', title: t('aiChatTitle'), icon: '🐱', action: () => openWindow('chat') },
    { id: 'icon-blog', title: t('blog'), icon: '✍️', action: () => openWebWindow(t('blog'), '/blog') },
    { id: 'icon-mail', title: t('mail'), icon: '✉️', action: () => openWebWindow(t('mail'), 'https://mail.lonelymeko.top/') },
    { id: 'icon-sponsor', title: t('sponsor'), icon: '💰', action: () => openWindow('sponsor') },
    { id: 'icon-search', title: t('search'), icon: '🔍', action: () => { startMenuOpen.value = true; } },
    { id: 'icon-nav', title: t('navGridTitle'), icon: '🌐', action: () => { startMenuOpen.value = true; } },
  ];

  const fileIcons = userFiles.value.map(file => ({
    id: file.id,
    title: file.title,
    icon: file.type === 'notepad' ? '📄' : '🖼️',
    action: () => openFile(file)
  }));

  return [...baseIcons, ...fileIcons];
});

// --- API Calls (HotSearch & News) ---
const doHotSearch = async () => {
  try {
    const response = await fetch('/api/bilibili/search/square?limit=10');
    const rawText = await response.text();
    if (!response.ok || !rawText.startsWith("{")) throw new Error(`Invalid response`);
    const data = JSON.parse(rawText);
    return data.data.trending.list.map(item => item.show_name || item.keyword);
  } catch (error) {
    console.error("获取热搜失败:", error);
    return [];
  }
};

const getToutiaoHot = async () => { 
  try {
    const response = await fetch('/api/toutiao/hot.php?type=toutiaoHot');
    const rawText = await response.text();
    if (!response.ok || !rawText.startsWith("{")) throw new Error(`Invalid response`);
    const data = JSON.parse(rawText);
    return data.data.slice(0, 20);
  } catch (error) {
    console.error("获取今日头条热搜失败:", error);
    return [];
  }
};

const openBilibiliSearch = (term) => {
  const url = `https://search.bilibili.com/all?keyword=${encodeURIComponent(term)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const viewMoreNews = async () => { 
    // Logic to load more news if needed
};

const handleUpdatePosition = (id, x, y) => {
    // Check if dropped on Recycle Bin
    // This is a simplified check. In a real app, we'd check intersection with the Recycle Bin icon rect.
    // Since we don't have easy access to the Recycle Bin's DOM rect here without more complex logic,
    // we will rely on the visual feedback or implement a more robust drop target system later.
    // For now, let's just save the position.
    
    // However, the user requirement says "Drag into Recycle Bin to delete".
    // We can implement a simple distance check if we know where the Recycle Bin is.
    // Or we can handle the drop logic inside DesktopIcons.vue where we have DOM access.
    // Let's delegate the "Drop on Recycle Bin" detection to DesktopIcons.vue and have it emit a specific event,
    // or we can just save the position here.
    
    saveIconPosition(id, x, y);
};

const handleFileDelete = (id) => {
    deleteFile(id);
};

const handleFileRename = (id, newName) => {
    renameFile(id, newName);
};

const handleDragStart = () => {
    isDraggingIcon.value = true;
};

const handleDragEnd = () => {
    isDraggingIcon.value = false;
};

// --- Lifecycle ---
onMounted(() => {
  calendarInfo.value = new Date().toLocaleDateString(currentLanguage.value);
  loadChatHistory();
  loadDailySuggestion();
  loadCustomLinks();
  loadUserFiles();
  loadIconPositions(); // Load positions
  loadWindowsState(() => openWebWindow(t('blog'), '/blog'));
  requestLocationAndWeather();
  
  doHotSearch().then(data => { hotSearchList.value = data; });
  getToutiaoHot().then(data => { newsHeadlines.value = data; });
  
  window.addEventListener('click', closeStartMenu);
  // Global mouseup listener to ensure drag state is reset even if mouse is released outside windows
  window.addEventListener('mouseup', () => {
      if (isDraggingIcon.value) {
          isDraggingIcon.value = false;
      }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('click', closeStartMenu);
  // Cleanup is handled automatically for anonymous function if we don't store ref, 
  // but for correctness we should probably store it. 
  // However, since HomeView is the root view, it's rarely unmounted.
});
</script>

<template>
  <div class="desktop-container">
    
    <!-- Desktop Icons -->
    <DesktopIcons 
      :icons="desktopIconsList" 
      :iconPositions="iconPositions"
      @delete-file="handleFileDelete"
      @rename-file="handleFileRename"
      @update-position="handleUpdatePosition"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
    />

    <!-- Windows -->
    <WindowFrame 
      v-for="win in windows" 
      :key="win.id" 
      :win="win" 
      :zIndexCounter="zIndexCounter"
      :style="{ pointerEvents: isDraggingIcon ? 'none' : 'auto' }"
      @focus="focusWindow"
      @start-drag="startDrag"
      @minimize="minimizeWindow"
      @maximize="handleMaximize"
      @close="closeWindow"
    >
        <!-- Weather Content -->
        <WeatherWidget 
          v-if="win.type === 'weather'" 
          :calendarInfo="calendarInfo"
          :rawWeatherData="rawWeatherData"
          :weatherInfo="weatherInfo"
          :t="t"
          :getWeatherIcon="getWeatherIcon"
        />

        <!-- Bilibili Content -->
        <div v-if="win.type === 'bilibili'" class="win-inner-content no-padding">
            <iframe style="width: 100%; height: 100%; border: none;" src="https://www.bilibili.com/blackboard/live/live-activity-player.html?cid=32117356&quality=0" frameborder="no" framespacing="0" scrolling="no" allow="autoplay; encrypted-media" allowfullscreen="true"></iframe>
        </div>

        <!-- Notepad Content -->
        <div v-if="win.type === 'notepad'" class="win-inner-content no-padding">
            <Notepad 
                :initialContent="win.content" 
                :isActive="win.zIndex === zIndexCounter && !win.isMinimized && win.isOpen"
                @save="(content) => handleSaveRequest(content, 'notepad', win.title, win.id)" 
            />
        </div>

        <!-- Paint Content -->
        <div v-if="win.type === 'paint'" class="win-inner-content no-padding">
            <Paint 
                :initialImage="win.content" 
                :isActive="win.zIndex === zIndexCounter && !win.isMinimized && win.isOpen"
                @save="(content) => handleSaveRequest(content, 'paint', win.title, win.id)" 
            />
        </div>

        <!-- Iframe Content (Generic Web Window) -->
        <div v-if="win.type === 'iframe'" class="win-inner-content no-padding" style="display: flex; flex-direction: column; overflow: hidden;">
             <div class="iframe-toolbar" style="background: #c0c0c0; padding: 2px; border-bottom: 1px solid #808080; display: flex; align-items: center; gap: 5px; flex-shrink: 0;">
                 <span style="font-size: 11px;">Address:</span>
                 <input type="text" :value="win.url" @keyup.enter="navigateIframe(win.id, $event.target.value)" style="flex: 1; font-size: 11px; padding: 2px;" />
             </div>
             <div class="iframe-container" style="flex: 1; overflow: hidden; position: relative;">
                <iframe 
                    :src="win.url" 
                    :name="win.id" 
                    style="width: 125%; height: 125%; border: none; transform: scale(0.8); transform-origin: 0 0;" 
                    frameborder="0" 
                    sandbox="allow-forms allow-scripts allow-same-origin allow-presentation allow-popups allow-modals">
                </iframe>
             </div>
        </div>

        <!-- Hot Search Content -->
        <div v-if="win.type === 'hotsearch'" class="win-inner-content">
            <div class="hot-search-tags">
             <span v-for="(term, index) in hotSearchList" :key="index" class="hot-tag"
             @click="openBilibiliSearch(term)">
               {{ term }}
             </span>
           </div>
        </div>

        <!-- News Content -->
        <div v-if="win.type === 'news'" class="win-inner-content">
             <button  class="view-more" @click="viewMoreNews" style="margin-bottom: 10px;">{{ t('viewMore') }}</button>
                <ul class="news-list">
                 <li v-for="item in newsHeadlines" :key="item.id">
                   <a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.index + "." + item.title }}</a>
                 </li>
               </ul>
        </div>

        <!-- Suggestion Content -->
        <div v-if="win.type === 'suggestion'" class="win-inner-content">
            <div v-if="isSuggestionLoading" class="loading-indicator">
               {{ t('aiSuggestionLoading') }} <span class="spinner">⏳</span>
            </div>
            <div v-else-if="suggestionError" class="error-message ai-error">
               ⚠️ {{ suggestionError }}
            </div>
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
        </div>

        <!-- Chat Content -->
        <ChatWidget 
          v-if="win.type === 'chat'"
          :chatMessages="chatMessages"
          :chatError="chatError"
          :isChatLoading="isChatLoading"
          :openai="openai"
          :t="t"
          :renderMarkdown="renderMarkdown"
          @send-message="(msg) => { chatInput = msg; sendChatMessage(); }"
        />

        <!-- Sponsor Content -->
        <div v-if="win.type === 'sponsor'" class="win-inner-content">
             <p style="text-align: center; font-weight: bold;">{{ t('sponsorThanks') }}</p>
            <div class="sponsor-qr-container">
                <img src="/img/alipay.jpg" alt="支付宝" >
                <img src="/img/weixin.jpg" alt="微信" >
            </div>
        </div>
    </WindowFrame>

    <!-- Save Dialog -->
    <SaveDialog 
      :showSaveDialog="showSaveDialog"
      :saveDialogData="saveDialogData"
      :zIndexCounter="zIndexCounter"
      @close="showSaveDialog = false"
      @confirm-save="confirmSave"
      @update:filename="(val) => saveDialogData.filename = val"
    />

    <!-- Add Link Modal -->
    <AddLinkModal 
      :showAddLinkModal="showAddLinkModal"
      :t="t"
      @close="showAddLinkModal = false"
      @add-link="(link) => { addCustomLink(link.name, link.url); showAddLinkModal = false; }"
    />

    <!-- Start Menu -->
    <StartMenu 
      :isOpen="startMenuOpen"
      :navLinks="navLinks"
      :t="t"
      :engines="engines"
      v-model:selectedEngineValue="selectedEngineValue"
      v-model:searchQuery="searchQuery"
      @close="startMenuOpen = false"
      @open-window="openWindow"
      @open-web-window="openWebWindow"
      @show-add-link="showAddLinkModal = true"
      @change-language="changeLanguage"
      @perform-search="performSearch"
    />

    <!-- Calendar & Weather Flyout -->
    <div v-if="showCalendar" class="calendar-flyout">
         <div class="weather-display-large">
            <h2>📅 {{ calendarInfo }}</h2>
            <div v-if="rawWeatherData" class="weather-details">
                <div class="weather-main">
                    <span class="weather-icon-large">{{ getWeatherIcon(rawWeatherData.weather) }}</span>
                    <span class="weather-temp-large">{{ rawWeatherData.temperature_float }}°C</span>
                </div>
                <p>{{ rawWeatherData.city }} - {{ rawWeatherData.weather }}</p>
                <p>{{ t('weatherWind') }}: {{ rawWeatherData.winddirection }} {{ rawWeatherData.windpower }}级</p>
                <p>{{ t('weatherHumidity') }}: {{ rawWeatherData.humidity_float }}%</p>
            </div>
            <div v-else>
                {{ weatherInfo }}
            </div>
         </div>
    </div>

    <!-- Taskbar -->
    <Taskbar 
      :startMenuOpen="startMenuOpen"
      :windows="windows"
      :zIndexCounter="zIndexCounter"
      :rawWeatherData="rawWeatherData"
      :t="t"
      :getWeatherIcon="getWeatherIcon"
      @toggle-start-menu="toggleStartMenu"
      @toggle-minimize="toggleMinimize"
      @toggle-calendar="toggleCalendar"
    />

  </div>
</template>

<style scoped>
/* --- Windows 95/98 Desktop Theme --- */

.desktop-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #008080; /* Teal Background */
}

/* Calendar Flyout */
.calendar-flyout {
    position: absolute;
    bottom: 28px;
    right: 2px;
    width: 250px;
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    padding: 10px;
    z-index: 10000;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
}

/* Component Specific Styles (Adapted for Windows) */
.weather-display-large { text-align: center; }
.weather-details { margin-top: 10px; }
.weather-main { font-size: 2em; margin-bottom: 10px; }

.hot-search-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.hot-tag {
    background-color: #fff;
    border: 1px solid #000;
    padding: 2px 5px;
    cursor: pointer;
}
.hot-tag:hover { background-color: #000080; color: white; }

.news-list { list-style: none; padding: 0; }
.news-list li { padding: 5px 0; border-bottom: 1px dashed #ccc; }
.news-list li a:hover { color: red; }

.view-more {
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    cursor: pointer;
    padding: 2px 10px;
    color: black;
}
.view-more:active {
    border-top: 2px solid #000;
    border-left: 2px solid #000;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
}

.win-inner-content {
    background-color: #fff;
    border: 2px solid;
    border-color: #808080 #fff #fff #808080; /* Inset border */
    padding: 15px;
    height: 100%;
    overflow-y: auto;
    color: black;
}
.win-inner-content.no-padding {
    padding: 0;
}

.sponsor-qr-container { display: flex; gap: 10px; justify-content: center; }
.sponsor-qr-container img { width: 150px; border: 1px solid #000; }

/* Mobile Adjustments for Retro Theme */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0; left: -260px; bottom: 40px; /* Above taskbar */
    background-color: #c0c0c0; /* Solid grey on mobile */
    border-right: 2px solid #fff;
    z-index: 2000;
  }
  .sidebar.mobile-open { left: 0; }
  .sidebar-nav li > a {
    flex-direction: row;
    color: black;
    text-shadow: none;
    width: 100%;
    text-align: left;
    padding: 10px;
  }
  .sidebar-nav li > a:hover {
    background-color: #000080;
    color: white;
    border: none;
  }
  .nav-icon { font-size: 1.2em; margin-right: 10px; margin-bottom: 0; }
  
  .main-content {
    padding: 10px 10px 50px 10px; /* Reset padding */
  }
  
  /* Mobile Start Button acts as Menu Toggle */
  .main-footer .start-button {
    z-index: 2001; /* Above sidebar */
  }
}
</style>