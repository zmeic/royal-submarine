/* ============================================================
 * 任务三：海洋救援（三步）
 *   第 1 步 轻轻靠近动物
 *   第 2 步 选择正确的工具（选错还能再试，不会直接结束）
 *   第 3 步 在绿色区域按下完成救援
 * 三步做完 +10 分。
 * ============================================================ */
window.RS = window.RS || {};
RS.taskGames = RS.taskGames || {};

RS.taskGames.rescue = (function () {
  var cfg = RS.config.tasks.rescue;
  var ui = RS.ui;
  var STEP_LABELS = ['靠近', '选工具', '救援'];

  var g = null;

  function header(step, tip) {
    return ui.stepsHtml(STEP_LABELS, step) +
      '<p class="step__now"><span class="step__now-tag">现在要做</span>' + tip + '</p>';
  }

  /* ---------- 第 1 步：靠近 ---------- */
  function renderApproach() {
    g.stepEl.innerHTML =
      header(1, '点按钮慢慢游过去，动作要轻') +
      '<div class="approach">' +
        '<div class="approach__row">' +
          '<span class="approach__diver" id="apDiver">' + RS.icons.get('diver', 'icon--scene') + '</span>' +
          '<span class="approach__line"><i id="apFill"></i></span>' +
          '<span class="approach__animal" id="apAnimal">' + RS.icons.get(g.animal.icon, 'icon--scene-lg') + '</span>' +
        '</div>' +
        '<p class="approach__trouble">' + g.animal.name + '：' + g.animal.trouble + '</p>' +
      '</div>' +
      '<button class="btn btn--primary btn--xl" type="button" data-rescue="approach">🤿 轻轻靠近</button>';
    updateApproach();
  }

  function updateApproach() {
    var pct = Math.round(g.approach / cfg.approachClicks * 100);
    var fill = document.getElementById('apFill');
    var diver = document.getElementById('apDiver');
    if (fill) { fill.style.width = pct + '%'; }
    if (diver) { diver.style.transform = 'translateX(' + (pct * 0.9) + '%)'; }
  }

  function onApproach() {
    if (g.step !== 1) { return; }
    g.approach += 1;
    updateApproach();
    RS.sound.play('step');
    if (g.approach >= cfg.approachClicks) {
      g.step = 1.5;
      ui.toast('靠近成功！它没有被吓跑～', 'good', 1400);
      window.setTimeout(function () {
        if (g) { g.step = 2; renderTools(); }
      }, 500);
    }
  }

  /* ---------- 第 2 步：选工具 ---------- */
  function renderTools() {
    var tools = ui.shuffle(cfg.tools);
    g.stepEl.innerHTML =
      header(2, '挑一样能帮到它的工具') +
      '<div class="trouble-card">' +
        '<span class="trouble-card__art">' + RS.icons.get(g.animal.icon, 'icon--scene') + '</span>' +
        '<p class="trouble-card__text" id="troubleText">' + g.animal.name + '：' + g.animal.trouble + '</p>' +
      '</div>' +
      '<div class="tool-row">' +
        tools.map(function (t) {
          return '<button class="tool" type="button" data-rescue="tool" data-tool="' + t.id + '">' +
            RS.icons.get(t.icon, 'icon--tool') +
            '<span class="tool__name">' + t.name + '</span>' +
            '<span class="tool__hint">' + t.hint + '</span>' +
            '</button>';
        }).join('') +
      '</div>';
  }

  function onTool(toolId, btn) {
    if (g.step !== 2) { return; }
    if (toolId === g.animal.tool) {
      btn.classList.add('is-right');
      g.step = 2.5;
      RS.sound.play('step');
      ui.burstFromEl(btn, 8);
      ui.toast('工具选对了！', 'good', 1400);
      window.setTimeout(function () { if (g) { g.step = 3; renderTiming(); } }, 700);
      return;
    }
    /* 选错不结束，只是换一个再试 */
    btn.classList.add('is-wrong');
    btn.disabled = true;
    g.toolWrong += 1;
    RS.sound.play('soft');
    var text = document.getElementById('troubleText');
    if (text) {
      text.classList.remove('is-hint');
      void text.offsetWidth;
      text.classList.add('is-hint');
    }
    ui.toast('这个好像用不上，再看看它怎么了～', 'warn', 2000);
  }

  /* ---------- 第 3 步：时机 ---------- */
  function renderTiming() {
    var zone = cfg.zoneWidth + (RS.state.has('suit') ? cfg.suitExtraZone : 0);
    g.zoneStart = ui.randInt(8, Math.max(8, 92 - zone));
    g.zoneWidth = zone;
    g.markerPos = 0;
    g.markerDir = 1;

    g.stepEl.innerHTML =
      header(3, '小滑块进到绿色区域时按下按钮') +
      '<div class="timing">' +
        '<div class="timing__bar" id="tmBar">' +
          '<span class="timing__zone" id="tmZone"></span>' +
          '<span class="timing__marker" id="tmMarker"></span>' +
        '</div>' +
        '<p class="timing__tries" id="tmTries"></p>' +
      '</div>' +
      '<button class="btn btn--gold btn--xl" type="button" data-rescue="timing">✨ 完成救援！</button>';

    var zoneEl = document.getElementById('tmZone');
    zoneEl.style.left = g.zoneStart + '%';
    zoneEl.style.width = g.zoneWidth + '%';
    g.markerEl = document.getElementById('tmMarker');
    g.triesEl = document.getElementById('tmTries');
    paintTries();
    g.last = 0;
    g.raf = window.requestAnimationFrame(tick);
  }

  function paintTries() {
    if (!g.triesEl) { return; }
    var hearts = '';
    for (var i = 0; i < cfg.timingTries; i++) {
      hearts += '<span class="try' + (i < g.timingTries ? '' : ' is-used') + '">💛</span>';
    }
    g.triesEl.innerHTML = '还有机会：' + hearts;
  }

  function tick(now) {
    if (!g || g.step !== 3) { return; }
    if (!g.last) { g.last = now; }
    var dt = Math.min(0.05, (now - g.last) / 1000);
    g.last = now;
    g.markerPos += g.markerDir * 45 * dt;   // 每秒 45%，儿童能跟上
    if (g.markerPos >= 100) { g.markerPos = 100; g.markerDir = -1; }
    if (g.markerPos <= 0) { g.markerPos = 0; g.markerDir = 1; }
    if (g.markerEl) { g.markerEl.style.left = g.markerPos + '%'; }
    g.raf = window.requestAnimationFrame(tick);
  }

  function onTiming() {
    if (!g || g.step !== 3) { return; }
    var inZone = g.markerPos >= g.zoneStart && g.markerPos <= g.zoneStart + g.zoneWidth;
    if (inZone) {
      if (g.raf) { window.cancelAnimationFrame(g.raf); g.raf = 0; }
      succeed();
      return;
    }
    g.timingTries -= 1;
    paintTries();
    if (g.timingTries > 0) {
      RS.sound.play('soft');
      ui.toast('差一点点！再看准一次～', 'warn', 1500);
      return;
    }
    if (g.raf) { window.cancelAnimationFrame(g.raf); g.raf = 0; }
    fail(g.animal.name + '自己挣脱游走啦，它没有受伤。下次一定能救到！');
  }

  /* ---------- 结束 ---------- */
  function succeed() {
    var cb = g.onFinish;
    var animal = g.animal;
    var el = g.stepEl;
    var out = {
      success: true,
      points: cfg.points,
      lines: ['💚 成功救助' + animal.name + ' · +' + cfg.points + ' 分', '三个步骤全部做对'],
      message: '救助成功！' + animal.name + '绕着你转了一圈，开心地游走了。',
      collect: { animal: animal.id, firstTime: RS.state.animalSaved(animal.id) === 0 }
    };
    g.step = 4;
    stop();

    /* 被救动物：恢复 → 转圈 → 游走 */
    el.innerHTML =
      '<div class="rescue-done">' +
        '<span class="rescue-done__animal">' + RS.icons.get(animal.icon, 'icon--scene-lg') + '</span>' +
        '<span class="rescue-done__star">' + RS.icons.get('sparkle', 'icon--scene') + '</span>' +
        '<p class="rescue-done__text">救助成功！' + animal.name + '得救啦</p>' +
      '</div>';
    RS.sound.play('rescue');
    ui.celebrate(20);
    var box = el.querySelector('.rescue-done');
    ui.burstFromEl(box, 14);
    window.setTimeout(function () { cb(out); }, 1500);
  }

  function fail(msg) {
    var cb = g.onFinish;
    var out = { success: false, points: 0, lines: ['没关系，不加分也不扣分'], message: msg };
    stop();
    RS.sound.play('soft');
    window.setTimeout(function () { cb(out); }, 500);
  }

  function stop() {
    if (!g) { return; }
    if (g.raf) { window.cancelAnimationFrame(g.raf); }
    g = null;
  }

  /* ---------- 入口 ---------- */
  function start(area, onFinish) {
    var animal = ui.pick(cfg.animals);
    area.innerHTML =
      '<div class="game">' +
        '<div class="game__top">' +
          '<p class="game__goal">🎯 三步救助海洋动物 · <b>成功 +10 分</b></p>' +
          '<p class="game__helpers' + (RS.state.has('suit') ? '' : ' game__helpers--none') + '">' +
            (RS.state.has('suit') ? '🥽 潜水衣加成：最后一步更好按' : '有潜水衣的话，最后一步会更容易') +
          '</p>' +
        '</div>' +
        '<div class="rescue" id="rescueStep"></div>' +
      '</div>';

    g = {
      animal: animal,
      step: 1,
      approach: 0,
      toolWrong: 0,
      timingTries: cfg.timingTries,
      raf: 0,
      last: 0,
      markerPos: 0,
      markerDir: 1,
      zoneStart: 0,
      zoneWidth: cfg.zoneWidth,
      onFinish: onFinish,
      stepEl: area.querySelector('#rescueStep')
    };

    g.stepEl.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-rescue]') : null;
      if (!btn || btn.disabled || !g) { return; }
      var kind = btn.getAttribute('data-rescue');
      if (kind === 'approach') { onApproach(); }
      else if (kind === 'tool') { onTool(btn.getAttribute('data-tool'), btn); }
      else if (kind === 'timing') { onTiming(); }
    });

    renderApproach();
  }

  return { id: 'rescue', start: start, stop: stop };
})();
