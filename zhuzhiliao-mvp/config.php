<?php
declare(strict_types=1);
return [
    'storage'=>['project_root'=>__DIR__.'/data/projects'],
    'limits'=>['max_projects_per_ip'=>10,'max_projects_total'=>200,'max_image_bytes'=>5*1024*1024,'max_audio_bytes'=>10*1024*1024,'write_requests_per_minute'=>20],
    'admin'=>['username'=>getenv('ZZL_ADMIN_USERNAME')?:'admin','password'=>getenv('ZZL_ADMIN_PASSWORD')?:'admin123','session_key'=>'zzl_mvp_admin'],
    'security'=>['ip_hash_key'=>getenv('ZZL_IP_HASH_KEY')?:'change-this-ip-hash-key-before-production','trust_proxy'=>filter_var(getenv('ZZL_TRUST_PROXY')?:'0',FILTER_VALIDATE_BOOL)],
];
