<template>
<section id="chat-section" class="content-section ai-chat-section">
    <h2 class="section-title">{{ t('aiChatTitle') }}</h2>
    <div class="chat-interface">
        <div class="chat-messages" ref="chatMessagesContainer">
            <div v-for="message in chatMessages" :key="message.id"
                 class="chat-message-wrapper"
                 :class="[`message-${message.role}`]">
                <div class="chat-message-bubble" :class="[`bubble-${message.role}`]">
                    <div v-html="renderMarkdown(message.content)"></div>
                    <span v-if="message.role === 'assistant' && isChatLoading && chatMessages[chatMessages.length - 1]?.id === message.id && !message.content.includes('⚠️')" class="typing-indicator">...</span>
                </div>
            </div>
        </div>

        <div v-if="chatError" class="error-message ai-error chat-error-display">
            ⚠️ {{ chatError }}
        </div>

        <div class="chat-input-area">
            <input
                type="text"
                v-model="chatInput"
                :placeholder="t('chatInputPlaceholder')"
                :disabled="isChatLoading || !openai"
                @keyup.enter="sendChatMessage"
            />
            <button @click="sendChatMessage" :disabled="isChatLoading || !chatInput.trim() || !openai">
                {{ isChatLoading ? t('chatSendingButton') : t('chatSendButton') }}
            </button>
        </div>
        <div v-if="!openai" class="info-message ai-info">
            {{ t('aiClientNotInitialized') }}
        </div>
    </div>
</section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { marked } from 'marked';
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

// AI 聊天相关状态
const chatMessagesContainer = ref(null);
const chatMessages = ref([]);
const chatInput = ref('');
const isChatLoading = ref(false);
const chatError = ref('');
let messageIdCounter = 0;

// Markdown 渲染函数
const renderMarkdown = (text) => {
  if (!text) return '';
  try {
    return marked.parse(text, { breaks: true, gfm: true });
  } catch (e) {
    console.error("Markdown parsing error:", e);
    return text;
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
    }
  });
};

// 加载聊天历史
const loadChatHistory = () => {
    chatMessages.value = [ { role: 'assistant', content: t('aiGreeting'), id: messageIdCounter++ } ];
    scrollToBottom();
};

// 发送聊天消息
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
    chatError.value = `${t('aiChatError')}: ${error.message || 'Unknown error'}`;
    chatMessages.value[assistantMessageIndex].content = `⚠️ ${chatError.value}`;
    scrollToBottom();
  } finally {
    isChatLoading.value = false;
  }
};

// 系统提示
const systemPrompt = `你是玺朽的猫娘、你现在作为玺朽的导航的看板娘帮助来到导航的人回答问题、玺朽是大二的本科软件工程大学生（主攻Java后端，也学过Vue前端框架，最近在看八股刷算法，准备暑假投实习）。
你的回答应该友好、乐于助人，带有一些猫娘的口癖（比如句尾带'喵~'，或者用'主人'称呼用户，但不要过度）。"另外，今天是${new Date().toLocaleDateString()}。
（为null说明还没获取到）。
`;

// 生命周期钩子
onMounted(() => {
  loadChatHistory();
});
</script>

<style scoped>
@import '../assets/css/main.css';
</style>
