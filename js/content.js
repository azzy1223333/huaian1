/* ============================================================
   槐安里：未寄出的全家福 — 静态内容数据
   说明：所有故事、图片、段落均在本地，无外部请求。
   ============================================================ */

window.GAME_DATA = (function () {
  'use strict';

  const SITE = {
    name: '槐安里·我们的家',
    shortName: '槐安里',
    domain: 'www.huai-an-li.net',
    archiveDate: '2001-09-14',
    archiveTime: '23:59',
    warning: '本档案包含闪烁画面、突发音效、压抑措辞与中式恐怖意象。建议在安静环境中浏览，并可随时关闭环境音和视觉特效。'
  };

  const FRAGMENTS = [
    {
      id: 'f1',
      n: 1,
      title: '公告栏底片',
      short: '第99户的底片',
      src: 'assets/photo-group.svg',
      source: '社区公告 · 1999-12-20',
      quote: '照片背面用圆珠笔写着：第99户，沈小满。但名单上没有她。',
      detail: '底片边缘有一道白痕。第99户的位置被划掉过一次，又用同一种蓝色圆珠笔重新写了回去。'
    },
    {
      id: 'f2',
      n: 2,
      title: '合影碎片',
      short: '少一个人的合影',
      src: 'assets/photo-group.svg',
      source: '居民相册 · 千禧百家福',
      quote: '最后一排右侧有一块空位。所有人的影子都朝左，只有那块空位下的影子朝右。',
      detail: '放大到第三倍时，空位里多出一双旧棉鞋的轮廓。'
    },
    {
      id: 'f3',
      n: 3,
      title: 'DSC_0404.jpg',
      short: '车棚后的铁门',
      src: 'assets/photo-shed.svg',
      source: 'BBS 附件 · 2001-09-14',
      quote: '照片背面的字：404不是仓库。她住在里面。',
      detail: '拍摄时间 1999-12-31 23:58。画面左下角有一小片红色的纸，像是从谁手里掉下来的。'
    },
    {
      id: 'f4',
      n: 4,
      title: '第404条留言',
      short: '墙上的名字',
      src: 'assets/photo-corridor.svg',
      source: '留言本 · 2000-01-01',
      quote: '我把名字写在墙上了。如果有人找到，请替我去看看。',
      detail: '留言编号 404。提交时间 00:04:11。那个时间，7号楼已经停电了。'
    },
    {
      id: 'f5',
      n: 5,
      title: '纸鹤里的底片',
      short: '没有脸的女孩',
      src: 'assets/photo-portrait-noface.svg',
      source: '小满的个人主页 · 未寄出的日记',
      quote: '不要回头。你回头，就会看见自己也在照片里。',
      detail: '底片中央的女孩没有脸。她的右手攥着一张红纸，形状和留言本第404条旁边贴的纸鹤一模一样。'
    },
    {
      id: 'f6',
      n: 6,
      title: 'OICQ 接收文件',
      short: '地下室的台阶',
      src: 'assets/photo-basement.svg',
      source: 'OICQ · 纸飞机',
      quote: '她发来一张图，没有文件名。图片右下角有一只红色的小鞋。',
      detail: '文件传输完成于 00:00:00。聊天窗口的在线状态，仍然是“离线”。'
    },
    {
      id: 'f7',
      n: 7,
      title: '墙上的最后一块',
      short: '第100户',
      src: 'assets/photo-building.svg',
      source: '7号楼 · 防空洞',
      quote: '最后一块底片粘在墙上。照片里，404的窗户亮着。',
      detail: '底片背后是一行铅笔字：照片缺的不是人，是一个名字。'
    }
  ];

  const CLUES = [
    {
      id: 'birthday',
      title: '她的生日',
      text: '沈小满，1987年11月7日出生。门锁密码可能是 1107。',
      source: '小满的个人主页 · 我的档案'
    },
    {
      id: 'entrance',
      title: '防空洞入口',
      text: '7号楼自行车棚后面有一扇铁门，门后是废弃的防空洞。',
      source: 'BBS · 车棚后面的门千万别开'
    },
    {
      id: 'dontlook',
      title: '不要回头',
      text: '小满反复说：如果听见有人叫你的名字，不要回头。',
      source: '未寄出的日记 · 2000-01-01'
    },
    {
      id: 'coverup',
      title: '官方说法',
      text: '《槐安日报》称：地下室杂物间起火，过火面积4平方米，无人员伤亡。',
      source: '旧闻存档 · 2000-01-03'
    },
    {
      id: 'registry',
      title: '第99户',
      text: '槐安里居民登记表只登记到第99户。404室在表格上被标注为“空房”。',
      source: '社区公告 · 千禧百家福名单'
    },
    {
      id: 'azhe',
      title: '阿哲的沉默',
      text: '站长阿哲在2000年1月1日听见门后有人叫他。他没有开门。',
      source: '隐藏页面 · 404.htm'
    },
    {
      id: 'fire',
      title: '火与广播',
      text: '1999年12月31日夜里，社区广播说是“放烟花”。但那天晚上没有烟花。',
      source: 'BBS · 昨晚广播又响了'
    },
    {
      id: 'photo_rule',
      title: '照片的规则',
      text: '照片装不下没有名字的人。要让小满出现在照片里，必须先把她写进居民名单。',
      source: '纸飞机 · OICQ 对话'
    }
  ];

  const ROUTES = [
    { path: '/', label: '首页', file: 'index.htm', chapter: '序章', desc: '槐安里社区欢迎您', public: true },
    { path: '/notice', label: '社区公告', file: 'news/notice.htm', chapter: '第一章', desc: '千禧百家福与寻人启事' },
    { path: '/album', label: '居民相册', file: 'photo/album.htm', chapter: '第一章', desc: '七号楼前的合影' },
    { path: '/bbs', label: '社区BBS', file: 'bbs/index.htm', chapter: '第二章', desc: '只有居民能进的留言板' },
    { path: '/bbs/404', label: 'BBS：7号楼有没有404', file: 'bbs/topic.asp?id=404', chapter: '第二章', desc: '一张被编辑过的帖子' },
    { path: '/bbs/underground', label: 'BBS：车棚后的门', file: 'bbs/topic.asp?id=7', chapter: '第二章', desc: '防空洞与广播' },
    { path: '/guestbook', label: '留言本', file: 'guestbook/index.htm', chapter: '第二章', desc: '第404条留言' },
    { path: '/diary', label: '小满的个人主页', file: '~xiaoman/index.htm', chapter: '第三章', desc: '纸飞机的小窝' },
    { path: '/diary/last', label: '未寄出的日记', file: '~xiaoman/last.htm', chapter: '第三章', desc: '2000年1月1日', hidden: true },
    { path: '/chat', label: 'OICQ', file: 'oicq/chat.htm', chapter: '第三章', desc: '与纸飞机聊天' },
    { path: '/archive', label: '旧闻存档', file: 'archive/20000103.htm', chapter: '第四章', desc: '槐安日报2000年1月3日' },
    { path: '/search', label: '站内搜索', file: 'search.asp', chapter: '工具', desc: '搜索这个网站' },
    { path: '/about', label: '站长的话', file: 'about.htm', chapter: '附录', desc: '阿哲的最后一次更新' },
    { path: '/links', label: '友情链接', file: 'links.htm', chapter: '附录', desc: '2001年的互联网' },
    { path: '/underground', label: '防空洞 · 铁门', file: 'b2/door.htm', chapter: '终章', desc: '门后没有回声' },
    { path: '/ritual', label: '修复全家福', file: 'restore/100.htm', chapter: '终章', desc: '把名字写进名单' },
    { path: '/ending/remember', label: '结局：有人记得你', file: 'ending/remember.htm', chapter: '结局', desc: '真结局', ending: true },
    { path: '/ending/replace', label: '结局：第100户', file: 'ending/replace.htm', chapter: '结局', desc: '坏结局', ending: true },
    { path: '/ending/forget', label: '结局：查无此人', file: 'ending/forget.htm', chapter: '结局', desc: '普通结局', ending: true },
    { path: '/404', label: '404.htm', file: '404.htm', chapter: '？', desc: '这里没有404室', hidden: true },
    { path: '/lost', label: '错误页', file: 'error/404.htm', chapter: '系统', desc: '页面不存在', system: true }
  ];

  const ENDINGS = [
    {
      id: 'remember',
      path: '/ending/remember',
      title: '有人记得你',
      kind: 'TRUE END',
      note: '照片终于完整了。',
      desc: '在居民名单上写下“沈小满”，让她重新成为一个有名字的人。',
      color: 'remember'
    },
    {
      id: 'replace',
      path: '/ending/replace',
      title: '第100户',
      kind: 'BAD END',
      note: '欢迎回家。',
      desc: '把自己的名字填进照片，替她留在404室。',
      color: 'replace'
    },
    {
      id: 'forget',
      path: '/ending/forget',
      title: '查无此人',
      kind: 'NORMAL END',
      note: '你关掉了网页。',
      desc: '关闭档案，让这个网站和她的名字一起消失。',
      color: 'forget'
    }
  ];

  const SEARCH_INDEX = [
    {
      title: '7号楼到底有没有404？',
      route: '/bbs/404',
      url: 'bbs/topic.asp?id=404',
      desc: '物业说404是仓库。但晚上能听见里面有电视声。……最新回复：她不是不在了，是从来没被登记过。',
      keys: ['404', '7号楼', '房间', '仓库', '小满', '门牌']
    },
    {
      title: '第404条留言 - 纸飞机',
      route: '/guestbook',
      url: 'guestbook/index.htm',
      desc: '如果有一天，有人看到这条留言，请替我去车棚后面看看。我把名字写在墙上了。',
      keys: ['404', '留言', '纸飞机', '名字', '墙', '小满']
    },
    {
      title: '寻人启事：沈小满，女，13岁',
      route: '/notice',
      url: 'news/notice.htm',
      desc: '于1999年12月31日晚在槐安里7号楼附近失踪。短发，穿白色棉袄。',
      keys: ['小满', '沈小满', '寻人', '失踪', '女孩']
    },
    {
      title: '千禧百家福合影活动通知',
      route: '/notice',
      url: 'news/notice.htm',
      desc: '请7号楼各户于12月31日23时到车棚前集合。第100户务必到齐。',
      keys: ['全家福', '合影', '千禧', '百家福', '100', '照片']
    },
    {
      title: '纸飞机的小窝',
      route: '/diary',
      url: '~xiaoman/index.htm',
      desc: '我的生日是1987年11月7日。奶奶说，槐花等我生日的时候就开了。',
      keys: ['纸飞机', '小满', '日记', '生日', '槐花', '主页']
    },
    {
      title: '车棚后面的门千万别开',
      route: '/bbs/underground',
      url: 'bbs/topic.asp?id=7',
      desc: '后面是防空洞。小时候进去过，墙上全是名字。1999年12月31日晚上，居委会让人把门锁了。',
      keys: ['地下室', '防空洞', '车棚', '门', '铁门', '广播']
    },
    {
      title: '槐安日报：地下室杂物间起火 无人员伤亡',
      route: '/archive',
      url: 'archive/20000103.htm',
      desc: '过火面积约4平方米。经查，该杂物间长期无人居住。',
      keys: ['火灾', '起火', '报纸', '旧闻', '伤亡', '地下室']
    },
    {
      title: '404 Not Found',
      route: '/404',
      url: '404.htm',
      desc: '这里没有404室。这里从来没有住过人。……你来了。',
      keys: ['404', '404室', '阿哲', '站长', '没有'],
      hiddenResult: true
    },
    {
      title: '站长的话',
      route: '/about',
      url: 'about.htm',
      desc: '本站将永久关闭。照片我会带走。对不起。',
      keys: ['阿哲', '站长', '关闭', '对不起']
    }
  ];

  const CHAT = {
    contacts: [
      { name: '纸飞机', status: '离线', active: true, avatar: 'assets/photo-portrait-xiaoman.svg' },
      { name: '阿哲', status: '离线', active: false, avatar: 'assets/photo-building.svg' },
      { name: '槐安里居委会', status: '离线', active: false, avatar: 'assets/photo-official.svg' }
    ],
    initial: [
      { who: 'sys', text: '正在连接 OICQ 服务器……' },
      { who: 'sys', text: '连接成功。您登录的号码：10404。' },
      { who: 'sys', text: '好友 纸飞机 当前离线。最后登录：2001-09-14 23:59。' }
    ],
    online: [
      { who: 'sys', text: '纸飞机 上线了。' },
      { who: 'ghost', text: '你找到这里了。' },
      { who: 'ghost', text: '不要相信公告栏。他们写的都不是真的。' }
    ],
    offlineHint: '（对方不在线。也许你应该先找到更多底片。）',
    quick: [
      { label: '你在哪里？', key: 'where' },
      { label: '照片里为什么没有你？', key: 'photo' },
      { label: '我该怎么帮你？', key: 'help' },
      { label: '阿哲是谁？', key: 'azhe' },
      { label: '地下室怎么走？', key: 'basement' },
      { label: '我记得你。', key: 'remember' }
    ],
    replies: {
      where: [
        { who: 'ghost', text: '车棚后面。以前是防空洞，后来放杂物。门锁着。' },
        { who: 'ghost', text: '不过你最好不要一个人来。' }
      ],
      photo: [
        { who: 'ghost', text: '因为名单上没有我。没有名字的人，照片装不进去。' },
        { who: 'ghost', text: '阿哲哥说会把我P上去。后来他连网站也不敢开了。' }
      ],
      help: [
        { who: 'ghost', text: '找齐底片。拼好照片。在名单上写下我的名字。' },
        { who: 'ghost', text: '就这三件事。听起来不难，对吧？' }
      ],
      azhe: [
        { who: 'ghost', text: '站长。他以前给我折纸飞机。' },
        { who: 'ghost', text: '那天晚上他听见我叫他。他没有回头。' },
        { who: 'ghost', text: '我不怪他。我只是有点冷。' }
      ],
      basement: [
        { who: 'ghost', text: '自行车棚后面。铁门。密码是我的生日。' },
        { who: 'ghost', text: '我写在主页上了。你去看过吗？' }
      ],
      remember: [
        { who: 'ghost', text: '你记得我？' },
        { who: 'ghost', text: '那你把这张拿去吧。最后一张在墙里。' },
        { who: 'ghost', text: '到了地下室，不要回头。' }
      ],
      unknown: [
        { who: 'ghost', text: '……' },
        { who: 'ghost', text: '信号不好。你再说一遍。' }
      ]
    },
    keywords: [
      { key: 'where', words: ['在哪', '哪里', '位置'] },
      { key: 'photo', words: ['照片', '合影', '全家福', '没有你'] },
      { key: 'help', words: ['帮你', '怎么帮', '怎么办', '救你'] },
      { key: 'azhe', words: ['阿哲', '站长'] },
      { key: 'basement', words: ['地下室', '防空洞', '车棚', '门'] },
      { key: 'remember', words: ['记得', '名字', '小满', '沈小满'] }
    ],
    fragmentAfter: 'remember'
  };

  const ASSETS = {
    group: 'assets/photo-group.svg',
    building: 'assets/photo-building.svg',
    corridor: 'assets/photo-corridor.svg',
    shed: 'assets/photo-shed.svg',
    basement: 'assets/photo-basement.svg',
    girl: 'assets/photo-girl.svg',
    portrait: 'assets/photo-portrait-xiaoman.svg',
    noface: 'assets/photo-portrait-noface.svg',
    emptyFrame: 'assets/fragment-empty.svg',
    chair: 'assets/photo-chair.svg',
    fire: 'assets/photo-fire.svg',
    official: 'assets/photo-official.svg'
  };

  return { SITE, FRAGMENTS, CLUES, ROUTES, ENDINGS, SEARCH_INDEX, CHAT, ASSETS };
})();
