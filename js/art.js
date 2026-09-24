/* ============================================================
 * 美术资源层
 * ------------------------------------------------------------
 * 这个文件集中管理所有"画面"，业务代码（任务、商店、存档）
 * 不再直接写 SVG。以后要换成孩子画的图，只改这里即可。
 *
 * 换图两种方式：
 *   1. 整体替换：在 RS.art.images 里填图片路径（见 assets/README.md）
 *   2. 改画法：直接改 js/icons.js 里对应的 SVG 图形
 * ============================================================ */
window.RS = window.RS || {};

RS.art = (function () {

  /* ------------------------------------------------------------
   * ① 图片替换表
   * 把图片放进 assets/，然后在这里写上 id -> 路径，
   * 游戏里所有用到这个 id 的地方就会自动换成图片。
   * 例：  fish: 'assets/fish-normal.png',
   * ------------------------------------------------------------ */
  var images = {
    // sub:        'assets/sub.png',
    // subMap:     'assets/sub-map.png',
    // captain:    'assets/captain.png',
    // diver:      'assets/diver.png',
    // crew:       'assets/crew.png',
    // fish:       'assets/fish-normal.png',
    // rareFish:   'assets/fish-rare.png',
    // chest:      'assets/chest.png',
    // turtle:     'assets/turtle.png',
  };

  /* ------------------------------------------------------------
   * ② 素材清单：以后要画哪些图、建议多大，都写在这里
   * （assets/README.md 里的表格就是照着这份清单写的）
   * ------------------------------------------------------------ */
  var spec = [
    { id: 'sub',       name: '潜艇外观（首页大图）', size: '600×400',  where: '开始界面' },
    { id: 'subMap',    name: '潜艇内部地图（整张）', size: '1920×940', where: '主界面，可整张替换' },
    { id: 'captain',   name: '船长',               size: '400×400',  where: '抽身份、顶部信息栏' },
    { id: 'diver',     name: '潜水员',             size: '400×400',  where: '抽身份、救援任务' },
    { id: 'crew',      name: '船员',               size: '400×400',  where: '抽身份、舞台' },
    { id: 'fish',      name: '普通鱼',             size: '300×200',  where: '捕鱼任务、观景区' },
    { id: 'rareFish',  name: '稀有鱼（金色）',      size: '300×200',  where: '捕鱼任务' },
    { id: 'chest',     name: '宝箱',               size: '300×300',  where: '寻宝任务' },
    { id: 'turtle',    name: '小海龟',             size: '300×300',  where: '救援任务' },
    { id: 'whale',     name: '小鲸鱼',             size: '300×300',  where: '救援任务' },
    { id: 'dolphin',   name: '小海豚',             size: '300×300',  where: '救援任务' },
    { id: 'suit',      name: '潜水衣',             size: '200×200',  where: '便利店' },
    { id: 'hook',      name: '鱼钩',               size: '200×200',  where: '便利店' },
    { id: 'spear',     name: '鱼枪',               size: '200×200',  where: '便利店' },
    { id: 'oxygen',    name: '氧气瓶',             size: '200×200',  where: '便利店' },
    { id: 'food',      name: '粮食',               size: '200×200',  where: '便利店、餐厅' },
    { id: 'scissors',  name: '安全剪刀',           size: '200×200',  where: '救援工具' },
    { id: 'balloon',   name: '浮力气囊',           size: '200×200',  where: '救援工具' },
    { id: 'medkit',    name: '海洋急救箱',         size: '200×200',  where: '救援工具' },
    { id: 'star',      name: '成功星星',           size: '200×200',  where: '任务成功界面' }
  ];

  function imageFor(id) { return images[id] || null; }

  /* 在 SVG 内部放一个图标（地图里用）。被替换成图片时自动改用 <image> */
  function iconAt(name, x, y, size) {
    var img = imageFor(name);
    if (img) {
      return '<image href="' + img + '" x="' + x + '" y="' + y +
        '" width="' + size + '" height="' + size + '" preserveAspectRatio="xMidYMid meet"/>';
    }
    return RS.icons.get(name, 'map-icon', true)
      .replace('<svg ', '<svg x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" ');
  }

  /* ============================================================
   * 潜艇内部平面图
   * ============================================================ */

  /* ------------------------------------------------------------
   * 潜艇内部平面图（坐标系 1200×760）
   * 布局参考孩子的原画：上层 休息/餐厅/舞台，下层 驾驶/厕所/设备/储藏，
   * 右端是整面落地舷窗的观景区，中间一道舷梯把两层连起来。
   * ------------------------------------------------------------ */
  var LINE = '#6b503a';          // 手绘线条色（暖棕，不是死黑）

  var ROOMS = {
    /* 上层 */
    rest:    { x: 190, y: 216, w: 236, h: 184, fill: '#ffe6d6', label: '休息区' },
    dining:  { x: 486, y: 216, w: 250, h: 184, fill: '#fff0cf', label: '餐厅'   },
    stage:   { x: 746, y: 216, w: 174, h: 184, fill: '#ffdcef', label: '舞台'   },
    /* 下层 */
    bridge:  { x: 190, y: 412, w: 236, h: 178, fill: '#d6ecff', label: '驾驶区' },
    toilet:  { x: 486, y: 412, w: 96,  h: 178, fill: '#e2f4ff', label: '厕所'   },
    engine:  { x: 590, y: 412, w: 160, h: 178, fill: '#e6e2f7', label: '设备区' },
    storage: { x: 758, y: 412, w: 158, h: 178, fill: '#e8e0cf', label: '储藏区' },
    /* 右端通高的观景舷窗 */
    view:    { x: 928, y: 216, w: 92,  h: 374, fill: '#cfeede', label: '观景区' }
  };

  /* 名牌在房间顶部，家具画在下面的"内容区"，两者不重叠 */
  function content(b) {
    return { x: b.x, y: b.y + 30, w: b.w, h: b.h - 38, cx: b.x + b.w / 2 };
  }

  /* 小工具：手绘感的圆角矩形 */
  function box(x, y, w, h, r, fill, sw) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r +
      '" fill="' + fill + '" stroke="' + LINE + '" stroke-width="' + (sw || 2) + '"/>';
  }

  var DETAIL = {
    /* 休息区：床、小夜灯、挂画、盆栽 —— 原画左上角 */
    rest: function (b) {
      var c = content(b);
      return '' +
        box(c.x + 14, c.y + 46, 122, 46, 10, '#ffd9c0') +
        box(c.x + 14, c.y + 28, 34, 64, 10, '#fff6e4') +
        '<path d="M' + (c.x + 52) + ' ' + (c.y + 58) + ' h84 v16 h-84z" fill="#a9d8f5" stroke="' + LINE + '" stroke-width="2"/>' +
        '<path d="M' + (c.x + 62) + ' ' + (c.y + 64) + ' l4 5 4-5 M' + (c.x + 92) + ' ' + (c.y + 64) + ' l4 5 4-5" stroke="' + LINE + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>' +
        /* 挂画（画的是小鱼） */
        box(c.x + 150, c.y + 8, 56, 42, 6, '#fffaf0') +
        '<ellipse cx="' + (c.x + 176) + '" cy="' + (c.y + 29) + '" rx="13" ry="8" fill="#8fd6f5" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<path d="M' + (c.x + 163) + ' ' + (c.y + 29) + ' l-7 -5 v10z" fill="#6cc3e8" stroke="' + LINE + '" stroke-width="1.4"/>' +
        /* 小夜灯 */
        '<path d="M' + (c.x + 164) + ' ' + (c.y + 92) + ' h26 l-5 -20 h-16z" fill="#ffe9a8" stroke="' + LINE + '" stroke-width="2" class="map-lamp"/>' +
        '<rect x="' + (c.x + 174) + '" y="' + (c.y + 62) + '" width="6" height="12" fill="#cbb08c" stroke="' + LINE + '" stroke-width="1.4"/>' +
        /* 盆栽 */
        '<path d="M' + (c.x + 202) + ' ' + (c.y + 92) + ' h18 l-3 -16 h-12z" fill="#e2a06a" stroke="' + LINE + '" stroke-width="2"/>' +
        '<path d="M' + (c.x + 211) + ' ' + (c.y + 76) + ' q-12 -12 -2 -20 q10 6 2 20 q12 -14 16 -4 q-6 8 -16 4z" fill="#7fce9e" stroke="' + LINE + '" stroke-width="1.8"/>';
    },

    /* 餐厅：原画里的圆桌聚餐 */
    dining: function (b) {
      var c = content(b);
      var tx = c.cx, ty = c.y + 58;
      var chairs = '';
      [-78, -26, 26, 78].forEach(function (dx, i) {
        var top = (i === 0 || i === 3);
        chairs += box(tx + dx - 13, ty - (top ? 40 : -14), 26, 30, 7, '#e0b483');
      });
      return chairs +
        '<ellipse cx="' + tx + '" cy="' + ty + '" rx="84" ry="30" fill="#f0c08a" stroke="' + LINE + '" stroke-width="2.4"/>' +
        '<ellipse cx="' + tx + '" cy="' + (ty - 5) + '" rx="84" ry="30" fill="#ffdcab" stroke="' + LINE + '" stroke-width="2.4"/>' +
        /* 桌上的菜 */
        '<ellipse cx="' + (tx - 44) + '" cy="' + (ty - 8) + '" rx="17" ry="8" fill="#fffaf0" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<circle cx="' + (tx - 44) + '" cy="' + (ty - 13) + '" r="7" fill="#ff9c8a" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<ellipse cx="' + tx + '" cy="' + (ty - 6) + '" rx="20" ry="9" fill="#fffaf0" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<path d="M' + (tx - 11) + ' ' + (ty - 10) + ' q11 -14 22 0z" fill="#ffe08a" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<ellipse cx="' + (tx + 44) + '" cy="' + (ty - 8) + '" rx="17" ry="8" fill="#fffaf0" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<circle cx="' + (tx + 44) + '" cy="' + (ty - 13) + '" r="7" fill="#8fd6a8" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<path class="map-steam" d="M' + tx + ' ' + (ty - 24) + ' q7 -9 0 -17" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>' +
        /* 吊灯 */
        '<path d="M' + tx + ' ' + c.y + ' v14" stroke="' + LINE + '" stroke-width="2"/>' +
        '<path d="M' + (tx - 18) + ' ' + (c.y + 28) + ' q18 -20 36 0z" fill="#ffe9a8" stroke="' + LINE + '" stroke-width="2"/>';
    },

    /* 舞台：迪斯科球、音响、跳舞的孩子、音符 —— 原画右上角 */
    stage: function (b) {
      var c = content(b);
      return '' +
        '<g class="map-spot"><path d="M' + c.cx + ' ' + (c.y + 14) + ' L' + (c.x + 18) + ' ' + (c.y + 98) +
          ' L' + (c.cx + 6) + ' ' + (c.y + 98) + ' Z" fill="#fff3c4" opacity=".75"/></g>' +
        '<g class="map-spot map-spot--2"><path d="M' + c.cx + ' ' + (c.y + 14) + ' L' + (c.cx - 6) + ' ' + (c.y + 98) +
          ' L' + (c.x + c.w - 18) + ' ' + (c.y + 98) + ' Z" fill="#ffd6ef" opacity=".75"/></g>' +
        /* 迪斯科球 */
        '<path d="M' + c.cx + ' ' + c.y + ' v8" stroke="' + LINE + '" stroke-width="2"/>' +
        '<circle class="map-disco" cx="' + c.cx + '" cy="' + (c.y + 16) + '" r="10" fill="#dff1ff" stroke="' + LINE + '" stroke-width="2"/>' +
        '<path d="M' + (c.cx - 10) + ' ' + (c.y + 16) + ' h20 M' + c.cx + ' ' + (c.y + 6) + ' v20" stroke="' + LINE + '" stroke-width="1" opacity=".5"/>' +
        /* 音响 */
        box(c.x + 6, c.y + 52, 24, 46, 5, '#c9a87c') +
        '<circle cx="' + (c.x + 18) + '" cy="' + (c.y + 66) + '" r="6" fill="#8b6f4e" stroke="' + LINE + '" stroke-width="1.4"/>' +
        '<circle cx="' + (c.x + 18) + '" cy="' + (c.y + 84) + '" r="7" fill="#8b6f4e" stroke="' + LINE + '" stroke-width="1.4"/>' +
        box(c.x + c.w - 30, c.y + 52, 24, 46, 5, '#c9a87c') +
        '<circle cx="' + (c.x + c.w - 18) + '" cy="' + (c.y + 66) + '" r="6" fill="#8b6f4e" stroke="' + LINE + '" stroke-width="1.4"/>' +
        '<circle cx="' + (c.x + c.w - 18) + '" cy="' + (c.y + 84) + '" r="7" fill="#8b6f4e" stroke="' + LINE + '" stroke-width="1.4"/>' +
        /* 两个跳舞的孩子 */
        '<g class="map-dancer" style="transform-origin:' + (c.cx - 20) + 'px ' + (c.y + 92) + 'px">' +
          '<circle cx="' + (c.cx - 20) + '" cy="' + (c.y + 56) + '" r="10" fill="#ffd9b0" stroke="' + LINE + '" stroke-width="1.8"/>' +
          '<path d="M' + (c.cx - 31) + ' ' + (c.y + 96) + ' q11 -28 22 0z" fill="#8fd6f5" stroke="' + LINE + '" stroke-width="1.8"/>' +
          '<path d="M' + (c.cx - 32) + ' ' + (c.y + 72) + ' l-8 -10 M' + (c.cx - 8) + ' ' + (c.y + 72) + ' l8 -10" stroke="' + LINE + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="map-dancer map-dancer--2" style="transform-origin:' + (c.cx + 22) + 'px ' + (c.y + 92) + 'px">' +
          '<circle cx="' + (c.cx + 22) + '" cy="' + (c.y + 56) + '" r="10" fill="#ffd9b0" stroke="' + LINE + '" stroke-width="1.8"/>' +
          '<path d="M' + (c.cx + 9) + ' ' + (c.y + 96) + ' q13 -30 26 0z" fill="#ff9cc0" stroke="' + LINE + '" stroke-width="1.8"/>' +
          '<path d="M' + (c.cx + 10) + ' ' + (c.y + 72) + ' l-8 -10 M' + (c.cx + 34) + ' ' + (c.y + 72) + ' l8 -10" stroke="' + LINE + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="map-note"><text x="' + (c.x + 34) + '" y="' + (c.y + 40) + '" font-size="20" fill="' + LINE + '">♪</text></g>' +
        '<g class="map-note map-note--2"><text x="' + (c.x + c.w - 44) + '" y="' + (c.y + 34) + '" font-size="18" fill="' + LINE + '">♫</text></g>';
    },

    /* 驾驶区：操作台、屏幕、戴皇冠的小船长 —— 原画左下角 */
    bridge: function (b) {
      var c = content(b);
      return '' +
        /* 前方大屏 */
        box(c.x + 12, c.y + 4, 66, 48, 6, '#bfe3f7') +
        '<ellipse cx="' + (c.x + 38) + '" cy="' + (c.y + 30) + '" rx="14" ry="9" fill="#8fd6f5" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<path d="M' + (c.x + 24) + ' ' + (c.y + 30) + ' l-7 -5 v10z" fill="#6cc3e8" stroke="' + LINE + '" stroke-width="1.4"/>' +
        /* 雷达 */
        '<circle cx="' + (c.x + 116) + '" cy="' + (c.y + 28) + '" r="23" fill="#0e4f3c" stroke="' + LINE + '" stroke-width="2.4"/>' +
        '<g class="map-radar" style="transform-origin:' + (c.x + 116) + 'px ' + (c.y + 28) + 'px">' +
          '<path d="M' + (c.x + 116) + ' ' + (c.y + 28) + ' L' + (c.x + 116) + ' ' + (c.y + 7) +
          ' A21 21 0 0 1 ' + (c.x + 134) + ' ' + (c.y + 18) + ' Z" fill="#7dffc0" opacity=".7"/>' +
        '</g>' +
        '<circle class="map-blip" cx="' + (c.x + 126) + '" cy="' + (c.y + 20) + '" r="3.4" fill="#7dffc0"/>' +
        /* 操作台 */
        '<path d="M' + (c.x + 10) + ' ' + (c.y + 98) + ' h' + (c.w - 20) + ' l-10 -26 h-' + (c.w - 40) + 'z" fill="#9fc4da" stroke="' + LINE + '" stroke-width="2.2"/>' +
        '<circle cx="' + (c.x + 34) + '" cy="' + (c.y + 84) + '" r="4.5" fill="#ff9c8a" stroke="' + LINE + '" stroke-width="1.4" class="map-led"/>' +
        '<circle cx="' + (c.x + 52) + '" cy="' + (c.y + 84) + '" r="4.5" fill="#ffd166" stroke="' + LINE + '" stroke-width="1.4" class="map-led map-led--2"/>' +
        '<circle cx="' + (c.x + 70) + '" cy="' + (c.y + 84) + '" r="4.5" fill="#8fe3b8" stroke="' + LINE + '" stroke-width="1.4" class="map-led map-led--3"/>' +
        /* 戴皇冠的小船长 */
        '<circle cx="' + (c.x + 168) + '" cy="' + (c.y + 48) + '" r="13" fill="#ffd9b0" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<path d="M' + (c.x + 157) + ' ' + (c.y + 37) + ' l-1 -12 6 5 6 -9 6 9 6 -5 -1 12z" fill="#ffd45e" stroke="' + LINE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M' + (c.x + 153) + ' ' + (c.y + 96) + ' q15 -34 30 0z" fill="#8fd6f5" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<circle cx="' + (c.x + 164) + '" cy="' + (c.y + 47) + '" r="1.6" fill="' + LINE + '"/>' +
        '<circle cx="' + (c.x + 172) + '" cy="' + (c.y + 47) + '" r="1.6" fill="' + LINE + '"/>' +
        '<path d="M' + (c.x + 164) + ' ' + (c.y + 53) + ' q4 3 8 0" stroke="' + LINE + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
        /* 方向舵 */
        '<g class="map-wheel" style="transform-origin:' + (c.x + 200) + 'px ' + (c.y + 64) + 'px">' +
          '<circle cx="' + (c.x + 200) + '" cy="' + (c.y + 64) + '" r="17" fill="none" stroke="' + LINE + '" stroke-width="4.5"/>' +
          '<path d="M' + (c.x + 200) + ' ' + (c.y + 45) + 'v10 M' + (c.x + 200) + ' ' + (c.y + 73) + 'v10' +
          ' M' + (c.x + 181) + ' ' + (c.y + 64) + 'h10 M' + (c.x + 209) + ' ' + (c.y + 64) + 'h10"' +
          ' stroke="' + LINE + '" stroke-width="4" stroke-linecap="round"/>' +
        '</g>';
    },

    /* 厕所：小小一间 */
    toilet: function (b) {
      var c = content(b);
      return '' +
        box(c.cx - 17, c.y + 20, 34, 18, 5, '#fffaf0') +
        '<path d="M' + (c.cx - 21) + ' ' + (c.y + 40) + ' h42 l-6 26 a10 10 0 0 1 -10 7 h-10 a10 10 0 0 1 -10 -7z" fill="#ffffff" stroke="' + LINE + '" stroke-width="2"/>' +
        '<ellipse cx="' + c.cx + '" cy="' + (c.y + 42) + '" rx="17" ry="5" fill="#a9ddf5" stroke="' + LINE + '" stroke-width="1.6"/>' +
        box(c.x + 8, c.y + 82, 26, 10, 4, '#ffffff') +
        '<circle class="map-bub map-bub--1" cx="' + (c.x + 16) + '" cy="' + (c.y + 76) + '" r="4" fill="#ffffff" stroke="' + LINE + '" stroke-width="1.2"/>' +
        '<circle class="map-bub map-bub--2" cx="' + (c.x + 26) + '" cy="' + (c.y + 70) + '" r="3" fill="#ffffff" stroke="' + LINE + '" stroke-width="1.2"/>';
    },

    /* 设备区：管道、氧气罐、大阀门 —— 原画中下 */
    engine: function (b) {
      var c = content(b);
      return '' +
        /* 管道 */
        '<path d="M' + (c.x + 10) + ' ' + (c.y + 16) + ' h50 v26 h44" stroke="' + LINE + '" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M' + (c.x + 10) + ' ' + (c.y + 16) + ' h50 v26 h44" stroke="#cfd8dc" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        /* 大阀门 */
        '<circle cx="' + (c.x + 44) + '" cy="' + (c.y + 72) + '" r="22" fill="#dfe6ea" stroke="' + LINE + '" stroke-width="2.4"/>' +
        '<g class="map-valve" style="transform-origin:' + (c.x + 44) + 'px ' + (c.y + 72) + 'px">' +
          '<circle cx="' + (c.x + 44) + '" cy="' + (c.y + 72) + '" r="7" fill="#b7c3c9" stroke="' + LINE + '" stroke-width="1.6"/>' +
          '<path d="M' + (c.x + 44) + ' ' + (c.y + 54) + 'v10 M' + (c.x + 44) + ' ' + (c.y + 80) + 'v10' +
          ' M' + (c.x + 26) + ' ' + (c.y + 72) + 'h10 M' + (c.x + 52) + ' ' + (c.y + 72) + 'h10"' +
          ' stroke="' + LINE + '" stroke-width="3.4" stroke-linecap="round"/>' +
        '</g>' +
        /* 氧气罐 */
        box(c.x + 92, c.y + 56, 24, 42, 12, '#8fe3b8') +
        '<rect x="' + (c.x + 99) + '" y="' + (c.y + 48) + '" width="10" height="10" rx="3" fill="#cfd8dc" stroke="' + LINE + '" stroke-width="1.6"/>' +
        box(c.x + 124, c.y + 64, 22, 34, 11, '#a9d8f5') +
        '<rect x="' + (c.x + 130) + '" y="' + (c.y + 57) + '" width="10" height="9" rx="3" fill="#cfd8dc" stroke="' + LINE + '" stroke-width="1.6"/>';
    },

    /* 储藏区：宝箱、货架、小机器人 —— 原画右下 */
    storage: function (b) {
      var c = content(b);
      return '' +
        /* 货架 */
        '<path d="M' + (c.x + 8) + ' ' + (c.y + 12) + ' h64 M' + (c.x + 8) + ' ' + (c.y + 40) + ' h64" stroke="' + LINE + '" stroke-width="3" stroke-linecap="round"/>' +
        box(c.x + 12, c.y - 4, 14, 16, 3, '#e8b4a0') +
        box(c.x + 30, c.y - 2, 12, 14, 3, '#a9d8f5') +
        box(c.x + 46, c.y - 6, 16, 18, 3, '#ffd166') +
        box(c.x + 14, c.y + 24, 18, 16, 3, '#c9b6ff') +
        box(c.x + 38, c.y + 22, 20, 18, 3, '#8fe3b8') +
        /* 宝箱（打开的，冒金币） */
        '<path d="M' + (c.x + 10) + ' ' + (c.y + 62) + ' q26 -22 52 0z" fill="#e0a95e" stroke="' + LINE + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        box(c.x + 10, c.y + 62, 52, 32, 5, '#c98d47', 2.2) +
        '<rect x="' + (c.x + 10) + '" y="' + (c.y + 70) + '" width="52" height="6" fill="#ffd166" stroke="' + LINE + '" stroke-width="1.4"/>' +
        '<circle cx="' + (c.x + 24) + '" cy="' + (c.y + 60) + '" r="6" fill="#ffe066" stroke="' + LINE + '" stroke-width="1.4"/>' +
        '<circle cx="' + (c.x + 38) + '" cy="' + (c.y + 56) + '" r="5" fill="#fff0b8" stroke="' + LINE + '" stroke-width="1.4"/>' +
        '<circle cx="' + (c.x + 50) + '" cy="' + (c.y + 60) + '" r="6" fill="#ffd166" stroke="' + LINE + '" stroke-width="1.4"/>' +
        /* 小机器人 */
        box(c.x + 96, c.y + 46, 40, 46, 9, '#dfe6ea') +
        '<circle cx="' + (c.x + 108) + '" cy="' + (c.y + 62) + '" r="4" fill="' + LINE + '"/>' +
        '<circle cx="' + (c.x + 124) + '" cy="' + (c.y + 62) + '" r="4" fill="' + LINE + '"/>' +
        '<path d="M' + (c.x + 106) + ' ' + (c.y + 76) + ' q10 7 20 0" stroke="' + LINE + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + (c.x + 116) + ' ' + (c.y + 46) + ' v-8" stroke="' + LINE + '" stroke-width="2.4"/>' +
        '<circle class="map-blip" cx="' + (c.x + 116) + '" cy="' + (c.y + 36) + '" r="4" fill="#ff9c8a" stroke="' + LINE + '" stroke-width="1.4"/>';
    },

    /* 观景区：整面落地舷窗，外面有鱼游过 */
    view: function (b) {
      var c = content(b);
      var out = '';
      for (var i = 0; i < 3; i++) {
        var wy = c.y + 8 + i * 106;
        out += box(c.x + 14, wy, 64, 92, 10, '#7cc7e8');
        out += '<g class="map-fish map-fish--' + (i + 1) + '">' +
          '<ellipse cx="' + (c.x + 40) + '" cy="' + (wy + 44) + '" rx="13" ry="8" fill="' + (i === 1 ? '#ffd971' : '#a8e6fb') + '" stroke="' + LINE + '" stroke-width="1.6"/>' +
          '<path d="M' + (c.x + 27) + ' ' + (wy + 44) + ' l-8 -6 v12z" fill="' + (i === 1 ? '#f5b53c' : '#6cc3e8') + '" stroke="' + LINE + '" stroke-width="1.4"/>' +
          '<circle cx="' + (c.x + 46) + '" cy="' + (wy + 41) + '" r="1.8" fill="' + LINE + '"/>' +
          '</g>';
        out += '<circle class="map-bub map-bub--' + (i % 2 + 1) + '" cx="' + (c.x + 62) + '" cy="' + (wy + 74) + '" r="4" fill="#ffffff" opacity=".85"/>';
      }
      return out;
    }
  };

  function roomGroup(id) {
    var b = ROOMS[id];
    if (!b) { return ''; }
    var cx = b.x + b.w / 2;
    var narrow = b.w < 110;
    var plateW = narrow ? (b.w - 12) : 104;
    var detail = DETAIL[id] ? DETAIL[id](b) : '';
    return '<g class="room" data-room="' + id + '" tabindex="0" role="button" aria-label="进入' + b.label + '">' +
      '<rect class="room__glow" x="' + (b.x - 5) + '" y="' + (b.y - 5) + '" width="' + (b.w + 10) +
        '" height="' + (b.h + 10) + '" rx="20" fill="none"/>' +
      '<rect class="room__rect" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h +
        '" rx="14" fill="' + b.fill + '"/>' +
      '<g class="room__detail">' + detail + '</g>' +
      '<rect class="room__plate" x="' + (cx - plateW / 2) + '" y="' + (b.y + 6) + '" width="' + plateW + '" height="24" rx="12"/>' +
      '<text class="room__label' + (narrow ? ' room__label--sm' : '') + '" x="' + cx + '" y="' + (b.y + 23) + '" text-anchor="middle">' + b.label + '</text>' +
      '<rect class="room__hit" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="14" fill="transparent"/>' +
      '</g>';
  }

  /* ---------------- 皇冠：原画最重要的识别元素 ---------------- */
  function crown() {
    return '<g class="sub-crown">' +
      '<path d="M540 148 L534 74 l28 22 26 -44 26 44 28 -22 -6 74z" fill="#ffd45e" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<rect x="536" y="146" width="112" height="20" rx="9" fill="#f5b53c" stroke="' + LINE + '" stroke-width="4"/>' +
      '<circle cx="534" cy="70" r="10" fill="#fff0b8" stroke="' + LINE + '" stroke-width="3.4"/>' +
      '<circle cx="588" cy="46" r="12" fill="#fff0b8" stroke="' + LINE + '" stroke-width="3.4"/>' +
      '<circle cx="642" cy="70" r="10" fill="#fff0b8" stroke="' + LINE + '" stroke-width="3.4"/>' +
      '<path d="M588 108 l11 14 -11 14 -11 -14z" fill="#8fd6f5" stroke="' + LINE + '" stroke-width="3"/>' +
      '</g>';
  }

  /* ---------------- 海底世界：海豚、水母、章鱼、鱼群、海草 ---------------- */
  function seaLife() {
    var fishSchool = '';
    [[250, 96], [286, 82], [318, 104], [214, 118], [282, 122]].forEach(function (pt, i) {
      fishSchool += '<g class="sea-fish sea-fish--' + (i % 3 + 1) + '">' +
        '<ellipse cx="' + pt[0] + '" cy="' + pt[1] + '" rx="13" ry="7.5" fill="#9fdcf5" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<path d="M' + (pt[0] - 13) + ' ' + pt[1] + ' l-9 -6 v12z" fill="#7cc7e8" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<circle cx="' + (pt[0] + 5) + '" cy="' + (pt[1] - 2) + '" r="1.7" fill="' + LINE + '"/></g>';
    });

    var weeds = '';
    [[120, 3], [172, 2], [1042, 3], [1104, 2], [66, 2], [996, 2]].forEach(function (w, i) {
      var x = w[0], n = w[1];
      for (var k = 0; k < n; k++) {
        var xx = x + k * 16;
        weeds += '<path class="sea-weed sea-weed--' + ((i + k) % 3 + 1) + '" d="M' + xx + ' 742 q-16 -34 2 -62 q14 26 -2 62z" ' +
          'fill="#7fce9e" stroke="' + LINE + '" stroke-width="2" style="transform-origin:' + xx + 'px 742px"/>';
      }
    });

    var bubbles = '';
    [[150, 620, 7], [1080, 560, 9], [300, 680, 6], [960, 660, 8], [80, 470, 6], [1140, 380, 7]].forEach(function (p, i) {
      bubbles += '<circle class="sea-bub sea-bub--' + (i % 3 + 1) + '" cx="' + p[0] + '" cy="' + p[1] +
        '" r="' + p[2] + '" fill="none" stroke="#e8f8ff" stroke-width="2.4" opacity=".85"/>';
    });

    return '' +
      /* 光柱 */
      '<g class="sea-rays" opacity=".5">' +
        '<path d="M300 0 L200 760 L330 760 L420 0z" fill="#ffffff" opacity=".13"/>' +
        '<path d="M760 0 L700 760 L790 760 L860 0z" fill="#ffffff" opacity=".1"/>' +
      '</g>' +
      /* 海豚（左上） */
      '<g class="sea-dolphin">' +
        '<path d="M60 150 q42 -70 116 -56 q36 6 54 30 q-34 10 -56 34 q-24 26 -62 28 q10 -20 4 -34 q-30 4 -56 -2z" fill="#cfe6f2" stroke="' + LINE + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M120 94 q10 -30 34 -30 q-14 16 -8 32z" fill="#bcd9e8" stroke="' + LINE + '" stroke-width="2.2"/>' +
        '<circle cx="168" cy="118" r="3.4" fill="' + LINE + '"/>' +
        '<path d="M182 132 q10 4 18 0" stroke="' + LINE + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</g>' +
      /* 水母（右上） */
      '<g class="sea-jelly">' +
        '<path d="M1068 120 a40 34 0 0 1 80 0 q-40 14 -80 0z" fill="#ffd6ef" stroke="' + LINE + '" stroke-width="2.6"/>' +
        '<path d="M1080 126 q-6 34 6 48 M1098 130 q-4 36 4 50 M1118 130 q4 36 -2 50 M1136 126 q8 32 -4 46" ' +
          'stroke="' + LINE + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="1094" cy="108" r="3" fill="' + LINE + '"/><circle cx="1122" cy="108" r="3" fill="' + LINE + '"/>' +
        '<path d="M1100 118 q8 6 16 0" stroke="' + LINE + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</g>' +
      fishSchool +
      /* 海底地面 */
      '<path class="sea-floor" d="M0 760 V712 q80 -26 170 -12 q90 14 180 -6 q120 -26 230 -2 q110 22 220 -4 q100 -24 200 -6 q110 10 200 -8 V760z" ' +
        'fill="#f3dfb4" stroke="' + LINE + '" stroke-width="2.6"/>' +
      weeds +
      /* 章鱼（右下） */
      '<g class="sea-octo">' +
        '<path d="M986 716 a44 40 0 0 1 88 0 q-6 18 -22 22 q-10 -14 -22 0 q-12 -14 -22 0 q-16 -6 -22 -22z" fill="#ffb3c6" stroke="' + LINE + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<circle cx="1012" cy="700" r="4.4" fill="' + LINE + '"/><circle cx="1048" cy="700" r="4.4" fill="' + LINE + '"/>' +
        '<path d="M1018 712 q12 8 24 0" stroke="' + LINE + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '</g>' +
      /* 海星 */
      '<path d="M380 742 l8 -22 8 22 22 2 -18 14 6 22 -18 -13 -18 13 6 -22 -18 -14z" fill="#ffc6a0" stroke="' + LINE + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      bubbles;
  }

  /* ---------------- 整张地图 ---------------- */
  function submarineMap() {
    var whole = imageFor('subMap');
    if (whole) {
      return '<div class="sub-photo"><img src="' + whole + '" alt="皇家潜艇内部地图" />' +
        '<div class="sub-photo__hint">（整张地图已换成图片，房间热区请在 js/art.js 的 ROOMS 里调整坐标）</div></div>';
    }

    var rooms = ['rest', 'dining', 'stage', 'bridge', 'toilet', 'engine', 'storage', 'view']
      .map(roomGroup).join('');

    /* 艇身舷窗 */
    var ports = '';
    [186, 246, 306, 366, 426, 486, 546, 654, 946, 1006].forEach(function (x, i) {
      ports += '<g class="port">' +
        '<rect class="sub-window" x="' + x + '" y="610" width="28" height="28" rx="6"/>' +
        '<circle class="port__bub port__bub--' + (i % 3 + 1) + '" cx="' + (x + 14) + '" cy="632" r="3.2" fill="#ffffff" opacity=".9"/>' +
        '</g>';
    });

    return '' +
      '<svg class="sub-svg" viewBox="0 0 1200 760" xmlns="http://www.w3.org/2000/svg" ' +
      'role="group" aria-label="皇家潜艇内部平面图">' +
      '<defs>' +
        '<filter id="sketch" x="-6%" y="-6%" width="112%" height="112%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.026" numOctaves="2" seed="7" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter>' +
        '<linearGradient id="hullGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffeec2"/><stop offset="0.5" stop-color="#ffd98e"/>' +
          '<stop offset="1" stop-color="#eab15c"/>' +
        '</linearGradient>' +
        '<linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#fff8d0" stop-opacity=".85"/>' +
          '<stop offset="1" stop-color="#fff8d0" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +

      seaLife() +

      /* 尾翼与螺旋桨（左） */
      '<path class="sk" d="M104 300 L34 246 L40 452 L104 404 Z" fill="#e8a94c" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<g class="sub-propeller" style="transform-origin:64px 350px">' +
        '<ellipse cx="64" cy="350" rx="12" ry="40" fill="#e8c98d" stroke="' + LINE + '" stroke-width="3.4"/>' +
        '<circle cx="64" cy="350" r="11" fill="#c9a266" stroke="' + LINE + '" stroke-width="3"/>' +
      '</g>' +

      /* 探照灯：像原画那样从艇底朝海底照 */
      '<path class="sub-beam" d="M566 636 L452 742 L748 742 L634 636 Z" fill="url(#beamGrad)"/>' +

      /* 艇身 */
      '<rect class="sk hull" x="100" y="160" width="1000" height="480" rx="150" ry="150" ' +
        'fill="url(#hullGrad)" stroke="' + LINE + '" stroke-width="6"/>' +
      '<rect class="sk" x="160" y="195" width="880" height="410" rx="55" ' +
        'fill="#fffaf0" stroke="' + LINE + '" stroke-width="4"/>' +

      /* 艇身上的「👑 皇家潜艇」字样：写在艇底的黄带上（原画里也有这行字） */
      '<g class="hull-name">' +
        '<path d="M726 630 l-3 -20 8 6 8 -12 8 12 8 -6 -3 20z" fill="#ffd45e" stroke="' + LINE + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<text x="752" y="632" font-size="27" font-weight="900" fill="' + LINE + '" letter-spacing="3">皇家潜艇</text>' +
      '</g>' +
      /* 探照灯灯头 */
      '<ellipse class="sk" cx="600" cy="640" rx="36" ry="12" fill="#e8c98d" stroke="' + LINE + '" stroke-width="3"/>' +
      '<ellipse class="sub-lamp" cx="600" cy="642" rx="26" ry="7" fill="#fff8d0" stroke="' + LINE + '" stroke-width="2"/>' +

      /* 指挥塔 + 皇冠 + 天线 */
      '<path class="sk" d="M476 166 q0 -44 44 -44 h146 q44 0 44 44z" fill="#ffe4a8" stroke="' + LINE + '" stroke-width="5"/>' +
      '<circle class="sub-window" cx="520" cy="142" r="14"/>' +
      '<circle class="sub-window" cx="594" cy="142" r="14"/>' +
      '<circle class="sub-window" cx="668" cy="142" r="14"/>' +
      '<path d="M700 122 v-58 M724 122 v-38" stroke="' + LINE + '" stroke-width="4" stroke-linecap="round"/>' +
      '<circle class="sub-beacon" cx="700" cy="60" r="7" fill="#ff9c8a" stroke="' + LINE + '" stroke-width="2.4"/>' +
      '<circle cx="724" cy="82" r="6" fill="#8fd6f5" stroke="' + LINE + '" stroke-width="2.4"/>' +
      crown() +

      /* 甲板隔层 + 舷梯 */
      '<rect class="sk" x="160" y="398" width="880" height="14" rx="7" fill="#e8c98d" stroke="' + LINE + '" stroke-width="3"/>' +
      '<g class="sub-ladder">' +
        '<path d="M438 220 v372 M474 220 v372" stroke="' + LINE + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M438 262 h36 M438 306 h36 M438 350 h36 M438 442 h36 M438 486 h36 M438 530 h36" ' +
          'stroke="' + LINE + '" stroke-width="4" stroke-linecap="round"/>' +
      '</g>' +

      rooms +
      ports +
      '</svg>';
  }

  /* ============================================================
   * 房间内部场景（点进房间后下方显示的小画面）
   * ============================================================ */
  var scenes = {
    rest: function () {
      return '<div class="scene scene--rest">' +
          '<span class="rest-lamp"></span>' +
          '<div class="rest-bed"><i class="rest-bed__pillow"></i><i class="rest-bed__quilt"></i></div>' +
          '<span class="rest-zzz rest-zzz--1">z</span><span class="rest-zzz rest-zzz--2">z</span>' +
          '<span class="rest-zzz rest-zzz--3">Z</span>' +
        '</div>';
    },
    engine: function () {
      return '<div class="scene scene--engine">' +
          '<span class="eng-valve">' + RS.icons.get('gear', 'icon--scene') + '</span>' +
          '<span class="eng-tank"></span><span class="eng-tank eng-tank--2"></span>' +
          '<div class="eng-pipes"><i></i><i></i></div>' +
          '<span class="eng-bub"></span><span class="eng-bub eng-bub--2"></span>' +
        '</div>';
    },
    bridge: function () {
      return '<div class="scene scene--bridge">' +
          '<div class="radar"><span class="radar__grid"></span><span class="radar__sweep"></span>' +
            '<span class="radar__dot radar__dot--1"></span><span class="radar__dot radar__dot--2"></span></div>' +
          '<div class="wheel-spin">' + RS.icons.get('wheel', 'icon--scene') + '</div>' +
          '<div class="console-lights"><span></span><span></span><span></span><span></span></div>' +
        '</div>';
    },
    view: function () {
      var fishes = ['fish', 'rareFish', 'turtle'];
      var win = fishes.map(function (f, i) {
        return '<div class="porthole">' +
            '<span class="porthole__ray"></span>' +
            '<span class="porthole__fish porthole__fish--' + (i + 1) + '">' + RS.icons.get(f, 'icon--scene') + '</span>' +
            '<span class="porthole__bub porthole__bub--a"></span>' +
            '<span class="porthole__bub porthole__bub--b"></span>' +
          '</div>';
      }).join('');
      return '<div class="scene scene--view">' +
          '<div class="portholes">' + win + '</div>' +
          '<div class="reef"><span class="reef__coral"></span><span class="reef__coral"></span>' +
            '<span class="reef__coral"></span><span class="reef__coral"></span><span class="reef__coral"></span></div>' +
        '</div>';
    },
    dining: function () {
      return '<div class="scene scene--dining">' +
          '<div class="dining-table">' +
            '<span class="dish dish--1">' + RS.icons.get('food', 'icon--scene') + '<i class="steam"></i></span>' +
            '<span class="dish dish--2">' + RS.icons.get('food', 'icon--scene') + '<i class="steam"></i></span>' +
            '<span class="dish dish--3">' + RS.icons.get('food', 'icon--scene') + '<i class="steam"></i></span>' +
            '<div class="dining-table__top"></div>' +
            '<div class="dining-table__legs"><span></span><span></span></div>' +
          '</div>' +
        '</div>';
    },
    storage: function () {
      return '<div class="scene scene--storage">' +
          '<span class="crate crate--1">' + RS.icons.get('box', 'icon--scene') + '</span>' +
          '<span class="crate crate--2">' + RS.icons.get('oxygen', 'icon--scene') + '</span>' +
          '<span class="crate crate--3">' + RS.icons.get('suit', 'icon--scene') + '</span>' +
          '<span class="crate crate--4">' + RS.icons.get('food', 'icon--scene') + '</span>' +
          '<div class="shelf"></div>' +
        '</div>';
    },
    toilet: function () {
      return '<div class="scene scene--toilet" id="toiletScene">' +
          RS.icons.get('toilet', 'icon--scene-lg') +
          '<div class="sink-bubbles"><span></span><span></span><span></span><span></span></div>' +
        '</div>';
    },
    stage: function () {
      return '<div class="scene scene--stage" id="stageScene">' +
          '<span class="spot spot--l"></span><span class="spot spot--r"></span>' +
          '<span class="disco"></span>' +
          '<div class="stage-floor"></div>' +
          '<span class="performer" id="performer">' + RS.icons.get('crew', 'icon--scene-lg') + '</span>' +
          '<span class="note note--1">♪</span><span class="note note--2">♫</span>' +
        '</div>';
    }
  };

  return {
    images: images,
    spec: spec,
    imageFor: imageFor,
    iconAt: iconAt,
    rooms: ROOMS,
    submarineMap: submarineMap,
    scenes: scenes
  };
})();
