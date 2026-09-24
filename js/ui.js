/* ============================================================
 * 界面工具：屏幕切换、顶部信息栏、提示条、加分动画、
 * 星星迸发、确认弹窗、音效联动。
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
    var logo = $('#hudLogo');
    if (logo && !logo.innerHTML) { logo.innerHTML = RS.icons.get('sub'); }

    var gear = RS.state.gearList();
    var gearEl = $('#hudGear');
    if (!gear.length) {
      gearEl.innerHTML = '<span class="gear-chip gear-chip--empty">还没有装备</span>';
    } else {
      gearEl.innerHTML = gear.map(function (g) {
        return '<span class="gear-chip">' + RS.icons.get(g.item.icon, 'icon--chip') +
          g.item.name + (g.count > 1 ? '×' + g.count : '') + '</span>';
      }).join('');
    }
    if (s.mealBonus > 0) {
      gearEl.innerHTML += '<span class="gear-chip gear-chip--meal">🍽️ 能量+' + s.mealBonus + '</span>';
    }
    setScoreDisplay(s.score);
  }

  /* 积分数字：变化时跳一下 */
  var shownScore = 0;
  function setScoreDisplay(value, animate) {
    var node = $('#hudScore');
    if (!node) { return; }
    if (animate && value !== shownScore) {
      node.classList.remove('is-bump');
      void node.offsetWidth;
      node.classList.add('is-bump');
    }
    shownScore = value;
    node.textContent = String(value);
  }

  /* ---------------- 提示条 ---------------- */
  function toast(message, kind, ms) {
    var wrap = $('#toastWrap');
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
    }, 1200);
  }

  function floatFromEl(text, target, kind) {
    if (!target) { return; }
    var r = target.getBoundingClientRect();
    floatText(text, r.left + r.width / 2, r.top + r.height / 2, kind);
  }

  /* ---------------- 星星 / 泡泡迸发 ---------------- */
  var SPARK_COLORS = ['#ffd166', '#ff9aa2', '#8ce0c0', '#9be3ff', '#ffffff'];

  function burst(x, y, count, spread) {
    var layer = $('#fxLayer');
    count = count || 10;
    spread = spread || 120;
    for (var i = 0; i < count; i++) {
      var p = el('span', 'spark');
      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      var dist = spread * (0.5 + Math.random() * 0.8);
      var size = 8 + Math.random() * 12;
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.background = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist - 30) + 'px');
      p.style.animationDelay = (Math.random() * 0.1) + 's';
      layer.appendChild(p);
      (function (node) {
        window.setTimeout(function () {
          if (node.parentNode) { node.parentNode.removeChild(node); }
        }, 1000);
      })(p);
    }
  }

  function burstFromEl(target, count, spread) {
    if (!target) { return; }
    var r = target.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, count || 10, spread);
  }

  /* 大庆祝：从屏幕上方落下彩色小圆 */
  function celebrate(count) {
    var layer = $('#fxLayer');
    count = count || 22;
    for (var i = 0; i < count; i++) {
      var p = el('span', 'confetti');
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.animationDuration = (1.4 + Math.random() * 1) + 's';
      layer.appendChild(p);
      (function (node) {
        window.setTimeout(function () {
          if (node.parentNode) { node.parentNode.removeChild(node); }
        }, 2800);
      })(p);
    }
  }

  /* ---------------- 步骤指示器（救援任务用） ---------------- */
  function stepsHtml(labels, active) {
    return '<ol class="steps">' + labels.map(function (label, i) {
      var cls = 'steps__item';
      if (i + 1 < active) { cls += ' is-done'; }
      if (i + 1 === active) { cls += ' is-active'; }
      return '<li class="' + cls + '"><span class="steps__no">' + (i + 1 < active ? '✓' : (i + 1)) + '</span>' +
        '<span class="steps__text">' + label + '</span></li>';
    }).join('') + '</ol>';
  }

  /* ---------------- 确认弹窗 ---------------- */
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

  /* ---------------- 全局音效 & 按下反馈 ---------------- */
  function initSoundBindings() {
    // 第一次触摸/点击时唤醒音频（浏览器自动播放策略）
    var wake = function () {
      RS.sound.warmUp();
      document.removeEventListener('pointerdown', wake);
    };
    document.addEventListener('pointerdown', wake);

    // 所有普通按钮都有点击音
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.btn') : null;
      if (btn && !btn.disabled) { RS.sound.play('click'); }
    }, true);

    // 声音开关（顶部信息栏和开始界面各有一个，状态保持同步）
    var toggles = document.querySelectorAll('[data-sound-toggle]');
    function paint() {
      var on = RS.sound.isOn();
      for (var i = 0; i < toggles.length; i++) {
        toggles[i].textContent = on ? '🔊 声音开' : '🔇 声音关';
        toggles[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        toggles[i].classList.toggle('is-off', !on);
      }
    }
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener('click', function () {
        RS.sound.toggle();
        paint();
        toast(RS.sound.isOn() ? '声音打开了 🔊' : '声音关掉了 🔇', 'info', 1400);
      });
    }
    RS.sound.onChange(paint);
    paint();
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
    burst: burst, burstFromEl: burstFromEl, celebrate: celebrate,
    stepsHtml: stepsHtml,
    confirm: confirmBox, closeModal: closeModal,
    initModal: initModal, initBubbles: initBubbles, initSoundBindings: initSoundBindings,
    randInt: randInt, pick: pick, shuffle: shuffle,
    roleCardHtml: roleCardHtml
  };
})();
