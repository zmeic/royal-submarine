/* ============================================================
 * 皇家潜艇 2D 平面图 + 房间互动。
 * 地图是一整张内联 SVG，每个房间是一个可点击的 <g class="room">。
 * ============================================================ */
window.RS = window.RS || {};

RS.submarine = (function () {
  var cfg = RS.config;
  var ui = RS.ui;
  var currentRoom = null;

  /* 把 48x48 的图标放到地图坐标上 */
  function iconAt(name, x, y, size) {
    return RS.icons.get(name, 'map-icon', true)
      .replace('<svg ', '<svg x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" ');
  }

  /* 方形窗户 */
  function windowsRow(xs, y, size) {
    return xs.map(function (x) {
      return '<rect class="sub-window" x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" rx="3"/>';
    }).join('');
  }

  var ROOM_BOX = {
    bridge:  { x: 110, y: 120, w: 170, h: 210, fill: '#bfe6ff' },
    view:    { x: 300, y: 110, w: 190, h: 105, fill: '#c9f2e6' },
    dining:  { x: 300, y: 225, w: 190, h: 105, fill: '#ffe2c4' },
    stage:   { x: 505, y: 110, w: 190, h: 105, fill: '#ffd6ef' },
    storage: { x: 505, y: 225, w: 190, h: 105, fill: '#e6dcff' },
    toilet:  { x: 710, y: 150, w: 135, h: 140, fill: '#d7f0ff' }
  };

  function roomGroup(room) {
    var b = ROOM_BOX[room.id];
    if (!b) { return ''; }
    var cx = b.x + b.w / 2;
    var iconSize = Math.min(58, b.h - 46);
    return '<g class="room" data-room="' + room.id + '" tabindex="0" role="button" ' +
      'aria-label="进入' + room.name + '">' +
      '<rect class="room__rect" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h +
      '" rx="16" fill="' + b.fill + '"/>' +
      iconAt(room.icon, cx - iconSize / 2, b.y + 14, iconSize) +
      '<text class="room__label" x="' + cx + '" y="' + (b.y + b.h - 14) + '" text-anchor="middle">' +
      room.name + '</text>' +
      '</g>';
  }

  function mapSvg() {
    var rooms = cfg.rooms.map(roomGroup).join('');
    return '' +
      '<svg class="sub-svg" viewBox="0 0 960 470" xmlns="http://www.w3.org/2000/svg" ' +
      'role="group" aria-label="皇家潜艇内部平面图">' +
      '<defs>' +
        '<linearGradient id="hullGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffd980"/><stop offset="1" stop-color="#eaa63a"/>' +
        '</linearGradient>' +
        '<linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#f0b34a"/>' +
        '</linearGradient>' +
      '</defs>' +
      /* 尾翼与螺旋桨（右侧） */
      '<path d="M885 150 L940 110 L935 225 Z" fill="#d9912c"/>' +
      '<path d="M885 300 L940 340 L935 225 Z" fill="#d9912c"/>' +
      '<g class="sub-propeller">' +
        '<circle cx="922" cy="225" r="16" fill="#c07f22"/>' +
        '<circle cx="922" cy="225" r="6" fill="#8d5d29"/>' +
      '</g>' +
      /* 艇首（左侧） */
      '<path d="M70 150 Q20 225 70 300 Z" fill="#eaa63a"/>' +
      '<circle class="sub-light" cx="58" cy="225" r="13" fill="#fff3c4"/>' +
      /* 指挥塔与潜望镜 */
      '<rect x="420" y="30" width="130" height="46" rx="14" fill="url(#towerGrad)"/>' +
      '<rect x="470" y="8" width="8" height="26" rx="4" fill="#c07f22"/>' +
      '<circle cx="474" cy="8" r="7" fill="#ff7a6b"/>' +
      '<rect class="sub-window" x="440" y="44" width="22" height="22" rx="3"/>' +
      '<rect class="sub-window" x="506" y="44" width="22" height="22" rx="3"/>' +
      /* 艇身 */
      '<rect x="70" y="70" width="820" height="310" rx="150" ry="155" ' +
        'fill="url(#hullGrad)" stroke="#c07f22" stroke-width="6"/>' +
      '<rect x="92" y="92" width="776" height="266" rx="132" ry="133" fill="#fff8e6"/>' +
      /* 方形窗户 */
      windowsRow([160, 220, 280, 340, 400, 460, 520, 580, 640, 700, 760], 352, 26) +
      windowsRow([160, 220, 640, 700, 760], 92, 26) +
      /* 房间 */
      rooms +
      /* 走廊 */
      '<path d="M285 225 H305 M492 225 H508 M697 220 H712" stroke="#e7d3a8" ' +
        'stroke-width="8" stroke-linecap="round"/>' +
      '<text class="sub-name" x="480" y="450" text-anchor="middle">皇 家 潜 艇 · R O Y A L · S U B</text>' +
      '</svg>';
  }

  /* ---------------- 房间内容 ---------------- */

  function distanceLine(task, dist) {
    var isCaptain = RS.state.get().role === 'captain';
    var text = isCaptain ? (dist + ' 米') : RS.tasks.fuzzyDistance(dist);
    return '<li><strong>' + task.name + '</strong>：' + text + '</li>';
  }

  function bridgeBody() {
    var dist = RS.tasks.distances();
    var isCaptain = RS.state.get().role === 'captain';
    var lines = ['fishing', 'treasure', 'rescue'].map(function (id) {
      return distanceLine(cfg.tasks[id], dist[id]);
    }).join('');
    return '<div class="room-scene room-scene--bridge">' +
        '<div class="radar"><span class="radar__sweep"></span><span class="radar__dot"></span></div>' +
        '<div class="wheel-spin">' + RS.icons.get('wheel', 'icon--scene') + '</div>' +
      '</div>' +
      '<p class="room__note">' + (isCaptain
        ? '你是船长，仪表盘显示出准确距离：'
        : '雷达只能看出大概远近（船长才看得到准确距离）：') + '</p>' +
      '<ul class="dist-list">' + lines + '</ul>' +
      '<button class="btn btn--primary btn--lg" type="button" data-room-action="tasks">🐟 选择任务地点</button>';
  }

  function viewBody() {
    return '<div class="room-scene room-scene--view">' +
        '<div class="portholes">' +
          '<div class="porthole"><span class="porthole__fish porthole__fish--a">' + RS.icons.get('fish', 'icon--scene') + '</span></div>' +
          '<div class="porthole"><span class="porthole__fish porthole__fish--b">' + RS.icons.get('rareFish', 'icon--scene') + '</span></div>' +
          '<div class="porthole"><span class="porthole__fish porthole__fish--c">' + RS.icons.get('turtle', 'icon--scene') + '</span></div>' +
        '</div>' +
        '<div class="reef"><span class="reef__coral"></span><span class="reef__coral"></span>' +
          '<span class="reef__coral"></span><span class="reef__coral"></span></div>' +
      '</div>' +
      '<p class="room__note">方形大窗户外面，小鱼和小海龟慢慢游过去。看久一点，说不定能看到金色的稀有鱼！</p>';
  }

  function diningBody() {
    var food = RS.state.count('food');
    var btn = food > 0
      ? '<button class="btn btn--gold btn--lg" type="button" data-room-action="eat">🍽️ 吃一份粮食（还有 ' + food + ' 份）</button>'
      : '<button class="btn btn--ghost btn--lg" type="button" data-room-action="shop">粮食吃完了，去便利店买（2 分）</button>';
    return '<div class="room-scene room-scene--dining">' +
        '<div class="dining-table">' +
          '<span class="dish">' + RS.icons.get('food', 'icon--scene') + '</span>' +
          '<span class="dish">' + RS.icons.get('food', 'icon--scene') + '</span>' +
          '<span class="dish">' + RS.icons.get('food', 'icon--scene') + '</span>' +
          '<div class="dining-table__top"></div>' +
          '<div class="dining-table__legs"><span></span><span></span></div>' +
        '</div>' +
      '</div>' +
      '<p class="room__note">餐桌上摆着热菜、面包和水果。吃一份粮食，下一个完成的任务会多加分。</p>' + btn;
  }

  function storageBody() {
    var gear = RS.state.gearList();
    var list = gear.length
      ? '<ul class="gear-list">' + gear.map(function (g) {
          return '<li>' + RS.icons.get(g.item.icon, 'icon--chip') + g.item.name +
            (g.count > 1 ? ' ×' + g.count : '') + '</li>';
        }).join('') + '</ul>'
      : '<p class="room__note">储藏柜现在是空的，去便利店换点装备吧。</p>';
    return '<div class="room-scene room-scene--storage">' +
        '<span class="crate">' + RS.icons.get('box', 'icon--scene') + '</span>' +
        '<span class="crate">' + RS.icons.get('oxygen', 'icon--scene') + '</span>' +
        '<span class="crate">' + RS.icons.get('suit', 'icon--scene') + '</span>' +
      '</div>' + list +
      '<button class="btn btn--gold btn--lg" type="button" data-room-action="shop">🛒 进入便利店</button>';
  }

  function toiletBody() {
    return '<div class="room-scene room-scene--toilet" id="toiletScene">' +
        RS.icons.get('toilet', 'icon--scene') +
        '<div class="sink-bubbles"><span></span><span></span><span></span></div>' +
      '</div>' +
      '<p class="room__note">小小的厕所，洗手池干干净净。</p>' +
      '<button class="btn btn--primary btn--lg" type="button" data-room-action="wash">🫧 洗洗手</button>';
  }

  function stageBody() {
    return '<div class="room-scene room-scene--stage" id="stageScene">' +
        '<span class="spot spot--l"></span><span class="spot spot--r"></span>' +
        '<div class="stage-floor"></div>' +
        '<span class="performer" id="performer">' + RS.icons.get('crew', 'icon--scene') + '</span>' +
      '</div>' +
      '<p class="room__note">灯光转起来了！让船员上台表演一个。</p>' +
      '<div class="row">' +
        '<button class="btn btn--primary btn--lg" type="button" data-room-action="sing">🎤 唱歌</button>' +
        '<button class="btn btn--gold btn--lg" type="button" data-room-action="dance">💃 跳舞</button>' +
      '</div>';
  }

  var BODY = {
    bridge: bridgeBody, view: viewBody, dining: diningBody,
    storage: storageBody, toilet: toiletBody, stage: stageBody
  };

  function openRoom(roomId) {
    var room = null;
    cfg.rooms.forEach(function (r) { if (r.id === roomId) { room = r; } });
    if (!room) { return; }
    currentRoom = roomId;

    var svg = document.querySelector('#subMap .sub-svg');
    if (svg) {
      var groups = svg.querySelectorAll('.room');
      for (var i = 0; i < groups.length; i++) {
        groups[i].classList.toggle('is-open', groups[i].getAttribute('data-room') === roomId);
      }
    }

    var body = BODY[roomId] ? BODY[roomId]() : '';
    var panel = ui.$('#roomPanel');
    panel.innerHTML =
      '<div class="room-card">' +
        '<div class="room-card__head">' +
          '<span class="room-card__icon">' + RS.icons.get(room.icon, 'icon--room') + '</span>' +
          '<h3 class="room-card__title">' + room.name + '</h3>' +
        '</div>' +
        '<p class="room-card__desc">' + room.desc + '</p>' +
        '<div class="room-card__body">' + body + '</div>' +
      '</div>';
    panel.classList.remove('is-pop');
    void panel.offsetWidth;
    panel.classList.add('is-pop');
  }

  /* ---------------- 房间里的按钮 ---------------- */
  function handleAction(action, btn) {
    if (action === 'tasks') { RS.tasks.openSelect(); return; }
    if (action === 'shop') { RS.shop.open(); return; }
    if (action === 'eat') {
      if (!RS.state.has('food')) {
        ui.toast('没有粮食了，去便利店买一份吧（2 分）', 'warn');
        return;
      }
      RS.state.removeItem('food', 1);
      var bonus = RS.state.get().role === 'crew' ? cfg.meal.crewBonus : cfg.meal.bonus;
      RS.state.setMealBonus(bonus);
      ui.toast('吃饱啦！下一个完成的任务 +' + bonus + ' 分', 'good');
      ui.floatFromEl('+' + bonus + ' 能量', btn, 'bonus');
      openRoom('dining');
      return;
    }
    if (action === 'wash') {
      var scene = document.getElementById('toiletScene');
      if (scene) {
        scene.classList.remove('is-washing');
        void scene.offsetWidth;
        scene.classList.add('is-washing');
      }
      ui.toast('手洗干净了，真棒！', 'good', 1600);
      return;
    }
    if (action === 'sing' || action === 'dance') {
      var st = document.getElementById('stageScene');
      var who = document.getElementById('performer');
      if (st) { st.classList.add('is-on'); }
      if (who) {
        who.classList.remove('is-singing', 'is-dancing');
        void who.offsetWidth;
        who.classList.add(action === 'sing' ? 'is-singing' : 'is-dancing');
      }
      ui.toast(action === 'sing' ? '🎵 哇——唱得真好听！' : '💃 跳得真好看！', 'good', 1600);
      return;
    }
  }

  /* ---------------- 初始化 ---------------- */
  function render() {
    var box = ui.$('#subMap');
    box.innerHTML = mapSvg();

    box.addEventListener('click', function (e) {
      var g = e.target.closest ? e.target.closest('.room') : null;
      if (g) { openRoom(g.getAttribute('data-room')); }
    });
    box.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') { return; }
      var g = e.target.closest ? e.target.closest('.room') : null;
      if (g) {
        e.preventDefault();
        openRoom(g.getAttribute('data-room'));
      }
    });

    ui.$('#roomPanel').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-room-action]') : null;
      if (btn) { handleAction(btn.getAttribute('data-room-action'), btn); }
    });
  }

  return {
    render: render,
    openRoom: openRoom,
    /** 回到潜艇时刷新当前房间（装备/粮食可能变了） */
    refresh: function () {
      openRoom(currentRoom || 'bridge');
    }
  };
})();
