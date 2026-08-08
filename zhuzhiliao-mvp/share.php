<?php
declare(strict_types=1);

function render_standard_share(string $id,string $title,string $description):void
{
    $file=__DIR__.'/../zhuzhiliao/index.html';
    $html=is_file($file)?(string)file_get_contents($file):'';
    if($html===''){
        http_response_code(500);
        echo '标准版页面暂时不可用';
        return;
    }

    $esc=static fn(string $value):string=>htmlspecialchars($value,ENT_QUOTES,'UTF-8');
    $html=preg_replace('/<title>.*?<\/title>/s','<title>'.$esc($title).' · 知了</title>',$html,1)??$html;
    $html=preg_replace('/<meta name="description" content="[^"]*">/','<meta name="description" content="'.$esc($description).'">',$html,1)??$html;
    $html=str_replace('<link rel="stylesheet" href="../assets/chat-widget.css">','',$html);
    $html=str_replace('<link rel="manifest" href="manifest.webmanifest">','',$html);
    $html=preg_replace('/<script src="\.\.\/assets\/chat-widget\.js"><\/script>\s*/','',$html)??$html;
    $html=preg_replace('/<!-- 51\.la 统计 -->.*?<script>LA\.init\(.*?<\/script>/s','',$html)??$html;
    $html=str_replace("try{ want3d = localStorage.getItem('zzl_3d') !== '0'; }catch(_){}","want3d = true;",$html);
    $html=str_replace(
        "if('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:'){\n  navigator.serviceWorker.register('sw.js').catch(() => {});\n}",
        '',
        $html
    );

    $html=str_replace('ROPE_LEN = clamp(minDim*0.28, 90, 150);','ROPE_LEN = window.ZZL_MVP_ROPE || clamp(minDim*0.28, 90, 150);',$html);
    $html=str_replace('AUTO_R   = clamp(minDim*0.13, 38, 58);','AUTO_R   = window.ZZL_MVP_RADIUS || clamp(minDim*0.13, 38, 58);',$html);
    $html=str_replace('auto.rps += (3.4 - auto.rps)*Math.min(1, dt*1.1);','auto.rps += ((window.ZZL_MVP_SPEED || 3.4) - auto.rps)*Math.min(1, dt*1.1);',$html);
    $html=str_replace(
        'drive = clamp((rps - 1.1)/2.6, 0, 1);',
        "drive = window.ZZL_MVP_SPEED\n    ? clamp((rps - Math.max(0.15, window.ZZL_MVP_SPEED*0.18))/Math.max(0.3, window.ZZL_MVP_SPEED*0.65), 0, 1)\n    : clamp((rps - 1.1)/2.6, 0, 1);",
        $html
    );
    $html=str_replace('function toyScale(){ return clamp(Math.min(W, H)*0.155, 64, 88); }','function toyScale(){ return window.ZZL_MVP_SIZE || clamp(Math.min(W, H)*0.155, 64, 88); }',$html);
    $html=str_replace("ctx.fillText('哇', 0, 0);","ctx.fillText(window.ZZL_MVP_NEXT_ECHO ? window.ZZL_MVP_NEXT_ECHO() : '哇', 0, 0, Math.min(W*.42, 420));",$html);
    $html=str_replace("sky.addColorStop(0,    '#0a1028');","sky.addColorStop(0,    (window.ZZL_MVP_NIGHT_COLORS || [])[0] || '#0a1028');",$html);
    $html=str_replace("sky.addColorStop(0.45, '#16204a');","sky.addColorStop(0.45, (window.ZZL_MVP_NIGHT_COLORS || [])[1] || '#16204a');",$html);
    $html=str_replace("sky.addColorStop(0.78, '#2c2a55');","sky.addColorStop(0.78, (window.ZZL_MVP_NIGHT_COLORS || [])[2] || '#2c2a55');",$html);
    $html=str_replace("sky.addColorStop(1,    '#43325a');","sky.addColorStop(1,    (window.ZZL_MVP_NIGHT_COLORS || [])[3] || '#43325a');",$html);
    $html=str_replace(
        '  // 蝉形竹筒：膜端(头)朝绳，筒身沿绳方向甩出',
        "  // 蝉形竹筒：膜端(头)朝绳，筒身沿绳方向甩出\n  if(window.ZZL_MVP_CUSTOM_IMAGE && window.ZZL_MVP_DRAW_IMAGE){ window.ZZL_MVP_DRAW_IMAGE(); return; }",
        $html
    );
    $html=str_replace('  按住 · 画圈 · 甩起来','  <span id="zzlHintText">按住 · 画圈 · 甩起来</span>',$html);
    $html=str_replace(
        "autoBtn.textContent = on ? '停一停' : '自动甩';",
        "autoBtn.textContent = window.ZZL_MVP_UI ? (on ? window.ZZL_MVP_UI.autoStop : window.ZZL_MVP_UI.autoStart) : (on ? '停一停' : '自动甩');",
        $html
    );

    $projectId=json_encode($id,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    $adapter=<<<HTML
<link rel="stylesheet" href="assets/share.css">
<script src="assets/qrcode.min.js"></script>
<script src="assets/share-config.js"></script>
<div class="zzl-share-modal" id="zzlGate" hidden>
  <form class="zzl-share-card" id="zzlGateForm">
    <h2 id="zzlGateTitle"></h2><p id="zzlGateHelp"></p>
    <input id="zzlPassword" type="password" autocomplete="current-password">
    <small id="zzlGateError"></small><button class="primary" id="zzlGateOpen" type="submit"></button>
  </form>
</div>
<div class="zzl-share-modal" id="zzlShare" hidden>
  <div class="zzl-share-card"><h2 id="zzlShareTitle"></h2><div id="zzlShareQr"></div>
    <input id="zzlShareUrl" readonly><div class="zzl-actions">
      <button class="primary" id="zzlCopy"></button><button id="zzlSystemShare"></button>
      <button id="zzlPosterOpen"></button><button id="zzlShareClose"></button>
    </div>
  </div>
</div>
<div class="zzl-share-modal" id="zzlPoster" hidden>
  <div class="zzl-share-card zzl-poster-card"><h2 id="zzlPosterTitle"></h2>
    <canvas id="zzlPosterCanvas" width="1536" height="1024"></canvas>
    <div class="zzl-template-actions"><button class="active" data-poster-template="quick"></button><button data-poster-template="craft"></button></div>
    <div class="zzl-actions"><button class="primary" id="zzlPosterDownload"></button><button id="zzlPosterShare"></button><button id="zzlPosterClose"></button></div>
  </div>
</div>
<div id="zzlPosterQrTemp" aria-hidden="true"></div>
<script>window.ZZL_SHARE_PROJECT_ID={$projectId};</script>
<script src="assets/share-app.js"></script>
HTML;
    $html=str_replace('</body>',$adapter."\n</body>",$html);
    echo $html;
}
