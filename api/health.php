<?php
/**
 * 健康检查接口
 * GET /api/health.php -> 返回服务与 Redis 状态
 */
require __DIR__ . '/lib/redis.php';

require_method('GET', 'OPTIONS');

$start = microtime(true);
$redis = redis_connect(false);
$ok = $redis && $redis->ping() !== false;

json_response($ok ? 200 : 503, [
    'status' => $ok ? 'ok' : 'degraded',
    'redis' => $ok,
    'time_ms' => round((microtime(true) - $start) * 1000, 2),
]);
