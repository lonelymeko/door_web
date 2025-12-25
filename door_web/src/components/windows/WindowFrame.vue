<script setup>
defineProps({
  win: Object,
  zIndexCounter: Number
});

const emit = defineEmits(['focus', 'start-drag', 'minimize', 'maximize', 'close']);
</script>

<template>
  <div class="window" 
       :class="{ minimized: win.isMinimized }"
       :style="{ left: win.x + 'px', top: win.y + 'px', width: typeof win.width === 'number' ? win.width + 'px' : win.width, height: typeof win.height === 'number' ? win.height + 'px' : win.height, zIndex: win.zIndex, display: win.isOpen && !win.isMinimized ? 'flex' : 'none' }"
       @mousedown="emit('focus', win.id)">
    
    <div class="window-title-bar" @mousedown="emit('start-drag', $event, win.id)">
      <div class="title-text">{{ win.title }}</div>
      <div class="window-controls">
        <button class="win-btn minimize" @click.stop="emit('minimize', win.id)">_</button>
        <button class="win-btn maximize" @click.stop="emit('maximize', win)">□</button>
        <button class="win-btn close" @click.stop="emit('close', win.id)">×</button>
      </div>
    </div>

    <div class="window-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
/* Window Styles */
.window {
  position: absolute;
  background-color: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  user-select: none;
}

.window-title-bar {
  background: linear-gradient(90deg, #000080, #1084d0);
  padding: 3px 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: default;
}

.title-text {
  color: white;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.window-controls {
  display: flex;
  gap: 2px;
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

.window-content {
  flex: 1;
  overflow: auto;
  padding: 2px;
  display: flex;
  flex-direction: column;
}
</style>
