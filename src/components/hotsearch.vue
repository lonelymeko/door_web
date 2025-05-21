<template>
  <section id="hotsearch-section" class="content-section hot-search-section">
    <h2 class="section-title">{{ t('hotSearchTitle') }}</h2>
    <div class="hot-search-tags">
      <span v-for="(term, index) in hotSearchList" :key="index" class="hot-tag">
        {{ term }}
      </span>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { locales } from '/src/utils/locales.js';

const props = defineProps({
  currentLanguage: {
    type: String,
    required: true
  }
});

const hotSearchList = ref(['Vue 3', 'Tailwind CSS', '天气 API', 'DeepSeek', '大模型', '备案流程', 'JavaScript']);

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
