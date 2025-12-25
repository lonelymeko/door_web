import { ref } from 'vue';

export function useFileSystem() {
  const USER_FILES_KEY = 'userFiles';
  const userFiles = ref([]);

  const loadUserFiles = () => {
    try {
      const stored = localStorage.getItem(USER_FILES_KEY);
      if (stored) {
        userFiles.value = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load user files:", e);
    }
  };

  const saveUserFilesToStorage = () => {
    localStorage.setItem(USER_FILES_KEY, JSON.stringify(userFiles.value));
  };

  const saveFile = (file) => {
      // Check if file already exists (update it) or add new
      // For simplicity, we just push new, but in a real OS we might overwrite or rename
      userFiles.value = [...userFiles.value, file]; // Force reactivity update
      saveUserFilesToStorage();
  };

  const deleteFile = (id) => {
    userFiles.value = userFiles.value.filter(f => f.id !== id);
    saveUserFilesToStorage();
  };

  const renameFile = (id, newName) => {
    const file = userFiles.value.find(f => f.id === id);
    if (file) {
      file.title = newName;
      saveUserFilesToStorage();
    }
  };

  // --- Custom Links Logic ---
  const customLinks = ref([]);
  
  const loadCustomLinks = () => {
    try {
      const storedLinks = localStorage.getItem('customNavLinks');
      if (storedLinks) {
        customLinks.value = JSON.parse(storedLinks);
      }
    } catch (e) {
      console.error("Failed to load custom links:", e);
    }
  };

  const saveCustomLinks = () => {
    try {
      localStorage.setItem('customNavLinks', JSON.stringify(customLinks.value));
    } catch (e) {
      console.error("Failed to save custom links:", e);
    }
  };

  const addCustomLink = (name, url) => {
    if (name && url) {
      let formattedUrl = url;
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      customLinks.value.push({ name: name, url: formattedUrl, isCustom: true });
      saveCustomLinks();
    }
  };

  const removeCustomLink = (index) => {
    customLinks.value.splice(index, 1);
    saveCustomLinks();
  };

  // --- Icon Positions Logic ---
  const ICON_POSITIONS_KEY = 'desktopIconPositions';
  const iconPositions = ref({});

  const loadIconPositions = () => {
    try {
      const stored = localStorage.getItem(ICON_POSITIONS_KEY);
      if (stored) {
        iconPositions.value = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load icon positions:", e);
    }
  };

  const saveIconPosition = (id, x, y) => {
    // Create a new object to ensure reactivity triggers properly
    iconPositions.value = {
      ...iconPositions.value,
      [id]: { x, y }
    };
    localStorage.setItem(ICON_POSITIONS_KEY, JSON.stringify(iconPositions.value));
  };

  return {
    userFiles,
    loadUserFiles,
    saveFile,
    deleteFile,
    renameFile,
    customLinks,
    loadCustomLinks,
    addCustomLink,
    removeCustomLink,
    iconPositions,
    loadIconPositions,
    saveIconPosition
  };
}
