<template>
  <div class="notepad-container">
    <textarea class="notepad-textarea" v-model="content" spellcheck="false"></textarea>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  initialContent: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['save']);

const content = ref(`Welcome to Windows 95!

This is a classic Notepad application interface.

Features:
• Simple text editing
• Classic menu bar
• Retro aesthetics
• Nostalgic experience
`);

// Handle Ctrl+S
const handleKeydown = (e) => {
  if (!props.isActive) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    emit('save', content.value);
  }
};

onMounted(() => {
  if (props.initialContent) {
    content.value = props.initialContent;
  }
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.notepad-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.notepad-textarea {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 5px;
  background: #ffffff;
  color: #000000;
  line-height: 1.5;
  box-sizing: border-box;
}
</style>
