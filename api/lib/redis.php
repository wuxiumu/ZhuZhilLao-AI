<?php
/**
 * Redis 连接公共库
 * 读取环境变量 REDIS_HOST / REDIS_PORT，连接失败时返回 500。
 */

function cors_headers(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function redis_connect(bool $exitOnError = true): ?Redis {
    $host = getenv('REDIS_HOST') ?: '127.0.0.1';
    $port = (int)(getenv('REDIS_PORT') ?: 6379);

    $redis = new Redis();
    try {
        if (!@$redis->connect($host, $port, 2)) {
            throw new RuntimeException('connection failed');
        }
        $redis->select(0);
    } catch (Throwable $e) {
        if ($exitOnError) {
            json_response(503, ['error' => 'redis unavailable', 'detail' => $e->getMessage()]);
        }
        return null;
    }
    return $redis;
}

function client_ip(): string {
    $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = $_SERVER[$h];
            if ($h === 'HTTP_X_FORWARDED_FOR') {
                $parts = explode(',', $ip);
                $ip = trim($parts[0]);
            }
            return filter_var($ip, FILTER_VALIDATE_IP) ?: 'unknown';
        }
    }
    return 'unknown';
}

function json_response(int $code, array $data): void {
    http_response_code($code);
    cors_headers();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_method(string ...$methods): void {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        cors_headers();
        exit;
    }
    if (!in_array($_SERVER['REQUEST_METHOD'], $methods, true)) {
        json_response(405, ['error' => 'method not allowed']);
    }
}

/**
 * 清理输入字符串：去除首尾空白、控制字符，限制最大长度。
 */
function sanitize(string $text, int $maxLength = 500): string {
    $text = trim($text);
    $text = preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u', '', $text) ?? '';
    return mb_substr($text, 0, $maxLength);
}

function parse_json_input(): array {
    $input = json_decode(file_get_contents('php://input') ?: '{}', true);
    return is_array($input) ? $input : [];
}
