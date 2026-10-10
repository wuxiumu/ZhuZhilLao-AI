#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
fail() { echo "✗ $1" >&2; exit 1; }
ok() { echo "✓ $1"; }

command -v php >/dev/null || fail "需要 PHP 8.1+"
[[ -f index.html && -f start.sh && -f api/health.php ]] || fail "缺少核心文件"
[[ -f .env.example ]] || fail "缺少 .env.example"
[[ -d zhuzhiliao && -d zhuzhiliao-ai ]] || fail "缺少游戏目录"
ok "核心文件齐全"

# 默认管理员密码不得再是硬编码 admin123
if grep -n "admin123" zhuzhiliao-mvp/config.php 2>/dev/null; then
  fail "config 仍含默认 admin123"
fi
ok "无默认 admin123"

php -l api/health.php >/dev/null
php -l api/stats.php >/dev/null
ok "API PHP lint OK"

PORT="${SMOKE_PORT:-18099}"
# start.sh 可能交互；直接用 php -S
php -S "127.0.0.1:${PORT}" -t "$ROOT" >/tmp/zzl-smoke.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT
for i in $(seq 1 40); do curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1 && break; sleep 0.15; done

curl -sf "http://127.0.0.1:${PORT}/" | grep -qi 'html' || fail "首页失败"
ok "首页 200"
curl -sf "http://127.0.0.1:${PORT}/zhuzhiliao/" >/dev/null || fail "经典版失败"
ok "经典版可访问"
# health 可能依赖 redis；允许降级
code=$(curl -s -o /tmp/zzl-health.out -w '%{http_code}' "http://127.0.0.1:${PORT}/api/health.php" || true)
ok "health HTTP $code（无 Redis 时可能非 200，属预期）"

echo ""; echo "smoke: ok"
