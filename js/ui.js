/* ============================================================
 * 界面工具：屏幕切换、顶部信息栏、浮动提示、加分动画、确认弹窗。
 * ============================================================ */
window.RS = window.RS || {};

RS.ui = (function () {
  var cfg = RS.config;

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    if (html !== undefined) { node.innerHTML = html; }
    return node;
  }

  /* ---------------- 屏幕切换 ---------------- */
  var currentScreen = 'screen-start';

  function show(screenId) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle('is-active', screens[i].id === screenId);
    }
    currentScreen = screenId;
    // 离开任务屏时确保小游戏已停止
    if (screenId !== 'screen-task' && RS.tasks && RS.tasks.stopCurrent) {
      RS.tasks.stopCurrent();
    }
    var hud = $('#hud');
    var hideHud = (screenId === 'screen-start' || screenId === 'screen-role' || screenId === 'screen-name');
    hud.hidden = hideHud || !RS.state.isReady();
    window.scrollTo(0, 0);
  }

  function screen() { return currentScreen; }

  /* ---------------- 顶部信息栏 ---------------- */
  function refreshHud() {
    var s = RS.state.get();
    var role = RS.state.roleInfo();
    $('#hudName').textContent = s.name || '—';
    $('#hudRole').textContent = role ? role.name : '—';
    $('#hudTasks').textContent = String(s.tasksCompleted);
    var gear = RS.state.gearList();
    var gearEl = $('#hudGear');
    if (!gear.length) {
      gearEl.textContent = '空空的';
    } else {
      gearEl.innerHTML = gear.map(function (g) {
        return '<span class="gear-chip">' + RS.icons.get(g.item.icon, 'icon--chip') +
          g.item.name + (g.count > 1 ? ' ×' + g.count : '') + '</span>';
      }).join('');
    }
    if (s.mealBonus > 0) {
      gearEl.innerHTML += '<span class="gear-chip gear-chip--meal">🍽️ 能量 +' + s.mealBonus + '</span>';
    }
    setScoreDisplay(s.score);
  }

  /* 积分数字：变化时跳动一下，让孩子看得见 */
  var shownScore = 0;
  function setScoreDisplay(value, animate) {
    var node = $('#hudScore');
    if (!node) { return; }
    if (animate && value !== shownScore) {
      node.classList.remove('is-bump');
      // 强制重排以便重复触发动画
      void node.offsetWidth;
      node.classList.add('is-bump');
    }
    shownScore = value;
    node.textContent = String(value);
  }

  /* ---------------- 浮动提示 ---------------- */
  function toast(message, kind, ms) {
    var wrap = $('#toastWrap');
    // 最多同时显示 3 条，免得盖住界面
    while (wrap.children.length >= 3) { wrap.removeChild(wrap.firstChild); }
    var t = el('div', 'toast toast--' + (kind || 'info'), message);
    wrap.appendChild(t);
    window.setTimeout(function () { t.classList.add('is-out'); }, ms || 2200);
    window.setTimeout(function () {
      if (t.parentNode) { t.parentNode.removeChild(t); }
    }, (ms || 2200) + 500);
  }

  /* ---------------- 加分飘字 ---------------- */
  function floatText(text, x, y, kind) {
    var layer = $('#fxLayer');
    var node = el('div', 'float-text float-text--' + (kind || 'score'), text);
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    layer.appendChild(node);
    window.setTimeout(function () {
      if (node.parentNode) { node.parentNode.removeChild(node); }
    }, 1100);
  }

  /* 从某个元素中心飘出 */
  function floatFromEl(text, target, kind) {
    var r = target.getBoundingClientRect();
    floatText(text, r.left + r.width / 2, r.top + r.height / 2, kind);
  }

  /* ---------------- 确认弹窗（二次确认） ---------------- */
  var modalHandler = null;
  function confirmBox(title, text, onOk, okLabel) {
    $('#modalTitle').textContent = title;
    $('#modalText').textContent = text;
    $('#modalOk').textContent = okLabel || '确定';
    $('#modal').hidden = false;
    modalHandler = onOk;
    $('#modalOk').focus();
  }
  function closeModal() {
    $('#modal').hidden = true;
    modalHandler = null;
  }
  function initModal() {
    $('#modalOk').addEventListener('click', function () {
      var fn = modalHandler;
      closeModal();
      if (fn) { fn(); }
    });
    $('#modalCancel').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', function (e) {
      if (e.target === $('#modal')) { closeModal(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#modal').hidden) { closeModal(); }
    });
  }

  /* ---------------- 背景气泡 ---------------- */
  function initBubbles() {
    var box = $('#bgBubbles');
    for (var i = 0; i < 14; i++) {
      var b = el('span', 'bubble');
      var size = 8 + Math.random() * 26;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = (Math.random() * 100) + '%';
      b.style.animationDuration = (9 + Math.random() * 10) + 's';
      b.style.animationDelay = (-Math.random() * 12) + 's';
      box.appendChild(b);
    }
  }

  /* ---------------- 小工具 ---------------- */
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function roleCardHtml(roleId, extraClass) {
    var role = cfg.roles[roleId];
    if (!role) { return ''; }
    return '<div class="role-card ' + (extraClass || '') + '">' +
      '<div class="role-card__art">' + RS.icons.get(role.icon, 'icon--role') + '</div>' +
      '<div class="role-card__body">' +
      '<h3 class="role-card__name">' + role.name + '</h3>' +
      '<ul class="role-card__duties">' +
      role.duties.map(function (d) { return '<li>' + d + '</li>'; }).join('') +
      '</ul>' +
      '<p class="role-card__perk">✨ ' + role.perk + '</p>' +
      '</div></div>';
  }

  return {
    $: $, el: el,
    show: show, screen: screen,
    refreshHud: refreshHud, setScoreDisplay: setScoreDisplay,
    toast: toast, floatText: floatText, floatFromEl: floatFromEl,
    confirm: confirmBox, closeModal: closeModal,
    initModal: initModal, initBubbles: initBubbles,
    randInt: randInt, pick: pick, shuffle: shuffle,
    roleCardHtml: roleCardHtml
  };
})();
