import { ref } from 'vue';

export function useWindowManager() {
  const windows = ref([
    // Static windows (Singletons)
    { id: 'bilibili', title: 'Bilibili Live', type: 'bilibili', icon: '📺', isOpen: true, isMinimized: false, x: 340, y: 20, width: 720, height: 450, zIndex: 100 },
    { id: 'hotsearch', title: '热搜榜', type: 'hotsearch', icon: '🔥', isOpen: true, isMinimized: false, x: 650, y: 500, width: 400, height: 300, zIndex: 100 },
    { id: 'news', title: '今日头条', type: 'news', icon: '📰', isOpen: true, isMinimized: false, x: 1080, y: 450, width: 500, height: 400, zIndex: 100 },
    { id: 'suggestion', title: '每日建议', type: 'suggestion', icon: '💡', isOpen: false, isMinimized: false, x: 100, y: 100, width: 500, height: 400, zIndex: 100 },
    { id: 'chat', title: 'AI 助手', type: 'chat', icon: '🐱', isOpen: false, isMinimized: false, x: 150, y: 150, width: 400, height: 500, zIndex: 100 },
    { id: 'sponsor', title: '赞助', type: 'sponsor', icon: '💰', isOpen: false, isMinimized: false, x: 200, y: 200, width: 350, height: 'auto', zIndex: 100 },
    // Initial App Windows
    { id: 'notepad-default', title: 'Untitled - Notepad', type: 'notepad', icon: '📝', isOpen: true, isMinimized: false, x: 50, y: 50, width: 400, height: 300, zIndex: 100, content: '' },
    { id: 'paint-default', title: 'untitled - Paint', type: 'paint', icon: '🎨', isOpen: true, isMinimized: false, x: 100, y: 100, width: 600, height: 450, zIndex: 100, content: null },
  ]);

  const zIndexCounter = ref(100);
  const WINDOWS_STATE_KEY = 'windowsState';

  // Dragging State
  const isDragging = ref(false);
  const dragOffset = ref({ x: 0, y: 0 });
  const currentDragWindowId = ref(null);

  const saveWindowsState = () => {
    const state = windows.value.map(w => ({
      id: w.id,
      type: w.type,
      title: w.title,
      url: w.url,
      icon: w.icon,
      x: w.x,
      y: w.y,
      zIndex: w.zIndex,
      isOpen: w.isOpen,
      isMinimized: w.isMinimized,
      width: w.width,
      height: w.height,
      content: w.content
    }));
    localStorage.setItem(WINDOWS_STATE_KEY, JSON.stringify(state));
  };

  const createAppWindow = (type, content = null, title = null) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const defaultTitle = type === 'notepad' ? 'Untitled - Notepad' : 'untitled - Paint';
    const icon = type === 'notepad' ? '📝' : '🎨';
    
    windows.value.push({
      id,
      title: title || defaultTitle,
      type,
      icon,
      isOpen: true,
      isMinimized: false,
      x: 50 + (windows.value.length * 20) % 200,
      y: 50 + (windows.value.length * 20) % 200,
      width: type === 'notepad' ? 400 : 600,
      height: type === 'notepad' ? 300 : 450,
      zIndex: ++zIndexCounter.value,
      content: content
    });
    saveWindowsState();
  };

  const openWebWindow = (title, url) => {
    const id = `iframe-${Date.now()}`;
    windows.value.push({
      id,
      title,
      type: 'iframe',
      url,
      icon: '🌐',
      isOpen: true,
      isMinimized: false,
      x: 50 + (windows.value.length * 20) % 200,
      y: 50 + (windows.value.length * 20) % 200,
      width: 800,
      height: 600,
      zIndex: ++zIndexCounter.value
    });
    saveWindowsState();
  };

  const navigateIframe = (id, url) => {
    const win = windows.value.find(w => w.id === id);
    if (win) {
        win.url = url;
        saveWindowsState();
    }
  };

  const openWindow = (id) => {
    const win = windows.value.find(w => w.id === id);
    if (win) {
      win.isOpen = true;
      win.isMinimized = false;
      focusWindow(id);
      saveWindowsState();
    } else if (id === 'notepad') {
        createAppWindow('notepad');
    } else if (id === 'paint') {
        createAppWindow('paint');
    }
  };

  const closeWindow = (id) => {
    const index = windows.value.findIndex(w => w.id === id);
    if (index !== -1) {
        const win = windows.value[index];
        if (win.type === 'iframe' || win.type === 'notepad' || win.type === 'paint') {
            windows.value.splice(index, 1);
        } else {
            win.isOpen = false;
        }
        saveWindowsState();
    }
  };

  const minimizeWindow = (id) => {
    const win = windows.value.find(w => w.id === id);
    if (win) {
      win.isMinimized = true;
      saveWindowsState();
    }
  };

  const toggleMinimize = (id) => {
    const win = windows.value.find(w => w.id === id);
    if (win) {
        if (win.isMinimized) {
            win.isMinimized = false;
            focusWindow(id);
        } else {
            if (win.zIndex === zIndexCounter.value) {
                win.isMinimized = true;
            } else {
                focusWindow(id);
            }
        }
        saveWindowsState();
    }
  };

  const handleMaximize = (win) => {
    if (win.type === 'iframe' && win.url) {
        window.open(win.url, '_blank');
    }
  };

  const focusWindow = (id) => {
    const win = windows.value.find(w => w.id === id);
    if (win) {
      zIndexCounter.value++;
      win.zIndex = zIndexCounter.value;
      saveWindowsState();
    }
  };

  const startDrag = (e, windowId) => {
    if (e.target.closest('.window-controls')) return;
    isDragging.value = true;
    currentDragWindowId.value = windowId;
    const win = windows.value.find(w => w.id === windowId);
    focusWindow(windowId);
    dragOffset.value = {
      x: e.clientX - win.x,
      y: e.clientY - win.y
    };
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  const onDrag = (e) => {
    if (!isDragging.value || !currentDragWindowId.value) return;
    const win = windows.value.find(w => w.id === currentDragWindowId.value);
    if (win) {
      win.x = e.clientX - dragOffset.value.x;
      win.y = e.clientY - dragOffset.value.y;
    }
  };

  const stopDrag = () => {
    isDragging.value = false;
    currentDragWindowId.value = null;
    saveWindowsState();
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
  };

  const loadWindowsState = (defaultCallback) => {
    try {
        const storedState = localStorage.getItem(WINDOWS_STATE_KEY);
        if (storedState) {
            const parsedState = JSON.parse(storedState);
            
            parsedState.forEach(storedWin => {
                const win = windows.value.find(w => w.id === storedWin.id);
                if (win) {
                    win.x = storedWin.x;
                    win.y = storedWin.y;
                    win.zIndex = storedWin.zIndex;
                    win.isOpen = storedWin.isOpen;
                    win.isMinimized = storedWin.isMinimized;
                    if (storedWin.width) win.width = storedWin.width;
                    if (storedWin.height) win.height = storedWin.height;
                    if (storedWin.content) win.content = storedWin.content;
                } else if (storedWin.type === 'iframe' || storedWin.type === 'notepad' || storedWin.type === 'paint') {
                    windows.value.push({
                        id: storedWin.id,
                        title: storedWin.title,
                        type: storedWin.type,
                        url: storedWin.url,
                        icon: storedWin.icon || (storedWin.type === 'notepad' ? '📝' : (storedWin.type === 'paint' ? '🎨' : '🌐')),
                        isOpen: storedWin.isOpen,
                        isMinimized: storedWin.isMinimized,
                        x: storedWin.x,
                        y: storedWin.y,
                        width: storedWin.width,
                        height: storedWin.height,
                        zIndex: storedWin.zIndex,
                        content: storedWin.content
                    });
                }
            });
            
            const maxZ = Math.max(...parsedState.map(w => w.zIndex || 100), 100);
            zIndexCounter.value = maxZ;
        } else {
            if (defaultCallback) defaultCallback();
        }
    } catch (e) {
        console.error("Failed to load windows state:", e);
        if (defaultCallback) defaultCallback();
    }
  };

  return {
    windows,
    zIndexCounter,
    createAppWindow,
    openWebWindow,
    navigateIframe,
    openWindow,
    closeWindow,
    minimizeWindow,
    toggleMinimize,
    handleMaximize,
    focusWindow,
    startDrag,
    loadWindowsState,
    saveWindowsState
  };
}
