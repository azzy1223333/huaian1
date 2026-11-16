/* ============================================================
   槐安里：未寄出的全家福 — 页面渲染
   ============================================================ */

window.PAGES = (function () {
  'use strict';

  const D = window.GAME_DATA;
  const FRAG = {};
  const CLUE = {};
  D.FRAGMENTS.forEach(function (f) { FRAG[f.id] = f; });
  D.CLUES.forEach(function (c) { CLUE[c.id] = c; });

  /* ---------------- 基础工具 ---------------- */

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pad(n, len) {
    var s = String(n);
    while (s.length < len) s = '0' + s;
    return s;
  }

  function fragmentCount(state) {
    return Array.isArray(state.fragments) ? state.fragments.length : 0;
  }

  function hasFrag(state, id) {
    return Array.isArray(state.fragments) && state.fragments.indexOf(id) !== -1;
  }

  function hasClue(state, id) {
    return Array.isArray(state.clues) && state.clues.indexOf(id) !== -1;
  }

  function navLink(path, label, active, extraClass) {
    var cls = extraClass || '';
    if (active) cls += ' active';
    return '<a href="#' + esc(path) + '" data-nav="' + esc(path) + '" class="' + cls.trim() + '">' + label + '</a>';
  }

  function visitCount(state) {
    var n = 403 + (state.visited ? state.visited.length : 0);
    return Math.min(n, 999999);
  }

  function counterHTML(state, digitsOnly) {
    var n = pad(visitCount(state), 6);
    var out = '';
    for (var i = 0; i < n.length; i++) out += '<span>' + n.charAt(i) + '</span>';
    return digitsOnly ? out : '<div class="counter-digits">' + out + '</div>';
  }

  function progressDots(state) {
    var count = fragmentCount(state);
    var out = '<div class="progress-strip" aria-label="底片收集进度">';
    for (var i = 1; i <= 7; i++) out += '<span class="' + (i <= count ? 'on' : '') + '"></span>';
    return out + '</div>';
  }

  function progressNote(state) {
    var n = fragmentCount(state);
    if (n === 0) return '尚未找到任何底片。';
    if (n < 4) return '你找到了 ' + n + ' 张底片。照片的边缘开始显影。';
    if (n < 6) return '你找到了 ' + n + ' 张底片。有人正在 OICQ 上等你。';
    if (n === 6) return '六张底片。车棚后面的铁门可以打开了。';
    if (n === 7) return '七张底片。是时候把照片拼回去了。';
    return '';
  }

  function fragmentAction(state, id, label) {
    if (hasFrag(state, id)) {
      return '<span class="tag">已收入线索本</span>';
    }
    return '<button type="button" class="btn small primary" data-action="collect-fragment" data-fragment="' + esc(id) + '">' +
      esc(label || '收取底片') + '</button>';
  }

  function clueAction(state, id, label) {
    if (hasClue(state, id)) {
      return '<span class="tag">线索已记录</span>';
    }
    return '<button type="button" class="btn small" data-action="add-clue" data-clue="' + esc(id) + '">' +
      esc(label || '记下这条线索') + '</button>';
  }

  function fragmentThumb(id) {
    return '<img src="' + esc(ASSET(id)) + '" alt="" loading="lazy">';
  }

  function ASSET(key) {
    if (D.ASSETS[key]) return D.ASSETS[key];
    return D.ASSETS.group;
  }

  /* ---------------- 站点框架 ---------------- */

  function marqueeText(state) {
    var n = fragmentCount(state);
    if (state.gateOpen && n >= 7) return '本站永久有效。请在天亮前，把照片还给她。';
    if (state.gateOpen) return '门已经开了。不要回头。不要相信你听见的名字。';
    if (n >= 7) return '七张底片已经找齐。请前往「修复全家福」。';
    if (n >= 6) return '本站寻人：沈小满。最后一张底片，在车棚后面的防空洞里。';
    if (n >= 4) return '有人正在 OICQ 上等你。她说，不要相信公告栏。';
    if (n >= 1) return '槐安里社区 · 有些事情没有写进公告，但照片记得。';
    return '欢迎光临槐安里社区！本站是居民自发建立的网上家园，请使用 IE5.0 浏览器，800×600 分辨率浏览。';
  }

  function headerSub(state) {
    if (state.gateOpen) return '槐安里社区 · 档案修复模式 · 请保持安静';
    if (fragmentCount(state) >= 4) return '槐安里社区 · 居民自建网上家园 · 本站永久有效';
    return '槐安里社区 · 居民自建网上家园 · 建于一九九九年';
  }

  function siteHeader(state) {
    return '' +
      '<header class="site-header">' +
        '<div class="brand-block">' +
          '<p class="brand-kicker">HUAI\'ANLI COMMUNITY · ONLINE SINCE 1999</p>' +
          '<h1 class="brand-title"><a href="#/" data-nav="/" style="color:inherit;text-decoration:none">槐安里<span class="brand-dot">·</span>我们的家</a></h1>' +
          '<p class="brand-sub">' + esc(headerSub(state)) + '</p>' +
        '</div>' +
        '<div class="header-side">' +
          '<div class="seal">' + (state.gateOpen ? '档案已启封' : '本站永久有效') + '</div>' +
          '<div style="margin-top:6px">最后更新：2001年9月14日 23:59<br>当前在线：' + (fragmentCount(state) >= 4 ? '2' : '1') + ' 人 · 访客 ' + pad(visitCount(state), 6) + '</div>' +
        '</div>' +
      '</header>' +
      '<div class="marquee" aria-label="站点公告"><span>' + esc(marqueeText(state)) + '</span></div>';
  }

  function siteNav(state, active) {
    var items = [
      ['/', '首 页'],
      ['/notice', '社区公告'],
      ['/album', '居民相册'],
      ['/bbs', '社区 BBS'],
      ['/guestbook', '留 言 本'],
      ['/diary', '小满的主页'],
      ['/chat', 'OICQ 聊天'],
      ['/archive', '旧闻存档'],
      ['/search', '站内搜索'],
      ['/about', '站长的话'],
      ['/links', '友情链接']
    ];
    var html = '<aside class="site-nav"><h2>社 区 导 航</h2><ul>';
    items.forEach(function (item) {
      var isActive = active === item[0] || (item[0] === '/bbs' && active && active.indexOf('/bbs') === 0);
      html += '<li>' + navLink(item[0], item[1], isActive) + '</li>';
    });
    html += '</ul><div class="nav-divider"></div>';
    if (!state.mailRead) {
      html += '<button type="button" class="unread-mail" data-action="open-mail" style="margin:0 6px 8px;width:calc(100% - 12px)">' +
        '<span class="mail-icon" aria-hidden="true"></span><span><b>收件箱（1）</b><br>请帮我按一次快门</span></button>';
    } else {
      html += '<div style="margin:0 8px 6px"><button type="button" class="text-link" data-action="open-mail" style="font-size:9px">查看站内信：请帮我按一次快门</button></div>';
    }
    html += '<div class="nav-note">档案修复进度：<b>' + fragmentCount(state) + '/7</b><br>' + esc(progressNote(state)) + '</div>';
    if (fragmentCount(state) >= 7) {
      html += '<div style="margin:0 6px 8px"><a class="btn small primary" href="#/ritual" data-nav="/ritual" style="width:100%">去修复全家福</a></div>';
    } else if (fragmentCount(state) >= 6) {
      html += '<div style="margin:0 6px 8px"><a class="btn small primary" href="#/underground" data-nav="/underground" style="width:100%">去车棚后面</a></div>';
    }
    html += '<div class="nav-note" style="margin-top:0">OICQ 好友：<b>' + (fragmentCount(state) >= 4 ? '纸飞机（在线）' : '纸飞机（离线）') + '</b><br>最后登录：2001-09-14 23:59</div>';
    html += '<div class="nav-badge">BEST VIEW 800 × 600<br>IE 5.0 / NETSCAPE 4.7</div>';
    html += '</aside>';
    return html;
  }

  function siteFooter(state) {
    return '' +
      '<footer class="site-footer">' +
        '<div class="footer-links">' +
          '<a href="#/" data-nav="/">首页</a>' +
          '<a href="#/about" data-nav="/about">关于本站</a>' +
          '<a href="#/guestbook" data-nav="/guestbook">签写留言</a>' +
          '<a href="#/search" data-nav="/search">站内搜索</a>' +
          '<button type="button" class="text-link" data-action="open-notebook">线索本</button>' +
          '<button type="button" class="text-link" data-action="view-source">查看源代码</button>' +
        '</div>' +
        '<div>本站由 槐安里居委会 主办 · 阿哲 制作维护 · 版权所有，请勿转载</div>' +
        '<div>Copyright © 1999—2001 Huai\'anli Community. 本网页最佳浏览分辨率 800×600。</div>' +
        '<div class="footer-badges">' +
          '<span class="web-badge red">槐安市<br>个人主页联盟</span>' +
          '<span class="web-badge blue">POWERED BY<br>网易免费空间</span>' +
          '<span class="web-badge green">本站已安全运行<br>1024 天</span>' +
          '<span class="web-badge">NO FRAMES<br>NO COOKIES</span>' +
        '</div>' +
        '<div>本站最后更新：2001-09-14 23:59:59 · 访客数：' + pad(visitCount(state), 6) + '</div>' +
        '<button type="button" class="maintenance-link" data-action="open-dev">站点维护 · 开发者入口</button>' +
      '</footer>';
  }

  function pageHead(title, state, metaRight) {
    var meta = metaRight || ('更新于 2001-09-14<br>档案区 · 1999—2001');
    return '' +
      '<div class="content-head">' +
        '<h1>' + esc(title) + '</h1>' +
        '<div class="page-meta">' + meta + '</div>' +
      '</div>';
  }

  function siteLayout(state, opts) {
    opts = opts || {};
    return '' +
      '<div class="site-shell">' +
        siteHeader(state) +
        '<div class="site-body">' +
          siteNav(state, opts.active || opts.route || '') +
          '<section class="site-content">' +
            (opts.before || '') +
            (opts.noHead ? '' : pageHead(opts.title || '', state, opts.meta)) +
            (opts.content || '') +
          '</section>' +
        '</div>' +
        siteFooter(state) +
      '</div>';
  }

  /* ---------------- 首页 ---------------- */

  function renderHome(state) {
    var n = fragmentCount(state);
    var content = '' +
      (state.mailRead ? '' : '<div class="fake-ad"><span><b>【系统提示】</b> 您的收件箱中有一封未读邮件，主题为「请帮我按一次快门」。</span><button type="button" class="ad-btn" data-action="open-mail">打开邮件</button></div>') +
      '<div class="welcome-box">' +
        '<span class="lede-mark" aria-hidden="true">槐</span>' +
        '<p class="lead">欢迎光临 <b>槐安里·我们的家</b>。这里是槐安里居民自己做的网上家园，建于一九九九年冬天。</p>' +
        '<p>你可以在这里查看社区公告、翻看居民相册、在 BBS 上留言，或者去小满的个人主页听一首加载了很久的 MIDI。</p>' +
        '<p class="small">本站由阿哲利用业余时间维护。服务器放在他家阳台上。请不要同时打开超过三个页面，不然会断线。</p>' +
      '</div>' +
      '<div class="home-grid">' +
        '<div>' +
          '<div class="missing-person">' +
            '<div class="missing-inner">' +
              '<div class="missing-photo"><img src="assets/photo-portrait-xiaoman.svg" alt="寻人启事照片：沈小满的旧档案照"></div>' +
              '<div class="missing-info">' +
                '<h3>寻人启事：沈小满，女，13岁</h3>' +
                '<p>于1999年12月31日晚在槐安里7号楼附近失踪。身高约1米50，短发，穿白色棉袄，右手腕有一道烫伤。</p>' +
                '<p class="meta-line">家属联系人：阿哲（站长） · 电话：044-782404 · 本站留言本第404条</p>' +
                '<p class="small">如果你见过她，请告诉我们。哪怕只是一张照片。</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><span>最 新 动 态</span><small>NEWS &amp; NOTICES</small></div>' +
            '<div class="panel-body tight">' +
              '<table class="old-table board-table">' +
                '<tr><td class="time">2001-09-14</td><td><a href="#/about" data-nav="/about" class="topic-title">本站将于今夜零时永久关闭</a> <span class="tag hot">NEW</span></td></tr>' +
                '<tr><td class="time">2001-08-15</td><td><a href="#/notice" data-nav="/notice">寻人启事：沈小满，女，13岁</a></td></tr>' +
                '<tr><td class="time">2000-01-03</td><td><a href="#/archive" data-nav="/archive">关于7号楼地下室渗水的说明</a></td></tr>' +
                '<tr><td class="time">1999-12-20</td><td><a href="#/notice" data-nav="/notice">千禧百家福合影活动通知</a></td></tr>' +
                '<tr><td class="time">1999-12-31</td><td><a href="#/album" data-nav="/album">居民相册更新：千禧年全家福（一）</a></td></tr>' +
              '</table>' +
            '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><span>本 站 说 明</span><small>ABOUT THIS SITE</small></div>' +
            '<div class="panel-body">' +
              '<p>本站所有照片均由槐安里居民授权发布。部分照片因为扫描仪故障，出现了空白、重影或颜色失真，敬请谅解。</p>' +
              '<p class="small">如果你在照片里看到一个不在名单上的人，请不要声张。把照片收好，然后去留言本看看。</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="home-side">' +
          '<div class="side-box weather-box">' +
            '<h3>今 日 天 气</h3>' +
            '<span class="temp">-4℃</span>' +
            '阴 · 西北风3级<br>槐花未开<br><span class="small">槐安市气象台 2001-09-14</span>' +
          '</div>' +
          '<div class="side-box">' +
            '<h3>档 案 修 复</h3>' +
            '<div class="online-box"><span class="online-dot' + (n >= 4 ? '' : ' off') + '"></span>' +
              (n >= 4 ? 'OICQ：纸飞机 在线' : 'OICQ：纸飞机 离线') +
            '</div>' +
            '<div style="margin:5px 0 2px;font-size:10px;color:#5f503a">已找到底片：' + n + ' / 7</div>' +
            progressDots(state) +
            '<div style="margin-top:6px;font-size:9px;color:#6f6049;line-height:1.6">' + esc(progressNote(state)) + '</div>' +
            '<div class="btn-row" style="margin-top:7px"><button type="button" class="btn small" data-action="open-notebook">打开线索本</button></div>' +
          '</div>' +
          '<div class="side-box">' +
            '<h3>访 问 统 计</h3>' +
            '<div class="counter-box"><div class="counter-label">YOU ARE VISITOR NO.</div>' + counterHTML(state) + '</div>' +
            '<div class="small" style="margin-top:6px;text-align:center">本站已运行 1024 天<br>今天是你第 ' + Math.max(1, (state.visited ? state.visited.length : 1)) + ' 次来访</div>' +
          '</div>' +
          '<div class="side-box">' +
            '<h3>站 长 推 荐</h3>' +
            '<div style="font-size:10px;line-height:1.8">' +
              '<a href="#/diary" data-nav="/diary">纸飞机的小窝</a><br>' +
              '<a href="#/bbs/underground" data-nav="/bbs/underground">车棚后面的门千万别开</a><br>' +
              '<a href="#/search" data-nav="/search">站内搜索：404</a>' +
            '</div>' +
            '<div class="under-construction" aria-hidden="true"></div>' +
          '</div>' +
          '<div class="side-box">' +
            '<h3>友 情 链 接</h3>' +
            '<div class="footer-badges" style="margin:0;justify-content:flex-start">' +
              '<span class="web-badge red">网易<br>免费个人主页</span>' +
              '<span class="web-badge blue">碧海银沙<br>聊天室</span>' +
              '<span class="web-badge green">千年虫<br>已修复</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return siteLayout(state, {
      active: '/',
      title: '欢迎回家',
      meta: '首页 · index.htm<br>更新于 2001-09-14 23:59',
      content: content
    });
  }

  /* ---------------- 社区公告 ---------------- */

  function renderNotice(state) {
    var f1 = fragmentAction(state, 'f1', '收取合影底片');
    var content = '' +
      '<div class="official-doc">' +
        '<h2>关于举办“千禧百家福”合影活动的通知</h2>' +
        '<div class="doc-sub">槐社字〔1999〕第100号 · 槐安里社区居民委员会</div>' +
        '<div class="doc-body">' +
          '<p>各楼栋居民：</p>' +
          '<p>为迎接千禧年，展示我社区“文明小区”建设成果，经居委会研究决定，于1999年12月31日（星期五）23时整，在7号楼前自行车棚空地举办“千禧百家福”居民合影活动。请各户至少派一名家庭成员参加。</p>' +
          '<p>本次合影将收入《槐安里社区志》，并上传至社区网站。请居民着深色外套，不要携带宠物。拍照时请勿眨眼。</p>' +
          '<p>特别说明：本次合影按户编号，共一百户。第100户由居委会统一安排。请名单上的居民务必到齐，不得缺席。</p>' +
          '<p>另：近日有居民反映7号楼地下室夜间有声响，系水泵检修所致。请勿靠近，以免发生危险。</p>' +
        '</div>' +
        '<div class="doc-sign">槐安里社区居民委员会<br>1999年12月20日</div>' +
        '<div class="doc-attachment">' +
          '<div><div class="file-name">附件：合影底片_099.jpg（扫描件，损坏）</div><div class="small">拍摄时间：1999-12-31 23:59 · 大小：404KB</div></div>' +
          '<div>' + f1 + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>居民登记名单（节选）</span><small>仅显示第97—100户</small></div>' +
        '<div class="panel-body tight">' +
          '<table class="old-table">' +
            '<tr><th>户号</th><th>姓名</th><th>房号</th><th>备注</th></tr>' +
            '<tr><td>097</td><td>王秀兰</td><td>7-402</td><td>已参加合影</td></tr>' +
            '<tr><td>098</td><td>李建国</td><td>7-403</td><td>已参加合影</td></tr>' +
            '<tr><td>099</td><td>沈小满</td><td>7-404</td><td>登记信息不完整，已划去</td></tr>' +
            '<tr><td>100</td><td class="red">（空）</td><td class="red">（空）</td><td class="red">由居委会统一安排</td></tr>' +
          '</table>' +
          '<div class="btn-row">' + clueAction(state, 'registry', '记下名单异常') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-head"><span>二〇〇〇年一月三日补充说明</span><small>来源：居委会办公室</small></div>' +
        '<div class="panel-body">' +
          '<p>关于7号楼地下室“起火”一事，经查系杂物间电线老化引燃纸箱，过火面积约4平方米。该杂物间长期无人居住，未造成人员伤亡。</p>' +
          '<p class="small">请居民不要传播不实信息。文明小区评比期间，任何个人不得擅自接受媒体采访。</p>' +
          '<div class="btn-row"><a class="btn small" href="#/archive" data-nav="/archive">查看当时的报纸报道</a>' + clueAction(state, 'coverup', '记录官方说法') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-head"><span>2001年8月15日 · 寻人启事</span><small>发布人：阿哲</small></div>' +
        '<div class="panel-body">' +
          '<div class="missing-inner">' +
            '<div class="missing-photo"><img src="assets/photo-portrait-xiaoman.svg" alt="沈小满的旧档案照"></div>' +
            '<div class="missing-info">' +
              '<h3>沈小满，你在哪里？</h3>' +
              '<p>已经一年半了。网站还在。照片还在。我把每一张合影都放大过，最后一排的右边，一直空着一个位置。</p>' +
              '<p>如果你看到这条启事，请去留言本。第404条留言，我一直没有删。</p>' +
              '<p class="meta-line">阿哲 · 2001-08-15 02:13</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return siteLayout(state, {
      active: '/notice',
      title: '社区公告',
      meta: 'news/notice.htm<br>置顶 · 更新于 2001-09-14',
      content: content
    });
  }

  /* ---------------- 居民相册 ---------------- */

  function albumCard(state, opts) {
    var fragAttr = opts.fragment ? ' data-fragment="' + esc(opts.fragment) + '"' : '';
    var locked = opts.locked ? ' locked' : '';
    return '' +
      '<button type="button" class="photo-card' + locked + '" data-action="open-photo" data-photo="' + esc(opts.src) + '" data-title="' + esc(opts.title) + '" data-caption="' + esc(opts.caption) + '"' + fragAttr + ' aria-label="查看照片：' + esc(opts.title) + '">' +
        '<span class="photo-frame">' +
          '<img class="photo-img" src="' + esc(opts.src) + '" alt="' + esc(opts.title) + '" loading="lazy">' +
          '<span class="photo-caption"><span class="photo-no">' + esc(opts.no) + '</span> · ' + esc(opts.file) + '</span>' +
        '</span>' +
        '<span class="photo-meta"><b>' + esc(opts.title) + '</b><br>' + esc(opts.note || '') + '</span>' +
      '</button>';
  }

  function renderAlbum(state) {
    var content = '' +
      '<div class="album-note"><span class="note-mark">※</span><div>本相册共收录 87 张照片，由于扫描仪故障，部分底片损坏。点击照片可查看原图。<br>最后更新：2001-09-14 · 上传者：阿哲</div></div>' +
      '<div class="photo-grid">' +
        albumCard(state, { src: 'assets/photo-group.svg', title: '千禧百家福 · 7号楼合影', note: '第99户的位置好像空着', no: '01', file: 'DSC_0099.jpg', caption: '1999年12月31日 23:59。槐安里7号楼全体居民。第100户未到场。', fragment: 'f2' }) +
        albumCard(state, { src: 'assets/photo-building.svg', title: '7号楼 · 清晨', note: '404的窗户亮了一夜', no: '02', file: 'IMG_0404.jpg', caption: '2000年1月1日 06:12。7号楼。四层最右边的窗户亮着。那间房在登记表上是空房。' }) +
        albumCard(state, { src: 'assets/photo-corridor.svg', title: '四楼走廊', note: '尽头好像站着一个人', no: '03', file: 'CAM_02.jpg', caption: '1999年12月31日 23:47。监控画面翻拍。走廊尽头有一个人形轮廓，身高约1.5米。' }) +
        albumCard(state, { src: 'assets/photo-shed.svg', title: '自行车棚', note: '铁门上的封条被撕过', no: '04', file: 'DSC_0404.jpg', caption: '1999年12月31日 23:58。车棚后面的铁门。封条上写着“禁止入内”，但门是虚掩的。' }) +
        albumCard(state, { src: 'assets/photo-chair.svg', title: '空椅子', note: '第100户的位置', no: '05', file: 'IMGP_0099.jpg', caption: '1999年12月31日。拍摄者说，椅子上原本坐着一个人。冲洗出来以后，只看见一张红纸。' }) +
        albumCard(state, { src: 'assets/photo-official.svg', title: '文明小区表彰会', note: '右下角有一只小鞋', no: '06', file: 'NEWS_0108.jpg', caption: '2000年1月8日。槐安里被评为文明小区。照片右下角有一只红色的小鞋，没有人认领。' }) +
        albumCard(state, { src: 'assets/photo-fire.svg', title: '地下室（禁止传播）', note: '这张照片不该存在', no: '07', file: 'B2_0047.jpg', caption: '2000年1月1日 00:47。地下室。照片被居委会要求删除，但阿哲留了一份。', locked: true }) +
        albumCard(state, { src: 'assets/photo-portrait-noface.svg', title: '未命名', note: '照片里的人没有脸', no: '08', file: 'NO_NAME.jpg', caption: '没有拍摄时间。没有上传记录。文件属性里只有一句话：“请把我还回去。”', fragment: 'f5' })
      '</div>' +
      '<div class="warning-strip" style="margin-top:14px">注意：相册中的第08张照片不在上传记录里。如果你看到了它，请立刻关闭页面，并检查你的收藏夹。</div>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>底片收集进度</span><small>' + fragmentCount(state) + ' / 7</small></div>' +
        '<div class="panel-body">' +
          '<p class="small">点击照片查看大图。如果照片背面有字，大图下方会显示。</p>' +
          progressDots(state) +
          '<div class="btn-row"><button type="button" class="btn small" data-action="open-notebook">查看已收集的底片</button><a class="btn small" href="#/bbs/404" data-nav="/bbs/404">去 BBS 问问</a></div>' +
        '</div>' +
      '</div>';

    return siteLayout(state, {
      active: '/album',
      title: '居民相册',
      meta: 'photo/album.htm<br>87 张照片 · 8 张异常',
      content: content
    });
  }

  /* ---------------- BBS ---------------- */

  function bbsPost(opts) {
    var av = opts.avatar
      ? '<img src="' + esc(opts.avatar) + '" alt="">'
      : esc(opts.initial || '?');
    return '' +
      '<article class="post">' +
        '<div class="post-user">' +
          '<div class="avatar">' + av + '</div>' +
          '<span class="username">' + esc(opts.user) + '</span>' +
          '<span class="usertitle">' + esc(opts.title || '居民') + '</span>' +
          '<div class="userstats">帖数：' + esc(opts.posts || '?') + '<br>来自：' + esc(opts.from || '槐安里') + '<br>注册：' + esc(opts.joined || '1999') + '</div>' +
        '</div>' +
        '<div class="post-body">' +
          '<div class="post-head"><span>' + esc(opts.time) + '</span><span class="floor">' + esc(opts.floor) + '</span></div>' +
          '<div class="post-text">' + opts.body + '</div>' +
          (opts.signature ? '<div class="post-signature">' + opts.signature + '</div>' : '') +
        '</div>' +
      '</article>';
  }

  function renderBBS(state) {
    var content = '' +
      '<div class="bbs-actions">' +
        '<div class="small">版主：阿哲 · 今日发帖：0 · 最后活跃：2001-09-14 23:59</div>' +
        '<div><button type="button" class="btn small" data-action="dead-link" data-message="您尚未登录，且本版块只允许槐安里居民发帖。">发表新帖</button></div>' +
      '</div>' +
      '<div class="post-notice">本版块为槐安里居民内部交流使用。请勿发布寻人、募捐、封建迷信及与社区无关的内容。因服务器硬盘出现坏道，部分旧帖无法显示。</div>' +
      '<table class="old-table board-table">' +
        '<tr><th style="width:46%">主题</th><th>作者</th><th>回复</th><th>最后更新</th></tr>' +
        '<tr class="row-link" data-nav="/about"><td><span class="topic-title">【置顶】本站将于今夜零时永久关闭</span> <span class="tag hot">锁</span></td><td class="author">阿哲</td><td>12</td><td class="time">09-14 23:59</td></tr>' +
        '<tr class="row-link" data-nav="/bbs/404"><td><span class="topic-title">7号楼到底有没有404？</span> <span class="tag hot">热</span></td><td class="author">夜班回家的人</td><td>12</td><td class="time">09-14 23:59</td></tr>' +
        '<tr class="row-link" data-nav="/bbs/underground"><td><span class="topic-title">车棚后面的门千万别开</span></td><td class="author">三楼王姨</td><td>7</td><td class="time">09-13 04:04</td></tr>' +
        '<tr class="row-link" data-nav="/notice"><td><span class="topic-title">寻人：沈小满，13岁，穿白色棉袄</span></td><td class="author">阿哲</td><td>38</td><td class="time">08-15 02:13</td></tr>' +
        '<tr class="row-link" data-action="dead-link" data-message="该主题已被管理员删除。删除原因：与社区无关。"><td><span class="topic-title">昨晚的广播又响了，大家听见了吗</span></td><td class="author">三楼王姨</td><td>5</td><td class="time">08-02 23:59</td></tr>' +
        '<tr class="row-link" data-action="dead-link" data-message="该主题已被管理员删除。删除原因：散布谣言。"><td><span class="topic-title">我在地下室墙上看见好多名字</span></td><td class="author">匿名</td><td>?</td><td class="time">07-29 00:04</td></tr>' +
        '<tr class="row-link" data-action="dead-link" data-message="该主题不存在，或已被并入其他主题。"><td><span class="topic-title">[灌水] 大家新年快乐！</span></td><td class="author">居委会</td><td>99</td><td class="time">01-01 00:00</td></tr>' +
        '<tr class="row-link" data-nav="/guestbook"><td><span class="topic-title">留言本第404条到底是谁写的？</span></td><td class="author">邮递员</td><td>0</td><td class="time">2000-01-01 00:04</td></tr>' +
      '</table>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>在线用户</span><small>1 位访客，0 位会员</small></div>' +
        '<div class="panel-body"><p class="small">当前在线：<b>你</b>、<span class="red">纸飞机（离线）</span>、阿哲（离线）</p><p class="small">服务器时间：2001-09-14 23:59:59 · 距离本站关闭还有 00:00:01</p></div>' +
      '</div>';

    return siteLayout(state, {
      active: '/bbs',
      title: '社区 BBS',
      meta: 'bbs/index.htm<br>共 8 个主题 · 1 个隐藏',
      content: content
    });
  }

  function renderBBS404(state) {
    var attachment = hasFrag(state, 'f3')
      ? '<span class="tag">附件已收入线索本</span>'
      : '<button type="button" class="post-attachment" data-action="open-photo" data-photo="assets/photo-shed.svg" data-title="DSC_0404.jpg" data-caption="照片背面：404不是仓库。她住在里面。拍摄时间 1999-12-31 23:58。" data-fragment="f3"><span class="paperclip" aria-hidden="true">⌁</span>DSC_0404.jpg（404 KB）</button>';

    var content = '' +
      '<div class="bbs-actions"><a class="text-link" href="#/bbs" data-nav="/bbs">← 返回主题列表</a><span class="tag dark">本主题已锁定</span></div>' +
      '<div class="thread">' +
        bbsPost({
          user: '夜班回家的人', title: '新手上路', initial: '夜', posts: '13', from: '7号楼', joined: '1999-11-02',
          time: '2000-01-02 01:13', floor: '楼主',
          body: '<p>我住7号楼6年。门牌从401、402、403，然后直接就是405。</p><p>我问过物业，物业说404是仓库，堆杂物的。可是每天晚上十一点半，我都能听见里面有电视声。</p><p>昨天我数了一下，7号楼一共六层，每层四户，应该是24户。但登记表上有25户。多出来的那一户，没有房号。</p>',
          signature: '—— 夜里回家，别数门牌。'
        }) +
        bbsPost({
          user: '物业张师傅', title: '物业', initial: '张', posts: '4', from: '传达室', joined: '2000-01-01',
          time: '2000-01-02 08:40', floor: '1楼',
          body: '<p>404是仓库。不要再去看了。里面没有电视，是水泵。</p><p>再散布谣言，就断你家网。</p>'
        }) +
        bbsPost({
          user: '纸飞机', title: '离线', avatar: 'assets/photo-portrait-xiaoman.svg', posts: '2', from: '7-404', joined: '1999-12-31',
          time: '2000-01-02 23:59', floor: '2楼',
          body: '<p>我家就在404呀。</p><p>你们为什么看不见？</p>'
        }) +
        bbsPost({
          user: '阿哲', title: '站长', initial: '哲', posts: '1024', from: '7-405', joined: '1999-01-01',
          time: '2001-09-14 23:59', floor: '3楼',
          body: '<p>别查了。</p><p>她不是不在了，是从来没被登记过。</p><p>下面这张照片是我最后一次去车棚后面拍的。门上的封条已经被人撕开了。如果你要去找她，记得先去她的主页，密码是她生日。</p>' + attachment,
          signature: '<span class="red">本帖最后由 阿哲 于 2001-09-14 23:59 编辑</span>'
        })
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-head"><span>版主备注</span><small>最后编辑：2001-09-14 23:59</small></div>' +
        '<div class="panel-body">' +
          '<p class="small">帖子发出后，物业张师傅的账号于2000年1月3日注销。纸飞机的最后登录时间为2000年1月1日00:04。</p>' +
          '<div class="btn-row">' + clueAction(state, 'entrance', '记下防空洞入口') + clueAction(state, 'birthday', '记下生日线索') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="post-notice">提示：本站图片附件需要 IE5.0 以上版本才能查看。如果图片无法显示，请尝试刷新页面，或去居民相册查看。</div>';

    return siteLayout(state, {
      active: '/bbs',
      title: '7号楼到底有没有404？',
      meta: 'bbs/topic.asp?id=404<br>12 回复 · 最后更新 2001-09-14',
      content: content
    });
  }

  function renderBBSUnderground(state) {
    var content = '' +
      '<div class="bbs-actions"><a class="text-link" href="#/bbs" data-nav="/bbs">← 返回主题列表</a><span class="tag">浏览 407 次</span></div>' +
      '<div class="thread">' +
        bbsPost({
          user: '三楼王姨', title: '老居民', initial: '王', posts: '88', from: '7-302', joined: '1999-01-05',
          time: '2001-09-13 04:04', floor: '楼主',
          body: '<p>车棚后面那扇铁门，你们年轻人千万别去开。</p><p>后面是防空洞，七十年代挖的，后来废弃了。小时候我们进去过，墙上全是名字，用粉笔写的，一层压一层。</p><p>1999年12月31日晚上，居委会突然让人把门锁了，说怕小孩乱跑。那天夜里我听见里面有声音，像有人在数数。</p><p>第二天早上，门外面多了一双小鞋。我问是谁的，没人说话。</p>'
        }) +
        bbsPost({
          user: '邮递员', title: '常客', initial: '邮', posts: '32', from: '槐安路', joined: '2000-06-01',
          time: '2001-09-13 06:17', floor: '1楼',
          body: '<p>那天晚上我在7号楼送信，看见居委会的人在车棚前面拉绳子。不是拍合影，是不让人靠近。</p><p>广播里说要放烟花。可我等了半天，只闻到一股烧塑料的味。</p>'
        }) +
        bbsPost({
          user: '阿哲', title: '站长', initial: '哲', posts: '1024', from: '7-405', joined: '1999-01-01',
          time: '2001-09-13 23:59', floor: '2楼',
          body: '<p>门锁是四位数的。她在主页上写过自己的生日。</p><p>进去以后，不管听见谁叫你，都不要回头。</p><p class="red">尤其是听见她叫你。</p>',
          signature: '如果你找到了最后一张底片，请把它带回来。'
        }) +
        bbsPost({
          user: '纸飞机', title: '离线', avatar: 'assets/photo-portrait-xiaoman.svg', posts: '2', from: '7-404', joined: '1999-12-31',
          time: '2000-01-01 00:03', floor: '3楼',
          body: '<p>阿哲哥，门从外面锁了。</p><p>我数到一百了。</p>'
        })
      '</div>' +
      '<div class="warning-strip">本帖内容已被居委会标记为“不实信息”。请勿前往车棚后面。防空洞入口已封死。</div>' +
      '<div class="panel" style="margin-top:12px">' +
        '<div class="panel-head"><span>可记录的信息</span><small>线索本</small></div>' +
        '<div class="panel-body">' +
          '<div class="btn-row">' + clueAction(state, 'entrance', '记录入口位置') + clueAction(state, 'fire', '记录火光与广播') + clueAction(state, 'dontlook', '记录“不要回头”') + '</div>' +
          '<div class="btn-row"><a class="btn small" href="#/diary" data-nav="/diary">去小满的主页找密码</a><a class="btn small" href="#/chat" data-nav="/chat">打开 OICQ</a><a class="btn small primary" href="#/underground" data-nav="/underground">前往车棚后面</a></div>' +
          '<p class="small" style="margin-top:6px">铁门需要至少六张底片才能打开。门锁密码在她的个人主页上。</p>' +
        '</div>' +
      '</div>';

    return siteLayout(state, {
      active: '/bbs',
      title: '车棚后面的门千万别开',
      meta: 'bbs/topic.asp?id=7<br>7 回复 · 最后更新 2001-09-13',
      content: content
    });
  }

  /* ---------------- 留言本 ---------------- */

  function guestEntry(opts) {
    return '' +
      '<article class="guest-entry' + (opts.ghost ? ' ghost-entry' : '') + '" id="' + esc(opts.anchor || '') + '">' +
        '<div class="guest-head">' +
          '<span class="guest-name"><span class="guest-no">#' + esc(opts.no) + '</span>' + esc(opts.name) + '</span>' +
          '<span class="guest-time">' + esc(opts.time) + ' · ' + esc(opts.from || '槐安里') + '</span>' +
        '</div>' +
        '<div class="guest-text">' + opts.text + '</div>' +
        (opts.reply ? '<div class="guest-reply">' + opts.reply + '</div>' : '') +
        (opts.extra || '') +
      '</article>';
  }

  function renderGuestbook(state) {
    var f4 = hasFrag(state, 'f4')
      ? '<div class="btn-row"><span class="tag">已收入线索本</span><a class="btn small" href="#/diary" data-nav="/diary">去她的主页</a></div>'
      : '<div class="btn-row"><button type="button" class="btn small primary" data-action="collect-fragment" data-fragment="f4">把这一条收进线索本</button><button type="button" class="btn small" data-action="open-photo" data-photo="assets/photo-corridor.svg" data-title="第404条留言的附件" data-caption="照片没有文件名。走廊尽头站着一个穿白棉袄的女孩。">查看附件</button></div>';

    var userEntries = (state.guestbook || []).map(function (entry, i) {
      return guestEntry({
        no: 406 + i,
        name: entry.name || '匿名访客',
        time: entry.time || '2001-09-14 23:59',
        from: '你的电脑',
        text: '<p>' + esc(entry.message) + '</p>',
        reply: '<span class="red">[系统]</span> 留言已提交，等待管理员审核。管理员最后登录时间：2001-09-14 23:59。'
      });
    }).join('');

    var content = '' +
      '<div class="guestbook">' +
        guestEntry({
          no: 401, name: '三楼王姨', time: '2000-01-01 00:31', from: '7-302',
          text: '<p>新年快乐。昨晚的广播太响了，我家老头子的心脏病都要犯了。</p><p>还有，谁看见我家门口那双小鞋了？不是我们家的。</p>'
        }) +
        guestEntry({
          no: 402, name: '阿哲', time: '2000-01-01 01:02', from: '7-405',
          text: '<p>小满，如果你能看到，给我回个消息。</p><p>我把论坛恢复了。照片我也重新扫了一遍。最后一排右边那个位置，我给你留着。</p>',
          reply: '<span class="red">[阿哲]</span> 这条留言他后来编辑过 47 次。最后编辑时间：2001-09-14 23:59。'
        }) +
        guestEntry({
          no: 403, name: '纸飞机', time: '1999-12-31 23:59', from: '7-404',
          text: '<p>等会儿要拍全家福了。王姨让我站最后一排，说镜头装不下这么多人。</p><p>阿哲哥说会把我P上去。</p>'
        }) +
        guestEntry({
          no: 404, name: '纸飞机', time: '2000-01-01 00:04', from: '未登记', ghost: true, anchor: 'guest-404',
          text: '<p>如果有一天，有人看到这条留言，请替我去车棚后面看看。</p><p>我把名字写在墙上了。</p><p>不要相信公告栏。也不要回头。</p><p style="text-align:right;color:#7d1a1a">—— 小满</p>',
          extra: f4
        }) +
        guestEntry({
          no: 405, name: '系统', time: '2000-01-01 00:04', from: '服务器',
          text: '<p>留言提交成功。</p><p>当前在线人数：0。</p>',
          reply: '<span class="red">[系统]</span> 此条留言没有经过审核，但无法删除。数据库字段 `author_id` 返回：NULL。'
        }) +
        userEntries +
      '</div>' +
      '<div class="guestbook-pager"><span>第 1 页 / 共 1 页 · 显示 401—405</span><button type="button" class="text-link" data-action="scroll-to" data-target="guest-404">跳到第404条</button></div>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>签写留言</span><small>请勿填写真实个人信息</small></div>' +
        '<div class="panel-body">' +
          '<form data-form="guestbook" autocomplete="off">' +
            '<div class="form-row"><label for="gb-name">你的名字：</label><input id="gb-name" class="retro-input" name="name" maxlength="20" placeholder="访客" style="width:180px"></div>' +
            '<div class="form-row"><label for="gb-message">留言内容：</label></div>' +
            '<textarea id="gb-message" class="retro-textarea" name="message" maxlength="180" placeholder="给槐安里留一句话……" required></textarea>' +
            '<div class="btn-row"><button type="submit" class="btn primary">提交留言</button><span class="small">提交后需要管理员审核。管理员上次登录：2001年。</span></div>' +
          '</form>' +
        '</div>' +
      '</div>' +
      '<div class="inline-note"><b>提示：</b>留言本的第404条无法被删除。你可以试着在站内搜索里输入“404”。</div>';

    return siteLayout(state, {
      active: '/guestbook',
      title: '留 言 本',
      meta: 'guestbook/index.htm<br>共 405 条留言 · 1 条待审核',
      content: content
    });
  }

  /* ---------------- 小满的个人主页 ---------------- */

  function renderDiary(state) {
    var canLast = hasFrag(state, 'f5');
    var f5note = hasFrag(state, 'f5')
      ? '<span class="tag">纸鹤已经展开，底片收入线索本</span>'
      : '<button type="button" class="folded-note" data-action="collect-fragment" data-fragment="f5">打开折纸：最后一张底片被折成了纸鹤</button>';

    var content = '' +
      '<div class="diary-layout">' +
        '<div>' +
          '<div class="diary-cover">' +
            '<h1>纸飞机的小窝</h1>' +
            '<div class="diary-sub">PAPER PLANE\'S HOME · EST. 1999</div>' +
            '<div class="diary-motto">“如果没有人记得，照片就不会显影。”</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><span>我 的 档 案</span><small>最后更新：1999-12-31</small></div>' +
            '<div class="panel-body">' +
              '<table class="profile-table">' +
                '<tr><th>昵称</th><td>纸飞机</td></tr>' +
                '<tr><th>真名</th><td class="red">沈小满</td></tr>' +
                '<tr><th>生日</th><td><b>1987 年 11 月 7 日</b>（今年12岁）</td></tr>' +
                '<tr><th>血型</th><td>O型</td></tr>' +
                '<tr><th>住址</th><td>槐安里 7 号楼 404 室</td></tr>' +
                '<tr><th>喜欢</th><td>槐花、纸飞机、阿哲哥电脑里的红警</td></tr>' +
                '<tr><th>讨厌</th><td>过生日、数数、从外面锁门的声音</td></tr>' +
              '</table>' +
              '<div class="btn-row">' + clueAction(state, 'birthday', '把生日记进线索本') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><span>我 的 日 记</span><small>只给自己看</small></div>' +
            '<div class="panel-body">' +
              '<div class="diary-entry">' +
                '<div class="diary-date"><span>1999-12-25</span><span class="weather">晴，有风</span></div>' +
                '<div class="diary-text"><p>奶奶说，槐花要等到五月才开。可是我的生日在十一月。</p><p>阿哲哥说，等我生日那天，他会去树上挂一串假的槐花。他去年也这么说，后来忘了。</p></div>' +
              '</div>' +
              '<div class="diary-entry">' +
                '<div class="diary-date"><span>1999-12-30</span><span class="weather">阴</span></div>' +
                '<div class="diary-text"><p>王姨来敲门，让我明天晚上去拍全家福。她说我站最后一排就行，脸看不清也没关系。</p><p>我问她，为什么名单上没有我的名字。她说，小孩子的名字不算数。</p></div>' +
              '</div>' +
              '<div class="diary-entry">' +
                '<div class="diary-date"><span>1999-12-31</span><span class="weather">雪</span></div>' +
                '<div class="diary-text"><p>晚上十一点要去车棚前面拍照。我把白棉袄洗了，袖口还是有一点灰。</p><p>阿哲哥说，等照片洗出来，就把我那张贴在网站首页。他还说，如果有人说我不存在，就让他们看照片。</p><p>我有点害怕。车棚后面的铁门一直在响。</p>' + f5note + '</div>' +
              '</div>' +
              '<div class="diary-entry secret-entry">' +
                '<div class="diary-date"><span>？？？？-？？-？？</span><span class="weather">黑</span></div>' +
                '<div class="diary-text"><p>门从外面锁了。我数到一百就有人来。</p><p>我数了七个一百。</p>' +
                  (canLast
                    ? '<p>后面的字被水泡开了。有一页被单独放在另一个地址里：<a href="#/diary/last" data-nav="/diary/last">未寄出的日记</a>。</p>'
                    : '<p>后面的字被水泡开了。纸页的角落画着一只纸飞机，翅膀上有一个四位数的锁孔。</p>') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="quote-box">“阿哲哥，如果照片里没有我，那我是不是就不算住在这里？”<br><span class="small">—— 小满，1999年12月31日 23:47</span></div>' +
        '</div>' +
        '<aside class="diary-side">' +
          '<div class="tinyvisitor">' +
            '<div class="counter-label">MY VISITORS</div>' +
            counterHTML(state) +
            '<div style="margin-top:4px">你是第 <b>' + Math.max(1, (state.visited ? state.visited.length : 1)) + '</b> 个来看我的人</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><span>背 景 音 乐</span></div>' +
            '<div class="panel-body tight">' +
              '<div class="small">致爱丽丝.mid<br><span class="muted">文件大小：0 KB</span></div>' +
              '<div class="btn-row" style="margin-top:6px"><button type="button" class="btn small" data-action="toggle-audio">' + (state.audio ? '暂停播放' : '播放音乐') + '</button></div>' +
              '<div class="small" style="margin-top:5px;color:#8a1a1a">（文件已损坏。你现在听到的是电脑自己的声音。）</div>' +
            '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><span>我 的 好 友</span></div>' +
            '<div class="panel-body tight" style="font-size:10px;line-height:1.9">' +
              '<a href="#/chat" data-nav="/chat">纸飞机（我自己）</a><br>' +
              '<a href="#/about" data-nav="/about">阿哲哥</a><br>' +
              '<a href="#/bbs" data-nav="/bbs">槐安里BBS</a><br>' +
              '<a href="#/guestbook" data-nav="/guestbook">留言本</a>' +
            '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><span>留 言 给 我</span></div>' +
            '<div class="panel-body tight">' +
              '<div class="small">如果你认识我，请在我的留言本里写一句话。</div>' +
              '<div class="btn-row" style="margin-top:6px"><a class="btn small" href="#/chat" data-nav="/chat">打开 OICQ</a></div>' +
            '</div>' +
          '</div>' +
          '<div class="under-construction" aria-hidden="true"></div>' +
        '</aside>' +
      '</div>';

    return siteLayout(state, {
      active: '/diary',
      title: '纸飞机的小窝',
      meta: '~xiaoman/index.htm<br>个人主页 · 最后更新 1999-12-31',
      content: content
    });
  }

  function renderDiaryLast(state) {
    var content = '' +
      '<div class="official-doc" style="background:#f6efdd">' +
        '<h2 style="font-size:20px">未 寄 出 的 日 记</h2>' +
        '<div class="doc-sub">保存于 ~xiaoman/last.htm · 最后修改时间未知</div>' +
        '<div class="doc-body" style="font-family:var(--song);font-size:14px;line-height:2.2">' +
          '<p style="text-align:right;color:#7a6a50;font-size:11px">2000年1月1日 星期六 阴<br>地点：7号楼地下室</p>' +
          '<p>门从外面锁了。</p>' +
          '<p>我数到一百就有人来。我数了七个一百。</p>' +
          '<p>外面很吵。广播说在放烟花，可是我从门缝里只看见红色的光。烟从上面灌下来，像有人往里面倒开水。</p>' +
          '<p>阿哲哥，你听见我叫你了吗？</p>' +
          '<p>我把名字写在墙上了。用你给我的那支蓝色圆珠笔。写得很高，这样他们擦不掉。</p>' +
          '<p class="red">如果有人来，不要回头。你回头，就会看见自己也在照片里。</p>' +
          '<p style="color:#8b7b60">（后面的纸被烧掉了。只剩下一个电话号码：044-782404。）</p>' +
        '</div>' +
        '<div class="doc-sign">纸飞机<br>2000年1月1日 00:04</div>' +
      '</div>' +
      '<div class="warning-strip" style="margin-top:12px">本页面不在网站导航中。你可能是从一条被删掉的链接、搜索缓存，或者别的什么东西那里找到它的。</div>' +
      '<div class="panel" style="margin-top:12px">' +
        '<div class="panel-head"><span>你读完了这页</span><small>2000-01-01</small></div>' +
        '<div class="panel-body">' +
          '<p class="small">如果你还没有找到最后一张底片，请回到她的主页，把折纸展开。如果你已经找到了，去 OICQ 找她。</p>' +
          '<div class="btn-row">' + clueAction(state, 'dontlook', '记录“不要回头”') + '<a class="btn small" href="#/diary" data-nav="/diary">返回纸飞机的小窝</a><a class="btn small" href="#/chat" data-nav="/chat">打开 OICQ</a></div>' +
        '</div>' +
      '</div>';

    return siteLayout(state, {
      active: '/diary',
      title: '未寄出的日记',
      meta: '~xiaoman/last.htm<br>隐藏页面 · 无法从导航进入',
      content: content
    });
  }

  /* ---------------- OICQ ---------------- */

  function msgHTML(msg) {
    if (msg.who === 'sys') {
      return '<div class="msg sys"><span class="msg-bubble">— ' + esc(msg.text) + ' —</span></div>';
    }
    if (msg.who === 'file') {
      return '<div class="msg ghost"><span class="msg-who">纸飞机 发送了一个文件</span>' +
        '<span class="msg-bubble"><button type="button" class="text-link" data-action="open-photo" data-photo="' + esc(msg.src || 'assets/photo-basement.svg') + '" data-title="' + esc(msg.name || '未命名.jpg') + '" data-caption="' + esc(msg.caption || '接收于 2000-01-01 00:00:00。发送者状态：离线。') + '">' + esc(msg.name || '未命名.jpg') + '</button></span></div>';
    }
    var who = msg.who === 'self' ? '我' : (msg.who === 'ghost' ? '纸飞机' : '系统');
    return '<div class="msg ' + (msg.who === 'self' ? 'self' : msg.who) + '">' +
      '<span class="msg-who">' + who + ' · ' + (msg.who === 'self' ? '2001-09-15 00:00' : '2000-01-01 00:04') + '</span>' +
      '<span class="msg-bubble">' + esc(msg.text) + '</span></div>';
  }

  function renderChat(state) {
    var online = fragmentCount(state) >= 4;
    var initial = D.CHAT.initial.map(msgHTML).join('');
    var onlineMsgs = online && !state.chatGreeted ? D.CHAT.online.map(msgHTML).join('') : '';
    var log = (state.chatLog || []).map(msgHTML).join('');
    var contacts = D.CHAT.contacts.map(function (c) {
      var isActive = c.name === '纸飞机';
      var live = isActive && online;
      return '<div class="oicq-contact' + (isActive ? ' active' : '') + (live ? ' online' : '') + '">' +
        '<span class="oicq-avatar"><img src="' + esc(c.avatar) + '" alt=""></span>' +
        '<span>' + esc(c.name) + '</span>' +
        '<span class="contact-status">' + (live ? '在线' : '离线') + '</span>' +
      '</div>';
    }).join('');

    var quick = D.CHAT.quick.map(function (q) {
      return '<button type="button" class="quick-reply" data-action="chat-quick" data-key="' + esc(q.key) + '"' + (online ? '' : ' disabled') + '>' + esc(q.label) + '</button>';
    }).join('');

    var content = '' +
      '<div class="chat-warning">聊天记录会自动保存在本机。请不要输入真实姓名、住址或电话。<span class="red">对方最后登录于 2001 年。</span></div>' +
      '<div class="oicq-window">' +
        '<div class="oicq-title">' +
          '<span>OICQ 2000b · 与 纸飞机 聊天中' + (online ? '' : '（对方离线）') + '</span>' +
          '<span class="oicq-btns"><span>_</span><span>□</span><span>×</span></span>' +
        '</div>' +
        '<div class="oicq-main">' +
          '<aside class="oicq-sidebar">' +
            '<div class="oicq-group-title">我的好友（' + (online ? '1' : '0') + '/3 在线）</div>' +
            contacts +
            '<div class="oicq-group-title" style="margin-top:10px">陌生人</div>' +
            '<div class="oicq-contact"><span class="oicq-avatar"><img src="assets/photo-official.svg" alt=""></span><span>404</span><span class="contact-status">?</span></div>' +
          '</aside>' +
          '<section class="oicq-chatpane">' +
            '<div class="oicq-toolbar"><span>消息记录</span><span>·</span><span>字体：宋体 9pt</span><span>·</span><span>状态：' + (online ? '在线' : '离线') + '</span></div>' +
            '<div class="oicq-messages" id="chat-messages">' +
              initial + onlineMsgs + log +
              (online ? '' : '<div class="msg sys"><span class="msg-bubble">' + esc(D.CHAT.offlineHint) + '</span></div>') +
            '</div>' +
            '<div class="oicq-typing" id="chat-typing"></div>' +
            '<div class="oicq-compose">' +
              '<form data-form="chat" autocomplete="off">' +
                '<textarea name="message" id="chat-input" maxlength="160" placeholder="' + (online ? '输入消息……' : '对方不在线。消息可能无法送达。') + '"' + (online ? '' : ' disabled') + '></textarea>' +
                '<div class="oicq-actions">' +
                  '<div class="quick-replies">' + quick + '</div>' +
                  '<button type="submit" class="oicq-send"' + (online ? '' : ' disabled') + '>发送</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
            '<div class="oicq-statusbar">OICQ 服务器：oicq.tencent.com · 连接方式：56K 调制解调器 · 在线时长：00:00:00</div>' +
          '</section>' +
        '</div>' +
      '</div>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>聊天提示</span><small>纸飞机 · 2001</small></div>' +
        '<div class="panel-body">' +
          '<p class="small">' + (online ? '她已经上线了。试着问她照片、地下室，或者你还记得什么。' : '她还没有上线。找齐至少四张底片后，再回到这里。') + '</p>' +
          '<div class="btn-row"><button type="button" class="btn small" data-action="open-notebook">查看线索本</button>' +
            (online ? '<a class="btn small" href="#/bbs/underground" data-nav="/bbs/underground">去 BBS 看地下室入口</a>' : '<a class="btn small" href="#/album" data-nav="/album">去相册找底片</a>') +
            (fragmentCount(state) >= 6 ? '<a class="btn small primary" href="#/underground" data-nav="/underground">去车棚后面</a>' : '') +
          '</div>' +
        '</div>' +
      '</div>';

    return siteLayout(state, {
      active: '/chat',
      title: 'OICQ 聊天',
      meta: 'oicq/chat.htm<br>1 位好友 · 最后登录 2001-09-14',
      content: content
    });
  }

  /* ---------------- 站内搜索 ---------------- */

  function normalizeQuery(q) {
    return String(q || '').trim().toLowerCase();
  }

  function searchMatches(q) {
    if (!q) return [];
    var results = [];
    D.SEARCH_INDEX.forEach(function (item) {
      var hit = item.keys.some(function (key) {
        return q.indexOf(String(key).toLowerCase()) !== -1 || String(key).toLowerCase().indexOf(q) !== -1;
      });
      if (hit) results.push(item);
    });
    return results;
  }

  function renderSearch(state) {
    var q = state.searchQuery || '';
    var nq = normalizeQuery(q);
    var results = searchMatches(nq);
    var resultHTML = '';

    if (!q) {
      resultHTML = '<div class="search-result"><div class="result-title">请输入关键词</div><div class="result-desc">本站已收录 18 个页面、87 张照片和 405 条留言。部分页面未被搜索引擎索引。</div></div>';
    } else if (!results.length) {
      resultHTML = '<div class="search-result"><div class="result-title">没有找到与“' + esc(q) + '”相关的内容</div><div class="result-desc">请尝试其他关键词，例如“404”“全家福”“地下室”“阿哲”。<br><span class="red">搜索记录已写入服务器日志。管理员会看到。</span></div></div>';
    } else {
      results.forEach(function (item) {
        resultHTML += '<div class="search-result">' +
          '<div class="result-title"><a href="#' + esc(item.route) + '" data-nav="' + esc(item.route) + '">' + esc(item.title) + '</a>' + (item.hiddenResult ? ' <span class="tag hot">未索引</span>' : '') + '</div>' +
          '<div class="result-url">http://www.huai-an-li.net/' + esc(item.url) + '</div>' +
          '<div class="result-desc">' + esc(item.desc) + '</div>' +
        '</div>';
      });
    }

    if (nq === '404' || nq.indexOf('404') !== -1) {
      resultHTML += '<div class="warning-strip" style="margin-top:12px">系统提示：搜索结果中有一条记录不属于本站。它的 URL 无法解析，但如果你点击它，它可能会打开。</div>';
    }
    if (nq.indexOf('小满') !== -1 || nq.indexOf('沈小满') !== -1) {
      resultHTML += '<div class="inline-note">有 1 条结果被隐藏。隐藏原因：涉及未登记居民。最后修改人：阿哲。</div>';
    }
    if (nq.indexOf('阿哲') !== -1 || nq.indexOf('站长') !== -1) {
      resultHTML += '<div class="inline-note">搜索结果中的第 404 条来自一个不存在的目录。要打开它吗？<a href="#/404" data-nav="/404">404.htm</a></div>';
    }

    var content = '' +
      '<form class="search-box" data-form="search" autocomplete="off">' +
        '<input class="retro-input" type="search" name="q" value="' + esc(q) + '" placeholder="输入关键词，例如：404、全家福、地下室" aria-label="站内搜索关键词">' +
        '<button type="submit" class="btn primary">搜索</button>' +
      '</form>' +
      '<div class="small">热门搜索：' +
        '<button type="button" class="text-link" data-action="search-preset" data-query="404">404</button> · ' +
        '<button type="button" class="text-link" data-action="search-preset" data-query="小满">小满</button> · ' +
        '<button type="button" class="text-link" data-action="search-preset" data-query="全家福">全家福</button> · ' +
        '<button type="button" class="text-link" data-action="search-preset" data-query="地下室">地下室</button> · ' +
        '<button type="button" class="text-link" data-action="search-preset" data-query="阿哲">阿哲</button>' +
      '</div>' +
      '<div class="search-results">' + resultHTML + '</div>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>关于搜索</span><small>search.asp · 最后索引 2001-09-14</small></div>' +
        '<div class="panel-body"><p class="small">本站搜索由阿哲手工编写，只索引了 18 个页面。未被索引的页面仍然可能通过直链访问。<br>如果搜索结果中出现乱码，请按 F5 刷新，或换一台电脑。</p>' +
          '<div class="btn-row"><a class="btn small" href="#/bbs/404" data-nav="/bbs/404">直接去 7号楼404 的帖子</a><button type="button" class="btn small" data-action="view-source">查看搜索页源代码</button></div>' +
        '</div>' +
      '</div>';

    return siteLayout(state, {
      active: '/search',
      title: '站内搜索',
      meta: 'search.asp<br>' + (q ? '关键词：' + esc(q) : '等待输入'),
      content: content
    });
  }

  /* ---------------- 旧闻存档 ---------------- */

  function renderArchive(state) {
    var content = '' +
      '<div class="newspaper">' +
        '<div class="paper-name"><h1>槐安日报</h1><div class="paper-info">HUAI\'AN DAILY<br>国内统一刊号 CN 32-0404<br>第 100 期</div></div>' +
        '<div class="paper-date"><span>2000年1月3日 星期一</span><span>农历己卯年 十一月廿七</span><span>零售价：伍角</span></div>' +
        '<h2 class="headline">槐安里小区一杂物间起火<br>有关部门迅速处置 无人员伤亡</h2>' +
        '<div class="subhead">本报讯（记者 周平）1月1日凌晨，槐安里小区7号楼地下室一间杂物间发生火灾，过火面积约4平方米。</div>' +
        '<div class="article-cols">' +
          '<figure class="article-photo"><img src="assets/photo-official.svg" alt="文明小区表彰会照片"><figcaption>图为1月8日槐安里“文明小区”表彰大会现场。本报记者 摄</figcaption></figure>' +
          '<p>记者从槐安里居委会了解到，起火时间为1月1日零时左右，起火点位于7号楼地下室的一间废弃杂物间。由于发现及时，火势未蔓延至居民区。消防人员到场后迅速将火扑灭。</p>' +
          '<p>居委会张主任表示，该杂物间长期无人居住，内部仅堆放纸箱、旧家具等杂物，没有人员居住。“这是一起普通的电线老化事故，希望大家不要信谣传谣。”</p>' +
          '<p>据了解，事发当晚，槐安里社区正在举办“千禧百家福”合影活动。有居民反映曾听到地下室方向传来声响，居委会解释称是“居民燃放烟花”。</p>' +
          '<p>1月8日，槐安里社区被评为本年度“文明小区”。张主任表示，将进一步加强对小区公共空间的管理，杜绝此类事故再次发生。</p>' +
          '<p class="small" style="color:#6c5b42">（本报提醒：冬季天干物燥，请居民注意用电安全。）</p>' +
        '</div>' +
        '<div class="paper-foot"><span>责任编辑：周平 · 校对：李梅</span><span>本版照片由槐安里居委会提供</span><span>如有线索，请致电 044-782404</span></div>' +
      '</div>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>报纸边缘的手写批注</span><small>阿哲 · 2001年</small></div>' +
        '<div class="panel-body">' +
          '<p class="small">“过火面积4平方米”是错的。地下室有两百平方米。那天晚上，火从门缝里烧出来，烧了四个小时。</p>' +
          '<p class="small">“无人居住”也是错的。里面有一个人。她的名字不在任何一份名单上。</p>' +
          '<p class="small red">右下角那只鞋，是她的。我认得。</p>' +
          '<div class="btn-row">' + clueAction(state, 'coverup', '记下官方说法') + '<button type="button" class="btn small" data-action="open-photo" data-photo="assets/photo-official.svg" data-title="表彰会原图" data-caption="放大右下角。有一只红色的小鞋。照片说明里没有提到它。">放大照片右下角</button><a class="btn small" href="#/bbs/404" data-nav="/bbs/404">去论坛继续查</a></div>' +
        '</div>' +
      '</div>' +
      '<div class="inline-note">阿哲在页面底部留了一句话：<br>“如果报纸和网站只能留下一个，我希望你相信网站。”</div>';

    return siteLayout(state, {
      active: '/archive',
      title: '旧闻存档',
      meta: 'archive/20000103.htm<br>槐安日报 · 2000-01-03',
      content: content
    });
  }

  /* ---------------- 站长的话 ---------------- */

  function renderAbout(state) {
    var content = '' +
      '<div class="official-doc">' +
        '<h2>站 长 的 话</h2>' +
        '<div class="doc-sub">最后一次更新 · 2001年9月14日 23:59</div>' +
        '<div class="doc-body">' +
          '<p>这个网站是我在1999年冬天做的。</p>' +
          '<p>那时候我刚学会用 FrontPage，觉得只要把每个人的名字都放上去，大家就不会走散。我给7号楼每户都做了个人主页，给小满做了一个粉色的。她嫌丑，但还是每天来看。</p>' +
          '<p>1999年12月31日晚上，社区拍全家福。小满站在最后一排的右边。摄影师说，人太多了，让那个“没登记的小孩”往旁边站一点。</p>' +
          '<p>23点58分，她跟我说，阿哲哥，车棚后面的门在响。</p>' +
          '<p>我说，别去。</p>' +
          '<p>00点03分，我听见她在门后叫我。</p>' +
          '<p>我站在门外。手放在锁上。钥匙断在里面。楼上有人在数数：九十八，九十九，一百。</p>' +
          '<p>我没有开门。</p>' +
          '<p>后来我告诉自己，里面没有人。我删掉了她的主页，删掉了合影。可是每隔一段时间，网站就会自己多出一个页面，或者一张照片。我想，可能是她还在。</p>' +
          '<p>本站将于2001年9月15日0时永久关闭。服务器我会搬走。</p>' +
          '<p>如果你看到这里，替我告诉她：对不起。</p>' +
        '</div>' +
        '<div class="doc-sign">阿哲<br>槐安里7号楼405室</div>' +
      '</div>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>网 站 档 案</span><small>ADMIN LOG</small></div>' +
        '<div class="panel-body">' +
          '<table class="old-table">' +
            '<tr><th>1999-12-20</th><td>社区网站上线。共 100 个个人主页。</td></tr>' +
            '<tr><th>2000-01-01</th><td>网站无法访问。管理员修改了首页。</td></tr>' +
            '<tr><th>2000-01-03</th><td>删除照片 87 张。添加“寻人启事”。</td></tr>' +
            '<tr><th>2001-08-15</th><td>恢复相册。上传合影底片（损坏）。</td></tr>' +
            '<tr><th>2001-09-14</th><td>最后一次登录。IP 地址：127.0.0.1。</td></tr>' +
          '</table>' +
          '<div class="btn-row"><button type="button" class="btn small" data-action="view-source">查看本站源代码</button><a class="btn small" href="#/search" data-nav="/search">搜索“阿哲”</a><a class="btn small" href="#/404" data-nav="/404" style="opacity:.55">404.htm</a></div>' +
        '</div>' +
      '</div>' +
      '<div class="warning-strip">“本站永久有效。”——这句话是自动生成的。它不一定代表站长还活着。</div>';

    return siteLayout(state, {
      active: '/about',
      title: '站长的话',
      meta: 'about.htm<br>最后更新 2001-09-14 23:59',
      content: content
    });
  }

  /* ---------------- 友情链接 ---------------- */

  function renderLinks(state) {
    var links = [
      ['网易免费个人主页', 'www.netease.com/~huai-an-li', '本站的服务器空间由网易提供。感谢网易。', 'dead-link', '目标网站已停止服务。'],
      ['碧海银沙聊天室', 'chat.silversand.net', '槐安里居民常去的聊天室。房间名：7号楼。', 'dead-link', '连接超时。对方服务器没有响应。'],
      ['榕树下 · 原创文学', 'www.rongshu.com', '阿哲在这里写过一篇小说，后来删了。', 'dead-link', '页面不存在。'],
      ['千年虫倒计时', 'www.y2k.com.cn', '距千年虫爆发还有 0 天。本站已修复。', 'dead-link', '该域名已过期。'],
      ['联众世界', 'www.ourgame.com', '小满说她想学下围棋。', 'dead-link', '无法连接到游戏服务器。'],
      ['槐安市个人主页联盟', 'www.huai-an.net', '本站已加入联盟。排名：404。', 'dead-link', '联盟已解散。'],
      ['未寄出的日记', '~xiaoman/last.htm', '这个链接不在导航里。它可能还在。', 'nav', '/diary/last'],
      ['404.htm', '404.htm', '这里没有404室。', 'nav', '/404']
    ];
    var cards = links.map(function (l) {
      var attrs = l[3] === 'nav'
        ? 'href="#' + esc(l[4]) + '" data-nav="' + esc(l[4]) + '"'
        : 'href="javascript:void(0)" data-action="dead-link" data-message="' + esc(l[4]) + '"';
      return '<a class="link-card" ' + attrs + '><b>' + esc(l[0]) + '</b><span>' + esc(l[1]) + '</span><span>' + esc(l[2]) + '</span></a>';
    }).join('');

    var content = '' +
      '<div class="inline-note">本站已加入“槐安市个人主页联盟”。请使用 88×31 的按钮与本站交换链接。站长阿哲的 OICQ：10404。</div>' +
      '<div class="links-grid">' + cards + '</div>' +
      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><span>自 助 友 链</span><small>复制以下代码到你的主页</small></div>' +
        '<div class="panel-body"><div class="dev-state" style="max-height:none;color:#8f8;background:#0d0d0d">&lt;a href="http://www.huai-an-li.net"&gt;&lt;img src="banner.gif" width="88" height="31" border="0"&gt;&lt;/a&gt;</div>' +
          '<p class="small" style="margin-top:8px">本站 banner 已丢失。请用文字链接代替。</p>' +
        '</div>' +
      '</div>' +
      '<div class="under-construction" aria-hidden="true"></div>';

    return siteLayout(state, {
      active: '/links',
      title: '友情链接',
      meta: 'links.htm<br>8 个链接 · 6 个已失效',
      content: content
    });
  }

  /* ---------------- 防空洞 ---------------- */

  var BASEMENT_NAMES = [
    '王秀兰', '李建国', '张德贵', '刘桂英', '陈卫东', '赵春梅', '孙志强', '周玉兰',
    '吴建军', '郑秀英', '冯国庆', '陈小军', '褚秀云', '卫红', '蒋大勇', '沈国华',
    '韩秀珍', '杨立新', '朱桂芳', '秦建国', '许秀兰', '何志明', '吕玉梅', '施小军',
    '张秀英', '孔令华', '曹德旺', '严凤英', '华建国', '金玉兰', '魏国强', '陶秀云',
    '姜卫东', '戚桂芳', '谢建平', '邹秀英', '喻小华', '柏玉兰', '水建国', '窦秀珍',
    '章志强', '云桂英', '苏建平', '潘秀兰', '葛建国', '奚玉英', '范志明', '彭秀珍',
    '郎建华', '鲁桂芳', '韦建国', '昌秀英', '马志强', '苗玉兰', '凤建国', '花秀珍',
    '方建平', '俞桂英', '任志强', '袁秀兰', '柳建国', '鲍玉英', '史建平', '唐秀珍',
    '费志明', '廉桂芳', '岑建国', '薛秀英', '雷建平', '贺玉兰', '倪志强', '汤秀珍',
    '滕建国', '殷桂英', '罗志明', '毕秀兰', '郝建平', '邬玉英', '安建国', '常秀珍',
    '乐于', '时建平', '傅桂芳', '皮秀英', '齐建国', '康玉兰', '伍志强', '余秀珍',
    '元建平', '卜桂英', '顾建国', '孟秀兰', '平志强', '黄玉英', '和建国', '穆秀珍',
    '萧建平', '尹桂芳', '欧阳明'
  ];

  function basementHeader(state) {
    return '<div class="basement-topline"><span>ARCHIVE://B2/DOOR</span><span>访客 ' + pad(visitCount(state), 6) + ' · 记录设备无信号</span></div>';
  }

  function renderBasementGate(state) {
    var n = fragmentCount(state);
    var enough = n >= 6;
    var doorLog = '';
    if (enough) {
      doorLog = '<div class="dark-log"><p class="highlight">门上的锁有四个数字位。</p><p>你手里有六张底片。它们贴在一起，边缘出现了一串模糊的数字：１１？７。</p><p class="danger">如果听见有人叫你的名字，不要回头。</p></div>';
    } else {
      doorLog = '<div class="dark-log"><p>铁门上有一把四位数的挂锁。</p><p>你试着拉了拉门。门后传来很轻的呼吸声。</p><p class="danger">底片不够。你还看不清那个数字。</p><p>当前底片：' + n + ' / 7。至少需要 6 张，才能从底片边缘读出密码。</p></div>';
    }

    return '' +
      '<div class="dark-page">' +
        '<div class="basement-wrap">' +
          basementHeader(state) +
          '<h1 class="basement-title">防 空 地 下 室</h1>' +
          '<div class="basement-sub">B2 · 7号楼自行车棚后 · 未经许可禁止入内</div>' +
          '<div class="door-frame">' +
            '<div class="door-lock" aria-hidden="true"></div>' +
            '<div style="color:#77806c;font-size:10px;letter-spacing:.18em;margin-bottom:4px">铁门 · 四位密码锁</div>' +
            '<form data-form="gate" autocomplete="off">' +
              '<div class="door-keypad">' +
                '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" name="code" id="gate-code" aria-label="四位密码" placeholder="＿＿＿＿" ' + (enough ? '' : 'disabled') + '>' +
                '<button type="submit" class="dark-btn" ' + (enough ? '' : 'disabled') + '>开门</button>' +
              '</div>' +
            '</form>' +
            '<div class="door-hint">' + (enough ? '提示：她最讨厌过生日。' : '提示：多找几张底片，再来。') + '</div>' +
          '</div>' +
          doorLog +
          '<div class="basement-wrap" style="margin-top:18px;text-align:center">' +
            '<button type="button" class="dark-btn" data-action="basement-back">离开车棚</button>' +
            '<div class="door-hint">你回头看了一眼。7号楼的窗户全黑着，只有四楼最右边那一扇，亮着。</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderBasementInside(state) {
    var stage = Math.max(1, Math.min(6, Number(state.basementStage) || 1));
    var title = '门 后';
    var body = '';
    var figure = stage >= 2 ? '<div class="corridor-figure" aria-hidden="true"></div>' : '';

    if (stage === 1) {
      title = '门 后';
      body = '<p class="stage-kicker">记录 01 / 07</p><p>门开了。</p><p>后面不是楼梯，是一段向下倾斜的水泥坡道。空气里有股烧焦的塑料味，混着潮湿的土腥气。</p><p>手电筒的光只够照到前三米。你听见自己的脚步声，比实际慢了半拍。</p>' +
        '<div class="basement-actions"><button type="button" class="dark-btn" data-action="basement-next">打开手电，向前走</button><button type="button" class="dark-btn" data-action="basement-back">退出去</button></div>';
    } else if (stage === 2) {
      title = '名 字';
      body = '<p class="stage-kicker">记录 02 / 07</p><p>你走了十七步。</p><p>墙上开始出现名字。粉笔、圆珠笔、钥匙刻的，一层压着一层。大多数已经被水泡花了。</p><p>你认出几个名字：王秀兰、李建国、张德贵……都是7号楼的住户。</p><p>在靠近地面的位置，有人用蓝色圆珠笔写了一行小字：<span class="highlight">阿哲哥，我在这里。</span></p>' +
        '<div class="basement-actions"><button type="button" class="dark-btn" data-action="basement-next">继续向前</button><button type="button" class="dark-btn" data-action="basement-lookback">回头看看</button></div>';
    } else if (stage === 3) {
      title = '第 一 百 户';
      body = '<p class="stage-kicker">记录 03 / 07</p><p>坡道到底了。面前是一扇更小的门，门框上贴着一张褪色的红纸。</p><p>墙上的名字到这里变得密集。你数了一遍，九十九个。</p><p>最后一个名字写在最高的地方，字迹很新：</p>' +
        '<div class="name-wall">' + BASEMENT_NAMES.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '<span class="target">沈小满</span></div>' +
        '<p>第一百个名字，是沈小满。</p><p>名字旁边有一道细缝，里面夹着一小片发黄的东西。</p>' +
        '<div class="basement-actions"><button type="button" class="dark-btn" data-action="basement-next">把手电照向墙角</button></div>';
    } else if (stage === 4) {
      title = '最 后 一 张';
      body = '<p class="stage-kicker">记录 04 / 07</p><p>墙缝里夹着一张底片。边缘被火烧过，但中间还能看清。</p><p>照片里是7号楼的清晨。四楼最右边的窗户亮着。窗户上贴着一张纸，纸上写着一个名字。</p><p>你伸出手去拿。背后传来一个女孩的声音：</p><p class="highlight">“你来了。”</p><p>声音很近。就在你后颈。</p>' +
        '<div class="basement-actions"><button type="button" class="dark-btn" data-action="basement-take">取下最后一张底片</button></div>';
    } else if (stage === 5) {
      title = '不 要 回 头';
      body = '<p class="stage-kicker">记录 05 / 07</p><p>底片在你手里。它很凉，像一块从冰箱里拿出来的铁。</p><p>身后的声音又说了一遍：</p><p class="highlight">“你叫什么名字？”</p><p>你听见脚步声。一步。两步。停在你背后。</p><p class="danger">不要回头。</p>' +
        '<div class="basement-actions"><button type="button" class="dark-btn" data-action="basement-escape">不要回头。往上走。</button><button type="button" class="dark-btn" data-action="basement-lookback">回头</button></div>';
    } else {
      title = '天 亮 之 前';
      body = '<p class="stage-kicker">记录 06 / 07</p><p>你没有回头。</p><p>你一直走，数着自己的脚步。一步，两步，三步……数到一百的时候，你看见了车棚外的天光。</p><p>背后没有声音了。手里多了一张底片。</p><p class="highlight">七张底片已经集齐。照片可以修复了。</p>' +
        '<div class="basement-actions"><button type="button" class="dark-btn" data-action="basement-finish">去修复全家福</button><button type="button" class="dark-btn" data-action="basement-back">先离开这里</button></div>';
    }

    return '' +
      '<div class="dark-page">' +
        '<div class="basement-wrap">' +
          basementHeader(state) +
          '<h1 class="basement-title">' + esc(title) + '</h1>' +
          '<div class="basement-sub">B2 · 地下二层 · 记录 00:04:' + pad(4 + stage * 3, 2) + '</div>' +
          '<div class="corridor">' +
            '<div class="corridor-scene" aria-hidden="true">' + figure + '<div class="corridor-floor"></div></div>' +
            '<div class="corridor-stage">' + body + '</div>' +
          '</div>' +
          '<div class="door-hint" style="text-align:center;margin-top:14px">底片 ' + fragmentCount(state) + ' / 7 · 当前阶段 ' + stage + ' / 6 · 本地进度已保存</div>' +
        '</div>' +
      '</div>';
  }

  function renderUnderground(state) {
    if (state.gateOpen) return renderBasementInside(state);
    return renderBasementGate(state);
  }

  /* ---------------- 修复全家福 ---------------- */

  function endingGallery(state) {
    var unlocked = state.endings || [];
    return D.ENDINGS.map(function (e) {
      var on = unlocked.indexOf(e.id) !== -1;
      return '<div class="ending-icon' + (on ? ' unlocked' : '') + '"><span>' + esc(e.kind) + '<br>' + esc(e.title) + '</span></div>';
    }).join('');
  }

  function renderRitual(state) {
    var n = fragmentCount(state);
    if (n < 7) {
      var content = '' +
        '<div class="warning-strip">你还没有集齐七张底片。照片无法显影。</div>' +
        '<div class="panel" style="margin-top:12px">' +
          '<div class="panel-head"><span>修复进度</span><small>' + n + ' / 7</small></div>' +
          '<div class="panel-body">' +
            '<p>七张底片分别藏在公告、相册、论坛、留言本、个人主页、OICQ 和防空洞里。</p>' +
            progressDots(state) +
            '<div class="btn-row"><button type="button" class="btn small" data-action="open-notebook">查看已有底片</button><a class="btn small" href="#/album" data-nav="/album">去相册</a><a class="btn small" href="#/chat" data-nav="/chat">去 OICQ</a></div>' +
          '</div>' +
        '</div>';
      return siteLayout(state, {
        active: '/ritual',
        title: '修复全家福',
        meta: 'restore/100.htm<br>底片不足',
        content: content
      });
    }

    if (!state.ritualDeveloped) {
      var before = '' +
        '<div class="warning-strip">七张底片已经集齐。把它们按时间顺序放回相纸，需要一点时间。</div>' +
        '<div class="panel" style="margin-top:12px">' +
          '<div class="panel-head"><span>待显影的相纸</span><small>请勿曝光</small></div>' +
          '<div class="panel-body center">' +
            '<div class="ritual-photo" style="filter:brightness(.38) contrast(1.1);transform:rotate(.5deg)">' +
              '<img src="assets/photo-group.svg" alt="尚未显影的合影" style="filter:blur(3px) sepia(.5)">' +
              '<div class="ritual-caption"><span>1999.12.31 · 槐安里7号楼</span><span>EXPOSING…</span></div>' +
            '</div>' +
            '<p class="small">相纸上浮着一层灰白色的雾。照片里有一百个位置，但只有九十九个影子。</p>' +
            '<button type="button" class="btn primary" data-action="ritual-develop">开始显影</button>' +
          '</div>' +
        '</div>';
      return siteLayout(state, {
        active: '/ritual',
        title: '修复全家福',
        meta: 'restore/100.htm<br>7 / 7 · 等待显影',
        content: before
      });
    }

    var selected = state.ritualChoice || '';
    var choiceHTML = '' +
      '<div class="ritual-choices">' +
        '<button type="button" class="choice-card' + (selected === 'remember' ? ' chosen' : '') + '" data-action="ritual-choice" data-choice="remember">' +
          '<span class="choice-no">CHOICE 01 · TRUE END</span><h3>在名单上写下她的名字</h3><p>让第100户不再是空白。让她重新成为一个有名字的人。</p>' +
        '</button>' +
        '<button type="button" class="choice-card' + (selected === 'replace' ? ' chosen' : '') + '" data-action="ritual-choice" data-choice="replace">' +
          '<span class="choice-no">CHOICE 02 · BAD END</span><h3>把自己填进第100户</h3><p>照片里总要有人。如果你留下，她就可以走了。</p>' +
        '</button>' +
        '<button type="button" class="choice-card' + (selected === 'forget' ? ' chosen' : '') + '" data-action="ritual-choice" data-choice="forget">' +
          '<span class="choice-no">CHOICE 03 · NORMAL END</span><h3>关闭网页，删除存档</h3><p>有些故事知道了也没有用。关掉它，回去睡觉。</p>' +
        '</button>' +
      '</div>';

    var formHTML = '';
    if (selected === 'remember') {
      formHTML = '<form class="ritual-form" data-form="ritual-name" autocomplete="off">' +
        '<label for="ritual-name">请写下照片里缺掉的那个名字</label>' +
        '<input type="text" id="ritual-name" name="name" maxlength="12" placeholder="姓名" autocomplete="off">' +
        '<div class="btn-row"><button type="submit" class="btn primary">写入居民名单</button><button type="button" class="btn" data-action="ritual-cancel">再想想</button></div>' +
        '<div class="small" style="margin-top:7px;color:#7f6b51">' + (state.ritualError ? '<span class="red">' + esc(state.ritualError) + '</span>' : '名单会自动保存。你随时可以关掉网页。') + '</div>' +
      '</form>';
    } else if (selected === 'replace') {
      formHTML = '<form class="ritual-form" data-form="ritual-replace" autocomplete="off">' +
        '<label for="replace-name">第100户的姓名（将写入你的名字）</label>' +
        '<input type="text" id="replace-name" name="name" maxlength="12" placeholder="你的名字" autocomplete="off">' +
        '<div class="btn-row"><button type="submit" class="btn primary">把我留在照片里</button><button type="button" class="btn" data-action="ritual-cancel">再想想</button></div>' +
        '<div class="small" style="margin-top:7px;color:#7f6b51">一旦写入，网页将无法关闭。这不是比喻。</div>' +
      '</form>';
    } else if (selected === 'forget') {
      formHTML = '<div class="ritual-form"><p class="small" style="color:#9d876b">你确定要关闭网页，并删除本机上的全部进度吗？<br>删除后，这个网站将不再出现在你的浏览器里。</p><div class="btn-row"><button type="button" class="btn primary" data-action="choose-forget">删除存档并关闭</button><button type="button" class="btn" data-action="ritual-cancel">再想想</button></div></div>';
    }

    var content = '' +
      '<div class="warning-strip">照片已经显影。请确认你看见的不是你自己的倒影。</div>' +
      '<div class="panel" style="margin-top:12px">' +
        '<div class="panel-head"><span>千禧百家福 · 修复版</span><small>1999-12-31 23:59</small></div>' +
        '<div class="panel-body">' +
          '<div class="ritual-photo">' +
            '<img src="assets/photo-group.svg" alt="修复后的千禧年全家福">' +
            '<div class="photo-assembly show" aria-hidden="true">' +
              '<span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>' +
            '</div>' +
            '<div class="ritual-caption"><span>槐安里7号楼 · 第100户（缺失）</span><span>1/1</span></div>' +
          '</div>' +
          '<p class="center small">照片里有一百个位置。九十九个人看着镜头，一块空白看着你。</p>' +
          '<p class="center">系统询问：要把谁写进名单？</p>' +
          choiceHTML +
          formHTML +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-head"><span>已发现的结局</span><small>' + (state.endings || []).length + ' / 3</small></div>' +
        '<div class="panel-body"><div class="ending-icon-row">' + endingGallery(state) + '</div>' +
          '<p class="small" style="margin-top:10px">七张底片、一个名字、一次选择。照片需要一个人，但不需要你替她消失。</p>' +
        '</div>' +
      '</div>';

    return siteLayout(state, {
      active: '/ritual',
      title: '修复全家福',
      meta: 'restore/100.htm<br>7 / 7 · 显影完成',
      content: content
    });
  }

  /* ---------------- 隐藏页面 404 ---------------- */

  function render404(state) {
    var content = '' +
      '<div class="basement-wrap">' +
        '<div class="basement-topline"><span>HTTP 404 · PAGE NOT FOUND</span><span>http://www.huai-an-li.net/404.htm</span></div>' +
        '<h1 class="basement-title glitch-text" data-text="这 里 没 有 4 0 4 室">这 里 没 有 4 0 4 室</h1>' +
        '<div class="basement-sub">但是页面存在。你也存在。</div>' +
        '<div class="dark-log" style="max-width:620px">' +
          '<p class="highlight">2000年1月1日 00:03</p>' +
          '<p>我站在门外。她说：阿哲哥，门打不开了。</p>' +
          '<p>我试了钥匙。钥匙断在里面。</p>' +
          '<p>我听见有人上楼。居委会的人在数数：九十八，九十九，一百。</p>' +
          '<p>我往楼上跑。我跑进自己家，把门反锁。我打开电脑，把网站首页换成了一张白纸。</p>' +
          '<p>后来我告诉自己，里面没有人。</p>' +
          '<p class="highlight">这个网页是我做的。我把她的照片P进每一张合影，又删掉。因为只要照片里没有她，我就可以当作她从来没有存在过。</p>' +
          '<p>可是网站每天都会自己多出一个页面。</p>' +
          '<p class="danger">今天多出来的是这个。</p>' +
          '<p style="text-align:right;color:#8c6a5a">—— 阿哲，2001-09-14 23:59</p>' +
        '</div>' +
        '<div class="name-wall" style="max-width:620px;margin:18px auto">' +
          '<span>第097户</span><span>第098户</span><span>第099户</span><span class="target">第100户</span>' +
        '</div>' +
        '<div class="basement-actions" style="justify-content:center">' +
          '<button type="button" class="dark-btn" data-action="add-clue" data-clue="azhe">记下阿哲的沉默</button>' +
          '<a class="dark-btn" href="#/diary/last" data-nav="/diary/last" style="text-decoration:none">去看未寄出的日记</a>' +
          '<a class="dark-btn" href="#/search" data-nav="/search" style="text-decoration:none">返回搜索</a>' +
          '<a class="dark-btn" href="#/" data-nav="/" style="text-decoration:none">返回首页</a>' +
        '</div>' +
        '<div class="door-hint" style="text-align:center;margin-top:20px">如果你在地址栏里输入这个页面，说明你已经知道了她的名字。<br>但知道名字还不够。你要把它写回去。</div>' +
      '</div>';

    return '<div class="dark-page">' + content + '</div>';
  }

  /* ---------------- 错误页 ---------------- */

  function renderLost(state) {
    var content = '' +
      '<div class="error-inner">' +
        '<div class="error-code">404</div>' +
        '<div class="error-title">无法找到该网页</div>' +
        '<div class="error-desc">' +
          '<p>您要访问的页面可能已被删除、更名，或暂时不可用。</p>' +
          '<p>请检查地址栏中的网址是否正确，或返回 <a href="#/" data-nav="/" style="color:#cfc7b6">槐安里首页</a>。</p>' +
          '<p style="margin-top:14px">HTTP 404 · 文件未找到 · 服务器：huai-an-li.net</p>' +
        '</div>' +
        '<div class="btn-row" style="justify-content:center;margin-top:18px">' +
          '<a class="btn" href="#/" data-nav="/">返回首页</a>' +
          '<a class="btn" href="#/search" data-nav="/search">站内搜索</a>' +
        '</div>' +
        '<p class="small" style="margin-top:24px;color:#5f5a50">提示：有些页面不在导航里。试着在地址栏输入一个房间号。</p>' +
      '</div>';
    return '<div class="error-page">' + content + '</div>';
  }

  /* ---------------- 结局 ---------------- */

  function endingMeta(state, id, kind) {
    var unlocked = state.endings || [];
    return '<div class="ending-meta"><span>' + esc(kind) + '</span><span>已发现结局：' + unlocked.length + ' / 3</span><span>存档：本地 · 自动保存</span></div>';
  }

  function endingActions() {
    return '<div class="ending-actions">' +
      '<button type="button" class="btn" data-action="restart-game">重新开始</button>' +
      '<a class="btn" href="#/" data-nav="/">回到首页</a>' +
      '<button type="button" class="btn" data-action="open-notebook">查看线索本</button>' +
    '</div>';
  }

  function renderEndingRemember(state) {
    var content = '' +
      '<div class="ending-wrap">' +
        '<div class="ending-kicker">TRUE END · 有人记得你</div>' +
        '<h1 class="ending-title">有 人 记 得 你</h1>' +
        '<div class="ending-sub">1999.12.31 — 2001.09.14 — 现在</div>' +
        '<figure class="ending-photo">' +
          '<img src="assets/photo-group-complete.svg" alt="完整的千禧年全家福">' +
          '<figcaption>槐安里7号楼 · 第100户 · 沈小满</figcaption>' +
        '</figure>' +
        '<div class="ending-body">' +
          '<p>你在名单上写下“沈小满”三个字。</p>' +
          '<p>网页没有立刻关闭。相纸先是发出一声很轻的响，像有人在很远的地方按了一下快门。然后，照片最后一排的右边，慢慢多出一个人。</p>' +
          '<p>她穿着白棉袄，短发，右手攥着一张红纸。她没有看你。她只是抬起头，看了一眼镜头。</p>' +
          '<p>“好了。”她说。</p>' +
          '<p>屏幕上的九十九个人一起眨了眨眼。四楼最右边那扇窗户的灯灭了。</p>' +
          '<p>第二天早上，你再次打开这个网址。浏览器显示：<b>该页面不存在。</b></p>' +
          '<p>你没有再找到槐安里。但在你的收藏夹里，多了一个没有名字的文件夹。里面只有一张照片。</p>' +
          '<p>很多年后，槐安里拆迁。工人在7号楼地下室的水泥墙上发现了一百个名字。最后一个名字写得很高，字迹很新：</p>' +
          '<p style="text-align:center;font-family:\'STKaiti\',\'KaiTi\',serif;font-size:28px;letter-spacing:.24em;color:#7c1a15">沈小满</p>' +
          '<p>工头说，那面墙本来要拆的。不知道为什么，那天下午的挖掘机一直打不着火。</p>' +
          '<p>后来，有人在那面墙的缝隙里找到一张底片。照片上，一个女孩站在最后一排的右边，很轻地笑着。</p>' +
          '<p>照片背面写着：<b>谢谢你还记得我。</b></p>' +
        '</div>' +
        '<div class="ending-meta"><span>TRUE END</span><span>结局 1 / 3</span><span>“如果没有人记得，照片就不会显影。”</span></div>' +
        endingActions() +
        '<div class="ending-icon-row">' + endingGallery(state) + '</div>' +
        '<div class="ending-meta"><span>槐安里：未寄出的全家福</span><span>感谢你替她按下了快门</span></div>' +
      '</div>';
    return '<div class="ending-page ending-remember">' + content + '</div>';
  }

  function renderEndingReplace(state) {
    var name = (state.playerName || '你').trim() || '你';
    var content = '' +
      '<div class="ending-wrap">' +
        '<div class="ending-kicker">BAD END · 第100户</div>' +
        '<h1 class="ending-title">第 100 户</h1>' +
        '<div class="ending-sub">槐安里7号楼 · 居民登记表更新成功</div>' +
        '<div class="registry">' +
          '槐安里社区居民登记表（7号楼）<br>' +
          '————————————————<br>' +
          '第097户　王秀兰　　7-402<br>' +
          '第098户　李建国　　7-403<br>' +
          '第099户　沈小满　　（已注销）<br>' +
          '<span class="row-new">第100户　' + esc(name) + '　　7-404</span>' +
          '————————————————<br>' +
          '登记时间：2001-09-15 00:00:00<br>' +
          '登记人：系统（自动）<br>' +
          '备注：住户已到齐。' +
        '</div>' +
        '<div class="ending-body">' +
          '<p>你把自己的名字填进了第100户。</p>' +
          '<p>照片里那块空白开始发白，发亮，最后变成一个人形。它穿着你的衣服，用你的姿势站着，脸朝着镜头。</p>' +
          '<p>你想关掉网页。可是浏览器没有响应。</p>' +
          '<p>你点了一下右上角的红叉。窗口缩小，又弹回原来的大小。你再点。窗外传来一个女孩的声音：</p>' +
          '<p style="text-align:center;font-family:\'STKaiti\',\'KaiTi\',serif;font-size:24px;color:#e0a58d">“谢谢你。现在我可以走了。”</p>' +
          '<p>你听见门从外面锁上的声音。你低头看自己的手。手里攥着一张红纸。</p>' +
          '<p>网站首页刷新了。寻人启事里的照片变成了你的脸。姓名栏空白。失踪时间写的是今天。</p>' +
          '<p>第100户已经到齐。本站永久有效。</p>' +
        '</div>' +
        '<div class="ending-meta"><span>BAD END</span><span>结局 2 / 3</span><span>“欢迎回家，第100户。”</span></div>' +
        '<div class="ending-actions">' +
          '<button type="button" class="btn" data-action="fake-close">关闭窗口</button>' +
          '<button type="button" class="btn" data-action="restart-game">重新开始</button>' +
          '<a class="btn" href="#/" data-nav="/">回到首页</a>' +
        '</div>' +
        '<div class="ending-icon-row">' + endingGallery(state) + '</div>' +
      '</div>';
    return '<div class="ending-page ending-replace">' + content + '</div>';
  }

  function renderEndingForget(state) {
    var content = '' +
      '<div class="ending-wrap">' +
        '<div class="ending-kicker">NORMAL END · 查无此人</div>' +
        '<h1 class="ending-title">查 无 此 人</h1>' +
        '<div class="ending-sub">您已删除本地存档</div>' +
        '<div class="ending-body">' +
          '<p>你关掉了网页。</p>' +
          '<p>硬盘灯闪了两下。浏览器问你要不要保存书签。你点了“否”。</p>' +
          '<p>那天晚上你睡得很好。没有做梦，没有听见敲门声，也没有人在你耳边数数。</p>' +
          '<p>第二天，你打开浏览器。历史记录里没有“槐安里”。收藏夹里没有。搜索框的自动补全里也没有。</p>' +
          '<p>你记不清自己昨天晚上做了什么。只记得屏幕很亮，房间里有一种烧塑料的味道。</p>' +
          '<p>又过了几天，你在路边看到一张被雨水泡烂的寻人启事。上面的照片已经看不清了。你把它捡起来，扔进了垃圾桶。</p>' +
          '<p>照片背面有一行蓝色圆珠笔字：</p>' +
          '<p style="text-align:center;color:#8d877b;font-family:\'STKaiti\',\'KaiTi\',serif;font-size:23px">“如果没有人记得，照片就不会显影。”</p>' +
          '<p>你没有看见。</p>' +
        '</div>' +
        '<div class="ending-meta"><span>NORMAL END</span><span>结局 3 / 3</span><span>“有些门，关上了就不要再打开。”</span></div>' +
        endingActions() +
        '<div class="ending-icon-row">' + endingGallery(state) + '</div>' +
      '</div>';
    return '<div class="ending-page ending-forget">' + content + '</div>';
  }

  /* ---------------- 注册渲染器 ---------------- */

  var renderers = {
    '/': renderHome,
    '/notice': renderNotice,
    '/album': renderAlbum,
    '/bbs': renderBBS,
    '/bbs/404': renderBBS404,
    '/bbs/underground': renderBBSUnderground,
    '/guestbook': renderGuestbook,
    '/diary': renderDiary,
    '/diary/last': renderDiaryLast,
    '/chat': renderChat,
    '/search': renderSearch,
    '/archive': renderArchive,
    '/about': renderAbout,
    '/links': renderLinks,
    '/underground': renderUnderground,
    '/ritual': renderRitual,
    '/ending/remember': renderEndingRemember,
    '/ending/replace': renderEndingReplace,
    '/ending/forget': renderEndingForget,
    '/404': render404,
    '/lost': renderLost
  };

  function render(route, state) {
    var fn = renderers[route] || renderers['/lost'];
    return fn(state);
  }

  return {
    render: render,
    renderers: renderers,
    helpers: {
      esc: esc,
      pad: pad,
      fragmentCount: fragmentCount,
      hasFrag: hasFrag,
      hasClue: hasClue,
      progressDots: progressDots,
      progressNote: progressNote,
      siteLayout: siteLayout,
      siteHeader: siteHeader,
      siteFooter: siteFooter,
      pageHead: pageHead,
      clueAction: clueAction,
      fragmentAction: fragmentAction,
      counterHTML: counterHTML
    }
  };
})();
