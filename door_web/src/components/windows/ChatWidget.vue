<script setup>
import { ref, nextTick, watch } from 'vue';

const props = defineProps({
  chatMessages: Array,
  chatError: String,
  isChatLoading: Boolean,
  openai: Object,
  t: Function,
  renderMarkdown: Function
});

const emit = defineEmits(['send-message']);

const chatInput = ref('');
const chatMessagesContainer = ref(null);

const sendChatMessage = () => {
  if (chatInput.value.trim()) {
    emit('send-message', chatInput.value);
    chatInput.value = '';
  }
};

// Watch for new messages to scroll to bottom
watch(() => props.chatMessages.length, () => {
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
    }
  });
});

// Watch for content updates (streaming) to scroll to bottom
watch(() => props.chatMessages[props.chatMessages.length - 1]?.content, () => {
    nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
    }
  });
}, { deep: true });

</script>

<template>
  <div class="win-inner-content no-padding" style="display: flex; flex-direction: column; height: 100%;">
       <div class="chat-interface" style="flex: 1; display: flex; flex-direction: column; border: none;">
          <div class="chat-messages" ref="chatMessagesContainer" style="flex: 1; overflow-y: auto; padding: 10px;">
            <div v-for="message in props.chatMessages" :key="message.id"
                 class="chat-message-wrapper"
                 :class="[`message-${message.role}`]">
                 <div class="chat-message-bubble" :class="[`bubble-${message.role}`]">
                     <div v-html="renderMarkdown(message.content)"></div>
                     <span v-if="message.role === 'assistant' && isChatLoading && props.chatMessages[props.chatMessages.length - 1]?.id === message.id && !message.content.includes('⚠️')" class="typing-indicator">...</span>
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
  </div>
</template>

<style scoped>
.win-inner-content {
    background-color: #fff;
    border: 2px solid;
    border-color: #808080 #fff #fff #808080; /* Inset border */
    padding: 15px;
    height: 100%;
    overflow-y: auto;
    color: black;
}
.win-inner-content.no-padding {
    padding: 0;
}

/* Chat Styles */
.chat-interface { background: #fff; }
.chat-message-bubble {
    padding: 8px;
    border: 1px solid #000;
    margin-bottom: 5px;
    background-color: #fff;
}
.bubble-user { background-color: #e0e0ff; }
.bubble-assistant { background-color: #ffffe0; }
.chat-input-area {
    display: flex;
    padding: 5px;
    border-top: 1px solid #ccc;
    background-color: #c0c0c0;
}
.chat-input-area input { flex: 1; margin-right: 5px; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 3px; }
.chat-input-area button {
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    cursor: pointer;
}
.chat-input-area button:active {
    border-top: 2px solid #000;
    border-left: 2px solid #000;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
}
</style>
