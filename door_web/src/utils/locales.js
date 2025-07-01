// src/utils/locales.js
export const locales = {
  // --- Simplified Chinese (简体中文) ---
  'zh-CN': {
      // Sidebar & General
      search: '搜索发现', // Slightly updated
      navGrid: '网站导航',
      aiChat: 'AI 助理喵', // Updated Name
      dailySuggestion: '今日运势', // New: Sidebar link title
      hotSearch: '今日热搜',
      blog: '博客小站',
      loveSpace: '玺朽的砂糖', // Kept original unique name
      news: '新闻资讯',
      sponsor: '赞助我',
      // Top Bar
      appCenter: '应用中心',
      abilityTest: '能力测验',
      webPlugin: '网页插件',
      checkIn: '打卡',
      buyPro: '购买 Pro',
      // Search Section
      searchPlaceholder: '输入内容开始搜索...', // Updated
      searchButton: '搜索',
      languageSwitch: '语言切换', // Updated
      // Daily Suggestion Section (New)
      dailySuggestionTitle: '💡 今日出行与生活指南',
      aiSuggestionLoading: '猫娘正在为你占卜今日运势...',
      aiSuggestionError: '获取今日建议失败',
      aiWaitingForWeather: '请先允许获取位置和天气信息，才能生成今日建议哦~',
      aiSuggestionWeatherError: '无法获取天气信息，暂时不能生成建议呢...',
      aiSuggestionNotAvailable: '今日建议暂无内容。',
      // Hot Search Section
      hotSearchTitle: '实时热搜', // Updated
      // Nav Grid Section
      navGridTitle: '常用网站导航', // Updated
      addLink: '+ 添加',
      // AI Chat Section
      aiChatTitle: '你的专属猫娘助理', // Updated Title
      aiGreeting: '喵~ 主人你好！我是你的导航看板娘，有什么想问的都可以告诉我哦~ 🐾', // Updated Greeting
      chatInputPlaceholder: '跟猫娘说点什么吧...', // Updated placeholder
      chatSendButton: '发送',
      chatSendingButton: '发送中...', // New
      aiClientNotInitialized: 'AI服务未配置或初始化失败，相关功能无法使用。', // New General AI Error
      aiChatError: '与猫娘连接时出现问题', // New Chat Error
      // News Section
      newsTitle: '今日头条', // Kept specific
      viewMore: '查看更多 >',
      // Footer
      footerCopyright: '© {year} 玺朽导航 版权所有',
      contactUs: '联系我们',
      privacyPolicy: '隐私声明',
      icpRecord: '新ICP备2025018290号-1', // Specific record from user's example
      // Typewriter Quotes
      quote1: '玺朽导航 - 发现互联网的精彩。',
      quote2: '学无止境，探索不息。',
      quote3: '代码改变世界，导航连接未来。',
      quote4: '保持好奇，永远学习。',
      quote5: '生活改变世界，学习改变生活。', // Keep as is
      quote6: '早安，打工人！今天也要努力搬砖喵~', // Added personality
      // Search Engines
      engineBing: '必应',
      engineBaidu: '百度',
      engineSogou: '搜狗',
      // Sponsor Modal
      sponsorThanks: '感谢主人的投喂！喵~', // Updated
      sponsorClose: '关闭',
      // Nav Link Names (Keep user's specific names)
      navLinkBilibili: 'Bilibili',
      navLinkAliyun: '阿里云ECS',
      navLinkYuketang: '雨课堂',
      navLinkDeepseek: 'Deepseek Chat',
      navLinkMoji: 'MOJI辞書',
      navLinkShixiseng: '实习僧',
      // Weather Related
      weatherLoading: '正在加载天气...',
      weatherError: '无法加载天气信息', // General weather fetch error
      weatherWind: '风力',
      weatherWindDirection: '风向',
      weatherHumidity: '湿度',
      weatherTempUnit: '°C',
      weatherWindPowerUnit: '级',
      weatherRequestingPermission: '正在请求位置权限...',
      weatherPermissionDenied: '您拒绝了位置权限，无法获取当地天气。',
      weatherPositionUnavailable: '无法获取当前位置信息。',
      weatherPositionTimeout: '获取位置信息超时。',
      weatherFetchingAdcode: '正在解析位置...',
      weatherAdcodeError: '无法解析位置。',
      weatherGeolocationNotSupported: '浏览器不支持地理位置', // New
      weatherApiKeyMissing: '天气服务配置错误', // New
      mail: '邮件系统',
  },

  // --- English ---
  'en-US': {
      // Sidebar & General
      search: 'Search',
      navGrid: 'Site Navigation',
      aiChat: 'AI Assistant Meow', // Updated Name
      dailySuggestion: 'Daily Brief', // New: Sidebar link title
      hotSearch: 'Trending Now',
      blog: 'Personal Blog',
      loveSpace: 'Xixiu\'s Sugar', // Kept original name's spirit
      news: 'News Feed',
      sponsor: 'Sponsor Me',
      // Top Bar
      appCenter: 'App Center',
      abilityTest: 'Ability Test',
      webPlugin: 'Web Plugins',
      checkIn: 'Check In',
      buyPro: 'Buy Pro',
      // Search Section
      searchPlaceholder: 'Search...',
      searchButton: 'Search',
      languageSwitch: 'Language',
      // Daily Suggestion Section (New)
      dailySuggestionTitle: '💡 Today\'s Travel & Lifestyle Tips',
      aiSuggestionLoading: 'Meow~ Consulting the stars for today\'s advice...',
      aiSuggestionError: 'Failed to fetch daily suggestion',
      aiWaitingForWeather: 'Please allow location and weather access to generate today\'s suggestions.',
      aiSuggestionWeatherError: 'Cannot get weather info, suggestions unavailable.',
      aiSuggestionNotAvailable: 'No suggestions available for today.',
      // Hot Search Section
      hotSearchTitle: 'Real-time Trends',
      // Nav Grid Section
      navGridTitle: 'Common Websites',
      addLink: '+ Add',
      // AI Chat Section
      aiChatTitle: 'Your Exclusive Cat Assistant', // Updated Title
      aiGreeting: 'Meow~ Hello Master! I\'m your navigation assistant, ask me anything! 🐾', // Updated Greeting
      chatInputPlaceholder: 'Chat with your cat assistant...', // Updated placeholder
      chatSendButton: 'Send',
      chatSendingButton: 'Sending...', // New
      aiClientNotInitialized: 'AI service is not configured or failed to initialize. Related features are disabled.', // New General AI Error
      aiChatError: 'Error connecting to the assistant', // New Chat Error
      // News Section
      newsTitle: 'Today\'s Headlines',
      viewMore: 'View More >',
      // Footer
      footerCopyright: '© {year} Xixiu Navigation All rights reserved',
      contactUs: 'Contact Us',
      privacyPolicy: 'Privacy Policy',
      icpRecord: 'ICP Record XinICPBei 2025018290-1', // Transliterated/translated record
      // Typewriter Quotes
      quote1: 'Xixiu Nav - Discover the wonders of the internet.',
      quote2: 'Learning is limitless, exploration never stops.',
      quote3: 'Code changes the world, navigation connects the future.',
      quote4: 'Stay curious, always learn.',
      quote5: 'Life changes the world, learning changes life.',
      quote6: 'Good morning, worker! Gotta work hard today too, meow~', // Added personality
      // Search Engines
      engineBing: 'Bing',
      engineBaidu: 'Baidu',
      engineSogou: 'Sogou',
      // Sponsor Modal
      sponsorThanks: 'Thank you for your support, Master! Meow~', // Updated
      sponsorClose: 'Close',
      // Nav Link Names
      navLinkBilibili: 'Bilibili',
      navLinkAliyun: 'Aliyun ECS',
      navLinkYuketang: 'Yuketang',
      navLinkDeepseek: 'Deepseek Chat',
      navLinkMoji: 'MOJI Dictionary', // Translated name
      navLinkShixiseng: 'shixiseng',
      // Weather Related
      weatherLoading: 'Loading weather...',
      weatherError: 'Could not load weather info',
      weatherWind: 'Wind',
      weatherWindDirection: 'Direction',
      weatherHumidity: 'Humidity',
      weatherTempUnit: '°C',
      weatherWindPowerUnit: 'Level',
      weatherRequestingPermission: 'Requesting location permission...',
      weatherPermissionDenied: 'Location permission denied. Cannot fetch local weather.',
      weatherPositionUnavailable: 'Unable to retrieve current location.',
      weatherPositionTimeout: 'Timeout while retrieving location.',
      weatherFetchingAdcode: 'Resolving location...',
      weatherAdcodeError: 'Failed to resolve location.',
      weatherGeolocationNotSupported: 'Browser does not support geolocation', // New
      weatherApiKeyMissing: 'Weather service configuration error', // New
      mail:'Mail System'
  },    

  // --- Japanese (日本語) ---
  'ja-JP': {
      // Sidebar & General
      search: '検索',
      navGrid: 'サイトナビ',
      aiChat: 'AIアシスタントニャン', // Updated Name
      dailySuggestion: '今日の運勢', // New: Sidebar link title
      hotSearch: '今日の話題',
      blog: '個人ブログ',
      loveSpace: '玺朽の砂糖', // Kept original name
      news: 'ニュース',
      sponsor: '支援する',
      // Top Bar
      appCenter: 'アプリセンター',
      abilityTest: '能力テスト',
      webPlugin: 'ウェブプラグイン',
      checkIn: 'チェックイン',
      buyPro: 'Proを購入',
      // Search Section
      searchPlaceholder: '検索...',
      searchButton: '検索',
      languageSwitch: '言語',
      // Daily Suggestion Section (New)
      dailySuggestionTitle: '💡 今日の移動・生活ガイド',
      aiSuggestionLoading: 'にゃ〜 今日の運勢を占っています...',
      aiSuggestionError: '今日のアドバイス取得に失敗しました',
      aiWaitingForWeather: '位置情報と天気のアクセスを許可して、今日のアドバイスを生成してください。',
      aiSuggestionWeatherError: '天気情報が取得できないため、アドバイスを生成できません。',
      aiSuggestionNotAvailable: '今日のアドバイスはありません。',
      // Hot Search Section
      hotSearchTitle: 'リアルタイム検索',
      // Nav Grid Section
      navGridTitle: 'よく使うサイト',
      addLink: '+ 追加',
      // AI Chat Section
      aiChatTitle: 'あなた専属の猫娘アシスタント', // Updated Title
      aiGreeting: 'にゃ〜ご主人様！ナビゲーションの看板娘です。何でも聞いてくださいね〜🐾', // Updated Greeting
      chatInputPlaceholder: '猫娘アシスタントと話しましょう...', // Updated placeholder
      chatSendButton: '送信',
      chatSendingButton: '送信中...', // New
      aiClientNotInitialized: 'AIサービスが設定されていないか、初期化に失敗しました。関連機能は無効です。', // New General AI Error
      aiChatError: 'アシスタントとの接続中に問題が発生しました', // New Chat Error
      // News Section
      newsTitle: '今日のヘッドライン',
      viewMore: 'もっと見る >',
      // Footer
      footerCopyright: '© {year} 玺朽ナビゲーション All rights reserved', // Mixed or adjust
      contactUs: 'お問い合わせ',
      privacyPolicy: 'プライバシーポリシー',
      icpRecord: '新ICP備2025018290号-1', // Specific record from user's example
      // Typewriter Quotes
      quote1: '玺朽ナビ - インターネットの素晴らしさを発見。',
      quote2: '学びは無限、探求は止まらない。',
      quote3: 'コードは世界を変え、ナビゲーションは未来をつなぐ。',
      quote4: '好奇心を持ち、常に学び続ける。',
      quote5: '生活は世界を変え、学習は生活を変える。',
      quote6: 'おはよう、労働者さん！ 今日も一日頑張るにゃん～', // Added personality
      // Search Engines
      engineBing: 'Bing',
      engineBaidu: '百度',
      engineSogou: 'Sogou',
      // Sponsor Modal
      sponsorThanks: 'ご主人様のご支援、感謝にゃん！', // Updated
      sponsorClose: '閉じる',
      // Nav Link Names
      navLinkBilibili: 'Bilibili',
      navLinkAliyun: 'Aliyun ECS',
      navLinkYuketang: '雨课堂', // Keep original name?
      navLinkDeepseek: 'Deepseek Chat',
      navLinkMoji: 'MOJI辞書', // Keep original name
      navLinkShixiseng: '実習僧',
      // Weather Related
      weatherLoading: '天気を読み込み中...',
      weatherError: '天気情報を読み込めませんでした',
      weatherWind: '風力',
      weatherWindDirection: '風向',
      weatherHumidity: '湿度',
      weatherTempUnit: '°C',
      weatherWindPowerUnit: 'レベル',
      weatherRequestingPermission: '位置情報の許可を要求しています...',
      weatherPermissionDenied: '位置情報の許可が拒否されました。地域の天気を取得できません。',
      weatherPositionUnavailable: '現在の位置情報を取得できません。',
      weatherPositionTimeout: '位置情報の取得がタイムアウトしました。',
      weatherFetchingAdcode: '位置情報を解決しています...',
      weatherAdcodeError: '位置情報の解決に失敗しました。',
      weatherGeolocationNotSupported: 'ブラウザは地理位置情報をサポートしていません', // New
      weatherApiKeyMissing: '天気サービスの設定エラー', // New\
      mail: 'メールシステム',
  }
};