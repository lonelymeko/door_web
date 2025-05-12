<template>
<section id="news-section" class="content-section news-feed-placeholder">
    <h2 class="section-title">{{ t('newsTitle') }} <a href="#" class="view-more">{{ t('viewMore') }}</a></h2>
    <ul class="news-list">
        <li v-for="item in newsHeadlines" :key="item.id">
            <a href="#">{{ item.titleKey ? t(item.titleKey) : item.title }}</a>
        </li>
    </ul>
</section>
</template>

<script setup>
import { ref } from 'vue';
import { locales } from '/src/utils/locales.js';

// 多语言处理函数
const currentLanguage = ref('zh-CN');
const t = (key, replacements = {}) => {
  const lang = currentLanguage.value;
  let translation = locales[lang]?.[key] || locales['zh-CN']?.[key] || key;
  Object.keys(replacements).forEach(repKey => {
    translation = translation.replace(`{${repKey}}`, replacements[repKey]);
  });
  return translation;
};

// 新闻数据
const newsHeadlines = ref([
    { id: 1, titleKey: 'newsItem1' },
    { id: 2, titleKey: 'newsItem2' },
    { id: 3, titleKey: 'newsItem3' },
]);
</script>

<style scoped>
@import '../assets/css/main.css';
</style>
