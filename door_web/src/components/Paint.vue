<template>
  <div class="paint-container">
    <div class="paint-toolbox">
      <div class="tool-button" :class="{ active: currentTool === 'pencil' }" @click="currentTool = 'pencil'" title="Pencil">✏️</div>
      <div class="tool-button" :class="{ active: currentTool === 'brush' }" @click="currentTool = 'brush'" title="Brush">🖌️</div>
      <div class="tool-button" :class="{ active: currentTool === 'eraser' }" @click="currentTool = 'eraser'" title="Eraser">⬜</div>
      <div class="tool-button" :class="{ active: currentTool === 'rect' }" @click="currentTool = 'rect'" title="Rectangle">▭</div>
      <div class="tool-button" :class="{ active: currentTool === 'circle' }" @click="currentTool = 'circle'" title="Circle">○</div>
      <div class="tool-button" :class="{ active: currentTool === 'star' }" @click="currentTool = 'star'" title="Star">★</div>
      <div class="tool-button" :class="{ active: currentTool === 'text' }" @click="currentTool = 'text'" title="Text">A</div>
      <div class="tool-button" @click="clearCanvas" title="Clear">🗑️</div>
    </div>
    <div class="paint-workspace">
      <canvas ref="canvas" 
              @mousedown="startDrawing" 
              @mousemove="draw" 
              @mouseup="stopDrawing" 
              @mouseleave="stopDrawing"></canvas>
    </div>
    <div class="paint-colors">
      <div v-for="color in colors" :key="color" 
           class="color-box" 
           :style="{ backgroundColor: color }"
           :class="{ active: currentColor === color }"
           @click="currentColor = color">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  initialImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['save']);

const canvas = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const currentTool = ref('pencil');
const currentColor = ref('#000000');
const startPos = ref({ x: 0, y: 0 }); // For shapes
const snapshot = ref(null); // For shapes preview
const colors = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];

onMounted(() => {
  if (canvas.value) {
    canvas.value.width = canvas.value.parentElement.clientWidth;
    canvas.value.height = canvas.value.parentElement.clientHeight;
    ctx.value = canvas.value.getContext('2d'); // Initialize context
    
    // Initialize white background
    ctx.value.fillStyle = '#ffffff';
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
    
    // Load initial image if provided
    if (props.initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.value.drawImage(img, 0, 0);
      };
      img.src = props.initialImage;
    }
  }
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const handleKeydown = (e) => {
  if (!props.isActive) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (canvas.value) {
      const dataUrl = canvas.value.toDataURL('image/png');
      emit('save', dataUrl);
    }
  }
};

const startDrawing = (e) => {
  isDrawing.value = true;
  const rect = canvas.value.getBoundingClientRect();
  startPos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  
  if (['rect', 'circle', 'star'].includes(currentTool.value)) {
    snapshot.value = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height);
  } else if (currentTool.value === 'text') {
      const text = prompt('Enter text:', '');
      if (text) {
          ctx.value.fillStyle = currentColor.value;
          ctx.value.font = '16px Arial';
          ctx.value.fillText(text, startPos.value.x, startPos.value.y);
      }
      isDrawing.value = false;
      return;
  }
  
  draw(e);
};

const draw = (e) => {
  if (!isDrawing.value || !ctx.value) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.value.lineWidth = currentTool.value === 'brush' || currentTool.value === 'eraser' ? 5 : 1;
  ctx.value.lineCap = 'round';
  ctx.value.strokeStyle = currentTool.value === 'eraser' ? '#ffffff' : currentColor.value;
  ctx.value.fillStyle = currentColor.value;

  if (currentTool.value === 'pencil' || currentTool.value === 'brush' || currentTool.value === 'eraser') {
      ctx.value.lineTo(x, y);
      ctx.value.stroke();
      ctx.value.beginPath();
      ctx.value.moveTo(x, y);
  } else if (['rect', 'circle', 'star'].includes(currentTool.value)) {
      ctx.value.putImageData(snapshot.value, 0, 0);
      ctx.value.beginPath();
      
      if (currentTool.value === 'rect') {
          ctx.value.strokeRect(startPos.value.x, startPos.value.y, x - startPos.value.x, y - startPos.value.y);
      } else if (currentTool.value === 'circle') {
          const radius = Math.sqrt(Math.pow(x - startPos.value.x, 2) + Math.pow(y - startPos.value.y, 2));
          ctx.value.arc(startPos.value.x, startPos.value.y, radius, 0, 2 * Math.PI);
          ctx.value.stroke();
      } else if (currentTool.value === 'star') {
          drawStar(startPos.value.x, startPos.value.y, 5, Math.abs(x - startPos.value.x), Math.abs(x - startPos.value.x) / 2);
          ctx.value.stroke();
      }
  }
};

const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.value.beginPath();
    ctx.value.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.value.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.value.lineTo(x, y);
        rot += step;
    }
    ctx.value.lineTo(cx, cy - outerRadius);
    ctx.value.closePath();
};

const stopDrawing = () => {
  isDrawing.value = false;
  if (ctx.value) ctx.value.beginPath();
};

const clearCanvas = () => {
  if (ctx.value && canvas.value) {
    ctx.value.fillStyle = '#ffffff';
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
  }
};
</script>

<style scoped>
.paint-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #c0c0c0;
}

.paint-toolbox {
  display: flex;
  gap: 2px;
  padding: 4px;
  background: #c0c0c0;
  border-bottom: 1px solid #808080;
}

.tool-button {
  width: 24px;
  height: 24px;
  background: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}

.tool-button:active, .tool-button.active {
  border-color: #808080 #ffffff #ffffff #808080;
  background: #dfdfdf;
}

.paint-workspace {
  flex: 1;
  padding: 4px;
  background: #808080;
  overflow: hidden;
}

canvas {
  background: #ffffff;
  cursor: crosshair;
}

.paint-colors {
  display: flex;
  gap: 2px;
  padding: 4px;
  background: #c0c0c0;
  border-top: 1px solid #ffffff;
}

.color-box {
  width: 16px;
  height: 16px;
  border: 1px solid #000000;
  cursor: pointer;
}

.color-box.active {
  outline: 2px solid #ffffff;
  outline-offset: -2px;
}
</style>
