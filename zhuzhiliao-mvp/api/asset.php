<?php
declare(strict_types=1);

require __DIR__.'/common.php';

$id=safe_id($_GET['id']??null);
$type=(string)($_GET['type']??'');
if(!$id||!in_array($type,['image','audio'],true)){
    http_response_code(404);
    exit;
}

$project=read_project_file($id);
if(!$project){
    http_response_code(404);
    exit;
}

$editing=($_GET['edit']??'')==='1';
$owner=project_owned_by_requester($project);
$admin=admin_authenticated();
if($editing&&!$owner&&!$admin){
    http_response_code(403);
    exit;
}

$passwordHash=(string)($project['access']['passwordHash']??'');
$password=mb_substr((string)($_GET['pwd']??''),0,64);
if($passwordHash!==''&&!$editing&&!$owner&&!$admin&&!password_verify($password,$passwordHash)){
    http_response_code(403);
    exit;
}

$asset=$project['assets'][$type]??null;
if(!is_array($asset)||empty($asset['file'])||empty($asset['mime'])){
    http_response_code(404);
    exit;
}

$file=project_path($id).'/'.basename((string)$asset['file']);
if(!is_file($file)){
    http_response_code(404);
    exit;
}

header('Content-Type: '.$asset['mime']);
header('Content-Length: '.filesize($file));
header($passwordHash!==''?'Cache-Control: private, max-age=3600':'Cache-Control: public, max-age=31536000, immutable');
header('X-Content-Type-Options: nosniff');
readfile($file);
