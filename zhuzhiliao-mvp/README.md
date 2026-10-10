# 知了快做 MVP

PHP + Redis + 本地文件存储的知了创作工具。

- 编辑器：`/zhuzhiliao-mvp/`
- 分享页：`/zhuzhiliao-mvp/?id=<作品ID>`
- 直接生成海报：`/zhuzhiliao-mvp/?id=<作品ID>&poster=1`
- 编辑作品：`/zhuzhiliao-mvp/?edit=<作品ID>`
- 正式作品：`data/projects/<id>/project.json`
- Redis：草稿、项目缓存和接口限流

主要配置集中在 `config.php`：每个 IP 最多 10 个作品，全站最多 200 个。默认管理员为 `admin / admin123`，上线前必须使用 `ZZL_ADMIN_PASSWORD` 和 `ZZL_IP_HASH_KEY` 环境变量覆盖。

当前 IP 创建的作品可编辑；编辑其他 IP 或旧作品需要管理员登录。只有管理员可以删除作品。

分享页简体中文、繁体中文和英文文案集中在 `assets/share-config.js`。两套海报使用根目录 `assets/icons/zlkz.png`、`assets/icons/zlzwj.png`，会动态叠加作品信息与二维码。

本地启动：

```bash
./start.sh
./start.sh 8081
```

脚本会检查 PHP 8.1+、必要扩展、Redis、作品目录权限和端口占用。需要替换已有本地服务时可显式使用 `./start.sh 8080 --force`。
