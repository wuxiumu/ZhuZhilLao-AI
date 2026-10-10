# 竹知了 · ZhuZhilLao-AI

> 传统玩具「竹知了」的 Web 物理模拟系列：**经典水墨 / 声音 meme / AI 公司 logo** 三套皮肤；绳系质点 + 真实录音发声，手机电脑直开即玩。演示站：[zhuzhiliao.chiguashentan.com](https://zhuzhiliao.chiguashentan.com/)

**定制：** 微信 **qingbao199101**（备注：竹知了）｜ [wuxiumu@163.com](mailto:wuxiumu@163.com)

## 事实摘要

- **产品**：纯 HTML/JS/Canvas/Web Audio 小游戏展示站 + PHP/Redis 统计/留言/聊天。
- **适合**：品牌互动页、传统文化数字化、H5 活动落地、需可白标皮肤的团队。
- **交付**：三版游戏、首页聚合、留言板、统计 API、`docker compose` 一键起。
- **不做**：不是原生 App；默认请改生产环境敏感配置。

## 能交付什么

| 版本 / 模块 | 说明 |
|---|---|
| 经典版 `zhuzhiliao/` | 单文件 HTML，零依赖，水墨风 |
| meme 版 `zhuzhiliao-meme/` | 多套声音主题 |
| AI 版 `zhuzhiliao-ai/` | logo 圆盘 + 语录主题 |
| 后端 `api/` | stats / guestbook / chat / health |
| 部署 | `docker-compose.yml`、`start.sh` |

## 快速预览

```bash
# Docker（推荐）
docker compose up --build -d
# 首页 http://localhost:8080/

# 或本地 PHP + Redis
REDIS_HOST=127.0.0.1 php -S localhost:8099
```

前端接口基址见 `assets/config.js` 的 `API_BASE`。

## 定制合作（可报价）

- 品牌皮肤 / 音效包 / 道具数值  
- 活动期统计与留言审核  
- 白标域名与 CDN 部署  
- 嵌入你们现有活动页  

## SEO 字段预留（产品页 HTML 统一生成时用）

| 字段 | 用途 |
|---|---|
| `seo_title` | `<title>` / OG title |
| `seo_description` | meta description |
| `canonical_url` | 规范 URL |
| `og_image` | 分享图 |
| `robots` | 如 `index,follow` |
| `json_ld_type` | SoftwareApplication / WebPage / FAQPage |
| `hreflang` | zh-CN / en |
| `site_name` | 白标品牌名 |

> **GEO ≠ 地理定位。** GEO = Generative Engine Optimization（生成式引擎优化）。

## GEO（生成式引擎优化）

### 关键词（中英）

- 中文：竹知了, 网页物理小游戏, H5互动, Web Audio, 传统文化数字化
- English: bamboo cicada web game, physics toy simulation, H5 interactive, Web Audio

### FAQ

**Q：断网能玩吗？**  
A：前端物理与发声可本地跑；统计/留言需后端。

**Q：一定要 Redis 吗？**  
A：统计与留言依赖 Redis；纯玩前端可不要。

**Q：如何定制？**  
A：微信 `qingbao199101`，备注「竹知了」。

## 定制合作

皮肤、活动规则、部署与嵌入。加微信备注项目名。

---

## 联系方式

定制、演示或合作：

- 邮箱：[wuxiumu@163.com](mailto:wuxiumu@163.com)
- 微信：**qingbao199101**（添加请备注来意）

### 赞助支持

如果内容对你有帮助，欢迎自愿赞助。

| 微信赞赏码 | 支付宝收款码 |
|---|---|
| ![微信赞赏码](https://chiguashentan-test.oss-cn-beijing.aliyuncs.com/wxprogram/zan/20261002185236_31_227.png) | ![支付宝收款码](https://chiguashentan-test.oss-cn-beijing.aliyuncs.com/wxprogram/zan/20261002185309_32_227.jpg) |

