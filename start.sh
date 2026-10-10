#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
HOST="${ZZL_HOST:-127.0.0.1}"
PORT="${ZZL_PORT:-8080}"
FORCE_STOP=0

usage() {
    printf '用法: %s [端口] [--force]\n' "$(basename "$0")"
    printf '示例: %s 8080          # 交互确认端口占用\n' "$(basename "$0")"
    printf '      %s 8080 --force  # 自动停止本项目旧服务\n' "$(basename "$0")"
}

for argument in "$@"; do
    case "$argument" in
        --force|-f) FORCE_STOP=1 ;;
        --help|-h) usage; exit 0 ;;
        *[!0-9]*|'') printf '未知参数: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
        *) PORT="$argument" ;;
    esac
done

if (( PORT < 1 || PORT > 65535 )); then
    printf '端口必须在 1-65535 之间。\n' >&2
    exit 2
fi

if ! command -v php >/dev/null 2>&1; then
    printf '未找到 PHP，请先安装 PHP 8.1 或更高版本。\n' >&2
    exit 1
fi

PHP_VERSION="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
if ! php -r 'exit(PHP_VERSION_ID >= 80100 ? 0 : 1);'; then
    printf '当前 PHP %s，项目需要 PHP 8.1 或更高版本。\n' "$PHP_VERSION" >&2
    exit 1
fi

for extension in json fileinfo mbstring session; do
    if ! php -r "exit(extension_loaded('$extension') ? 0 : 1);"; then
        printf '缺少 PHP 扩展: %s\n' "$extension" >&2
        exit 1
    fi
done

PROJECT_DIR="$ROOT_DIR/zhuzhiliao-mvp/data/projects"
mkdir -p "$PROJECT_DIR"
if [[ ! -w "$PROJECT_DIR" ]]; then
    printf '作品目录不可写: %s\n' "$PROJECT_DIR" >&2
    exit 1
fi

REDIS_HOST_VALUE="${REDIS_HOST:-127.0.0.1}"
REDIS_PORT_VALUE="${REDIS_PORT:-6379}"
if ! REDIS_HOST="$REDIS_HOST_VALUE" REDIS_PORT="$REDIS_PORT_VALUE" php -r '
    $socket = @fsockopen((string)getenv("REDIS_HOST"), (int)getenv("REDIS_PORT"), $errorCode, $errorMessage, 0.25);
    if ($socket) { fclose($socket); exit(0); }
    exit(1);
'; then
    printf '⚠️  Redis %s:%s 当前不可连接；页面可打开，但发布与限流接口可能不可用。\n' "$REDIS_HOST_VALUE" "$REDIS_PORT_VALUE"
fi

if command -v lsof >/dev/null 2>&1; then
    mapfile_supported=0
    if builtin help mapfile >/dev/null 2>&1; then mapfile_supported=1; fi
    if (( mapfile_supported )); then
        mapfile -t PORT_PIDS < <(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
    else
        PORT_PIDS=()
        while IFS= read -r pid; do [[ -n "$pid" ]] && PORT_PIDS+=("$pid"); done < <(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
    fi
    if (( ${#PORT_PIDS[@]} > 0 )); then
        printf '⚠️  端口 %s 已被占用（PID: %s）\n' "$PORT" "${PORT_PIDS[*]}"
        if (( FORCE_STOP == 0 )); then
            if [[ ! -t 0 ]]; then
                printf '非交互环境不会自动停止进程；可确认后使用 --force。\n' >&2
                exit 1
            fi
            read -r -p '停止占用进程并继续？[y/N] ' confirmation
            [[ "$confirmation" =~ ^[Yy]$ ]] || { printf '已取消。\n'; exit 1; }
        fi
        kill "${PORT_PIDS[@]}"
        for _ in 1 2 3 4 5 6 7 8 9 10; do
            lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 || break
            sleep 0.2
        done
        if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
            printf '端口仍被占用，未强制终止进程，请手动处理。\n' >&2
            exit 1
        fi
        printf '✓ 已停止旧进程\n'
    fi
fi

printf '\n知了快做 MVP 本地服务\n'
printf 'PHP: %s | Redis: %s:%s\n' "$PHP_VERSION" "$REDIS_HOST_VALUE" "$REDIS_PORT_VALUE"
printf '编辑器: http://%s:%s/zhuzhiliao-mvp/\n' "$HOST" "$PORT"
printf '标准版: http://%s:%s/zhuzhiliao/\n' "$HOST" "$PORT"
printf '按 Ctrl+C 停止服务。\n\n'

cd "$ROOT_DIR"
exec php \
    -d upload_max_filesize=10M \
    -d post_max_size=16M \
    -d max_file_uploads=4 \
    -S "$HOST:$PORT" \
    -t "$ROOT_DIR"
