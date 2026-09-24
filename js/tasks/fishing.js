/* ============================================================
 * 任务一：捕鱼
 * 鱼从两边游过来，点中就捕到。普通鱼 +2 分，稀有鱼 +5 分。
 * 至少捕到 1 条就算完成。
 * ============================================================ */
window.RS = window.RS || {};
RS.taskGames = RS.taskGames || {};

RS.taskGames.fishing = (function () {
  var cfg = RS.config.tasks.fishing;
  var ui = RS.ui;

  var g = null;

  function tankSize() {
    var t = g.tank;
    return { w: t.clientWidth || 700, h: t.clientHeight || 340 };
  }

  /* 只负责放一条鱼，不负责排下一次（避免开出两条并行的生成链） */
  function spawnOne() {
    if (!g || !g.running) { return; }
    var size = tankSize();
    var rare = Math.random() < g.rareChance;

    /* 大小略有差异，看起来更自然 */
    var base = rare ? 128 : 104;
    var fishW = Math.round(base * (0.9 + Math.random() * 0.25));
    var fishH = fishW;                       // 图标是正方形画布
    var fromLeft = Math.random() < 0.5;
    /* 速度：儿童友好，稀有鱼稍快一点但不会快到点不中 */
    var speed = (rare ? 108 : 82) + Math.random() * 34;

    /* 保证整条鱼都留在水槽里、且不会被底部沙地挡住 */
    var sand = 54;
    var maxY = Math.max(6, size.h - fishH - sand);
    var baseY = 6 + Math.random() * maxY;

    var node = ui.el('button', 'fish' + (rare ? ' fish--rare' : '') + (g.bigHit ? ' fish--big' : ''));
    node.type = 'button';
    node.setAttribute('aria-label', rare ? '稀有鱼，点击捕捉，5 分' : '普通鱼，点击捕捉，2 分');
    node.innerHTML =
      (rare ? '<span class="fish__glow"></span>' : '') +
      '<span class="fish__body">' + RS.icons.get(rare ? 'rareFish' : 'fish', 'icon--fish') + '</span>' +
      (rare ? '<span class="fish__tag">稀有</span>' : '');
    node.style.width = fishW + 'px';

    var fish = {
      el: node,
      x: fromLeft ? -fishW : size.w,
      baseY: baseY,
      dir: fromLeft ? 1 : -1,
      speed: speed,
      w: fishW,
      rare: rare,
      points: rare ? cfg.rarePoints : cfg.normalPoints,
      phase: Math.random() * Math.PI * 2,
      wobble: 8 + Math.random() * 10,     // 上下摆动幅度
      wobbleSpeed: 1.4 + Math.random(),
      alive: true
    };
    place(fish, fish.baseY);
    g.fishes.push(fish);
    g.tank.appendChild(node);

  }

  /* 排下一条鱼：整局只有这一条生成链 */
  function scheduleSpawn() {
    if (!g || !g.running) { return; }
    g.spawnTimer = window.setTimeout(function () {
      spawnOne();
      scheduleSpawn();
    }, g.spawnEvery + Math.random() * 380);
  }

  function place(fish, y) {
    fish.el.style.transform = 'translate(' + fish.x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)' +
      (fish.dir < 0 ? ' scaleX(-1)' : '');
  }

  function catchFish(fish, ev) {
    if (!fish.alive || !g.running) { return; }
    fish.alive = false;
    g.caught.push(fish.rare ? 'rare' : 'normal');
    g.points += fish.points;
    fish.el.classList.add('is-caught');
    fish.el.disabled = true;

    var x = (ev && ev.clientX) ? ev.clientX : 0;
    var y = (ev && ev.clientY) ? ev.clientY : 0;
    if (!x && !y) {
      var r = fish.el.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }

    if (fish.rare) {
      ui.floatText('+' + fish.points + ' 稀有鱼！', x, y, 'rare');
      ui.burst(x, y, 16, 160);
      RS.sound.play('rare');
      flashTank();
    } else {
      ui.floatText('+' + fish.points, x, y, 'score');
      ui.burst(x, y, 6, 80);
      RS.sound.play('fish');
    }

    updateHud();
    window.setTimeout(function () {
      if (fish.el.parentNode) { fish.el.parentNode.removeChild(fish.el); }
    }, 340);
  }

  function flashTank() {
    if (!g || !g.tank) { return; }
    g.tank.classList.remove('is-flash');
    void g.tank.offsetWidth;
    g.tank.classList.add('is-flash');
  }

  function updateHud() {
    if (!g) { return; }
    var rare = g.caught.filter(function (k) { return k === 'rare'; }).length;
    var normal = g.caught.length - rare;
    g.countEl.innerHTML =
      '<span class="catch-chip">' + RS.icons.get('fish', 'icon--chip') + '普通 <strong>' + normal + '</strong></span>' +
      '<span class="catch-chip catch-chip--rare">' + RS.icons.get('rareFish', 'icon--chip') + '稀有 <strong>' + rare + '</strong></span>' +
      '<span class="catch-chip catch-chip--score">本次 <strong>' + g.points + '</strong> 分</span>';
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
      f.phase += dt * f.wobbleSpeed;
      place(f, f.baseY + Math.sin(f.phase) * f.wobble);
      if ((f.dir > 0 && f.x > size.w + 30) || (f.dir < 0 && f.x < -f.w - 30)) {
        if (f.el.parentNode) { f.el.parentNode.removeChild(f.el); }
        g.fishes.splice(i, 1);
      }
    }

    var left = Math.max(0, (g.endAt - Date.now()) / 1000);
    g.timeEl.textContent = left.toFixed(1) + ' 秒';
    g.barEl.style.width = (left / g.duration * 100) + '%';
    g.barEl.classList.toggle('is-low', left <= 6);
    if (left <= 0) { finish(); return; }

    g.raf = window.requestAnimationFrame(frame);
  }

  function finish() {
    if (!g || !g.running) { return; }
    var rare = g.caught.filter(function (k) { return k === 'rare'; }).length;
    var normal = g.caught.length - rare;
    var result = {
      success: g.caught.length > 0,
      points: g.points,
      lines: []
    };
    if (normal > 0) { result.lines.push('普通鱼 ' + normal + ' 条 · 每条 ' + cfg.normalPoints + ' 分'); }
    if (rare > 0) { result.lines.push('✨ 稀有鱼 ' + rare + ' 条 · 每条 ' + cfg.rarePoints + ' 分'); }
    result.message = result.success
      ? '收网啦！一共捕到 ' + g.caught.length + ' 条鱼。'
      : '鱼儿今天游得快，一条都没抓住。再来一次就好啦！';
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
    if (hasHook) { helpers.push('🪝 鱼更多'); }
    if (hasSpear) { helpers.push('🔱 稀有鱼更多'); }
    if (oxygen) { helpers.push('🫧 +' + cfg.oxygenBonusTime + '秒'); }
    if (isDiver) { helpers.push('🤿 +' + cfg.diverBonusTime + '秒'); }

    area.innerHTML =
      '<div class="game">' +
        '<div class="game__top">' +
          '<p class="game__goal">🎯 点中游过的鱼！<b>普通鱼 +2</b> · <b class="is-rare">稀有鱼 +5</b></p>' +
          '<div class="timer">' +
            '<div class="timer__bar"><span class="timer__fill" id="fishBar"></span></div>' +
            '<span class="timer__text" id="fishTime">' + duration.toFixed(1) + ' 秒</span>' +
          '</div>' +
          '<p class="game__count" id="fishCount"></p>' +
          (helpers.length
            ? '<p class="game__helpers">装备加成：' + helpers.join(' · ') + '</p>'
            : '<p class="game__helpers game__helpers--none">买个鱼钩，鱼会更多哦</p>') +
        '</div>' +
        '<div class="tank" id="fishTank">' +
          '<span class="tank__ray tank__ray--1"></span><span class="tank__ray tank__ray--2"></span>' +
          '<div class="tank__weeds"><i></i><i></i><i></i><i></i></div>' +
          '<div class="tank__sand"></div>' +
        '</div>' +
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
    /* 开局先放两条，玩家不用干等 */
    spawnOne();
    window.setTimeout(function () { spawnOne(); }, 420);
    scheduleSpawn();
    g.raf = window.requestAnimationFrame(frame);
  }

  return { id: 'fishing', start: start, stop: stop };
})();
