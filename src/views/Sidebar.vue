<!-- src/components/Sidebar.vue -->
<template>
  <aside class="sidebar" :class="{ 'mobile-open': isMobileNavOpen }">
    <div class="sidebar-header">
      <img src="/img/avatar.jpg" alt="头像" class="sidebar-avatar">
      <span class="logo">玺朽</span>
      <button class="mobile-close-btn" @click="closeMobileNav">×</button>
    </div>
    <nav class="sidebar-nav">
      <!-- Main Section -->
      <ul class="nav-group">
        <li v-for="(item, index) in groupedNavItems.main" :key="'main-'+item.link+'-'+index" :class="{ active: false }">
          <router-link v-if="item.internal && item.link.startsWith('/') && item.link !== '/'" :to="item.link" @click="closeMobileNav">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.title }}</span>
          </router-link>
          <a v-else :href="item.link" @click="handleClick($event, item.click)" :target="determineTarget(item)">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.title }}</span>
          </a>
        </li>
      </ul>
      <div class="nav-separator"></div>
      <!-- Extras Section -->
      <ul class="nav-group">
        <li v-for="(item, index) in groupedNavItems.extras" :key="'extras-'+item.link+'-'+index" :class="{ active: false }">
          <router-link v-if="item.internal === true && item.link.startsWith('/')" :to="item.link" @click="closeMobileNav">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.title }}</span>
          </router-link>
          <a v-else :href="item.link" @click="handleClick($event, item.click)" :target="determineTarget(item)">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.title }}</span>
          </a>
        </li>
      </ul>
      <div class="nav-separator"></div>
      <!-- User Section -->
      <ul class="nav-group">
        <li v-for="(item, index) in groupedNavItems.user" :key="'user-'+item.link+'-'+index" :class="{ active: false }">
          <a :href="item.link"
             @click="handleClick($event, item.click)"
             :target="determineTarget(item)">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.title }}</span>
          </a>
        </li>
      </ul>
    </nav>
    <div class="sidebar-footer">
      v1.10 2025-4-20 今日指南和AI聊天<!-- Update version if needed -->
    </div>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    isMobileNavOpen: {
      type: Boolean,
      required: true
    },
    groupedNavItems: {
      type: Object,
      required: true
    }
  },
  methods: {
    closeMobileNav() {
      this.$emit('close-mobile-nav');
    },
    handleClick(event, clickHandler) {
      this.$emit('handle-click', event, clickHandler);
    },
    determineTarget(item) {
      this.$emit('determine-target', item);
    }
  }
}
</script>

<style scoped>
  @import '../assets/css/main.css';
</style>
