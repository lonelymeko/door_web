<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
// ... (keep existing imports and typewriter setup) ...

// --- State Adjustments ---

// Define sidebar navigation items
const navItems = ref([
  // Main Section
  { title: '搜索', icon: '🔍', link: '#search-section', internal: true, section: 'main' },
  { title: '网站导航', icon: '🌐', link: '#nav-section', internal: true, section: 'main' }, // Links to the grid below
  { title: 'AI 聊天', icon: '💬', link: '#chat-section', internal: true, section: 'main' }, // Placeholder
  { title: '今日热搜', icon: '🔥', link: '#hotsearch-section', internal: true, section: 'main' }, // Links to hot tags
  // Extras Section
  { title: '个人博客', icon: '✍️', link: '/blog', internal: true, section: 'extras' }, // Internal Vue Route
  { title: '玺朽的砂糖', icon: '💖', link: '/love', internal: true, section: 'extras' }, // Internal Vue Route, moved here
  { title: '新闻资讯', icon: '📰', link: '#news-section', internal: true, section: 'extras' }, // Placeholder
  // User Section
  { title: '赞助我', icon: '💰', link: '#', internal: true, click: () => { showSponsor.value = true }, section: 'user' }
]);

// Define links for the main content navigation grid (mostly external)
const navLinks = ref([
    { name: 'Bilibili', url: 'https://www.bilibili.com' },
    { name: '阿里云ECS', url: 'https://ecs.console.aliyun.com/' },
    { name: '雨课堂', url: 'https://www.yuketang.cn/v2/web/index' },
    { name: 'Deepseek Chat', url: 'https://chat.deepseek.com/' },
    { name: 'MOJI辞書', url: 'https://www.mojidict.com/' },
    // Add others if needed
]);


// --- Search Engine Config ---
const engines = [
  { name: '必应', value: 'bing', url: 'https://www.bing.com/search?q=' },
  { name: '百度', value: 'baidu', url: 'https://www.baidu.com/s?wd=' },
  { name: '搜狗', value: 'sogou', url: 'https://www.sogou.com/web?query=' }
];
const selectedEngine = ref(engines[0]);
const searchQuery = ref('');

// --- Other State ---
const showSponsor = ref(false);
const hotSearchList = ref(['Vue 3', 'Tailwind CSS', '天气 API', 'DeepSeek', '大模型', '备案流程', 'JavaScript']);
const currentYear = new Date().getFullYear();
const weatherInfo = ref("☀️ 晴朗 25°C");
const calendarInfo = ref(new Date().toLocaleDateString('zh-CN'));
const newsHeadlines = ref([
    { id: 1, title: "科技巨头发布新款 AI 芯片" },
    { id: 2, title: "国内新能源汽车销量再创新高" },
    { id: 3, title: "某地探索数字人民币应用新场景" },
]);

// --- Typewriter State & Logic (Keep as is) ---
const quotes = [
  "玺朽的导航 - 发现互联网的精彩。",
  "学无止境，探索不息。",
  "代码改变世界，导航连接未来。",
  "保持好奇，永远学习。"
];
const currentQuoteIndex = ref(0);
const displayedTitle = ref('');
const typingSpeed = 100;
const pauseBetweenQuotes = 2000;
let typingInterval = null;
let charIndex = 0;
let isDeleting = false;

const typeWriterEffect = () => {
    // ... (typewriter logic remains the same) ...
      const currentQuote = quotes[currentQuoteIndex.value];
      if (!currentQuote) return; // Guard against issues

      clearTimeout(typingInterval); // Clear previous timeout

      if (isDeleting) {
        displayedTitle.value = currentQuote.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex <= 0) {
          isDeleting = false;
          charIndex = 0; // Reset charIndex
          currentQuoteIndex.value = (currentQuoteIndex.value + 1) % quotes.length;
          typingInterval = setTimeout(typeWriterEffect, typingSpeed * 5); // Pause before next
        } else {
          typingInterval = setTimeout(typeWriterEffect, typingSpeed / 2); // Faster deleting
        }
      } else {
        displayedTitle.value = currentQuote.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex >= currentQuote.length) {
          isDeleting = true;
          typingInterval = setTimeout(typeWriterEffect, pauseBetweenQuotes); // Pause at end
        } else {
          typingInterval = setTimeout(typeWriterEffect, typingSpeed); // Continue typing
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
  navItems.value.forEach(item => {
    if (groups[item.section]) {
      groups[item.section].push(item);
    } else {
      groups.main.push(item); // Default group if section mismatch
    }
  });
  return groups;
});


