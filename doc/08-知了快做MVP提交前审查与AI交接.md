# 08-知了快做 MVP 提交前审查与 AI 交接

> 审查日期：2026-08-08
> 项目入口：`/zhuzhiliao-mvp/`
> 分享入口：`/zhuzhiliao-mvp/?id=<作品ID>`
> 结论：当前代码可作为“功能可运行的 MVP 快照”提交 Git；生产上线前仍有必须处理的安全与部署问题。

## 1. 本次版本完成内容

### 1.1 编辑器

- 新建独立的 `zhuzhiliao-mvp/` 前后端项目。
- 支持上传 PNG、JPEG、WebP 图片，最大 5MB。
- 支持上传 MP3、WAV、M4A、OGG、WebM 等常见音频，最大 10MB。
- 支持浏览器录音、停止录音、录音时长/大小提示、试听、暂停和移除。
- 修复录音按钮使用错误选择器导致停止回调中断的问题。
- 支持名称、副标题、模拟字数组、单字/多字模式。
- 内置 5 组多字参考语句。
- 支持主题色、夜幕色、知了大小、转速、甩动半径、绳长、音量。
- 支持中文、繁体中文、英文及对应的 Demo 默认数据。
- 记录语言、Tab、本地草稿和本机作品 ID。
- 支持恢复最佳 Demo 数据。

### 1.2 分享与展示

- 分享地址统一为 `/zhuzhiliao-mvp/?id=<作品ID>`。
- 分享页复用标准版 `zhuzhiliao/index.html` 的绳索、竹签、物理和夜景效果。
- 默认作品未上传图片时，强制使用标准版 3D 竹蝉。
- 上传自定义图片后，自动关闭 3D，图片完全替换默认蝉，不叠加旧图。
- 自定义转速、半径、绳长、大小、夜幕色、模拟字和音量同步到分享页。
- 修复低转速作品沿用标准版固定发声阈值，导致自动甩有动画但无声的问题。
- 修复自定义录音刚播放就被下一帧暂停、后续被浏览器手势策略拦截的问题。
- 支持二维码、复制链接、复制分享文案和系统分享。
- 分享页三语文案集中在 `assets/share-config.js`，标准版静态显示文字会按作品语言统一替换。
- 使用 `assets/icons/zlkz.png`、`assets/icons/zlzwj.png` 生成两套带作品信息和二维码的分享海报，支持下载和系统分享。
- 发布成功弹窗和作品分享弹窗可以直接打开对应作品的海报生成页。
- 支持可选访问密码；带 `pwd` 的链接可免输入，普通链接显示密码弹窗。
- 密码作品未解锁前不输出作品标题和副标题元信息。
- 聊天、统计、手绘切换入口不进入 MVP 分享页。

### 1.3 作品管理

- “放入素材 / 我的作品 / 历史作品”使用 Tab 切换。
- 历史作品支持分页，每页 8 条。
- 支持时间正序/倒序、浏览量正序/倒序。
- 当前 IP 创建的作品可以编辑。
- 非当前 IP 的作品编辑需要管理员验证。
- 只有管理员可以删除作品；普通用户能查看但不能删除。
- 每个 IP 最多创建 10 个作品，全站最多保留 200 个作品。
- 当前默认管理员仅用于开发：`admin / admin123`。

### 1.4 后端与存储

- PHP 接口：
  - `api/project.php`：读取、创建、更新、删除作品。
  - `api/projects.php`：作品列表、排序、分页和权限状态。
  - `api/asset.php`：受控输出图片和音频。
  - `api/admin.php`：管理员登录。
  - `api/common.php`：配置、IP、文件读写和公共函数。
  - `api/redis.php`：轻量 Redis RESP 客户端和限流。
- Redis 用于草稿、项目缓存和接口限流。
- 最终作品数据写入 `data/projects/<id>/project.json`。
- 图片和音频保存在对应作品目录。
- 受密码保护的素材使用私有缓存。
- 素材访问允许：正确密码、作品所有者 IP、已登录管理员。
- 公共初始化自动创建并检查 `data/projects`，首次部署不再依赖手工建立目录。
- 根目录 `start.sh` 检查 PHP、必要扩展、Redis、存储权限和端口占用后启动本地服务。

### 1.5 标准版及首页联动

- 根首页和标准版增加“创建我的知了”入口。
- 修正标准版 Manifest、Service Worker 和 Three.js 相对路径。
- Service Worker 升级为 `zzl-v2`，单个预缓存资源失败不会让安装整体失败。
- MVP 编辑页使用内嵌 favicon，避免自动请求 `/favicon.ico` 产生 404。

## 2. 当前架构

