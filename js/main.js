/* ============================================================
 * 启动与主流程：
 * 开始 → 抽身份 → 起名 → 进潜艇 → 选任务 → 小游戏
 * → 得积分 → 便利店 → 换装备 → 回来继续（可循环）
 * ============================================================ */
window.RS = window.RS || {};

RS.main = (function () {
  var cfg = RS.config;
  var ui = RS.ui;
  var ROLE_IDS = ['captain', 'diver', 'crew'];
  var drawing = false;

  /* ---------------- 开始界面 ---------------- */
  function renderStart() {
    ui.$('#heroArt').innerHTML =
      '<span class="hero__beam"></span>' +
      '<span class="hero__crown">' + RS.icons.get('crown') + '</span>' +
      RS.icons.get('sub', 'icon--hero') +
      '<span class="hero__fish hero__fish--1">' + RS.icons.get('fish', 'icon--mini') + '</span>' +
      '<span class="hero__fish hero__fish--2">' + RS.icons.get('rareFish', 'icon--mini') + '</span>' +
      '<span class="hero__fish hero__fish--3">' + RS.icons.get('chest', 'icon--mini') + '</span>';

    var tc = ui.$('#titleCrown');
    if (tc && !tc.innerHTML) { tc.innerHTML = RS.icons.get('crown'); }

    var sum = RS.state.savedSummary();
    var tip = ui.$('#startSaveTip');
    if (sum) {
      ui.$('#btnContinue').hidden = false;
      tip.hidden = false;
      tip.innerHTML = '上次：<strong>' + sum.name + '</strong>（' + sum.roleName + '）· ' +
        sum.score + ' 分 · 完成 ' + sum.tasksCompleted + ' 个任务';
    } else {
      ui.$('#btnContinue').hidden = true;
      tip.hidden = true;
    }
    if (!RS.state.storageWorks()) {
      tip.hidden = false;
      tip.textContent = '这个浏览器不能保存进度（刷新会重来），但游戏照样能玩。';
    }
  }

  /* ---------------- 抽身份 ---------------- */
  function renderRoleSlots(activeId) {
    ui.$('#roleSlots').innerHTML = ROLE_IDS.map(function (id) {
      var role = cfg.roles[id];
      return '<div class="slot' + (id === activeId ? ' is-active' : '') + '" data-slot="' + id + '">' +
        '<span class="slot__art">' + RS.icons.get(role.icon, 'icon--slot') + '</span>' +
        '<span class="slot__name">' + role.name + '</span>' +
        '</div>';
    }).join('');
  }

  function resetRoleScreen() {
    renderRoleSlots(null);
    ui.$('#roleResult').hidden = true;
    ui.$('#roleResult').innerHTML = '';
    ui.$('#btnDrawRole').hidden = false;
    ui.$('#btnRedraw').hidden = true;
    ui.$('#btnRoleNext').hidden = true;
  }

  function openRoleScreen() {
    resetRoleScreen();
    ui.show('screen-role');
  }

  function drawRole() {
    if (drawing) { return; }
    drawing = true;
    ui.$('#btnDrawRole').hidden = true;
    ui.$('#btnRedraw').hidden = true;
    ui.$('#btnRoleNext').hidden = true;
    ui.$('#roleResult').hidden = true;
    ui.$('#roleSlots').classList.add('is-spinning');

    var picked = ui.pick(ROLE_IDS);          // 真正的随机结果
    var steps = 15 + ROLE_IDS.indexOf(picked);
    var i = 0;

    function spin() {
      renderRoleSlots(ROLE_IDS[i % ROLE_IDS.length]);
      RS.sound.play('tick');
      i++;
      if (i >= steps) { land(picked); return; }
      /* 越转越慢，最后"咔"一下停住 */
      var t = i / steps;
      var delay = 60 + Math.pow(t, 3) * 240;
      window.setTimeout(spin, delay);
    }

    function land(id) {
      renderRoleSlots(id);
      ui.$('#roleSlots').classList.remove('is-spinning');
      var slot = document.querySelector('.slot[data-slot="' + id + '"]');
      if (slot) {
        slot.classList.add('is-landed');
        ui.burstFromEl(slot, 16, 150);
      }
      RS.sound.play('reveal');
      ui.celebrate(14);
      RS.state.setRole(id);

      var box = ui.$('#roleResult');
      box.innerHTML = ui.roleCardHtml(id, 'role-card--big');
      box.hidden = false;
      box.classList.remove('is-pop');
      void box.offsetWidth;
      box.classList.add('is-pop');

      ui.$('#btnRedraw').hidden = false;
      ui.$('#btnRoleNext').hidden = false;
      ui.toast('抽到了：' + cfg.roles[id].name + '！', 'good');
      drawing = false;
    }

    spin();
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
      RS.sound.play('soft');
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
    RS.submarine.openRoom('bridge', true);
    if (firstTime) {
      var s = RS.state.get();
      var role = RS.state.roleInfo();
      RS.sound.play('reveal');
      ui.celebrate(16);
      ui.toast('欢迎登艇，' + s.name + ' ' + (role ? role.name : '') + '！', 'good', 3000);
    }
  }

  /* ---------------- 重新开始 ---------------- */
  function restart() {
    ui.confirm(
      '要重新开始吗？',
      '名字、身份、积分和装备都会清空，而且不能恢复。',
      function () {
        RS.tasks.stopCurrent();
        RS.state.reset();
        ui.refreshHud();
        renderStart();
        resetRoleScreen();
        ui.show('screen-start');
        ui.toast('已经重新开始，可以再抽一次身份啦', 'info', 2600);
      },
      '重新开始'
    );
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    ui.$('#btnNewGame').addEventListener('click', function () {
      if (RS.state.hasSave()) {
        ui.confirm('开始新游戏？', '上次的积分和装备会被清空。', function () {
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
    ui.$('#btnGoDex').addEventListener('click', function () { RS.collection.open(); });
    ui.$('#btnHudDex').addEventListener('click', function () { RS.collection.open(); });
    ui.$('#btnResultDex').addEventListener('click', function () { RS.collection.open(); });
    ui.$('#btnDexToTasks').addEventListener('click', RS.tasks.openSelect);
    ui.$('#btnHudShop').addEventListener('click', RS.shop.open);
    ui.$('#btnHudRestart').addEventListener('click', restart);
    ui.$('#btnShopToTasks').addEventListener('click', RS.tasks.openSelect);
    ui.$('#btnResultAgain').addEventListener('click', RS.tasks.openSelect);
    ui.$('#btnResultShop').addEventListener('click', RS.shop.open);

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
    ui.initSoundBindings();
    RS.submarine.render();
    RS.shop.init();
    RS.collection.init();
    RS.tasks.init();
    bind();

    RS.state.onChange(function () {
      if (RS.state.isReady()) { ui.refreshHud(); }
    });

    RS.state.loadFromSave();
    /* 老存档可能早就够格拿徽章了，这里补发一次，但不弹卡片打扰 */
    RS.achievements.check({ silent: true });
    renderStart();
    if (RS.state.isReady()) { ui.refreshHud(); }
    ui.show('screen-start');
  }

  return { boot: boot };
})();

document.addEventListener('DOMContentLoaded', RS.main.boot);
