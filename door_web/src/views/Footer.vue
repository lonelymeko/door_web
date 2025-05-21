<template>
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
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue';
import { locales } from '../utils/locales.js';

// --- Instance and Global Properties ---
const instance = getCurrentInstance();

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

// --- Current Year ---
const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>
@import '../assets/css/main.css';
</style>