```text
浏览器编辑器
  ├─ localStorage：语言、Tab、草稿、本机作品 ID
  ├─ MediaRecorder：浏览器录音
  └─ PHP API
       ├─ Redis：限流、草稿、项目缓存
       └─ data/projects/<id>/
            ├─ project.json
            ├─ image.png|jpg|webp
            ├─ audio.mp3|wav|m4a|ogg|webm
            └─ views.txt

分享页
  ├─ PHP 读取标准版 HTML 并注入 MVP 适配代码
  ├─ GET api/project.php 读取作品配置
  ├─ GET api/asset.php 输出受控素材
  ├─ 无自定义图片：3D 标准竹蝉
  └─ 有自定义图片：关闭 3D，绘制自定义图片
```

## 3. 提交前问题分级

### 3.1 必须在生产上线前处理

#### P0-1：生产默认管理员密码和 IP 哈希密钥不安全

当前开发回退值：

```text
ZZL_ADMIN_USERNAME=admin
ZZL_ADMIN_PASSWORD=admin123
ZZL_IP_HASH_KEY=change-this-ip-hash-key-before-production
```

生产环境必须通过环境变量覆盖。更稳妥的做法是生产模式下检测到默认值就拒绝启动，而不是继续运行。

#### P0-2：IP 不能作为可靠的作品所有权凭证

当前“自己的作品”由 `HMAC(IP)` 判断。风险包括：

- 公司、学校、家庭、运营商 NAT 下，多人可能共享一个公网 IP。
- IP 变化后，真正作者会失去编辑权限。
- 代理配置错误时，可能所有用户都被识别为同一个 IP。
- 开启 `ZZL_TRUST_PROXY=1` 后，没有可信代理白名单，客户端可能伪造 `X-Forwarded-For`。

MVP 可以暂时保留，但正式管理应改为用户登录、作品编辑令牌或签名 Cookie。IP 只适合作为限流辅助信号。

#### P0-3：写接口缺少 CSRF 防护

创建、更新、删除和管理员登录没有 CSRF Token。`SameSite=Strict` 能保护部分管理员 Session 请求，但不能完整保护基于 IP 所有权的作品更新。

建议为编辑器生成 CSRF Token，所有 POST/DELETE 请求同时校验 Token 和 `Origin/Referer`。

### 3.2 建议上线前处理

#### P1-1：密码通过 URL 查询参数传播

这是当前明确支持的产品能力，但密码可能进入：

- 浏览器历史记录。
- 服务器访问日志。
- 截图、二维码和复制的分享文案。
- 某些跳转场景的 Referer。

建议长期改为一次性分享令牌，或者密码验证成功后换取短期 HttpOnly Cookie。至少应设置 `Referrer-Policy: no-referrer`。

#### P1-2：历史接口会公开受保护作品的元数据

`api/projects.php` 对所有访客返回作品标题、副标题、发布时间、浏览量、是否有图/声音以及原始图片地址。图片接口会对陌生访客返回 403，但会造成破图请求，也会泄露标题等元数据。

建议：受保护作品对非所有者/非管理员仅返回通用标题和占位图，或不进入公开历史列表。

#### P1-3：浏览器录音缺少时长与兼容性保护

当前问题：

- 没有最大录音时长，长录音会持续占用内存，最终可能超过 10MB 才在发布时失败。
- 没有 `MediaRecorder` 不可用时的 WAV/Web Audio 回退。
- `MediaRecorder` 构造或启动失败时，麦克风 Track 可能没有完整清理。
- 不同 Safari/Chrome 版本对 WebM、MP4、OGG 支持不同。

建议设置 60–120 秒自动停止、显示计时器，并增加能力检测与错误提示。

#### P1-4：分享页依赖字符串替换标准版 HTML

`share.php` 通过多次 `str_replace()` 修改 `zhuzhiliao/index.html`。标准版只要改变函数文本、空格或注释，替换可能静默失效。

建议把标准版暴露为稳定配置接口，或拆出共享物理模块。短期至少应对每个关键替换检查替换次数，未命中时记录错误并阻止发布错误页面。

#### P1-5：分享链接依赖请求 Host

`base_url()` 使用经过字符过滤的 `HTTP_HOST` 生成分享链接，但没有固定可信域名。错误的反向代理或 Host Header 可能生成错误链接。

建议增加 `APP_PUBLIC_URL`，生产环境直接使用固定公开地址。

#### P1-6：缺少安全响应头

建议增加：

- `Content-Security-Policy`。
- `Referrer-Policy: no-referrer`。
- `X-Frame-Options: SAMEORIGIN` 或 CSP `frame-ancestors`。
- `Permissions-Policy`，只给编辑页开放麦克风。

### 3.3 可后续优化

#### P2-1：浏览量不是独立访客流量

目前每次读取分享作品都会增加 `views.txt`，刷新页面也会重复计数。排序中的“浏览量”实际是请求次数，不是 UV。

#### P2-2：管理员缺少退出登录接口

管理员 Session 只能等待浏览器会话结束。建议增加明确的退出按钮和 Session 销毁接口。

#### P2-3：Redis 不可用时发布完全失败

