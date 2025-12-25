<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  navLinks: Array,
  t: Function,
  engines: Array,
  selectedEngineValue: String,
  searchQuery: String
});

const emit = defineEmits([
  'close', 
  'open-window', 
  'open-web-window', 
  'show-add-link', 
  'change-language', 
  'update:selectedEngineValue', 
  'update:searchQuery', 
  'perform-search'
]);

const navSubmenuOpen = ref(false);
const langSubmenuOpen = ref(false);

const handleNavSubmenuLeave = () => {
    navSubmenuOpen.value = false;
};

const localSelectedEngineValue = computed({
  get: () => props.selectedEngineValue,
  set: (val) => emit('update:selectedEngineValue', val)
});

const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (val) => emit('update:searchQuery', val)
});

const performSearch = () => {
  emit('perform-search');
};

const openWindow = (id) => emit('open-window', id);
const openWebWindow = (name, url) => emit('open-web-window', name, url);
const showAddLinkModal = () => emit('show-add-link');
const changeLanguage = (lang) => emit('change-language', lang);

</script>

<template>
  <div v-if="isOpen" class="start-menu">
      <div class="start-menu-sidebar">
          <span class="vertical-text">Windows<span style="font-weight: bold;">95</span></span>
      </div>
      <div class="start-menu-items">
           <div class="start-item" @click="openWindow('notepad')">
              <span class="start-item-icon">📝</span>
              <span class="start-item-text">Notepad</span>
          </div>
           <div class="start-item" @click="openWindow('paint')">
              <span class="start-item-icon">🎨</span>
              <span class="start-item-text">Paint</span>
          </div>
           <div class="start-divider"></div>

          <!-- Search Component in Start Menu -->
           <div class="start-menu-section">
               <div class="search-box start-menu-search">
                   <select v-model="localSelectedEngineValue" class="search-select">
                      <option v-for="engine in engines" :key="engine.value" :value="engine.value">
                        {{ engine.name }}
                      </option>
                    </select>
                  <input type="text" v-model="localSearchQuery" :placeholder="t('searchPlaceholder')" @keyup.enter="performSearch" class="search-input" />
                  <button @click="performSearch" class="search-button">Go</button>
                </div>
           </div>
           <div class="start-divider"></div>

           <!-- Nav Links Submenu Trigger -->
           <div class="start-item" @mouseenter="navSubmenuOpen = true" @mouseleave="handleNavSubmenuLeave" style="position: relative;">
              <span class="start-item-icon">🌐</span>
              <span class="start-item-text">{{ t('navGridTitle') }}</span>
              <span class="submenu-arrow">▶</span>

              <!-- Navigation Submenu -->
              <div v-if="navSubmenuOpen" class="start-submenu" style="bottom: 0; left: 100%;">
                   <div v-for="(link, index) in navLinks" :key="'start-nav-'+index" class="start-item submenu-item" @click.stop="openWebWindow(link.name, link.url); emit('close')">
                       <span class="start-item-icon">🔗</span>
                       <span class="start-item-text">{{ link.name }}</span>
                   </div>
                   <div class="start-divider"></div>
                   <div class="start-item submenu-item" @click.stop="showAddLinkModal(); emit('close')">
                       <span class="start-item-icon">➕</span>
                       <span class="start-item-text">{{ t('addLink') }}</span>
                   </div>
              </div>
          </div>
           
           <!-- Add Link (Restored to main menu for visibility) -->
           <div class="start-item" @click="showAddLinkModal(); emit('close')">
               <span class="start-item-icon">➕</span>
               <span class="start-item-text">{{ t('addLink') }}</span>
           </div>

           <div class="start-divider"></div>

           <!-- Language Submenu Trigger -->
           <div class="start-item" @mouseenter="langSubmenuOpen = true" @mouseleave="langSubmenuOpen = false" style="position: relative;">
              <span class="start-item-icon">🌐</span>
              <span class="start-item-text">{{ t('languageSwitch') }}</span>
              <span class="submenu-arrow">▶</span>

              <!-- Language Submenu -->
              <div v-if="langSubmenuOpen" class="start-submenu" style="top: -4px; left: 100%;">
                   <div class="start-item submenu-item" @click.stop="changeLanguage('zh-CN'); emit('close')">
                       <span class="start-item-text">简体中文</span>
                   </div>
                   <div class="start-item submenu-item" @click.stop="changeLanguage('en-US'); emit('close')">
                       <span class="start-item-text">English</span>
                   </div>
                   <div class="start-item submenu-item" @click.stop="changeLanguage('ja-JP'); emit('close')">
                       <span class="start-item-text">日本語</span>
                   </div>
              </div>
          </div>

           <div class="start-divider"></div>

           <div class="start-item" @click="openWindow('chat')">
              <span class="start-item-icon">🐱</span>
              <span class="start-item-text">{{ t('aiChatTitle') }}</span>
          </div>
      </div>
  </div>
</template>

<style scoped>
/* Start Menu */
.start-menu {
    position: absolute;
    bottom: 28px;
    left: 2px;
    width: 350px; /* Increased width for search box */
    height: auto;
    min-height: 300px; /* Increased height */
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    display: flex;
    z-index: 10000;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
}
.start-menu-sidebar {
    width: 28px;
    background: linear-gradient(to bottom, #000080, #1084d7);
    color: #ffffff;
    display: flex;
    align-items: flex-end;
    padding-bottom: 10px;
    overflow: hidden;
}
.vertical-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 20px;
    font-weight: bold;
    white-space: nowrap;
    padding-left: 4px;
    letter-spacing: 2px;
}
.start-menu-items {
    flex: 1;
    padding: 2px;
    overflow: visible; /* Allow submenu to overflow */
    position: relative;
}
.start-menu-section {
    padding: 2px;
}
.start-menu-search {
    margin-bottom: 5px;
    width: 100%;
    box-sizing: border-box;
}
.start-item {
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: black;
}
.start-item:hover {
    background-color: #000080;
    color: white;
}
.start-item:hover .submenu-arrow {
    color: white;
}
.start-divider {
    height: 1px;
    background-color: #808080;
    border-bottom: 1px solid #fff;
    margin: 4px 2px;
}

/* Navigation Submenu */
.start-submenu {
    position: absolute;
    left: 100%;
    /* top: 0; Removed to allow bottom positioning override */
    width: 200px;
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    padding: 2px;
    max-height: 400px;
    overflow-y: auto;
    overscroll-behavior: contain; /* Prevent parent scrolling */
}

/* Custom Scrollbar for Submenu (Win95 Style) */
.start-submenu::-webkit-scrollbar {
    width: 16px;
    background: #ffffff; /* Track background */
}
.start-submenu::-webkit-scrollbar-track {
    background: #dfdfdf; /* Dotted pattern simulation usually, plain grey here */
}
.start-submenu::-webkit-scrollbar-thumb {
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
}
.start-submenu::-webkit-scrollbar-button {
    display: block;
    width: 16px;
    height: 16px;
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
}

.submenu-item {
    padding: 5px 10px;
}
.submenu-arrow {
    margin-left: auto;
    font-size: 10px;
}

.search-box {
  display: flex;
  align-items: center;
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
  padding: 2px;
  background-color: #fff;
  margin-bottom: 10px;
}
.search-select { border: none; background: transparent; outline: none; }
.search-input { flex: 1; border: none; outline: none; padding: 5px; }
.search-button {
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    cursor: pointer;
    padding: 2px 10px;
}
.search-button:active {
    border-top: 2px solid #000;
    border-left: 2px solid #000;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
}
</style>
