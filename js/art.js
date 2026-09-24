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

  /* 房间位置：坐标系 960×470，必须落在内舱（约 x 92~868 / y 92~358）里，
     并且要避开内舱的圆角，否则方框会戳出艇身 */
  var ROOMS = {
    bridge:  { x: 150, y: 120, w: 144, h: 210, fill: '#c8e9ff', label: '驾驶区' },
    view:    { x: 306, y: 104, w: 190, h: 116, fill: '#c6f2e4', label: '观景区' },
    dining:  { x: 306, y: 228, w: 190, h: 116, fill: '#ffe3c6', label: '餐厅'   },
    stage:   { x: 512, y: 104, w: 190, h: 116, fill: '#ffd8ef', label: '舞台'   },
    storage: { x: 512, y: 228, w: 190, h: 116, fill: '#e7dcff', label: '储藏区' },
    toilet:  { x: 718, y: 150, w: 118, h: 150, fill: '#d8f1ff', label: '厕所'   }
  };

  /* 名牌在房间顶部，家具画在下面的"内容区"，两者不会重叠 */
  function content(b) {
    return { x: b.x, y: b.y + 30, w: b.w, h: b.h - 38, cx: b.x + b.w / 2 };
  }

  /* 每个房间里的小家具细节（让房间一眼能认出来） */
  var DETAIL = {
    bridge: function (b) {
      var c = content(b);
      var rx = c.cx - 32, ry = c.y + 46;      // 雷达中心
      var wx = c.cx + 34, wy = c.y + 46;      // 方向舵中心
      return '' +
        '<circle cx="' + rx + '" cy="' + ry + '" r="28" fill="#0b3d2e" stroke="#d9912c" stroke-width="4"/>' +
        '<g class="map-radar" style="transform-origin:' + rx + 'px ' + ry + 'px">' +
          '<path d="M' + rx + ' ' + ry + ' L' + rx + ' ' + (ry - 26) +
          ' A26 26 0 0 1 ' + (rx + 22) + ' ' + (ry - 13) + ' Z" fill="#7dffc0" opacity=".7"/>' +
        '</g>' +
        '<circle cx="' + (rx + 12) + '" cy="' + (ry - 10) + '" r="4" fill="#7dffc0" class="map-blip"/>' +
        '<g class="map-wheel" style="transform-origin:' + wx + 'px ' + wy + 'px">' +
          '<circle cx="' + wx + '" cy="' + wy + '" r="22" fill="none" stroke="#b07a3c" stroke-width="6"/>' +
          '<circle cx="' + wx + '" cy="' + wy + '" r="6" fill="#d79a4e"/>' +
          '<path d="M' + wx + ' ' + (wy - 28) + 'v12 M' + wx + ' ' + (wy + 16) + 'v12' +
          ' M' + (wx - 28) + ' ' + wy + 'h12 M' + (wx + 16) + ' ' + wy + 'h12"' +
          ' stroke="#b07a3c" stroke-width="6" stroke-linecap="round"/>' +
        '</g>' +
        '<rect x="' + (c.x + 16) + '" y="' + (c.y + 108) + '" width="' + (c.w - 32) + '" height="26" rx="8" fill="#9fc4da"/>' +
        '<circle cx="' + (c.x + 36) + '" cy="' + (c.y + 121) + '" r="5" fill="#ff7a6b" class="map-led"/>' +
        '<circle cx="' + (c.x + 56) + '" cy="' + (c.y + 121) + '" r="5" fill="#ffd166" class="map-led map-led--2"/>' +
        '<circle cx="' + (c.x + 76) + '" cy="' + (c.y + 121) + '" r="5" fill="#7dffc0" class="map-led map-led--3"/>' +
        '<rect x="' + (c.x + 20) + '" y="' + (c.y + 146) + '" width="' + (c.w - 40) + '" height="10" rx="5" fill="#a9cede"/>';
    },
    view: function (b) {
      var c = content(b);
      var out = '';
      for (var i = 0; i < 3; i++) {
        var wx = c.x + 14 + i * 60;
        var wy = c.y + 4;
        out += '<rect x="' + wx + '" y="' + wy + '" width="44" height="44" rx="5" fill="#2b9fd4" stroke="#ffffff" stroke-width="4"/>';
        out += '<g class="map-fish map-fish--' + (i + 1) + '">' +
          '<ellipse cx="' + (wx + 14) + '" cy="' + (wy + 23) + '" rx="10" ry="6" fill="' + (i === 1 ? '#ffc94a' : '#9be3ff') + '"/>' +
          '<path d="M' + (wx + 4) + ' ' + (wy + 23) + ' l-7 -5 v10 z" fill="' + (i === 1 ? '#f2a33c' : '#6fd0f5') + '"/>' +
          '</g>';
      }
      out += '<path d="M' + (c.x + 12) + ' ' + (c.y + 70) + ' q30 -12 60 0 t60 0 t46 -4" stroke="#8fd6bd" stroke-width="7" fill="none" stroke-linecap="round"/>';
      return out;
    },
    dining: function (b) {
      var c = content(b);
      return '' +
        '<rect x="' + (c.x + 20) + '" y="' + (c.y + 38) + '" width="' + (c.w - 40) + '" height="12" rx="6" fill="#d79a4e"/>' +
        '<rect x="' + (c.x + 32) + '" y="' + (c.y + 50) + '" width="8" height="22" rx="3" fill="#b07a3c"/>' +
        '<rect x="' + (c.x + c.w - 40) + '" y="' + (c.y + 50) + '" width="8" height="22" rx="3" fill="#b07a3c"/>' +
        '<ellipse cx="' + (c.cx - 48) + '" cy="' + (c.y + 34) + '" rx="16" ry="7" fill="#ffffff"/>' +
        '<circle cx="' + (c.cx - 48) + '" cy="' + (c.y + 29) + '" r="7" fill="#ff7a6b"/>' +
        '<ellipse cx="' + c.cx + '" cy="' + (c.y + 34) + '" rx="16" ry="7" fill="#ffffff"/>' +
        '<rect x="' + (c.cx - 9) + '" y="' + (c.y + 23) + '" width="18" height="10" rx="4" fill="#ffe9a8"/>' +
        '<ellipse cx="' + (c.cx + 48) + '" cy="' + (c.y + 34) + '" rx="16" ry="7" fill="#ffffff"/>' +
        '<circle cx="' + (c.cx + 48) + '" cy="' + (c.y + 29) + '" r="7" fill="#3ddc97"/>' +
        '<path class="map-steam" d="M' + c.cx + ' ' + (c.y + 18) + ' q6 -8 0 -14" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>';
    },
    storage: function (b) {
      var c = content(b);
      return '' +
        '<rect x="' + (c.x + 16) + '" y="' + (c.y + 34) + '" width="' + (c.w - 32) + '" height="6" rx="3" fill="#a98cf0"/>' +
        '<rect x="' + (c.x + 16) + '" y="' + (c.y + 70) + '" width="' + (c.w - 32) + '" height="6" rx="3" fill="#a98cf0"/>' +
        '<rect x="' + (c.x + 24) + '" y="' + (c.y + 6) + '" width="34" height="28" rx="4" fill="#d79a4e"/>' +
        '<rect x="' + (c.x + 24) + '" y="' + (c.y + 17) + '" width="34" height="6" fill="#ffc34d"/>' +
        '<rect x="' + (c.x + 66) + '" y="' + (c.y + 12) + '" width="26" height="22" rx="4" fill="#c9b6ff"/>' +
        '<rect x="' + (c.x + 100) + '" y="' + (c.y + 6) + '" width="16" height="28" rx="8" fill="#3ddc97"/>' +
        '<rect x="' + (c.x + 104) + '" y="' + (c.y + 1) + '" width="8" height="7" rx="3" fill="#9aa7ad"/>' +
        '<path d="M' + (c.x + 132) + ' ' + (c.y + 42) + ' h18 l4 12 -6 3 v13 h-14 v-13 l-6 -3z" fill="#0e88c4"/>' +
        '<circle cx="' + (c.x + 141) + '" cy="' + (c.y + 46) + '" r="5" fill="#cfefff"/>' +
        '<rect x="' + (c.x + 26) + '" y="' + (c.y + 44) + '" width="30" height="26" rx="4" fill="#e0b57a"/>';
    },
    toilet: function (b) {
      var c = content(b);
      return '' +
        '<rect x="' + (c.cx - 18) + '" y="' + (c.y + 14) + '" width="36" height="20" rx="6" fill="#eef7fb"/>' +
        '<path d="M' + (c.cx - 22) + ' ' + (c.y + 36) + ' h44 l-5 24 a10 10 0 0 1 -10 7 h-14 a10 10 0 0 1 -10 -7z" fill="#ffffff"/>' +
        '<ellipse cx="' + c.cx + '" cy="' + (c.y + 38) + '" rx="18" ry="5" fill="#7fd8f7"/>' +
        '<rect x="' + (c.x + 14) + '" y="' + (c.y + 78) + '" width="30" height="12" rx="5" fill="#ffffff"/>' +
        '<circle class="map-bub map-bub--1" cx="' + (c.x + 24) + '" cy="' + (c.y + 72) + '" r="4" fill="#ffffff" opacity=".9"/>' +
        '<circle class="map-bub map-bub--2" cx="' + (c.x + 34) + '" cy="' + (c.y + 66) + '" r="3" fill="#ffffff" opacity=".9"/>';
    },
    stage: function (b) {
      var c = content(b);
      return '' +
        '<g class="map-spot">' +
          '<path d="M' + (c.x + 34) + ' ' + (c.y + 2) + ' L' + (c.x + 14) + ' ' + (c.y + 66) + ' L' + (c.x + 62) + ' ' + (c.y + 66) + ' Z" fill="#fff3c4" opacity=".8"/>' +
        '</g>' +
        '<g class="map-spot map-spot--2">' +
          '<path d="M' + (c.x + c.w - 34) + ' ' + (c.y + 2) + ' L' + (c.x + c.w - 62) + ' ' + (c.y + 66) + ' L' + (c.x + c.w - 14) + ' ' + (c.y + 66) + ' Z" fill="#ffd6ef" opacity=".8"/>' +
        '</g>' +
        '<rect x="' + (c.x + 14) + '" y="' + (c.y + 62) + '" width="' + (c.w - 28) + '" height="10" rx="4" fill="#d79a4e"/>' +
        '<g class="map-dancer" style="transform-origin:' + c.cx + 'px ' + (c.y + 56) + 'px">' +
          '<circle cx="' + c.cx + '" cy="' + (c.y + 26) + '" r="9" fill="#ffd9b0"/>' +
          '<path d="M' + (c.cx - 10) + ' ' + (c.y + 62) + ' q10 -26 20 0z" fill="#ff7a6b"/>' +
        '</g>' +
        '<g class="map-note"><circle cx="' + (c.cx + 42) + '" cy="' + (c.y + 26) + '" r="5" fill="#ffffff"/>' +
        '<rect x="' + (c.cx + 45) + '" y="' + (c.y + 10) + '" width="3" height="18" fill="#ffffff"/></g>';
    }
  };

  function roomGroup(id) {
    var b = ROOMS[id];
    if (!b) { return ''; }
    var cx = b.x + b.w / 2;
    var detail = DETAIL[id] ? DETAIL[id](b) : '';
    return '<g class="room" data-room="' + id + '" tabindex="0" role="button" aria-label="进入' + b.label + '">' +
      '<rect class="room__glow" x="' + (b.x - 4) + '" y="' + (b.y - 4) + '" width="' + (b.w + 8) +
        '" height="' + (b.h + 8) + '" rx="20" fill="none"/>' +
      '<rect class="room__rect" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h +
        '" rx="16" fill="' + b.fill + '"/>' +
      '<g class="room__detail">' + detail + '</g>' +
      '<rect class="room__plate" x="' + (cx - 52) + '" y="' + (b.y + 5) + '" width="104" height="25" rx="12"/>' +
      '<text class="room__label" x="' + cx + '" y="' + (b.y + 23) + '" text-anchor="middle">' + b.label + '</text>' +
      '<rect class="room__hit" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="16" fill="transparent"/>' +
      '</g>';
  }

  /* 艇身上的方形舷窗 */
  function windowsRow(xs, y, size) {
    return xs.map(function (x, i) {
      return '<g class="port"><rect class="sub-window" x="' + x + '" y="' + y + '" width="' + size +
        '" height="' + size + '" rx="4"/>' +
        '<circle class="port__bub port__bub--' + (i % 3 + 1) + '" cx="' + (x + size / 2) + '" cy="' + (y + size - 5) + '" r="3" fill="#ffffff" opacity=".85"/>' +
        '</g>';
    }).join('');
  }

  function submarineMap() {
    /* 整张地图也可以被一张图片替换 */
    var whole = imageFor('subMap');
    if (whole) {
      return '<div class="sub-photo"><img src="' + whole + '" alt="皇家潜艇内部地图" />' +
        '<div class="sub-photo__hint">（整张地图已换成图片，房间热区请在 js/art.js 的 ROOMS 里调整坐标）</div></div>';
    }

    var rooms = ['bridge', 'view', 'dining', 'stage', 'storage', 'toilet'].map(roomGroup).join('');

    return '' +
      '<svg class="sub-svg" viewBox="0 0 960 470" xmlns="http://www.w3.org/2000/svg" ' +
      'role="group" aria-label="皇家潜艇内部平面图">' +
      '<defs>' +
        '<linearGradient id="hullGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffe08c"/><stop offset="0.55" stop-color="#ffc34d"/>' +
          '<stop offset="1" stop-color="#e09a2d"/>' +
        '</linearGradient>' +
        '<linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#f0b34a"/>' +
        '</linearGradient>' +
        '<radialGradient id="beamGrad" cx="0" cy="0.5" r="1">' +
          '<stop offset="0" stop-color="#fff8d0" stop-opacity=".95"/>' +
          '<stop offset="1" stop-color="#fff8d0" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +

      /* 艇首探照灯光束 */
      '<path class="sub-beam" d="M50 225 L-70 150 L-70 300 Z" fill="url(#beamGrad)"/>' +

      /* 尾翼与螺旋桨 */
      '<path d="M886 148 L946 104 L940 226 Z" fill="#d9912c"/>' +
      '<path d="M886 302 L946 346 L940 226 Z" fill="#d9912c"/>' +
      '<g class="sub-propeller" style="transform-origin:922px 225px">' +
        '<ellipse cx="922" cy="225" rx="9" ry="30" fill="#c07f22"/>' +
        '<circle cx="922" cy="225" r="9" fill="#8d5d29"/>' +
      '</g>' +

      /* 艇首 */
      '<path d="M70 146 Q14 225 70 304 Z" fill="#e8a93c"/>' +
      '<circle class="sub-light" cx="56" cy="225" r="14" fill="#fff3c4"/>' +

      /* 指挥塔与潜望镜 */
      '<rect x="418" y="26" width="134" height="50" rx="16" fill="url(#towerGrad)" stroke="#c07f22" stroke-width="5"/>' +
      '<rect x="468" y="2" width="9" height="28" rx="4" fill="#c07f22"/>' +
      '<circle class="sub-beacon" cx="472" cy="4" r="8" fill="#ff7a6b"/>' +
      '<rect class="sub-window" x="438" y="42" width="24" height="24" rx="4"/>' +
      '<rect class="sub-window" x="506" y="42" width="24" height="24" rx="4"/>' +

      /* 艇身：外壳 + 内舱 */
      '<rect x="66" y="66" width="828" height="318" rx="155" ry="159" ' +
        'fill="url(#hullGrad)" stroke="#a96a17" stroke-width="9"/>' +
      '<rect x="92" y="92" width="776" height="266" rx="132" ry="133" fill="#fffaf0" stroke="#e8c98d" stroke-width="4"/>' +

      /* 方形舷窗 */
      windowsRow([150, 212, 274, 336, 398, 460, 522, 584, 646, 708, 770], 352, 28) +
      windowsRow([150, 212, 646, 708, 770], 90, 28) +

      /* 走廊 */
      '<g class="sub-corridor">' +
        '<path d="M292 225 H308 M494 225 H514 M700 224 H720" stroke="#f0dfb8" stroke-width="14" stroke-linecap="round"/>' +
        '<path d="M401 216 V232 M607 216 V232" stroke="#f0dfb8" stroke-width="14" stroke-linecap="round"/>' +
      '</g>' +

      rooms +

      '<text class="sub-name" x="480" y="446" text-anchor="middle">皇 家 潜 艇 · R O Y A L · S U B</text>' +
      '</svg>';
  }

  /* ============================================================
   * 房间内部场景（点进房间后下方显示的小画面）
   * ============================================================ */
  var scenes = {
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
