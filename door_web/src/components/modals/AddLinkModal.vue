<script setup>
import { ref } from 'vue';

const props = defineProps({
  showAddLinkModal: Boolean,
  t: Function
});

const emit = defineEmits(['close', 'add-link']);

const newLinkName = ref('');
const newLinkUrl = ref('');

const addCustomLink = () => {
  if (newLinkName.value && newLinkUrl.value) {
    emit('add-link', { name: newLinkName.value, url: newLinkUrl.value });
    newLinkName.value = '';
    newLinkUrl.value = '';
  }
};
</script>

<template>
  <div v-if="showAddLinkModal" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <h3>{{ t('addLink') }}</h3>
      <input v-model="newLinkName" :placeholder="t('linkNamePlaceholder') || '网站名称'" class="modal-input" />
      <input v-model="newLinkUrl" :placeholder="t('linkUrlPlaceholder') || '网站地址 (URL)'" class="modal-input" @keyup.enter="addCustomLink" />
      <div class="modal-actions">
        <button @click="emit('close')" class="modal-btn cancel">{{ t('cancel') || '取消' }}</button>
        <button @click="addCustomLink" class="modal-btn confirm">{{ t('confirm') || '确定' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 20000;
    display: flex; justify-content: center; align-items: center;
}
.modal-content {
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    padding: 2px;
    width: 300px;
}
.modal-content h3 {
    background: #000080; color: white; margin: 0 0 10px 0; padding: 5px; font-size: 14px;
}
.modal-input {
    width: 100%; margin-bottom: 10px;
    border: 2px solid; border-color: #808080 #fff #fff #808080;
    padding: 3px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 20px;
}

.modal-btn {
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    padding: 4px 12px; 
    cursor: pointer;
    font-family: sans-serif;
    font-size: 11px;
    min-width: 70px;
}
.modal-btn:active {
    border-top: 2px solid #000;
    border-left: 2px solid #000;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: translate(1px, 1px);
}
</style>
