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
    <h1>❤️ 玺朽的砂糖 ❤️</h1>
    <h2>超级无敌腹黑的泄兔子</h2>
    <p>
      你是我生命中的一部分，是我最宝贵的记忆，是我最珍贵的礼物。
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
      我会一直陪伴你，无论你走到哪里，无论你遇到什么，无论你做什么，我都会一直陪伴你。
    </p>
  </div>
    </div>

  <audio id="bgm" src="http://ws.stream.qqmusic.qq.com/C400003WqTAU476PTJ.m4a?guid=392697146&vkey=3DDC4090E2B7048DE8919B1E6CA9617C0EE3CB08321822B43DBA3EB02482ED5198D441F6A69EC138E0036FBD801A97C1A02B727EA5B742A6__v21e2a1872&uin=&fromtag=120032&src=C400000FH4UL0gwyGe.m4a" loop ref="audioRef" autoplay></audio>

  <p>
    一直，一直永远在一起！
  </p>
</template>

<style scoped>
.access-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.modal-content input {
  width: 100%;
  padding: 0.5rem;
  margin: 1rem 0;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.modal-content button {
  background: #ff3860;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.error-message {
  color: #ff3860;
  margin-top: 1rem;
}

@keyframes float {
  0% { transform: translateY(100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; }
}

.heart {
  position: absolute;
  font-size: 24px;
  animation: float 8s linear infinite;
  pointer-events: none;
}

.love-view {
  text-align: center;
  overflow: hidden;
  background: linear-gradient(45deg, #ff9a9e, #fad0c4);
  min-height: 100vh;
  /* height: 100vh; 添加：确保覆盖整个视口高度 */
  width: 100%; /* 添加：确保宽度是全屏的 */
  position: relative;
  max-width: 100%;
}

/* 添加：媒体查询以适应移动设备 */
@media (max-width: 768px) {
  .love-view {
    padding: 1rem; /* 添加：为移动设备添加内边距 */
  }
}

@keyframes breath {
  0% { text-shadow: 0 0 10px rgba(255,0,0,0.5); }
  50% { text-shadow: 0 0 20px rgba(255,0,0,0.8), 0 0 30px rgba(255,0,0,0.6); }
  100% { text-shadow: 0 0 10px rgba(255,0,0,0.5); }
}

h1, h2 {
  animation: breath 2s ease-in-out infinite;
  color: #ff3860;
  margin: 1rem 0;
  transition: transform 0.3s ease;
}

h1:hover, h2:hover {
  transform: scale(1.1);
  text-shadow: 0 0 30px rgba(255, 56, 96, 0.8);
}

/* 图片轮播动画 */
.image-container {
  position: relative;
  min-height: 400px;

}

.fade-enter-active {
  transition: all 1s ease;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) scale(0.9);
}

.fade-enter-to {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.love-view img {
  max-width: 95%;
  height: auto;
  transition: all 0.5s ease;
  border: 3px solid #ff7eb9;
  border-radius: 20px;
  box-shadow: 0 8px 16px rgba(255, 126, 185, 0.3);
  object-fit: cover;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
 
}


.music-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #ff7eb3, #ff758c);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(255, 126, 179, 0.4);
  transition: all 0.3s ease;
  z-index: 100;
}

.music-button:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(255, 126, 179, 0.6);
}

.music-button i {
  font-size: 20px;
  margin-bottom: 5px;
}

.music-wave {
  display: flex;
  height: 10px;
  align-items: flex-end;
  gap: 3px;
}

.music-wave.active .wave-bar {
  animation: wave 1.2s ease infinite alternate;
}

.wave-bar {
  width: 3px;
  background: white;
  border-radius: 3px;
  height: 5px;
}

.wave-bar:nth-child(1) {
  animation-delay: 0.1s;
}

.wave-bar:nth-child(2) {
  animation-delay: 0.3s;
}

.wave-bar:nth-child(3) {
  animation-delay: 0.5s;
}

@keyframes wave {
  from {
    height: 5px;
  }
  to {
    height: 10px;
  }
}



/* 动态生成爱心 */
@keyframes heartbeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.love-view img:hover {
  filter: drop-shadow(0 0 10px #ff3860);
  /* transform: translateX(1px) ; */
  scale: 1.2;
  translate: 70px ;
  transform-origin: center center;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

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
const images = Array.from({ length: 14 }, (_, i) => `/img/love${i}.png`);


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
  }, 5000);
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
  if(Math.random() > 0.95){
    // 随机获取一句情话
    let {data} = await axios.get('https://api.uomg.com/api/rand.qinghua?format=json')

    message.value = data.content
    console.log(message.value)
    heart.innerHTML = '❤️\n ' + message.value
  }else{
    heart.innerHTML = '❤️'
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