/* ============================================================
 * 启动与主流程：
 * 开始游戏 → 抽身份 → 起名字 → 进入潜艇 → 选任务 → 小游戏
 * → 得积分 → 便利店 → 换装备 → 回来继续任务（可以一直循环）
 * ============================================================ */
window.RS = window.RS || {};

RS.main = (function () {
  var cfg = RS.config;
  var ui = RS.ui;
  var ROLE_IDS = ['captain', 'diver', 'crew'];
  var drawTimer = null;

  /* ---------------- 开始界面 ---------------- */
  function renderStart() {
    ui.$('#heroArt').innerHTML =
      RS.icons.get('sub', 'icon--hero') +
      '<span class="hero__fish hero__fish--1">' + RS.icons.get('fish', 'icon--mini') + '</span>' +
      '<span class="hero__fish hero__fish--2">' + RS.icons.get('rareFish', 'icon--mini') + '</span>' +
      '<span class="hero__fish hero__fish--3">' + RS.icons.get('chest', 'icon--mini') + '</span>';

    var sum = RS.state.savedSummary();
    var tip = ui.$('#startSaveTip');
    if (sum) {
      ui.$('#btnContinue').hidden = false;
      tip.hidden = false;
      tip.textContent = '上次的进度：' + sum.name + '（' + sum.roleName + '）· ' +
        sum.score + ' 分 · 完成 ' + sum.tasksCompleted + ' 个任务';
    } else {
      ui.$('#btnContinue').hidden = true;
      tip.hidden = true;
    }
    if (!RS.state.storageWorks()) {
      tip.hidden = false;
      tip.textContent = '提示：这个浏览器不能保存进度（刷新后会重新开始），游戏本身照样可以玩。';
    }
  }

  /* ---------------- 抽身份 ---------------- */
  function renderRoleSlots(activeId) {
    ui.$('#roleSlots').innerHTML = ROLE_IDS.map(function (id) {
      var role = cfg.roles[id];
      return '<div class="slot' + (id === activeId ? ' is-active' : '') + '">' +
        RS.icons.get(role.icon, 'icon--slot') +
        '<span class="slot__name">' + role.name + '</span>' +
        '</div>';
    }).join('');
  }

  function openRoleScreen() {
    renderRoleSlots(null);
    ui.$('#roleResult').hidden = true;
    ui.$('#btnDrawRole').hidden = false;
    ui.$('#btnRedraw').hidden = true;
    ui.$('#btnRoleNext').hidden = true;
    ui.show('screen-role');
  }

  function drawRole() {
    if (drawTimer) { return; }
    ui.$('#btnDrawRole').hidden = true;
    ui.$('#btnRedraw').hidden = true;
    ui.$('#btnRoleNext').hidden = true;
    ui.$('#roleResult').hidden = true;

    var i = 0;
    var spins = 12 + ui.randInt(0, 2);
    drawTimer = window.setInterval(function () {
      renderRoleSlots(ROLE_IDS[i % ROLE_IDS.length]);
      i++;
      if (i >= spins) {
        window.clearInterval(drawTimer);
        drawTimer = null;
        var picked = ui.pick(ROLE_IDS);      // 真正的随机结果
        renderRoleSlots(picked);
        RS.state.setRole(picked);
        var box = ui.$('#roleResult');
        box.innerHTML = ui.roleCardHtml(picked, 'role-card--big');
        box.hidden = false;
        box.classList.remove('is-pop');
        void box.offsetWidth;
        box.classList.add('is-pop');
        ui.$('#btnRedraw').hidden = false;
        ui.$('#btnRoleNext').hidden = false;
        ui.toast('抽到了：' + cfg.roles[picked].name + '！', 'good');
      }
    }, 110);
  }

  /* ---------------- 起名字 ---------------- */
  function openNameScreen() {
    var s = RS.state.get();
    ui.$('#nameRoleCard').innerHTML = ui.roleCardHtml(s.role, 'role-card--mini');
    ui.$('#nameError').hidden = true;
    var input = ui.$('#inputName');
    input.value = s.name || '';
    ui.show('screen-name');
    input.focus();
  }

  function randomName() {
    var p = cfg.nameParts;
    return ui.pick(p.first) + ui.pick(p.last);
  }

  function confirmName() {
    var input = ui.$('#inputName');
    var name = (input.value || '').trim();
    if (!name) {
      ui.$('#nameError').hidden = false;
      input.focus();
      return;
    }
    ui.$('#nameError').hidden = true;
    RS.state.setName(name);
    enterSubmarine(true);
  }

  /* ---------------- 进入潜艇 ---------------- */
  function enterSubmarine(firstTime) {
    ui.refreshHud();
    ui.show('screen-main');
    RS.submarine.openRoom('bridge');
    if (firstTime) {
      var s = RS.state.get();
      var role = RS.state.roleInfo();
      ui.toast('欢迎登艇，' + s.name + ' ' + (role ? role.name : '') + '！', 'good', 3000);
    }
  }

  /* ---------------- 重新开始 ---------------- */
  function restart() {
    ui.confirm(
      '要重新开始游戏吗？',
      '重新开始会清空名字、身份、积分和所有装备，而且不能恢复。确定吗？',
      function () {
        RS.tasks.stopCurrent();
        RS.state.reset();
        ui.refreshHud();
        renderStart();
        openRoleScreenReset();
        ui.show('screen-start');
        ui.toast('已经重新开始，可以再抽一次身份啦', 'info', 2600);
      },
      '重新开始'
    );
  }

  function openRoleScreenReset() {
    renderRoleSlots(null);
    ui.$('#roleResult').hidden = true;
    ui.$('#btnDrawRole').hidden = false;
    ui.$('#btnRedraw').hidden = true;
    ui.$('#btnRoleNext').hidden = true;
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    ui.$('#btnNewGame').addEventListener('click', function () {
      if (RS.state.hasSave()) {
        ui.confirm('开始新游戏？', '上次的进度（积分和装备）会被清空，确定要重新开始吗？', function () {
          RS.state.reset();
          ui.refreshHud();
          renderStart();
          openRoleScreen();
        }, '开始新游戏');
        return;
      }
      RS.state.reset();
      openRoleScreen();
    });

    ui.$('#btnContinue').addEventListener('click', function () {
      if (RS.state.loadFromSave() && RS.state.isReady()) {
        enterSubmarine(false);
        ui.toast('欢迎回来，' + RS.state.get().name + '！', 'good');
      } else {
        openRoleScreen();
      }
    });

    ui.$('#btnDrawRole').addEventListener('click', drawRole);
    ui.$('#btnRedraw').addEventListener('click', drawRole);
    ui.$('#btnRoleNext').addEventListener('click', openNameScreen);

    ui.$('#btnRandomName').addEventListener('click', function () {
      ui.$('#inputName').value = randomName();
      ui.$('#nameError').hidden = true;
    });
    ui.$('#btnNameNext').addEventListener('click', confirmName);
    ui.$('#inputName').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { confirmName(); }
    });

    ui.$('#btnGoTasks').addEventListener('click', RS.tasks.openSelect);
    ui.$('#btnGoShop').addEventListener('click', RS.shop.open);
    ui.$('#btnHudShop').addEventListener('click', RS.shop.open);
    ui.$('#btnHudRestart').addEventListener('click', restart);
    ui.$('#btnShopToTasks').addEventListener('click', RS.tasks.openSelect);
    ui.$('#btnResultAgain').addEventListener('click', RS.tasks.openSelect);
    ui.$('#btnResultShop').addEventListener('click', RS.shop.open);

    // 所有带 data-goto 的按钮（回到潜艇等）
    var gotos = document.querySelectorAll('[data-goto]');
    for (var i = 0; i < gotos.length; i++) {
      gotos[i].addEventListener('click', function (e) {
        var target = e.currentTarget.getAttribute('data-goto');
        ui.show(target);
        if (target === 'screen-main') { RS.submarine.refresh(); }
      });
    }
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    ui.initBubbles();
    ui.initModal();
    RS.submarine.render();
    RS.shop.init();
    RS.tasks.init();
    bind();

    RS.state.onChange(function () {
      // 状态一变就同步顶部信息栏（积分、装备、任务数）
      if (RS.state.isReady()) { ui.refreshHud(); }
    });

    RS.state.loadFromSave();
    renderStart();

    if (RS.state.isReady()) {
      // 有存档：留在开始界面，让玩家自己选“继续”还是“新游戏”
      ui.refreshHud();
    }
    ui.show('screen-start');
  }

  return { boot: boot };
})();

document.addEventListener('DOMContentLoaded', RS.main.boot);
