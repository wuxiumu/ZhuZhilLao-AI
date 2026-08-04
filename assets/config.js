/**
 * cgos.cc 前端全局配置
 * 修改 API_BASE 即可把接口指向不同域名或路径。
 * 示例：
 *   API_BASE: '/api'                       // 同源相对路径
 *   API_BASE: 'https://cgos.cc/api'        // 绝对路径跨域
 *   API_BASE: 'http://localhost:8099/api'  // 本地开发
 */
window.CGOS_CONFIG = {
  API_BASE: '/api',
  GITHUB_URL: 'https://github.com/wuxiumu/ZhuZhilLao-AI',

  // 底部版权和链接配置
  FOOTER: {
    copyright: '© 2024 cgos.cc. All rights reserved.',
    poweredBy: 'Powered by PHP + Redis',
    statsUrl: 'https://v6.51.la/s/DXb51v7uEZ9wCB4',
    links: [
      { text: 'GitHub 仓库', url: 'https://github.com/wuxiumu/ZhuZhilLao-AI', target: '_blank' },
      { text: 'cgos.cc', url: 'https://cgos.cc', target: '_blank' }
      // 可添加更多友情链接
      // { text: '示例链接', url: 'https://example.com', target: '_blank' }
    ]
  }
};
