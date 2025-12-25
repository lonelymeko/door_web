<template>
  <div v-if="!accessGranted" class="access-modal">
      <div class="modal-content">
        <h3>这是什么游戏？</h3>
        <input v-model="gameInput" placeholder="请输入游戏名称" @keyup.enter="checkAccess" />
        <button @click="checkAccess">验证</button>
        <p v-if="isInput" class="error-message">{{ errorMessage }}</p>
      </div>
    </div>
<div v-else class="love-view" @mousemove="createHeart" @touchmove="handleTouchMove">
  
  <div class="love-view">
    <button class="music-button" @click="toggleMusic">💓</button>
    <h1> {{ title }} </h1>
    <h2>{{ id }}</h2>
    <p>
      {{ img_say }}
    </p>

    <div class="image-container">
      <img 
        :src="images[currentImageIndex]" 
        alt="love"
        :key="currentImageIndex"
        class="fade-enter-active"
      />
    </div>
    <p>
      {{ view_say }}
    </p>
  </div>
    </div>

  <audio id="bgm" src="http://ws.stream.qqmusic.qq.com/C400003WqTAU476PTJ.m4a?guid=392697146&vkey=3DDC4090E2B7048DE8919B1E6CA9617C0EE3CB08321822B43DBA3EB02482ED5198D441F6A69EC138E0036FBD801A97C1A02B727EA5B742A6__v21e2a1872&uin=&fromtag=120032&src=C400000FH4UL0gwyGe.m4a" loop ref="audioRef" autoplay></audio>

  <p>
    {{ bgm_say }}
  </p>
</template>

<style scoped>
  @import '../assets/css/love.css';
</style>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

// import .env sg
const title = ref(import.meta.env.VITE_LOVE_TITLE); 
const id = ref(import.meta.env.VITE_LOVE_ID)
const view_say = ref(import.meta.env.VITE_LOVE_VIEW_SAY)
const img_say = ref(import.meta.env.VITE_LOVE_IMG_SAY)
const bgm_say = ref(import.meta.env.VITE_LOVE_BGM_SAY)

// 验证游戏
const accessGranted = ref(false);
const gameInput = ref('');
const errorMessage = ref('');
const isInput = ref(false);

const checkAccess = () => {
  const validAnswers = ['vrc', 'VRChat'];
  const input = gameInput.value.trim().toLowerCase();
  console.log('checkAccess:', { accessGranted: accessGranted.value }, { gameInput: gameInput.value });
    isInput.value = true
  
  if (validAnswers.some(answer => answer.toLowerCase() === input)) {
    accessGranted.value = true;
    errorMessage.value = '';
    //存到本地存储
    localStorage.setItem('accessGranted', 'true');
  } else {
    accessGranted.value = false;
    if (isInput != null) {
      errorMessage.value = '请输入正确的答案';
    }
  }
};

const currentImageIndex = ref(0);

// 图片列表
const images = Array.from({ length: 16 }, (_, i) => `/img/love${i}.png`);


let interval = null;

onMounted(() => {
  //先在本地存储中查找
    const storedAccessGranted = localStorage.getItem('accessGranted');
  if (storedAccessGranted === 'true') {
    accessGranted.value = true;
  }
  // 图片轮播间隔
  interval = setInterval(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % images.length;
  }, 10000);
});

onUnmounted(() => {
  clearInterval(interval);
});

const message = ref('')
const isPlaying = ref(false)
const audioRef = ref(null)

const toggleMusic = () => {
  isPlaying.value = !isPlaying.value
  if(isPlaying.value) {
    audioRef.value.play()
  } else {
    audioRef.value.pause()
  }
}

onMounted(() => {
  if(accessGranted){
    audioRef.value = document.getElementById('bgm')
    audioRef.value.volume = 0.3
    audioRef.value.play()
    isPlaying.value = true
  }

})

const createHeart = async (e) => {
  if(Math.random() > 0.3) return;
  const heart = document.createElement('div');
  heart.className = 'heart';
  if(Math.random() > 0.7){
    // 请求本地的 love_words.json 文件
    let {data} = await axios.get('/love_words/love_words.json');
    // 随机获取一句情话
    const randomIndex = Math.floor(Math.random() * data.content.length);
    message.value = data.content[randomIndex];
    console.log(message.value);
    heart.innerHTML = '❤️\n ' + message.value;
  }else{
    heart.innerHTML = '❤️';
  }
  heart.style.left = e.pageX + 'px';
  heart.style.top = e.pageY + 'px';
  heart.style.fontSize = Math.random() * 20 + 10 + 'px';
  heart.style.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
  heart.style.animation = `float ${Math.random() * 3 + 5}s linear infinite`;
  
  document.querySelector('.love-view').appendChild(heart);
  setTimeout(() => heart.remove(), 8000);
};

const handleTouchMove = (e) => {
  // 获取触摸事件的第一个触摸点
  const touch = e.touches[0];
  if (touch) {
    // 创建一个虚拟的鼠标事件对象
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    // 触发 createHeart 方法
    createHeart(mouseEvent);
  }
};

</script>