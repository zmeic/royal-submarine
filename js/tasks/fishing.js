/* ============================================================
 * 任务一：捕鱼
 * 鱼从两边游过来，点中就捕到。普通鱼 +2 分，稀有鱼 +5 分。
 * 至少捕到 1 条算完成任务。
 * ============================================================ */
window.RS = window.RS || {};
RS.taskGames = RS.taskGames || {};

RS.taskGames.fishing = (function () {
  var cfg = RS.config.tasks.fishing;
  var ui = RS.ui;

  var g = null; // 当前这一局的数据

  function tankSize() {
    var t = g.tank;
    return {
      w: t.clientWidth || 700,
      h: t.clientHeight || 340
    };
  }

  function spawnFish() {
    if (!g || !g.running) { return; }
    var size = tankSize();
    var rare = Math.random() < g.rareChance;
    var fishW = rare ? 130 : 112;
    var fromLeft = Math.random() < 0.5;
    var speed = (rare ? 150 : 105) + Math.random() * 50;

    var node = ui.el('button', 'fish' + (rare ? ' fish--rare' : '') + (g.bigHit ? ' fish--big' : ''));
    node.type = 'button';
    node.setAttribute('aria-label', rare ? '稀有鱼，点击捕捉' : '普通鱼，点击捕捉');
    node.innerHTML = RS.icons.get(rare ? 'rareFish' : 'fish', 'icon--fish');
    node.style.width = fishW + 'px';

    var fish = {
      el: node,
      x: fromLeft ? -fishW : size.w,
      baseY: 10 + Math.random() * Math.max(20, size.h - 140),
      dir: fromLeft ? 1 : -1,
      speed: speed,
      w: fishW,
      rare: rare,
      points: rare ? cfg.rarePoints : cfg.normalPoints,
      phase: Math.random() * Math.PI * 2,
      alive: true
    };
    node.style.transform = 'translate(' + fish.x + 'px,' + fish.baseY + 'px)' +
      (fish.dir < 0 ? ' scaleX(-1)' : '');
    g.fishes.push(fish);
    g.tank.appendChild(node);

    g.spawnTimer = window.setTimeout(spawnFish, g.spawnEvery + Math.random() * 400);
  }

  function catchFish(fish, ev) {
    if (!fish.alive || !g.running) { return; }
    fish.alive = false;
    g.caught.push(fish.rare ? 'rare' : 'normal');
    g.points += fish.points;
    fish.el.classList.add('is-caught');
    fish.el.disabled = true;

    var x = ev && ev.clientX ? ev.clientX : 0;
    var y = ev && ev.clientY ? ev.clientY : 0;
    if (x || y) { ui.floatText('+' + fish.points, x, y, fish.rare ? 'rare' : 'score'); }
    else { ui.floatFromEl('+' + fish.points, fish.el, 'score'); }

    updateHud();
    window.setTimeout(function () {
      if (fish.el.parentNode) { fish.el.parentNode.removeChild(fish.el); }
    }, 320);
  }

  function updateHud() {
    if (!g) { return; }
    var rare = g.caught.filter(function (k) { return k === 'rare'; }).length;
    var normal = g.caught.length - rare;
    g.countEl.innerHTML = '普通鱼 <strong>' + normal + '</strong> 条 ｜ 稀有鱼 <strong>' + rare +
      '</strong> 条 ｜ 本次 <strong>' + g.points + '</strong> 分';
  }

  function frame(now) {
    if (!g || !g.running) { return; }
    if (!g.last) { g.last = now; }
    var dt = Math.min(0.05, (now - g.last) / 1000);
    g.last = now;

    var size = tankSize();
    for (var i = g.fishes.length - 1; i >= 0; i--) {
      var f = g.fishes[i];
      if (!f.alive) {
        if (!f.el.parentNode) { g.fishes.splice(i, 1); }
        continue;
      }
      f.x += f.speed * f.dir * dt;
      f.phase += dt * 2;
      var y = f.baseY + Math.sin(f.phase) * 12;
      f.el.style.transform = 'translate(' + f.x + 'px,' + y + 'px)' + (f.dir < 0 ? ' scaleX(-1)' : '');
      if ((f.dir > 0 && f.x > size.w + 20) || (f.dir < 0 && f.x < -f.w - 20)) {
        if (f.el.parentNode) { f.el.parentNode.removeChild(f.el); }
        g.fishes.splice(i, 1);
      }
    }

    var left = Math.max(0, (g.endAt - Date.now()) / 1000);
    g.timeEl.textContent = left.toFixed(1) + ' 秒';
    g.barEl.style.width = (left / g.duration * 100) + '%';
    if (left <= 0) { finish(); return; }

    g.raf = window.requestAnimationFrame(frame);
  }

  function finish() {
    if (!g || !g.running) { return; }
    var result = {
      success: g.caught.length > 0,
      points: g.points,
      lines: []
    };
    var rare = g.caught.filter(function (k) { return k === 'rare'; }).length;
    var normal = g.caught.length - rare;
    result.lines.push('普通鱼 ' + normal + ' 条（每条 ' + cfg.normalPoints + ' 分）');
    result.lines.push('稀有鱼 ' + rare + ' 条（每条 ' + cfg.rarePoints + ' 分）');
    result.message = result.success
      ? '收网啦！一共捕到 ' + g.caught.length + ' 条鱼。'
      : '这次一条也没捕到，没关系，鱼跑得快，再来一次！';
    var cb = g.onFinish;
    stop();
    cb(result);
  }

  function stop() {
    if (!g) { return; }
    g.running = false;
    if (g.raf) { window.cancelAnimationFrame(g.raf); }
    if (g.spawnTimer) { window.clearTimeout(g.spawnTimer); }
    g = null;
  }

  function start(area, onFinish) {
    var hasHook = RS.state.has('hook');
    var hasSpear = RS.state.has('spear');
    var isDiver = RS.state.get().role === 'diver';
    var oxygen = RS.state.count('oxygen') > 0;

    var duration = cfg.duration +
      (isDiver ? cfg.diverBonusTime : 0) +
      (oxygen ? cfg.oxygenBonusTime : 0);

    var helpers = [];
    if (hasHook) { helpers.push('鱼钩：鱼来得更快，也更好点中'); }
    if (hasSpear) { helpers.push('鱼枪：稀有鱼出现得更多'); }
    if (oxygen) { helpers.push('氧气瓶：时间 +' + cfg.oxygenBonusTime + ' 秒'); }
    if (isDiver) { helpers.push('潜水员：时间 +' + cfg.diverBonusTime + ' 秒'); }

    area.innerHTML =
      '<div class="game">' +
        '<div class="game__top">' +
          '<p class="game__goal">🎯 ' + cfg.intro + '</p>' +
          '<div class="timer">' +
            '<div class="timer__bar"><span class="timer__fill" id="fishBar"></span></div>' +
            '<span class="timer__text" id="fishTime">' + duration.toFixed(1) + ' 秒</span>' +
          '</div>' +
          '<p class="game__count" id="fishCount"></p>' +
          (helpers.length ? '<p class="game__helpers">装备加成：' + helpers.join('；') + '</p>'
            : '<p class="game__helpers game__helpers--none">还没有装备加成，攒够积分去便利店换鱼钩吧！</p>') +
        '</div>' +
        '<div class="tank" id="fishTank"><div class="tank__sand"></div></div>' +
      '</div>';

    g = {
      running: true,
      fishes: [],
      caught: [],
      points: 0,
      raf: 0,
      spawnTimer: 0,
      last: 0,
      duration: duration,
      endAt: Date.now() + duration * 1000,
      rareChance: hasSpear ? cfg.spearRareChance : cfg.rareChance,
      spawnEvery: hasHook ? (cfg.spawnEvery - cfg.hookSpawnFaster) : cfg.spawnEvery,
      bigHit: hasHook,
      onFinish: onFinish,
      tank: area.querySelector('#fishTank'),
      timeEl: area.querySelector('#fishTime'),
      barEl: area.querySelector('#fishBar'),
      countEl: area.querySelector('#fishCount')
    };

    g.tank.addEventListener('pointerdown', function (e) {
      var node = e.target.closest ? e.target.closest('.fish') : null;
      if (!node) { return; }
      e.preventDefault();
      for (var i = 0; i < g.fishes.length; i++) {
        if (g.fishes[i].el === node) { catchFish(g.fishes[i], e); return; }
      }
    });

    updateHud();
    spawnFish();
    g.raf = window.requestAnimationFrame(frame);
  }

  return { id: 'fishing', start: start, stop: stop };
})();