onMounted(() => {
  clearTimeout(typingInterval); // Ensure clean start
  typeWriterEffect();
});

onBeforeUnmount(() => {
  clearTimeout(typingInterval); // Cleanup
});

</script>

<template>
  <div class="page-container">
    <!-- Left Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo">玺朽</span>
      </div>
      <nav class="sidebar-nav">
        <!-- Main Navigation Section -->
        <ul class="nav-group">
           <li v-for="(item, index) in groupedNavItems.main" :key="'main-'+index" :class="{ active: false }">
             <!-- Use router-link for internal Vue routes starting with '/' -->
             <router-link v-if="item.internal && item.link.startsWith('/')" :to="item.link">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-text">{{ item.title }}</span>
             </router-link>
             <!-- Use <a> for section links (#) or links with click handlers -->
             <a v-else :href="item.link" @click.prevent="item.click ? item.click() : null" :target="item.link.startsWith('http') ? '_blank' : '_self'">
               <span class="nav-icon">{{ item.icon }}</span>
               <span class="nav-text">{{ item.title }}</span>
             </a>
           </li>
        </ul>
        <div class="nav-separator"></div>
         <!-- Extras Navigation Section -->
         <ul class="nav-group">
           <li v-for="(item, index) in groupedNavItems.extras" :key="'extras-'+index" :class="{ active: false }">
              <router-link v-if="item.internal && item.link.startsWith('/')" :to="item.link">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-text">{{ item.title }}</span>
             </router-link>
             <a v-else :href="item.link" @click.prevent="item.click ? item.click() : null" :target="item.link.startsWith('http') ? '_blank' : '_self'">
               <span class="nav-icon">{{ item.icon }}</span>
               <span class="nav-text">{{ item.title }}</span>
             </a>
           </li>
         </ul>
         <div class="nav-separator"></div>
         <!-- User/Settings Section -->
         <ul class="nav-group">
           <li v-for="(item, index) in groupedNavItems.user" :key="'user-'+index" :class="{ active: false }">
             <!-- Sponsor link is handled by click, href='#' prevents navigation -->
             <a :href="item.link" @click.prevent="item.click ? item.click() : null">
               <span class="nav-icon">{{ item.icon }}</span>
               <span class="nav-text">{{ item.title }}</span>
             </a>
           </li>
         </ul>
      </nav>
      <div class="sidebar-footer">
        v1.0.2 <!-- Updated version placeholder -->
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Top Bar (remains the same) -->
       <header class="top-bar">
            <div class="top-bar-left">
               <span class="top-bar-item">应用中心</span>
               <span class="top-bar-item">能力测验</span>
               <span class="top-bar-item">网页插件</span>
            </div>
            <div class="top-bar-right">
              <span class="top-bar-item weather-widget">
                 {{ weatherInfo }}
               </span>
               <span class="top-bar-item calendar-widget">
                 📅 {{ calendarInfo }}
               </span>
               <span class="top-bar-item">打卡</span>
               <span class="top-bar-item buy-item">购买 Pro</span>
            </div>
      </header>

      <!-- Content Body -->
      <div class="content-body">
        <!-- Title with Typewriter Effect (remains the same) -->
        <h1 class="main-title">
          {{ displayedTitle }}<span class="cursor">|</span>
        </h1>

        <!-- Search Section (remains the same) -->
        <section id="search-section" class="content-section search-section">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                 <select v-model="selectedEngine" class="search-select">
                    <option v-for="engine in engines" :key="engine.value" :value="engine">
                      {{ engine.name }}
                    </option>
                  </select>
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="查询单词或文本..."
                  @keyup.enter="performSearch"
                  class="search-input"
                />
                <button @click="performSearch" class="search-button">搜索</button>
              </div>
               <div class="language-switch">语言切换: 简体中文 | English</div>
        </section>

        <!-- Hot Search Section (remains the same) -->
        <section id="hotsearch-section" class="content-section hot-search-section">
           <h2 class="section-title">实时热搜</h2>
           <div class="hot-search-tags">
             <span v-for="(term, index) in hotSearchList" :key="index" class="hot-tag">
               {{ term }}
             </span>
           </div>
        </section>

         <!-- Navigation Links Section -->
        <section id="nav-section" class="content-section">
           <h2 class="section-title">常用网站导航</h2>
           <div class="nav-links-grid">
               <!-- RENDER EXTERNAL/GRID LINKS HERE -->
               <a v-for="(link, index) in navLinks" :key="'grid-'+index" :href="link.url" target="_blank" class="nav-link-card">
                   {{ link.name }}
               </a>
               <a href="#" class="nav-link-card add-link-card">+ 添加</a>
           </div>
        </section>

        <!-- AI Chat Placeholder Section (remains the same) -->
        <section id="chat-section" class="content-section ai-chat-placeholder">
          <h2 class="section-title">Deepseek AI 聊天</h2>
          <div class="chat-interface">
            <div class="chat-messages">
              <p>AI: 你好！有什么可以帮你的吗？</p>
            </div>
            <div class="chat-input-area">
              <input type="text" placeholder="输入你的问题..." />
              <button>发送</button>
            </div>
          </div>
        </section>

        <!-- News Feed Placeholder Section -->
        <section id="news-section" class="content-section news-feed-placeholder">
           <h2 class="section-title">今日头条 <a href="#" class="view-more">查看更多 ></a></h2>
          <ul class="news-list">
            <li v-for="item in newsHeadlines" :key="item.id">
               <a href="#">{{ item.title }}</a>
            </li>
          </ul>
        </section>

      </div>

       <!-- Footer (remains the same) -->
       <footer class="main-footer">
          <span>© {{ currentYear }} 玺朽导航 版权所有</span>
          <span class="separator">|</span>
          <a href="#">联系我们</a>
          <span class="separator">|</span>
          <a href="#">隐私声明</a>
          <span class="separator">|</span>
          <!-- IMPORTANT: Replace with your actual ICP备案号 -->
          <a href="https://beian.miit.gov.cn/" target="_blank">粤ICP备XXXXXXXX号-Y</a>
          <span class="separator">|</span>
           <!-- IMPORTANT: Replace with your actual 公安备案号 -->
          <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=XXXXXXXXXXXXXX" target="_blank">
              <img src="/img/gongan.png" alt="公安备案" style="height: 14px; vertical-align: middle; margin-right: 5px;"> <!-- Ensure gongan.png is in public folder -->
              粤公网安备 XXXXXXXXXXXXXX号
          </a>
        </footer>
    </main>

    <!-- Sponsor Modal (remains the same) -->
    <div class="sponsor-modal" v-if="showSponsor">
       <!-- ... modal content ... -->
        <div class="modal-content">
         <p style="text-align: center; font-weight: bold;">感谢您的支持！</p>
        <div style="display: flex; gap: 20px; justify-content: center;">
            <img src="/img/alipay.jpg" alt="支付宝" style="width: 200px; height: auto; border: 1px solid #eee;">
            <img src="/img/weixin.jpg" alt="微信" style="width: 200px; height: auto; border: 1px solid #eee;">
        </div>
        <button @click="showSponsor = false" class="close-modal-button">关闭</button>
      </div>
    </div>

  </div>
</template>

<!-- CSS <style scoped> remains the same as the previous version -->
<style scoped>
/* Basic Reset & Font */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body { /* Apply to html too for full height */
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa; /* Light background for the page */
  color: #333;
}

.page-container {
  display: flex;
  min-height: 100vh;
}

/* Sidebar Styles */
.sidebar {
  width: 240px;
  background-color: #ffffff; /* White sidebar */
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  height: 60px; /* Match top-bar height */
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  font-size: 1.5em;
  font-weight: bold;
  color: #e63946; /* Accent color */
}

.sidebar-nav {
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px 0;
}

.nav-group {
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0; /* Space below group */
}

.nav-separator {
    height: 1px;
    background-color: #e0e0e0;
    margin: 10px 20px;
}

/* Style for both router-link and a tags in sidebar */
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
  cursor: pointer; /* Ensure pointer for all */
}

