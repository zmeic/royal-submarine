/* ============================================================
 * 任务二：寻宝
 * 海底 6 片区域，宝箱藏在其中一片。
 * 挖错会给出"离宝箱有多远 + 往哪个方向"的提示。
 * 挖到宝箱 +6 分。
 * ============================================================ */
window.RS = window.RS || {};
RS.taskGames = RS.taskGames || {};

RS.taskGames.treasure = (function () {
  var cfg = RS.config.tasks.treasure;
  var ui = RS.ui;
  var COLS = 3;

  /* 每片区域长得不一样，一眼能分出来 */
  var ZONES = [
    { name: '珊瑚丛', deco: 'coral' },
    { name: '沉船边', deco: 'wreck' },
    { name: '海草地', deco: 'weed' },
    { name: '岩石缝', deco: 'rock' },
    { name: '沙丘上', deco: 'dune' },
    { name: '贝壳堆', deco: 'shell' }
  ];

  var g = null;

  function cellOf(i) { return { c: i % COLS, r: Math.floor(i / COLS) }; }

  function hintFor(i) {
    var a = cellOf(i), b = cellOf(g.target);
    var dx = b.c - a.c, dy = b.r - a.r;
    var d = Math.abs(dx) + Math.abs(dy);
    var angle = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
    if (d <= 1) { return { text: '很近！就在旁边', cls: 'hot', icon: '🔥', angle: angle }; }
    if (d === 2) { return { text: '有点远', cls: 'warm', icon: '🙂', angle: angle }; }
    return { text: '很远哦', cls: 'cold', icon: '❄️', angle: angle };
  }

  function decoHtml(kind) {
    if (kind === 'coral') {
      return '<span class="deco deco--coral"><i></i><i></i><i></i></span>';
    }
    if (kind === 'wreck') {
      return '<span class="deco deco--wreck"><i></i><i></i></span>';
    }
    if (kind === 'weed') {
      return '<span class="deco deco--weed"><i></i><i></i><i></i><i></i></span>';
    }
    if (kind === 'rock') {
      return '<span class="deco deco--rock"><i></i><i></i></span>';
    }
    if (kind === 'shell') {
      return '<span class="deco deco--shell"><i></i><i></i></span>';
    }
    return '<span class="deco deco--dune"><i></i></span>';
  }

  function zoneHtml(i) {
    var z = ZONES[i];
    return '<button class="zone" type="button" data-zone="' + i + '" aria-label="挖' + z.name + '">' +
      '<span class="zone__water"></span>' +
      decoHtml(z.deco) +
      '<span class="zone__mound"></span>' +
      '<span class="zone__name">' + z.name + '</span>' +
      '<span class="zone__result" aria-live="polite"></span>' +
      '</button>';
  }

  function updateHud() {
    var picks = '';
    for (var i = 0; i < g.attemptsMax; i++) {
      picks += '<span class="pick' + (i < g.attempts ? '' : ' is-used') + '">⛏️</span>';
    }
    g.leftEl.innerHTML = '还可以挖：' + picks;
  }

  function dig(i, btn) {
    if (!g || !g.running || g.opened[i]) { return; }
    g.opened[i] = true;
    btn.classList.add('is-open');
    var res = btn.querySelector('.zone__result');

    if (i === g.target) {
      btn.classList.add('is-treasure');
      res.innerHTML = '<span class="chest-pop">' + RS.icons.get('chestOpen', 'icon--zone') + '</span>' +
        '<span class="zone__hit">找到啦！</span>';
      RS.sound.play('treasure');
      ui.burstFromEl(btn, 20, 180);
      ui.celebrate(18);
      ui.floatFromEl('+' + cfg.points, btn, 'rare');
      g.running = false;
      window.setTimeout(function () {
        var cb = g.onFinish;
        var out = {
          success: true,
          points: cfg.points,
          lines: ['🎁 找到宝藏 · +' + cfg.points + ' 分', '一共挖了 ' + (g.used + 1) + ' 次'],
          message: '宝箱打开了，里面全是金币和珍珠！'
        };
        stop();
        cb(out);
      }, 1100);
      return;
    }

    g.attempts -= 1;
    g.used += 1;
    var h = hintFor(i);
    btn.classList.add('is-empty', 'is-' + h.cls);
    res.innerHTML =
      '<span class="zone__hint zone__hint--' + h.cls + '">' +
        '<span class="zone__hint-icon">' + h.icon + '</span>' + h.text +
        '<span class="zone__arrow" style="transform:rotate(' + h.angle + 'deg)">➤</span>' +
      '</span>';
    RS.sound.play('soft');
    updateHud();

    if (g.attempts <= 0) {
      g.running = false;
      var targetBtn = g.grid.querySelector('[data-zone="' + g.target + '"]');
      if (targetBtn) {
        targetBtn.classList.add('is-open', 'is-reveal');
        targetBtn.querySelector('.zone__result').innerHTML =
          RS.icons.get('chest', 'icon--zone') + '<span class="zone__hit">在这里</span>';
      }
      window.setTimeout(function () {
        var cb = g.onFinish;
        var out = {
          success: false,
          points: 0,
          lines: ['宝藏藏在亮起来的那一片'],
          message: '这次没挖到，宝箱就在那儿呢！下次带上潜水衣可以多挖一次。'
        };
        stop();
        cb(out);
      }, 1400);
    }
  }

  function stop() { g = null; }

  function start(area, onFinish) {
    var isDiver = RS.state.get().role === 'diver';
    var hasSuit = RS.state.has('suit');
    var attempts = cfg.attempts +
      (isDiver ? cfg.diverExtraAttempt : 0) +
      (hasSuit ? cfg.suitExtraAttempt : 0);

    var helpers = [];
    if (isDiver) { helpers.push('🤿 潜水员 +1 次'); }
    if (hasSuit) { helpers.push('🥽 潜水衣 +1 次'); }

    var zones = '';
    for (var i = 0; i < cfg.zones; i++) { zones += zoneHtml(i); }

    area.innerHTML =
      '<div class="game">' +
        '<div class="game__top">' +
          '<p class="game__goal">🎯 宝箱藏在一片区域里 · <b>找到 +6 分</b></p>' +
          '<p class="game__count" id="digLeft"></p>' +
          (helpers.length
            ? '<p class="game__helpers">装备加成：' + helpers.join(' · ') + '</p>'
            : '<p class="game__helpers game__helpers--none">买了潜水衣可以多挖一次</p>') +
        '</div>' +
        '<div class="zone-grid" id="zoneGrid">' + zones + '</div>' +
      '</div>';

    g = {
      running: true,
      target: ui.randInt(0, cfg.zones - 1),
      attempts: attempts,
      attemptsMax: attempts,
      used: 0,
      opened: {},
      onFinish: onFinish,
      grid: area.querySelector('#zoneGrid'),
      leftEl: area.querySelector('#digLeft')
    };
    updateHud();

    g.grid.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.zone') : null;
      if (!btn) { return; }
      dig(Number(btn.getAttribute('data-zone')), btn);
    });
  }

  return { id: 'treasure', start: start, stop: stop };
})();