这符合当前“Redis 临时数据和限流必须可用”的实现，但应增加健康检查和更明确的运维提示。服务端草稿只有写入逻辑，没有按草稿 ID 恢复的完整接口。

#### P2-4：上传只限制文件大小，没有限制像素和时长

超高像素图片可能导致浏览器解码占用大量内存；高压缩率长音频可能在较小文件下仍有很长时长。建议读取图片尺寸和媒体时长后再接收。

#### P2-5：缺少自动化测试

当前主要依赖 PHP/JS 语法检查和浏览器人工验证。至少应补充：

- 创建、编辑、删除、限额接口测试。
- 密码正确/错误/无密码素材访问测试。
- 所有者、陌生 IP、管理员权限矩阵测试。
- 默认 3D 与自定义图片 2D 切换测试。
- 录音停止后生成试听面板的浏览器测试。
- 标准版字符串适配命中测试。

#### P2-6：代码可维护性较弱

- `index.php`、API 文件和 `share.php` 大量使用单行压缩代码。
- `share.php` 同时负责模板转换、CSS、i18n、数据加载、音频和分享逻辑。
- `i18n.js` 的英文/繁体部分使用中文对象扩展，缺失键会悄悄回退中文。

建议上线稳定后拆分并格式化，不建议在功能尚未冻结时进行大规模重构。

## 4. 当前验证结果

已执行并通过：

- 所有 `zhuzhiliao-mvp/*.php` 和 `api/*.php` 的 `php -l`。
- `assets/app.js`、`assets/i18n.js`、`zhuzhiliao/sw.js` 的 `node --check`。
- `manifest.webmanifest` JSON 校验。
- 标准版 Manifest、Service Worker、Three.js、3D 启动模块返回 HTTP 200。
- 默认作品启用 3D 画布。
- 自定义图片作品关闭 3D，并完全替换默认蝉。
- 浏览器录音停止回调不再因空元素报错。
- 已有录音可以从“试听”切换为“暂停”。
- 低转速作品自动甩时会产生声波和模拟字反馈。
- 受保护素材：所有者请求返回 HTTP 200；素材 MIME 和长度正确。
- 英文和繁体分享页的全部可见标准文案跟随作品语言，无简体中文回退。
- 两套海报模板均可生成作品标题、副标题和有效分享二维码。
- `start.sh` 通过 Bash 语法、帮助信息、PHP 版本/扩展和端口占用检查。
- PHP 和 Git diff 空白检查通过。

尚未形成自动化覆盖：

- 不同真实 IP 的权限矩阵。
- Safari/iOS 真机录音。
- Redis 中断及恢复。
- 200 个作品上限下的并发创建。
- 生产 Nginx/Apache/PHP-FPM 部署。

## 5. Git 提交范围建议

建议本次功能提交包含：

```text
.gitignore
index.html
assets/main.css
assets/icons/zlkz.png
assets/icons/zlzwj.png
start.sh
zhuzhiliao/index.html
zhuzhiliao/manifest.webmanifest
zhuzhiliao/sw.js
zhuzhiliao-mvp/
doc/06-变更记录.md
doc/08-知了快做MVP提交前审查与AI交接.md
```

注意：

- `zhuzhiliao-mvp/data/` 已被忽略，不应提交真实作品、录音、图片、IP 哈希或密码哈希。
- `zhuzhiliao-mvp/QR_CODE_LICENSE` 应和 `qrcode.min.js` 一起提交。
- `start.sh`、`assets/icons/zlkz.png`、`assets/icons/zlzwj.png` 属于本次海报和本地启动功能，应随本次功能一并提交。
- 仍不建议使用 `git add .` 盲目提交；先确认 `git status` 中没有运行时作品数据或其他个人文件。

## 6. 推荐提交拆分

为了方便回滚，建议拆成两个提交：

1. `feat: add customizable cicada MVP editor and sharing`
   - `zhuzhiliao-mvp/`
   - 首页和标准版创建入口
2. `fix: repair standard PWA and 3D asset paths`
   - `zhuzhiliao/index.html`
   - `zhuzhiliao/manifest.webmanifest`
   - `zhuzhiliao/sw.js`
   - 文档可放在第二个提交或独立文档提交

如果目标是保存当前阶段快照，也可以合并为一个提交，但提交信息应明确标注 `MVP`，避免后续 AI 或开发者误认为已经完成生产安全加固。

## 7. 后续 AI 接手顺序

后续 AI 建议按以下顺序继续：

1. 增加生产环境变量模板和启动时安全检查。
2. 将 IP 所有权升级为编辑令牌或用户鉴权。
3. 增加 CSRF、Origin 校验和安全响应头。
4. 修复受保护作品历史元数据/缩略图策略。
5. 增加录音时长上限、计时器、失败清理和 Safari 回退。
6. 为权限矩阵、密码素材、海报和 3D/2D 切换增加自动化测试。
7. 最后再拆分 `share.php` 和格式化单行 PHP/JS。
