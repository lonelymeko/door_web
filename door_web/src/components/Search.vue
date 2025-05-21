<template>
  <section id="search-section" class="content-section search-section">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <select v-model="selectedEngineValue" class="search-select">
        <option v-for="engine in engines" :key="engine.value" :value="engine.value">
          {{ engine.name }}
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
    <div class="language-switch">
      {{ t('languageSwitch') }}:
      <a href="#" @click.prevent="changeLanguage('zh-CN')" :class="{ active: currentLanguage === 'zh-CN' }">简体中文</a> |
      <a href="#" @click.prevent="changeLanguage('en-US')" :class="{ active: currentLanguage === 'en-US' }">English</a> |
      <a href="#" @click.prevent="changeLanguage('ja-JP')" :class="{ active: currentLanguage === 'ja-JP' }">日本語</a>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { locales } from '/src/utils/locales.js';

const props = defineProps({
  engines: {
    type: Array,
    required: true
  },
  currentLanguage: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['change-language']);

// const selectedEngineValue = ref(props.engines[0].value);
const selectedEngineValue = null
const searchQuery = ref('');

const selectedEngine = computed(() => {
  return props.engines.find(e => e.value === selectedEngineValue.value) || props.engines[0];
});

const performSearch = () => {
  if (searchQuery.value.trim()) {
    window.open(selectedEngine.value.url + encodeURIComponent(searchQuery.value), '_blank');
  }
};

const changeLanguage = (lang) => {
  emit('change-language', lang);
};

const t = (key, replacements = {}) => {
  const lang = props.currentLanguage;
  let translation = locales[lang]?.[key] || locales['zh-CN']?.[key] || key;
  Object.keys(replacements).forEach(repKey => {
    translation = translation.replace(`{${repKey}}`, replacements[repKey]);
  });
  return translation;
};
</script>

<style scoped>
@import '../assets/css/main.css';
</style>
