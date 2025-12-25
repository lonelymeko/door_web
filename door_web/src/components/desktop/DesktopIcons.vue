<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  icons: {
    type: Array,
    required: true
  },
  iconPositions: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['delete-file', 'rename-file', 'update-position', 'drag-start', 'drag-end']);

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  targetId: null,
  isSystem: false
});

const renamingId = ref(null);
const renameInput = ref('');

// Dragging State
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const currentDragId = ref(null);
const tempDragPosition = ref(null); // 新增：用于存储拖拽过程中的临时位置

const handleContextMenu = (e, icon) => {
  e.preventDefault();
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    targetId: icon.id,
    isSystem: !icon.id.startsWith('file-') // Assuming user files start with 'file-'
  };
};

const closeContextMenu = () => {
  contextMenu.value.visible = false;
};

const handleDelete = () => {
  if (contextMenu.value.targetId && !contextMenu.value.isSystem) {
    emit('delete-file', contextMenu.value.targetId);
  }
  closeContextMenu();
};

const startRename = () => {
  if (contextMenu.value.targetId && !contextMenu.value.isSystem) {
    const icon = props.icons.find(i => i.id === contextMenu.value.targetId);
    if (icon) {
      renamingId.value = icon.id;
      renameInput.value = icon.title;
    }
  }
  closeContextMenu();
};

const finishRename = () => {
  if (renamingId.value) {
    emit('rename-file', renamingId.value, renameInput.value);
    renamingId.value = null;
  }
};

// Dragging Logic
const startDrag = (e, icon) => {
  if (renamingId.value === icon.id) return; // Don't drag while renaming
  if (isDragging.value) return; // Prevent multiple drags
  
  e.preventDefault(); // 防止浏览器默认的图片拖拽行为
  e.stopPropagation();
  
  isDragging.value = true;
  currentDragId.value = icon.id;
  emit('drag-start'); // 通知父组件开始拖拽
  
  // Let's use the mouse position relative to the element
  const rect = e.currentTarget.getBoundingClientRect();
  const container = document.querySelector('.desktop-icons-container');
  // Safety check for container
  if (!container) return;
  
  const containerRect = container.getBoundingClientRect();

  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  
  // 初始化临时位置，确保开始拖拽时位置不跳变
  tempDragPosition.value = {
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top
  };
  
  // Use document and capture phase to ensure we don't miss events
  document.addEventListener('mousemove', onDrag, { capture: true });
  document.addEventListener('mouseup', stopDrag, { capture: true });
  window.addEventListener('blur', stopDrag); // Stop drag if window loses focus
};

const onDrag = (e) => {
  if (!isDragging.value || !currentDragId.value) return;

  // Safety check: if mouse button is not pressed, stop dragging
  if (e.buttons === 0) {
      stopDrag(e);
      return;
  }
  
  const container = document.querySelector('.desktop-icons-container');
  if (container) {
      const rect = container.getBoundingClientRect();
      // 计算新的相对位置
      const x = e.clientX - rect.left - dragOffset.value.x;
      const y = e.clientY - rect.top - dragOffset.value.y;
      
      // 更新临时位置，触发视图更新
      tempDragPosition.value = { x, y };
  }
};

const stopDrag = (e) => {
  // Remove listeners immediately to prevent further triggers
  document.removeEventListener('mousemove', onDrag, { capture: true });
  document.removeEventListener('mouseup', stopDrag, { capture: true });
  window.removeEventListener('blur', stopDrag);

  if (isDragging.value && currentDragId.value) {
    try {
        // Check if dropped on Recycle Bin
        const recycleBinEl = document.querySelector('.icon-recycle-bin-target');
        
        if (recycleBinEl) {
            const rbRect = recycleBinEl.getBoundingClientRect();
            // Check if mouse is within recycle bin bounds
            // Use e.clientX/Y if available, otherwise ignore (e.g. blur event)
            if (e && e.clientX !== undefined && 
                e.clientX >= rbRect.left && e.clientX <= rbRect.right &&
                e.clientY >= rbRect.top && e.clientY <= rbRect.bottom) {
                
                // Dropped on Recycle Bin
                if (!currentDragId.value.startsWith('icon-')) { // Only delete user files
                     emit('delete-file', currentDragId.value);
                }
                // Return here, cleanup is in finally block (simulated)
                // Actually we need to run the cleanup logic below.
                // Let's just use a flag or restructure.
            } else {
                // Normal drop - update position
                const container = document.querySelector('.desktop-icons-container'); 
                if (container) {
                    const rect = container.getBoundingClientRect();
                    // Use last known position from tempDragPosition if event is missing coords (e.g. blur)
                    // But tempDragPosition is relative.
                    // Let's recalculate from event if possible.
                    let x, y;
                    if (e && e.clientX !== undefined) {
                        x = e.clientX - rect.left - dragOffset.value.x;
                        y = e.clientY - rect.top - dragOffset.value.y;
                      } else if (tempDragPosition.value) {
                        x = tempDragPosition.value.x;
                        y = tempDragPosition.value.y;
                      }
                      
                      if (x !== undefined && y !== undefined) {
                        emit('update-position', currentDragId.value, x, y);
                      }
                }
            }
        } else {
             // No recycle bin found, just update position
             const container = document.querySelector('.desktop-icons-container'); 
             if (container) {
                const rect = container.getBoundingClientRect();
                let x, y;
                if (e && e.clientX !== undefined) {
                    x = e.clientX - rect.left - dragOffset.value.x;
                    y = e.clientY - rect.top - dragOffset.value.y;
                } else if (tempDragPosition.value) {
                    x = tempDragPosition.value.x;
                    y = tempDragPosition.value.y;
                }
                if (x !== undefined && y !== undefined) {
                    emit('update-position', currentDragId.value, x, y);
                }
             }
        }
    } catch (err) {
        console.error("Error in stopDrag:", err);
    }
  }
  
  // Always reset state
  isDragging.value = false;
  currentDragId.value = null;
  tempDragPosition.value = null;
  emit('drag-end'); 
};

