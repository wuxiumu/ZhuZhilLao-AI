# 竹知了 AI 版

基于 `zhuzhiliao-meme` 改造的 AI 主题版本。**15个主题**，涵盖 AI 公司、科技巨头和加密货币。

**在线试玩：<https://cgos.cc/zhuzhiliao-ai/>**

## 特点

- **15个主题**：AI公司、科技巨头、加密货币三大类
- **JSON配置驱动**：新增主题只需一个JSON文件 + 一个SVG
- **企业文化名言**：每个主题7条经典语录，随机显示
- **URL记忆**：分享链接自动记住选中的主题（如 `#bitcoin`）
- **分享功能**：支持 Twitter、微博、QQ、微信等平台
- **赛博 HUD 风格**：科幻界面，动态背景
- **零依赖**：纯原生 HTML/CSS/JS

## 主题列表

### AI 公司（第一排）
| ID | 公司 | 配色 | 经典语录 |
|---|---|---|---|
| bamboo | 竹知了 | 橙红 #e2603f | 传统与科技的交汇 |
| openai | OpenAI | 绿 #10a37f | AGI for the benefit of humanity |
| anthropic | Anthropic | 棕 #d4a574 | Build reliable, interpretable, and steerable AI |
| google | Google | 蓝 #4285f4 | Organize the world's information |
| meta | Meta | 蓝 #0668E1 | Give people the power to build community |
| xai | xAI | 蓝 #1d9bf0 | Understand the true nature of the universe |

### 科技巨头（第二排）
| ID | 公司 | 配色 | 经典语录 |
|---|---|---|---|
| apple | Apple | 银灰 #A2AAAD | Think Different |
| nvidia | NVIDIA | 绿 #76B900 | The GPU is the engine of AI |
| tesla | Tesla | 红 #E82127 | Accelerating the world's transition to sustainable energy |
| dji | DJI | 橙红 #FF4500 | The Future of Possible |

### 加密货币（第三排）
| ID | 项目 | 标志 | 配色 | 经典语录 |
|---|---|---|---|---|
| btc | Bitcoin | ₿ | 橙 #F7931A | Peer-to-Peer Electronic Cash System |
| eth | Ethereum | Ξ | 蓝紫 #627EEA | World Computer |
| usdt | Tether | ₮ | 绿 #26A17B | Every USDT is Backed by Real Reserves |
| bnb | BNB | Ⓑ | 金 #F3BA2F | Build and Build |
| sol | Solana | ◎ | 紫 #9945FF | Speed Without Compromise |

## 文件结构

```
zhuzhiliao-ai/
├── index.html          # 主页面（2200+ 行）
├── README.md           # 本文件
├── assets/
│   └── clean-bamboo.wav  # 知了声音采样
├── 3d/                 # WebGL 渲染层（可选）
├── og-image.jpg        # 分享预览图
├── icon-*.png          # PWA 图标
└── ...
```

## 访问地址

http://localhost:8099/zhuzhiliao-ai/

## 技术要点

- 使用 Canvas 绘制 AI logo 圆盘（`drawAILogoToy` 函数）
- 苹果主题用 Canvas 路径绘制苹果图标
- 背景中绘制企业文化名言（半透明，不影响游戏）
- 主题配置在 `THEMES` 数组中，每个主题包含 `quote` 字段
- 所有主题共用同一个音频文件
- 保持与 zhuzhiliao-meme 相同的物理引擎和音频系统

## 主题切换效果

切换主题时会：
1. 更换旋转玩具的 logo 和配色
2. 重新绘制背景（包括新的名言）
3. 更新 UI 元素的颜色（Tab、按钮、统计等）
4. 保持知了声音不变
