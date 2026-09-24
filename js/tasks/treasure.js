/* ============================================================
 * 任务二：寻宝
 * 海底 6 片区域，宝箱藏在其中一片。挖错会提示离宝箱有多远。
 * 挖到宝箱 +6 分。
 * ============================================================ */
window.RS = window.RS || {};
RS.taskGames = RS.taskGames || {};

RS.taskGames.treasure = (function () {
  var cfg = RS.config.tasks.treasure;
  var ui = RS.ui;
  var COLS = 3;

  var g = null;

  function cellOf(i) { return { c: i % COLS, r: Math.floor(i / COLS) }; }

  function hintFor(i) {
    var a = cellOf(i), b = cellOf(g.target);
    var d = Math.abs(a.c - b.c) + Math.abs(a.r - b.r);
    if (d <= 1) { return { text: '很近！就在旁边！', cls: 'hot' }; }
    if (d === 2) { return { text: '有点远，再找找', cls: 'warm' }; }
    return { text: '很远哦，换一边挖', cls: 'cold' };
  }

  function zoneHtml(i) {
    var names = ['珊瑚丛', '沉船边', '海草地', '岩石缝', '沙丘上', '贝壳堆'];
    return '<button class="zone" type="button" data-zone="' + i + '" aria-label="挖' + names[i] + '">' +
      '<span class="zone__mound"><span class="zone__rock"></span><span class="zone__weed"></span></span>' +
      '<span class="zone__name">' + names[i] + '</span>' +
      '<span class="zone__result" aria-live="polite"></span>' +
      '</button>';
  }

  function updateHud() {
    g.leftEl.innerHTML = '还可以挖 <strong>' + g.attempts + '</strong> 次';
  }

  function dig(i, btn) {
    if (!g || !g.running || g.opened[i]) { return; }
    g.opened[i] = true;
    btn.classList.add('is-open');
    var res = btn.querySelector('.zone__result');

    if (i === g.target) {
      btn.classList.add('is-treasure');
      res.innerHTML = RS.icons.get('chest', 'icon--zone') + '<span class="zone__hit">宝藏！</span>';
      ui.floatFromEl('+' + cfg.points, btn, 'rare');
      g.running = false;
      window.setTimeout(function () {
        var cb = g.onFinish;
        var out = {
          success: true,
          points: cfg.points,
          lines: ['找到宝藏：+' + cfg.points + ' 分', '一共挖了 ' + g.used + ' 次'],
          message: '哗——宝箱打开了，里面全是金币和珍珠！'
        };
        stop();
        cb(out);
      }, 700);
      return;
    }

    g.attempts -= 1;
    g.used += 1;
    var h = hintFor(i);
    btn.classList.add('is-empty', 'is-' + h.cls);
    res.innerHTML = '<span class="zone__hint zone__hint--' + h.cls + '">' + h.text + '</span>';
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
          lines: ['宝藏其实藏在亮起来的那一片'],
          message: '机会用完了，这次没挖到宝箱。不扣分，下次带上潜水衣可以多挖一次！'
        };
        stop();
        cb(out);
      }, 1100);
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
    if (isDiver) { helpers.push('潜水员：多挖 ' + cfg.diverExtraAttempt + ' 次'); }
    if (hasSuit) { helpers.push('潜水衣：多挖 ' + cfg.suitExtraAttempt + ' 次'); }

    var zones = '';
    for (var i = 0; i < cfg.zones; i++) { zones += zoneHtml(i); }

    area.innerHTML =
      '<div class="game">' +
        '<div class="game__top">' +
          '<p class="game__goal">🎯 ' + cfg.intro + '</p>' +
          '<p class="game__count" id="digLeft"></p>' +
          (helpers.length ? '<p class="game__helpers">装备加成：' + helpers.join('；') + '</p>'
            : '<p class="game__helpers game__helpers--none">买了潜水衣可以多挖一次哦。</p>') +
        '</div>' +
        '<div class="zone-grid" id="zoneGrid">' + zones + '</div>' +
      '</div>';

    g = {
      running: true,
      target: ui.randInt(0, cfg.zones - 1),
      attempts: attempts,
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
