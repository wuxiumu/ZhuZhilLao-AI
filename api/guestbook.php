<?php
/**
 * 留言接口
 * GET  -> 获取最近留言
 * POST -> 提交 email + message
 */
require __DIR__ . '/lib/redis.php';

require_method('GET', 'POST', 'OPTIONS');
$redis = redis_connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $limit = min(max((int)($_GET['limit'] ?? 20), 1), 50);
    $items = $redis->lRange('cgos:guestbook', 0, $limit - 1);
    $list = array_map(fn ($x) => json_decode($x, true), $items);
    json_response(200, ['list' => $list]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = parse_json_input();
    $email = filter_var(sanitize($input['email'] ?? '', 128), FILTER_VALIDATE_EMAIL);
    $message = sanitize($input['message'] ?? '', 500);

    if (!$email) {
        json_response(400, ['error' => 'invalid email']);
    }
    if ($message === '') {
        json_response(400, ['error' => 'message is required']);
    }

    // 简单防刷：同一 IP 1 分钟内最多 5 条
    $ip = client_ip();
    $rate_key = "rate:guestbook:$ip";
    $current = (int)$redis->get($rate_key);
    if ($current >= 5) {
        json_response(429, ['error' => 'too many messages, please wait a minute']);
    }
    $redis->incr($rate_key);
    $redis->expire($rate_key, 60);

    $entry = [
        'email' => $email,
        'message' => $message,
        'time' => $now = time(),
        'ip' => $ip,
    ];
    $redis->lPush('cgos:guestbook', json_encode($entry, JSON_UNESCAPED_UNICODE));
    $redis->lTrim('cgos:guestbook', 0, 199); // 仅保留最近 200 条

    json_response(200, ['ok' => true, 'id' => $now]);
}
