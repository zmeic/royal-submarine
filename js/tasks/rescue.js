/* ============================================================
 * 任务三：海洋救援（三步小游戏）
 *  第一步 轻轻靠近动物
 *  第二步 选择正确的工具
 *  第三步 在绿色区域按下完成救援
 * 三步都做对 +10 分。
 * ============================================================ */
window.RS = window.RS || {};
RS.taskGames = RS.taskGames || {};

RS.taskGames.rescue = (function () {
  var cfg = RS.config.tasks.rescue;
  var ui = RS.ui;

  var g = null;

  /* ---------- 第一步：靠近 ---------- */
  function renderApproach() {
    g.stepEl.innerHTML =
      '<h3 class="step__title">第 1 步 · 轻轻靠近' + g.animal.name + '</h3>' +
      '<p class="step__hint">动作要轻，不要吓到它。点 ' + cfg.approachClicks + ' 次慢慢靠近。</p>' +
      '<div class="approach">' +
        '<div class="approach__track"><span class="approach__fill" id="apFill"></span></div>' +
        '<div class="approach__row">' +
          '<span class="approach__diver">' + RS.icons.get('diver', 'icon--scene') + '</span>' +
          '<span class="approach__animal" id="apAnimal">' + RS.icons.get(g.animal.icon, 'icon--scene-lg') + '</span>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn--primary btn--xl" type="button" data-rescue="approach">🤿 轻轻靠近</button>';
    updateApproach();
  }

  function updateApproach() {
    var pct = Math.round(g.approach / cfg.approachClicks * 100);
    var fill = document.getElementById('apFill');
    var animal = document.getElementById('apAnimal');
    if (fill) { fill.style.width = pct + '%'; }
    if (animal) { animal.style.transform = 'translateX(' + (-pct * 0.5) + 'px)'; }
  }

  function onApproach() {
    if (g.step !== 1) { return; }          // 已经进入下一步就忽略多余的点击
    g.approach += 1;
    updateApproach();
    if (g.approach >= cfg.approachClicks) {
      g.step = 1.5;                        // 过渡中，防止连点重复渲染
      ui.toast('靠近成功！它没有被吓跑～', 'good', 1500);
      window.setTimeout(function () {
        if (g) { g.step = 2; renderTools(); }
      }, 500);
    }
  }

  /* ---------- 第二步：选工具 ---------- */
  function renderTools() {
    var tools = ui.shuffle(cfg.tools);
    g.stepEl.innerHTML =
      '<h3 class="step__title">第 2 步 · 选择正确的工具</h3>' +
      '<p class="step__hint">' + g.animal.name + '：' + g.animal.trouble + '（还可以选 ' +
        g.toolTries + ' 次）</p>' +
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
      ui.toast('工具选对了！', 'good', 1500);
      g.step = 3;
      window.setTimeout(function () { if (g) { renderTiming(); } }, 600);
      return;
    }
    btn.classList.add('is-wrong');
    btn.disabled = true;
    g.toolTries -= 1;
    if (g.toolTries > 0) {
      ui.toast('这个工具不太合适，再想一想～', 'warn', 2000);
      var hint = g.stepEl.querySelector('.step__hint');
      if (hint) {
        hint.textContent = g.animal.name + '：' + g.animal.trouble + '（还可以选 ' + g.toolTries + ' 次）';
      }
      return;
    }
    fail('工具没有选对，' + g.animal.name + '有点害怕，游走了。别灰心，下次记住：' +
      g.animal.trouble + ' 要用「' + toolName(g.animal.tool) + '」。');
  }

  function toolName(id) {
    var n = id;
    cfg.tools.forEach(function (t) { if (t.id === id) { n = t.name; } });
    return n;
  }

  /* ---------- 第三步：时机 ---------- */
  function renderTiming() {
    var zone = cfg.zoneWidth + (RS.state.has('suit') ? cfg.suitExtraZone : 0);
    g.zoneStart = ui.randInt(10, Math.max(10, 90 - zone));
    g.zoneWidth = zone;
    g.markerPos = 0;
    g.markerDir = 1;

    g.stepEl.innerHTML =
      '<h3 class="step__title">第 3 步 · 在绿色区域完成救援</h3>' +
      '<p class="step__hint">小滑块来回移动，在绿色区域里按下按钮（还有 ' + g.timingTries + ' 次机会）</p>' +
      '<div class="timing">' +
        '<div class="timing__bar" id="tmBar">' +
          '<span class="timing__zone" id="tmZone"></span>' +
          '<span class="timing__marker" id="tmMarker"></span>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn--gold btn--xl" type="button" data-rescue="timing">✨ 完成救援！</button>';

    var zoneEl = document.getElementById('tmZone');
    zoneEl.style.left = g.zoneStart + '%';
    zoneEl.style.width = g.zoneWidth + '%';
    g.markerEl = document.getElementById('tmMarker');
    g.last = 0;
    g.raf = window.requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!g || g.step !== 3) { return; }
    if (!g.last) { g.last = now; }
    var dt = Math.min(0.05, (now - g.last) / 1000);
    g.last = now;
    g.markerPos += g.markerDir * 45 * dt;   // 每秒 45%
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
    if (g.timingTries > 0) {
      ui.toast('差一点！再看准一点～', 'warn', 1600);
      var hint = g.stepEl.querySelector('.step__hint');
      if (hint) { hint.textContent = '小滑块来回移动，在绿色区域里按下按钮（还有 ' + g.timingTries + ' 次机会）'; }
      return;
    }
    if (g.raf) { window.cancelAnimationFrame(g.raf); g.raf = 0; }
    fail('时机没有抓准，' + g.animal.name + '自己挣脱游走了。它没有受伤，下次一定能救到！');
  }

  /* ---------- 结束 ---------- */
  function succeed() {
    var cb = g.onFinish;
    var animalName = g.animal.name;
    var out = {
      success: true,
      points: cfg.points,
      lines: ['成功救助' + animalName + '：+' + cfg.points + ' 分', '三个步骤全部做对'],
      message: '救助成功！' + animalName + '绕着你转了一圈，然后开心地游走了。'
    };
    var el = g.stepEl;
    stop();
    el.innerHTML = '<div class="rescue-done">' + RS.icons.get('star', 'icon--scene-lg') +
      '<p>救助成功！</p></div>';
    window.setTimeout(function () { cb(out); }, 700);
  }

  function fail(msg) {
    var cb = g.onFinish;
    var out = { success: false, points: 0, lines: ['任务没完成，不加分也不扣分'], message: msg };
    stop();
    window.setTimeout(function () { cb(out); }, 400);
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
          '<p class="game__goal">🎯 ' + cfg.intro + '</p>' +
          '<p class="game__helpers">' + (RS.state.has('suit')
            ? '潜水衣加成：第 3 步的绿色区域更宽。'
            : '有潜水衣的话，第 3 步会更容易一点。') + '</p>' +
        '</div>' +
        '<div class="rescue" id="rescueStep"></div>' +
      '</div>';

    g = {
      animal: animal,
      step: 1,
      approach: 0,
      toolTries: cfg.toolTries,
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
