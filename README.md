## refactor工作目标
- 重构代码，使得代码更加规范化，更加易读易懂，更加易于维护
  - 分离原 `HomeView.vue` 中的代码，使得代码更加清晰 
    - `HomeView.vue` >>> `MainView.vue`
  - 修改了 `LoveView.vue` 的文字引入，可通过 `.env` 自定义

### 已完成：

- 模块分离
  - 分离了 `components/Suggestion.vue` ，取于原 `HomeView.vue` 的天气建议模块
  - 分离了 `components/hotsearch.vue` ，取于原 `HomeView.vue` 的热搜模块
  - 分离了 `components/Search.vue`，取于原 `HomeView.vue` 的搜索引擎模块
- 页面分离
  - 分离了 `Sidebar.vue` ，取于原 `HomeView.vue` 的侧边栏页模块
  - 分离了 `Header.vue` ，取于原 `HomeView.vue` 的网页头模块

### 待实现功能：
1.引入搜索引擎（必应，搜狗，百度） （感觉没必要了）
2.天气系统 √
3.集成deepseek等ai语音聊天√
4.更多网站导航栏
5.今日头条
6.万年历√