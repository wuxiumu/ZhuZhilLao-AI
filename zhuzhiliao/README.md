# 竹知了 · 经典版

一转就"哇哇"叫的传统玩具，Web 模拟版。

**在线试玩：<https://cgos.cc/zhuzhiliao/>**

## 玩法

打开浏览器即可玩，零依赖、零构建。

- **按住屏幕画圈**：像甩真玩具一样，转得越快叫得越响
- **自动甩**：不想动手就点它
- **体感模式**：手机端握住手机划圈，重力感应驱动

## 技术特点

- **单文件部署**：一个 HTML 文件包含所有代码和资源
- **物理模拟**：绳系质点模型，真实还原甩动手感
- **真实录音**：Web Audio API 处理，转速影响音高和音量
- **Canvas 2D**：所有动画实时渲染，包括水墨风背景
- **移动端优化**：触屏友好，响应式布局，体感支持

## 本地运行

```bash
# 直接打开
open zhuzhiliao/index.html

# 或用 HTTP 服务器
python3 -m http.server 8000
# 访问 http://localhost:8000/zhuzhiliao/
```

## 项目结构

```
zhuzhiliao/
├── index.html          # 主页面（单文件，包含所有代码）
├── README.md           # 本文件
├── worker/             # Cloudflare Worker 后端（可选）
└── CLAUDE.md           # 开发文档
```

## License

MIT
