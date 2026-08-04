<?php
/**
 * 流量统计接口
 * GET /api/stats.php  -> 记录一次访问并返回当前 PV/UV/在线
 * 也可通过 POST 显式触发记录。
 */
require __DIR__ . '/lib/redis.php';

require_method('GET', 'POST', 'OPTIONS');

$redis = redis_connect();
$ip = client_ip();
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$today = date('Y-m-d');
$now = time();

// 在线标识：IP + UA 哈希，5 分钟内有效
$online_key = 'online:' . md5($ip . '|' . $ua);
$redis->zAdd('cgos:stats:online', $now + 300, $online_key);
$redis->zRemRangeByScore('cgos:stats:online', '-inf', $now);
$online = (int)$redis->zCount('cgos:stats:online', $now, '+inf');

// 总 PV / 今日 PV
$redis->incr('cgos:stats:pv');
$redis->incr("cgos:stats:pv:$today");

// UV：使用 HyperLogLog 做 IP 去重
$redis->pfAdd('cgos:stats:uv', [$ip]);
$redis->pfAdd("cgos:stats:uv:$today", [$ip]);

json_response(200, [
    'pv' => (int)$redis->get('cgos:stats:pv'),
    'uv' => (int)$redis->pfCount('cgos:stats:uv'),
    'today_pv' => (int)$redis->get("cgos:stats:pv:$today"),
    'today_uv' => (int)$redis->pfCount("cgos:stats:uv:$today"),
    'online' => $online,
]);
