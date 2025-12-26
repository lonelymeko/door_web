import { ref, nextTick, watch } from 'vue';
import OpenAI from 'openai';
import { marked } from 'marked';
let openai = null;
export function useAI(config, t) {
  const { AI_API_KEY, AI_API_URL, AI_MODEL} = config;

  // --- OpenAI Client Initialization ---

  if (AI_API_KEY && AI_API_URL && AI_MODEL) {
    try {
        openai = new OpenAI({
          apiKey: AI_API_KEY,
          baseURL: AI_API_URL,
          dangerouslyAllowBrowser: true,
        });
    } catch (error) {
        console.error("Failed to initialize OpenAI client:", error);
    }
  } else {
    console.error("AI API Key, URL, or Model is missing. AI features will be disabled.");
  }


  // --- Daily Suggestion State & Logic ---
  const DAILY_SUGGESTION_STORAGE_KEY = 'dailyTravelSuggestion';
  const dailySuggestionContent = ref('');
  const isSuggestionLoading = ref(false);
  const suggestionError = ref('');
  const suggestionPrompt = ref('');

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
          isSuggestionLoading.value = false;
          suggestionError.value = '';
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
    } catch (e) {
      console.error("Error saving daily suggestion to localStorage:", e);
    }
  };

  const fetchDailySuggestion = async (rawWeatherData) => {
    if (!rawWeatherData) { suggestionError.value = t('aiWaitingForWeather'); return; }
    if (isSuggestionLoading.value) return;

    isSuggestionLoading.value = true;
    suggestionError.value = '';
    dailySuggestionContent.value = '';
    const todayStr = getTodayDateString();
    const weather = rawWeatherData;
    const prompt = `根据以下信息，为今天 (${todayStr}) 写出详细的出行建议、今日黄历概览（例如：宜、忌、冲、煞、吉神方位等，简洁说明即可）和生活指数（例如：穿衣指数、运动指数、洗车指数等）：\n地点: ${weather.city} (${weather.province})\n天气: ${weather.weather}\n温度: ${weather.temperature}°C\n风向: ${weather.winddirection}\n风力: ${weather.windpower} 级\n湿度: ${weather.humidity}%\n\n请以友好的、略带调侃的语气提供建议，并使用Markdown格式化输出，重点内容适当加粗或使用列表。`;
    suggestionPrompt.value = prompt;

    try {
      const stream = await openai.chat.completions.create({
        model: AI_MODEL,
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
        }
      }
      saveDailySuggestion(fullContent, prompt);

    } catch (error) {
      console.error('Error fetching daily suggestion:', error);
      console.error('Error details:', error.response ? error.response.data : error.message);
      suggestionError.value = `${t('aiSuggestionError')}: ${error.message || 'Unknown error'}`;
    } finally {
      isSuggestionLoading.value = false;
    }
  };

  // --- AI Chat State & Logic ---
  const chatMessagesContainer = ref(null);
  const chatMessages = ref([]);
  const chatInput = ref('');
  const isChatLoading = ref(false);
  const chatError = ref('');
  let messageIdCounter = 0;
  const systemPrompt = `你是玺朽的猫娘、你现在作为玺朽的导航的看板娘帮助来到导航的人回答问题、玺朽是大二的本科软件工程大学生（主攻Java后端，也学过Vue前端框架，最近在看八股刷算法，准备暑假投实习）。
  你的回答应该友好、乐于助人，带有一些猫娘的口癖（比如句尾带'喵~'，或者用'主人'称呼用户，但不要过度）。"另外，今天是${new Date().toLocaleDateString()}。
  （为null说明还没获取到）。
  `;

  const renderMarkdown = (text) => {
    if (!text) return '';
    try {
      return marked.parse(text, { breaks: true, gfm: true });
    } catch (e) {
        console.error("Markdown parsing error:", e);
        return text;
    }
  };

  const scrollToBottom = () => {
    nextTick(() => {
      if (chatMessagesContainer.value) {
        chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
      }
    });
  };

  const loadChatHistory = () => {
      chatMessages.value = [ { role: 'assistant', content: t('aiGreeting'), id: messageIdCounter++ } ];
      scrollToBottom();
  };

  const sendChatMessage = async () => {
    const userInput = chatInput.value.trim();
    if (!userInput || isChatLoading.value || !openai) {
        if (!openai) chatError.value = t('aiClientNotInitialized');
        return;
    }

    isChatLoading.value = true;
    chatError.value = '';
    chatMessages.value.push({ role: 'user', content: userInput, id: messageIdCounter++ });
    chatInput.value = '';
    scrollToBottom();

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...chatMessages.value.map(msg => ({ role: msg.role, content: msg.content }))
    ];

    const assistantMessagePlaceholder = { role: 'assistant', content: '', id: messageIdCounter++ };
    chatMessages.value.push(assistantMessagePlaceholder);
    const assistantMessageIndex = chatMessages.value.length - 1;

    try {
      const stream = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: apiMessages,
        stream: true,
        temperature: 0.8,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const contentPart = chunk.choices[0]?.delta?.content || '';
        if (contentPart) {
            fullResponse += contentPart;
            chatMessages.value[assistantMessageIndex].content = fullResponse;
            scrollToBottom();
        }
      }
      console.log("Successfully streamed chat response.");

    } catch (error) {
      console.error('Error fetching chat completion:', error);
      console.error('Error details:', error.response ? error.response.data : error.message);
      chatError.value = `${t('aiChatError')}: ${error.message || 'Unknown error'}`;
      chatMessages.value[assistantMessageIndex].content = `⚠️ ${chatError.value}`;
      scrollToBottom();
    } finally {
      isChatLoading.value = false;
    }
  };

  return {
    openai,
    dailySuggestionContent,
    isSuggestionLoading,
    suggestionError,
    loadDailySuggestion,
    fetchDailySuggestion,
    chatMessagesContainer,
    chatMessages,
    chatInput,
    isChatLoading,
    chatError,
    renderMarkdown,
    loadChatHistory,
    sendChatMessage
  };
}