.sidebar-nav li > a:hover,
.sidebar-nav li > router-link:hover {
  background-color: #f1f3f5; /* Light hover */
  color: #e63946;
}

/* Active class might be automatically added by Vue Router for router-link */
.sidebar-nav li.active > a,
.sidebar-nav li > .router-link-active, /* Default Vue Router active class */
.sidebar-nav li > .router-link-exact-active { /* Default Vue Router exact active class */
  background-color: #e63946; /* Accent color for active */
  color: #ffffff !important; /* Ensure text is white */
}

/* Ensure icons inside active links are also white */
.sidebar-nav li.active > a .nav-icon,
.sidebar-nav li > .router-link-active .nav-icon,
.sidebar-nav li > .router-link-exact-active .nav-icon {
    color: #ffffff;
}
.sidebar-nav li.active > a .nav-text,
.sidebar-nav li > .router-link-active .nav-text,
.sidebar-nav li > .router-link-exact-active .nav-text {
    color: #ffffff;
}

.nav-icon {
  margin-right: 15px;
  font-size: 1.1em;
  width: 20px; /* Ensure alignment */
  text-align: center;
  color: #888; /* Default icon color */
  transition: color 0.2s ease; /* Smooth transition */
}

.nav-text {
  font-size: 0.95em;
}

