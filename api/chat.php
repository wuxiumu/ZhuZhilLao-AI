<?php
/**
 * 聊天/对话接口（简单 REST 版）
 * GET  -> 获取最近对话记录
 * POST -> 发送 name + message
 */
require __DIR__ . '/lib/redis.php';

require_method('GET', 'POST', 'OPTIONS');
$redis = redis_connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $limit = min(max((int)($_GET['limit'] ?? 50), 1), 100);
    $items = $redis->lRange('cgos:chat', 0, $limit - 1);
    $list = array_map(fn ($x) => json_decode($x, true), $items);
    json_response(200, ['list' => $list]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = parse_json_input();
    $name = sanitize($input['name'] ?? '匿名', 32) ?: '匿名';
    $message = sanitize($input['message'] ?? '', 500);

    if ($message === '') {
        json_response(400, ['error' => 'message is required']);
    }

    // 简单防刷：同一 IP 10 秒内最多 3 条
    $ip = client_ip();
    $rate_key = "rate:chat:$ip";
    $current = (int)$redis->get($rate_key);
    if ($current >= 3) {
        json_response(429, ['error' => 'too many messages, please wait 10 seconds']);
    }
    $redis->incr($rate_key);
    $redis->expire($rate_key, 10);

    $entry = [
        'name' => $name,
        'message' => $message,
        'time' => $now = time(),
        'ip' => $ip,
    ];
    $redis->lPush('cgos:chat', json_encode($entry, JSON_UNESCAPED_UNICODE));
    $redis->lTrim('cgos:chat', 0, 499); // 仅保留最近 500 条

    json_response(200, ['ok' => true, 'id' => $now]);
}
