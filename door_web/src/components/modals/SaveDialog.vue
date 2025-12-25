<script setup>
defineProps({
  showSaveDialog: Boolean,
  saveDialogData: Object,
  zIndexCounter: Number
});

const emit = defineEmits(['close', 'confirm-save', 'update:filename']);
</script>

<template>
  <div v-if="showSaveDialog" class="save-dialog-wrapper" :style="{ left: saveDialogData.x + 'px', top: saveDialogData.y + 'px', zIndex: zIndexCounter + 100 }">
    <div class="modal-content save-dialog window-style">
      <div class="save-dialog-header">
        <div style="display: flex; align-items: center; gap: 5px;">
           <span>⚠️</span> <span>Save As</span>
        </div>
        <button class="win-btn close" @click="emit('close')">×</button>
      </div>
      <div class="save-dialog-body">
        <div class="save-field">
          <label>File name:</label>
          <input :value="saveDialogData.filename" @input="emit('update:filename', $event.target.value)" class="modal-input" />
        </div>
        <div class="save-field">
          <label>Save as type:</label>
          <select disabled class="modal-input">
            <option>{{ saveDialogData.type === 'notepad' ? 'Text Document (*.txt)' : 'PNG Image (*.png)' }}</option>
          </select>
        </div>
        <div class="save-actions">
          <button @click="emit('confirm-save', 'desktop')" class="modal-btn win95-btn">Save to Desktop</button>
          <button @click="emit('confirm-save', 'download')" class="modal-btn win95-btn">Download</button>
          <button @click="emit('close')" class="modal-btn win95-btn cancel">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modal */
.save-dialog-wrapper {
    position: absolute;
    /* No fixed positioning, absolute relative to desktop container */
    box-shadow: 10px 10px 0 rgba(0,0,0,0.5); /* Hard shadow */
    animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
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
.save-dialog {
  width: 350px;
  display: flex;
  flex-direction: column;
  border: 2px solid #fff; /* Outer highlight */
  outline: 1px solid #000; /* Outer border */
  background: #c0c0c0;
}
.window-style {
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
}

.save-dialog-header {
  background: #000080;
  color: white;
  padding: 2px 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 12px;
}
.save-dialog-body {
  padding: 15px;
}
.save-field {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.save-field label {
  width: 80px;
  font-size: 12px;
}
.save-field .modal-input {
  flex: 1;
  margin-bottom: 0;
}
.save-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}
.win95-btn {
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
.win95-btn:active {
    border-top: 2px solid #000;
    border-left: 2px solid #000;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: translate(1px, 1px);
}

.win-btn {
  width: 16px;
  height: 14px;
  background-color: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  font-size: 10px;
  line-height: 10px;
  text-align: center;
  padding: 0;
  cursor: pointer;
  font-family: sans-serif;
  color: black;
}

.win-btn:active {
  border-top: 1px solid #000;
  border-left: 1px solid #000;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
}

.win-btn.close {
    font-size: 12px;
    line-height: 11px;
}

.modal-input {
    width: 100%; margin-bottom: 10px;
    border: 2px solid; border-color: #808080 #fff #fff #808080;
    padding: 3px;
}
</style>
