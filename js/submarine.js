/* ============================================================
 * 皇家潜艇主界面：平面图 + 房间互动
 * 画面部分全部来自 js/art.js，这里只管交互。
 * ============================================================ */
window.RS = window.RS || {};

RS.submarine = (function () {
  var cfg = RS.config;
  var ui = RS.ui;
  var currentRoom = null;

  /* ---------------- 各房间的操作区 ---------------- */

  function bridgeBody() {
    var dist = RS.tasks.distances();
    var isCaptain = RS.state.get().role === 'captain';
    var rows = ['fishing', 'treasure', 'rescue'].map(function (id) {
      var t = cfg.tasks[id];
      var text = isCaptain ? (dist[id] + ' 米') : RS.tasks.fuzzyDistance(dist[id]);
      return '<li><span class="dist-list__icon">' + RS.icons.get(t.icon, 'icon--chip') + '</span>' +
        '<span class="dist-list__name">' + t.name + '</span>' +
        '<span class="dist-list__val">' + text + '</span></li>';
    }).join('');
    return '<ul class="dist-list">' + rows + '</ul>' +
      '<button class="btn btn--primary btn--xl" type="button" data-room-action="tasks">🐟 去做任务</button>';
  }

  function viewBody() {
    return '<p class="room__note">窗外有小鱼慢慢游过，运气好还能看到金色的稀有鱼。</p>';
  }

  function diningBody() {
    var food = RS.state.count('food');
    if (food > 0) {
      return '<button class="btn btn--gold btn--xl" type="button" data-room-action="eat">' +
        '🍽️ 吃一份粮食（还有 ' + food + ' 份）</button>' +
        '<p class="room__note">吃饱了，下一个任务会多加分。</p>';
    }
    return '<button class="btn btn--ghost btn--lg" type="button" data-room-action="shop">' +
      '粮食吃完了 · 去便利店买（2 分）</button>';
  }

  function storageBody() {
    var gear = RS.state.gearList();
    var list = gear.length
      ? '<ul class="gear-list">' + gear.map(function (g) {
          return '<li>' + RS.icons.get(g.item.icon, 'icon--chip') + g.item.name +
            (g.count > 1 ? ' ×' + g.count : '') + '</li>';
        }).join('') + '</ul>'
      : '<p class="room__note">柜子是空的，去便利店换点装备吧。</p>';
    return list +
      '<button class="btn btn--gold btn--xl" type="button" data-room-action="shop">🛒 去便利店</button>';
  }

  function toiletBody() {
    return '<button class="btn btn--primary btn--lg" type="button" data-room-action="wash">🫧 洗洗手</button>';
  }

  function restBody() {
    return '<button class="btn btn--primary btn--xl" type="button" data-room-action="rest">😴 躺一会儿</button>' +
      '<p class="room__note">休息一下，什么都不会扣。</p>';
  }

  function engineBody() {
    return '<button class="btn btn--primary btn--lg" type="button" data-room-action="engine">🔧 检查设备</button>' +
      '<p class="room__note">阀门转一转，潜艇跑得更稳。</p>';
  }

  function stageBody() {
    return '<div class="row row--center">' +
        '<button class="btn btn--primary btn--lg" type="button" data-room-action="sing">🎤 唱歌</button>' +
        '<button class="btn btn--gold btn--lg" type="button" data-room-action="dance">💃 跳舞</button>' +
      '</div>';
  }

  var BODY = {
    bridge: bridgeBody, view: viewBody, dining: diningBody,
    storage: storageBody, toilet: toiletBody, stage: stageBody,
    rest: restBody, engine: engineBody
  };

  /* ---------------- 打开房间 ---------------- */
  function openRoom(roomId, silent) {
    var room = null;
    cfg.rooms.forEach(function (r) { if (r.id === roomId) { room = r; } });
    if (!room) { return; }
    var changed = currentRoom !== roomId;
    currentRoom = roomId;

    var svg = document.querySelector('#subMap .sub-svg');
    if (svg) {
      var groups = svg.querySelectorAll('.room');
      for (var i = 0; i < groups.length; i++) {
        groups[i].classList.toggle('is-open', groups[i].getAttribute('data-room') === roomId);
      }
    }

    var scene = RS.art.scenes[roomId] ? RS.art.scenes[roomId]() : '';
    var body = BODY[roomId] ? BODY[roomId]() : '';
    var panel = ui.$('#roomPanel');
    panel.innerHTML =
      '<div class="room-card">' +
        '<div class="room-card__head">' +
          '<span class="room-card__icon">' + RS.icons.get(room.icon, 'icon--room') + '</span>' +
          '<h3 class="room-card__title">' + room.name + '</h3>' +
        '</div>' +
        '<p class="room-card__desc">' + room.desc + '</p>' +
        scene +
        '<div class="room-card__body">' + body + '</div>' +
      '</div>';

    // 进入房间的小过渡
    panel.classList.remove('is-entering');
    void panel.offsetWidth;
    panel.classList.add('is-entering');
    if (changed && !silent) { RS.sound.play('tap'); }
  }

  /* ---------------- 房间里的按钮 ---------------- */
  function handleAction(action, btn) {
    if (action === 'tasks') { RS.tasks.openSelect(); return; }
    if (action === 'shop') { RS.shop.open(); return; }

    if (action === 'eat') {
      if (!RS.state.has('food')) {
        ui.toast('没有粮食了，去便利店买一份吧', 'warn');
        return;
      }
      RS.state.removeItem('food', 1);
      var bonus = RS.state.get().role === 'crew' ? cfg.meal.crewBonus : cfg.meal.bonus;
      RS.state.setMealBonus(bonus);
      RS.sound.play('score');
      ui.toast('吃饱啦！下一个任务 +' + bonus + ' 分', 'good');
      ui.floatFromEl('+' + bonus + ' 能量', btn, 'bonus');
      ui.burstFromEl(btn, 6);
      openRoom('dining', true);
      return;
    }

    if (action === 'wash') {
      var scene = document.getElementById('toiletScene');
      if (scene) {
        scene.classList.remove('is-washing');
        void scene.offsetWidth;
        scene.classList.add('is-washing');
      }
      RS.sound.play('bubble');
      ui.toast('手洗干净啦！', 'good', 1500);
      return;
    }

    if (action === 'rest') {
      var bed = document.querySelector('.scene--rest');
      if (bed) {
        bed.classList.remove('is-sleeping');
        void bed.offsetWidth;
        bed.classList.add('is-sleeping');
      }
      RS.sound.play('bubble');
      ui.toast('呼——睡了一小会儿，精神多啦！', 'good', 1800);
      return;
    }

    if (action === 'engine') {
      var eng = document.querySelector('.scene--engine');
      if (eng) {
        eng.classList.remove('is-running');
        void eng.offsetWidth;
        eng.classList.add('is-running');
      }
      RS.sound.play('step');
      ui.toast('设备一切正常 ⚙️', 'good', 1600);
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
      RS.sound.play(action === 'sing' ? 'rescue' : 'score');
      ui.burstFromEl(st || who, 8);
      ui.toast(action === 'sing' ? '🎵 唱得真好听！' : '💃 跳得真好看！', 'good', 1500);
      return;
    }
  }

  /* ---------------- 初始化 ---------------- */
  function render() {
    var box = ui.$('#subMap');
    box.innerHTML = RS.art.submarineMap();

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
    current: function () { return currentRoom; },
    /** 回到潜艇时刷新当前房间（装备/粮食可能变了） */
    refresh: function () { openRoom(currentRoom || 'bridge', true); }
  };
})();
