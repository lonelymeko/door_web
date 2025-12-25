<script setup>
defineProps({
  startMenuOpen: Boolean,
  windows: Array,
  zIndexCounter: Number,
  rawWeatherData: Object,
  t: Function,
  getWeatherIcon: Function
});

const emit = defineEmits(['toggle-start-menu', 'toggle-minimize', 'toggle-calendar']);
</script>

<template>
  <footer class="taskbar">
    <div class="start-button" :class="{ active: startMenuOpen }" @click="emit('toggle-start-menu')">
        <span class="start-icon">❖</span> Start
    </div>
    <div class="taskbar-divider"></div>
    
    <div class="taskbar-items">
        <div v-for="win in windows" :key="win.id" 
             class="taskbar-item" 
             :class="{ active: win.isOpen && !win.isMinimized && win.zIndex === zIndexCounter }"
             v-show="win.isOpen"
             @click="emit('toggle-minimize', win.id)">
            <span class="taskbar-icon">{{ win.icon }}</span>
            {{ win.title }}
        </div>
    </div>

    <div class="taskbar-tray" @click="emit('toggle-calendar')">
        <a href="https://beian.miit.gov.cn/" target="_blank" class="tray-icon" :title="t('icpRecord')" @click.stop>
          <img src="/img/gongan.png" alt="备案" style="height: 14px;">
        </a>
        <span class="tray-weather" v-if="rawWeatherData" :title="rawWeatherData.weather + ' ' + rawWeatherData.temperature + '°C'">
           {{ getWeatherIcon(rawWeatherData.weather) }}
        </span>
        <span class="tray-clock">{{ new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
    </div>
  </footer>
</template>

<style scoped>
/* Taskbar */
.taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 28px;
  background-color: #c0c0c0;
  border-top: 2px solid #fff;
  display: flex;
  align-items: center;
  padding: 2px;
  z-index: 9999;
}

.start-button {
  display: flex;
  align-items: center;
  padding: 2px 6px;
  margin-right: 5px;
  background-color: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  height: 22px;
}
.start-button.active, .start-button:active {
  border-top: 2px solid #000;
  border-left: 2px solid #000;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  background-color: #d0d0d0;
}
.start-icon {
  margin-right: 4px;
  font-weight: 900;
}

.taskbar-divider {
  width: 2px;
  height: 20px;
  background-color: #808080;
  border-right: 1px solid #fff;
  margin: 0 5px;
}

.taskbar-items {
    flex: 1;
    display: flex;
    gap: 3px;
    overflow: hidden;
}

.taskbar-item {
    width: 160px;
    height: 22px;
    background-color: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    padding: 2px 5px;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px; /* Add gap for icon */
}
.taskbar-item.active {
    border-top: 2px solid #000;
    border-left: 2px solid #000;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    background-color: #dfdfdf;
    font-weight: bold;
}
.taskbar-icon {
    font-size: 14px;
}

.taskbar-tray {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 5px;
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    height: 22px;
    margin-left: 5px;
}
.taskbar-tray:active {
    border-top: 2px solid #000;
    border-left: 2px solid #000;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
}
</style>
