<script setup>
defineProps({
  calendarInfo: String,
  rawWeatherData: Object,
  weatherInfo: String,
  t: Function,
  getWeatherIcon: Function
});
</script>

<template>
  <div class="win-inner-content">
       <div class="weather-display-large">
          <h2>📅 {{ calendarInfo }}</h2>
          <div v-if="rawWeatherData" class="weather-details">
              <div class="weather-main">
                  <span class="weather-icon-large">{{ getWeatherIcon(rawWeatherData.weather) }}</span>
                  <span class="weather-temp-large">{{ rawWeatherData.temperature_float }}°C</span>
              </div>
              <p>{{ rawWeatherData.city }} - {{ rawWeatherData.weather }}</p>
              <p>{{ t('weatherWind') }}: {{ rawWeatherData.winddirection }} {{ rawWeatherData.windpower }}级</p>
              <p>{{ t('weatherHumidity') }}: {{ rawWeatherData.humidity_float }}%</p>
          </div>
          <div v-else>
              {{ weatherInfo }}
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
.weather-display-large { text-align: center; }
.weather-details { margin-top: 10px; }
.weather-main { font-size: 2em; margin-bottom: 10px; }
</style>