.sidebar-footer {
  padding: 15px 20px;
  font-size: 0.8em;
  color: #aaa;
  text-align: center;
  border-top: 1px solid #e0e0e0;
}

/* Main Content Styles */
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa; /* Match page background */
  max-height: 100vh; /* Limit height to viewport */
  overflow: hidden; /* Hide main scrollbar if content scrolls */
}

/* Top Bar Styles */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px; /* Adjust padding */
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  height: 60px; /* Fixed height */
  flex-shrink: 0; /* Prevent shrinking */
}

.top-bar-left, .top-bar-right {
  display: flex;
  align-items: center;
  gap: 20px; /* Spacing between items */
}

.top-bar-item {
  font-size: 0.9em;
  color: #555;
  cursor: pointer;
  transition: color 0.2s ease;
  white-space: nowrap; /* Prevent wrapping */
}
.top-bar-item:hover {
    color: #e63946;
}

.buy-item {
    color: #e63946;
    font-weight: 500;
    background-color: #fee; /* Light red background */
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

/* Content Body Styles */
.content-body {
  flex-grow: 1;
  padding: 30px;
  overflow-y: auto; /* Enable scrolling for content only */
}

.main-title {
  font-size: 2.2em;
  font-weight: 500;
  color: #333;
  margin-bottom: 30px;
  min-height: 40px; /* Ensure space for text */
  font-family: 'Courier New', Courier, monospace; /* Monospace for typewriter */
  position: relative; /* Needed for cursor */
}

.cursor {
  /* display: inline-block; */
  /* margin-left: 2px; */
  animation: blink 0.7s infinite;
  font-weight: bold;
  position: absolute; /* Position relative to title */
  bottom: 5px; /* Adjust vertical position */
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

/* Search Section Specific */
.search-section .search-box {
  display: flex;
  align-items: center;
  border: 1px solid #ced4da;
  border-radius: 25px; /* More rounded */
  padding: 5px 10px 5px 15px;
  background-color: #fff;
  margin-bottom: 15px;
  max-width: 700px; /* Limit width */
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.search-section .search-icon {
    font-size: 1.2em;
    color: #888;
    margin-right: 10px;
}
.search-section .search-select {
    border: none;
    background: transparent;
    padding: 8px 5px;
    margin-right: 5px;
    color: #555;
    font-size: 0.9em;
    cursor: pointer;
    outline: none;
    border-right: 1px solid #eee; /* Separator */
}
.search-section .search-select:focus {
    outline: none;
}

.search-section .search-input {
  flex-grow: 1;
  border: none;
  outline: none;
  padding: 10px;
  font-size: 1em;
  background: transparent;
}

.search-section .search-button {
  padding: 8px 20px;
  background: #e63946; /* Accent color */
  color: white;
  border: none;
  border-radius: 20px; /* Rounded button */
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}

.search-section .search-button:hover {
  background: #d62828; /* Darker shade */
}

.language-switch {
    text-align: center;
    font-size: 0.9em;
    color: #777;
    margin-top: 10px;
}

/* Hot Search Specific */
.hot-search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hot-tag {
  background-color: #f1f3f5;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.9em;
  color: #555;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.hot-tag:hover {
  background-color: #e63946;
  color: #fff;
}

/* Navigation Links Specific */
.nav-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); /* Slightly wider */
    gap: 15px;
}

.nav-link-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;
    text-align: center;
    text-decoration: none;
    color: #333;
    font-size: 0.95em;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    font-weight: 500;
}