onMounted(() => {
  window.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu);
});
</script>

<template>
  <div class="desktop-icons-container">
    <div v-for="icon in icons" :key="icon.id" 
         class="desktop-icon" 
         :class="{ 'icon-recycle-bin-target': icon.id === 'icon-recycle-bin' }"
         :style="{ 
             position: (currentDragId === icon.id && tempDragPosition) || iconPositions[icon.id] ? 'absolute' : 'relative',
             left: (currentDragId === icon.id && tempDragPosition) ? tempDragPosition.x + 'px' : (iconPositions[icon.id] ? iconPositions[icon.id].x + 'px' : 'auto'),
             top: (currentDragId === icon.id && tempDragPosition) ? tempDragPosition.y + 'px' : (iconPositions[icon.id] ? iconPositions[icon.id].y + 'px' : 'auto'),
             zIndex: currentDragId === icon.id ? 100 : 1
         }"
         @dblclick="icon.action"
         @contextmenu="handleContextMenu($event, icon)"
         @mousedown="startDrag($event, icon)">
      
      <div class="icon-img">{{ icon.icon }}</div>
      
      <div v-if="renamingId === icon.id" class="icon-rename">
        <input v-model="renameInput" @blur="finishRename" @keyup.enter="finishRename" autoFocus />
      </div>
      <div v-else class="icon-text">{{ icon.title }}</div>
    </div>

    <!-- Context Menu -->
    <div v-if="contextMenu.visible" class="context-menu" :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">
      <div class="menu-item" :class="{ disabled: contextMenu.isSystem }" @click.stop="handleDelete">Delete</div>
      <div class="menu-item" :class="{ disabled: contextMenu.isSystem }" @click.stop="startRename">Rename</div>
    </div>
  </div>
</template>

<style scoped>
.desktop-icons-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Remove flex layout to allow absolute positioning mixed with flow */
  /* But we want default flow... this is tricky. 
     Let's keep the original flex container for default items, 
     but items with positions will be absolute. */
  padding: 10px;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px;
  z-index: 0;
  pointer-events: none; /* Allow clicks to pass through to background if needed, but icons need pointer-events: auto */
}

.desktop-icon {
  pointer-events: auto;
  width: 80px;
  max-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  text-align: center;
  color: white;
  margin-bottom: 10px;
  /* Ensure absolute positioned items don't take up space in flow if possible, 
     but Vue v-for renders them. 
     If position is absolute, they are removed from flow automatically. */
}

.desktop-icon:hover .icon-img {
    filter: brightness(1.2);
}
.desktop-icon:hover .icon-text {
    background-color: #000080;
}

.icon-img {
  font-size: 32px;
  margin-bottom: 5px;
  filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.5));
  user-select: none;
}

.icon-text {
  font-size: 12px;
  text-shadow: 1px 1px 0 black;
  padding: 2px;
  line-height: 1.2;
  user-select: none;
}

.icon-rename input {
  width: 70px;
  font-size: 12px;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: #c0c0c0;
  border: 2px solid;
  border-color: #fff #000 #000 #fff;
  min-width: 100px;
  z-index: 99999;
  pointer-events: auto;
}

.menu-item {
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
  color: black;
}

.menu-item:hover:not(.disabled) {
  background-color: #000080;
  color: white;
}

.menu-item.disabled {
  color: #808080;
  cursor: default;
}
</style>
