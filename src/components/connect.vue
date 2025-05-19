<template>
<section id="nav-section" class="content-section">
    <h2 class="section-title">{{ t('navGridTitle') }}</h2>
    <div class="nav-links-grid">
        <a v-for="(link, index) in navLinks" :key="'grid-'+link.url+'-'+index" :href="link.url" target="_blank" class="nav-link-card">
            {{ link.name }}
        </a>
        <a href="#" class="nav-link-card add-link-card" @click.prevent>{{ t('addLink') }}</a>
    </div>
</section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { locales } from '/src/utils/locales.js';

const currentLanguage = ref('zh-CN');
const t = (key, replacements = {}) => {
  const lang = currentLanguage.value;
  let translation = locales[lang]?.[key] || locales['zh-CN']?.[key] || key;
  Object.keys(replacements).forEach(repKey => {
    translation = translation.replace(`{${repKey}}`, replacements[repKey]);
  });
  return translation;
};

const navLinks = computed(() => [
    { name: t('navLinkBilibili'), url: 'https://www.bilibili.com' },
    { name: t('navLinkAliyun'), url: 'https://www.aliyun.com' },
    { name: t('navLinkYuketang'), url: 'https://www.yuketang.cn' },
    { name: t('navLinkDeepseek'), url: 'https://www.deepseek.com' }
]);
</script>

<style scoped>
@import '../assets/css/main.css';
</style>