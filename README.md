# [cgos.cc](http://cgos.cc)

传统玩具「竹知了」的 Web 模拟版系列项目展示站，一个页面集齐 **三个版本** 的网页游戏：


| 版本                            | 目录                 | 核心玩法                 |
| ----------------------------- | ------------------ | -------------------- |
| [经典版](zhuzhiliao/)            | `zhuzhiliao/`      | 单文件 HTML，零依赖零构建，水墨画风 |
| [声音 meme 版](zhuzhiliao-meme/) | `zhuzhiliao-meme/` | 7 套声音主题，赛博朋克风格       |
| [AI 公司版](zhuzhiliao-ai/)      | `zhuzhiliao-ai/`   | 15 个主题，logo 圆盘 + 语录  |


同一套物理引擎（绳系质点 + 真实录音采样发声），不同视觉与声音体验，手机电脑直开即玩。

后端采用 **PHP + Redis**，提供流量统计、留言板和聊天接口，并为首页统计、留言、聊天提供实时数据。

## 功能亮点

- **物理模拟发声**：竹筒是绳系质点，甩得越快、绳越紧，声音越响越亮；声音主源为真实录音采样，解码失败自动回退 Web Audio 合成。
- **零依赖零构建**：纯 HTML + JS + Canvas/Web Audio，不引第三方库，断网也能玩。
- **一套引擎，三种玩法**：经典水墨、声音 meme、AI 公司 logo 三套皮肤自由切换。
- **PHP + Redis 后端**：实时统计 PV/UV/在线、留言板、聊天室，前端每 30 秒自动刷新。
- **一键部署**：`docker compose up` 起 PHP + Redis 双服务。



## 快速开始



### 方式一：Docker（推荐）

```bash
cd /Users/mac/code/git/cgos.cc
docker compose up --build -d
```

访问：

- 首页：`http://localhost:8080/`
- 留言页：`http://localhost:8080/guestbook.html`
- 统计接口：`http://localhost:8080/api/stats.php`
- 留言接口：`http://localhost:8080/api/guestbook.php`
- 聊天接口：`http://localhost:8080/api/chat.php`
- 健康检查：`http://localhost:8080/api/health.php`



### 方式二：本地 PHP + Redis

如果你本地已经运行了 Redis：

```bash
cd /Users/mac/code/git/cgos.cc
REDIS_HOST=127.0.0.1 php -S localhost:8099
```

然后访问 `http://localhost:8099/`。

## 前端配置

修改 `assets/config.js` 中的 `API_BASE` 即可改变接口地址：

```javascript
window.CGOS_CONFIG = {
  API_BASE: '/api'                    // 同源相对路径
  // API_BASE: 'https://cgos.cc/api' // 跨域绝对路径
  // API_BASE: 'http://localhost:8099/api' // 本地开发
};
```



## 目录结构

```
.
├── index.html              # 项目展示首页（介绍三个版本 + 统计/留言/聊天）
├── guestbook.html          # 独立留言页（顶部滚动展示留言）
├── assets/                 # 前端资源
│   ├── config.js           # API 地址配置
│   ├── main.css            # 公共样式
│   ├── main.js             # 首页/留言页公共脚本
│   ├── chat-widget.css     # 聊天弹窗样式
│   ├── chat-widget.js      # 聊天弹窗组件（任意页面可引入）
│   ├── audio/              # 真实录音音频采样
│   ├── icons/              # og 缩略图等图标
│   └── 3d/                 # 3D 渲染资源
├── api/                    # PHP 接口
│   ├── lib/redis.php       # Redis 公共库（含 CORS、输入过滤、统一响应）
│   ├── stats.php           # 流量统计
│   ├── guestbook.php       # 留言
│   ├── chat.php            # 聊天
│   └── health.php          # 健康检查
├── zhuzhiliao/             # 竹知了 · 经典版
├── zhuzhiliao-meme/        # 竹知了 · 声音 meme 版
├── zhuzhiliao-ai/          # 竹知了 · AI 公司版
├── docker-compose.yml      # Docker 开发环境
├── php.dockerfile          # PHP 镜像构建
├── .htaccess               # Apache 配置
└── doc/                    # 改造过程文档
```



## 聊天组件使用

任意页面引入以下资源即可在右下角显示聊天入口：

```html
<link rel="stylesheet" href="assets/chat-widget.css">
<script src="assets/config.js"></script>
<script src="assets/chat-widget.js"></script>
```

效果：

- 右下角显示聊天图标和未读消息数。
- 点击图标展开全屏居中弹窗。
- 昵称会保存在 `localStorage`。
- 未读消息数基于上次打开时间计算。



## 常用命令

```bash
# 启动
docker compose up --build -d

# 停止
docker compose down

# 查看日志
docker compose logs -f web

# 进入 Redis 查看数据
docker compose exec redis redis-cli

# 本地 PHP 开发（需本地 Redis）
REDIS_HOST=127.0.0.1 php -S localhost:8099
```



## 文档

- [01-需求与目标](doc/01-需求与目标.md)
- [02-架构与接口设计](doc/02-架构与接口设计.md)
- [03-数据模型](doc/03-数据模型.md)
- [04-实施步骤](doc/04-实施步骤.md)
- [05-测试与部署](doc/05-测试与部署.md)
- [06-变更记录](doc/06-变更记录.md)

