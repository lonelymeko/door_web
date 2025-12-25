import { ref } from 'vue';

export function useWeather(WEATHER_API_KEY, t) {
  const weatherInfo = ref(t('weatherLoading'));
  const rawWeatherData = ref(null);
  const geolocationStatus = ref('idle');
  const geolocationError = ref('');

  const getWeatherIcon = (weatherCondition) => {
    if (!weatherCondition) return '❓';
    const condition = String(weatherCondition).toLowerCase();
    if (condition.includes('雷阵雨')) return '⛈️';
    if (condition.includes('雷')) return '⚡';
    if (condition.includes('雨夹雪')) return '🌨️';
    if (condition.includes('雪')) return '❄️';
    if (condition.includes('雨')) return '🌧️';
    if (condition.includes('阴')) return '☁️';
    if (condition.includes('多云')) return '🌥️';
    if (condition.includes('晴')) return '☀️';
    if (condition.includes('雾') || condition.includes('霾')) return '🌫️';
    if (condition.includes('风') || condition.includes('吹')) return '🌬️';
    console.warn("未匹配的天气图标:", weatherCondition);
    return '🌍';
  };

  const fetchAdcodeFromCoords = async (latitude, longitude) => {
    if (!WEATHER_API_KEY) return null;
    geolocationStatus.value = 'pending_regeo';
    weatherInfo.value = t('weatherFetchingAdcode');
    try {
        const proxyRegeoUrl = `/proxy-regeo?output=json&location=${longitude},${latitude}&key=${WEATHER_API_KEY}&radius=1000&extensions=base`;
        const response = await fetch(proxyRegeoUrl);
        if (!response.ok) throw new Error(`Proxy Regeo request failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (data.status === '1' && data.regeocode) {
            const adcode = data.regeocode.addressComponent?.adcode;
            if (adcode) return adcode;
            else throw new Error('Gaode Regeo success, but no Adcode found');
        } else {
            throw new Error(`Gaode Regeo API error: ${data.info || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Failed to get Adcode:', error);
        geolocationStatus.value = 'error';
        geolocationError.value = t('weatherAdcodeError');
        weatherInfo.value = geolocationError.value;
        return null;
    }
  };

  const fetchWeatherDataByAdcode = async (adcode) => {
    if (!WEATHER_API_KEY || !adcode) return null;
    weatherInfo.value = t('weatherLoading');
    try {
        const proxyWeatherUrl = `/proxy-weather?city=${adcode}&key=${WEATHER_API_KEY}`;
        const response = await fetch(proxyWeatherUrl);
        if (!response.ok) throw new Error(`Proxy Weather request failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (data.status === '1' && data.lives && data.lives.length > 0) {
            rawWeatherData.value = data.lives[0];
            geolocationStatus.value = 'success';
            weatherInfo.value = '';
            return data.lives[0];
        } else {
            throw new Error(`Gaode Weather API error: ${data.info || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Failed to get weather data:', error);
        geolocationStatus.value = 'error';
        if (!geolocationError.value) geolocationError.value = t('weatherError');
        weatherInfo.value = geolocationError.value;
        rawWeatherData.value = null;
        return null;
    }
  };

  const requestLocationAndWeather = () => {
    if (!('geolocation' in navigator)) {
        geolocationStatus.value = 'error';
        geolocationError.value = t('weatherGeolocationNotSupported');
        weatherInfo.value = geolocationError.value;
        return;
    }
    if (!WEATHER_API_KEY) {
         geolocationStatus.value = 'error';
         geolocationError.value = t('weatherApiKeyMissing');
         weatherInfo.value = geolocationError.value;
         return;
    }
    geolocationStatus.value = 'pending_permission';
    weatherInfo.value = t('weatherRequestingPermission');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            const adcode = await fetchAdcodeFromCoords(latitude, longitude);
            if (adcode) {
                await fetchWeatherDataByAdcode(adcode);
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            geolocationStatus.value = 'error';
            switch (error.code) {
                case error.PERMISSION_DENIED: geolocationError.value = t('weatherPermissionDenied'); break;
                case error.POSITION_UNAVAILABLE: geolocationError.value = t('weatherPositionUnavailable'); break;
                case error.TIMEOUT: geolocationError.value = t('weatherPositionTimeout'); break;
                default: geolocationError.value = t('weatherPositionUnavailable'); break;
            }
            weatherInfo.value = geolocationError.value;
        }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  };

  return {
    weatherInfo,
    rawWeatherData,
    geolocationStatus,
    geolocationError,
    getWeatherIcon,
    requestLocationAndWeather
  };
}
