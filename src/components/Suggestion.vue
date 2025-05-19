<template>
  <section id="daily-suggestion-section" class="content-section daily-suggestion-section">
    <h2 class="section-title">{{ t('dailySuggestionTitle') }}</h2>
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
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import { marked } from 'marked';
import { locales } from '/src/utils/locales.js';

const props = defineProps({
  rawWeatherData: {
    type: Object,
    required: true
  },
  geolocationStatus: {
    type: String,
    required: true
  },
  currentLanguage: {
    type: String,
    required: true
  },
  openai: {
    type: Object,
    required: true
  },
  AI_MODEL: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:suggestion']);

// --- Daily Suggestion State & Logic ---
const DAILY_SUGGESTION_STORAGE_KEY = 'dailyTravelSuggestion';
const dailySuggestionContent = ref('');
const isSuggestionLoading = ref(false);
const suggestionError = ref('');
const suggestionPrompt = ref('');

const t = (key, replacements = {}) => {
  const lang = props.currentLanguage;
  let translation = locales[lang]?.[key] || locales['zh-CN']?.[key] || key;
  Object.keys(replacements).forEach(repKey => {
    translation = translation.replace(`{${repKey}}`, replacements[repKey]);
  });
  return translation;
};

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
        emit('update:suggestion', {
          content: dailySuggestionContent.value,
          loading: isSuggestionLoading.value,
          error: suggestionError.value
        });
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
  if (!props.openai) { 
    suggestionError.value = t('aiClientNotInitialized'); 
    emit('update:suggestion', {
      content: dailySuggestionContent.value,
      loading: isSuggestionLoading.value,
      error: suggestionError.value
    });
    return; 
  }
  if (!props.rawWeatherData) { 
    suggestionError.value = t('aiWaitingForWeather'); 
    emit('update:suggestion', {
      content: dailySuggestionContent.value,
      loading: isSuggestionLoading.value,
      error: suggestionError.value
    });
    return; 
  }
  if (isSuggestionLoading.value) return;

  isSuggestionLoading.value = true;
  suggestionError.value = '';
  dailySuggestionContent.value = '';
  emit('update:suggestion', {
    content: dailySuggestionContent.value,
    loading: isSuggestionLoading.value,
    error: suggestionError.value
  });

  const todayStr = getTodayDateString();
  const weather = props.rawWeatherData;
  const prompt = `根据以下信息，为今天 (${todayStr}) 写出详细的出行建议、今日黄历概览（例如：宜、忌、冲、煞、吉神方位等，简洁说明即可）和生活指数（例如：穿衣指数、运动指数、洗车指数等）：\n地点: ${weather.city} (${weather.province})\n天气: ${weather.weather}\n温度: ${weather.temperature}°C\n风向: ${weather.winddirection}\n风力: ${weather.windpower} 级\n湿度: ${weather.humidity}%\n\n请以友好的、略带调侃的语气提供建议，并使用Markdown格式化输出，重点内容适当加粗或使用列表。`;
  suggestionPrompt.value = prompt;

  try {
    const stream = await props.openai.chat.completions.create({
      model: props.AI_MODEL,
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
        emit('update:suggestion', {
          content: dailySuggestionContent.value,
          loading: isSuggestionLoading.value,
          error: suggestionError.value
        });
      }
    }
    saveDailySuggestion(fullContent, prompt);
    console.log("Successfully fetched and streamed daily suggestion.");

  } catch (error) {
    console.error('Error fetching daily suggestion:', error);
    suggestionError.value = `${t('aiSuggestionError')}: ${error.message || 'Unknown error'}`;
    emit('update:suggestion', {
      content: dailySuggestionContent.value,
      loading: isSuggestionLoading.value,
      error: suggestionError.value
    });
  } finally {
    isSuggestionLoading.value = false;
    emit('update:suggestion', {
      content: dailySuggestionContent.value,
      loading: isSuggestionLoading.value,
      error: suggestionError.value
    });
  }
};

const renderMarkdown = (text) => {
  if (!text) return '';
  try {
    return marked.parse(text, { breaks: true, gfm: true });
  } catch (e) {
    console.error("Markdown parsing error:", e);
    return text;
  }
};

// Watch for weather data changes
watch(() => props.rawWeatherData, (newData) => {
  if (newData) {
    console.log("Weather data updated, checking/fetching daily suggestion.");
    if (!loadDailySuggestion()) {
      fetchDailySuggestion();
    }
  } else {
    dailySuggestionContent.value = '';
    suggestionError.value = '';
    isSuggestionLoading.value = false;
    emit('update:suggestion', {
      content: dailySuggestionContent.value,
      loading: isSuggestionLoading.value,
      error: suggestionError.value
    });
  }
}, { immediate: true });

defineExpose({
  loadDailySuggestion,
  fetchDailySuggestion
});
</script>

<style scoped>
@import '../assets/css/main.css';
</style>