.nav-link-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    color: #e63946;
    border-color: #e63946;
}

.add-link-card {
    color: #adb5bd;
    border-style: dashed;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: normal;
}
.add-link-card:hover {
    color: #e63946;
    border-color: #e63946;
    border-style: dashed; /* Keep dashed on hover */
}


/* AI Chat Placeholder Specific */
.ai-chat-placeholder .chat-interface {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  height: 300px; /* Example height */
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #f8f9fa; /* Light background for messages */
}
.chat-messages p {
    margin-bottom: 10px;
    font-size: 0.9em;
    line-height: 1.5;
}

.chat-input-area {
  display: flex;
  border-top: 1px solid #e0e0e0;
  padding: 10px;
  background-color: #fff; /* White input area */
}

.chat-input-area input {
  flex-grow: 1;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px 10px;
  margin-right: 10px;
  outline: none;
}
.chat-input-area input:focus {
    border-color: #e63946;
    box-shadow: 0 0 0 2px rgba(230, 57, 70, 0.2);
}

.chat-input-area button {
    padding: 8px 15px;
    background: #e63946;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}
.chat-input-area button:hover {
    background: #d62828;
}


/* News Feed Placeholder Specific */
.news-feed-placeholder .news-list {
  list-style: none;
  padding: 0;
}

.news-list li {
  padding: 8px 0;
  border-bottom: 1px dashed #eee; /* Dashed separator */
}
.news-list li:last-child {
    border-bottom: none;
}

.news-list li a {
  text-decoration: none;
  color: #337ab7;
  font-size: 0.95em;
}

.news-list li a:hover {
  text-decoration: underline;
  color: #e63946;
}

/* Footer Styles */
.main-footer {
  padding: 15px 30px;
  text-align: center;
  font-size: 0.85em;
  color: #888;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0; /* Prevent shrinking */
  line-height: 1.6;
}

.main-footer a {
    color: #666;
    text-decoration: none;
    margin: 0 3px; /* Add small margin around links */
}
.main-footer a:hover {
    color: #e63946;
    text-decoration: underline;
}

.main-footer .separator {
    margin: 0 5px; /* Adjust separator margin */
    color: #ccc;
}

/* Sponsor Modal Styles (Basic) */
.sponsor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.close-modal-button {
    padding: 10px 20px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    align-self: center; /* Center button */
    margin-top: 10px;
    transition: background-color 0.2s ease;
}
.close-modal-button:hover {
    background: #5a6268;
}

</style>