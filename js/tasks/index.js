/* ============================================================
 * 任务调度与结算：
 *  任务地点与距离 / 任务选择 / 启动小游戏 /
 *  积分结算（身份奖励、粮食加成、装备损坏）/ 结果界面
 * ============================================================ */
window.RS = window.RS || {};

RS.tasks = (function () {
  var cfg = RS.config;
  var ui = RS.ui;
  var ORDER = ['fishing', 'treasure', 'rescue'];

  var current = null;
  var currentId = null;
  var dist = {};

  /* 装备坏掉时的轻松说法（随机一条，不要让孩子有挫败感） */
  var BREAK_LINES = {
    hook: [
      '被一条大鱼拽弯啦',
      '挂在珊瑚上拉直了',
      '用久了有点卷边'
    ],
    spear: [
      '弹簧松掉了',
      '被海龟当成玩具啃了一口',
      '用久了有点松'
    ]
  };

  function rollDistances() {
    ORDER.forEach(function (id) {
      dist[id] = ui.randInt(cfg.distance.min, cfg.distance.max);
    });
  }

  function fuzzyDistance(d) {
    if (d < 1000) { return '很近'; }
    if (d < 2200) { return '有点远'; }
    return '很远';
  }

  function rewardChips(id) {
    if (id === 'fishing') {
      return '<span class="chip">普通鱼 +2</span><span class="chip chip--gold">稀有鱼 +5</span>';
    }
    if (id === 'treasure') { return '<span class="chip chip--gold">宝藏 +6</span>'; }
    return '<span class="chip chip--gold">救助 +10</span>';
  }

  function taskCard(id) {
    var t = cfg.tasks[id];
    var isCaptain = RS.state.get().role === 'captain';
    var d = dist[id];
    return '<article class="task-card" data-task="' + id + '" tabindex="0" role="button" ' +
      'aria-label="开始' + t.name + '">' +
      '<div class="task-card__art">' + RS.icons.get(t.icon, 'icon--task') + '</div>' +
      '<h3 class="task-card__name">' + t.name + '</h3>' +
      '<p class="task-card__intro">' + t.intro + '</p>' +
      '<p class="task-card__reward">' + rewardChips(id) + '</p>' +
      '<p class="task-card__dist">📍 ' + (isCaptain ? (d + ' 米') : fuzzyDistance(d)) + '</p>' +
      '<span class="task-card__go">出发 →</span>' +
      '</article>';
  }

  function openSelect() {
    var s = RS.state.get();
    ui.$('#taskSelHint').textContent = s.role === 'captain'
      ? '船长看得到准确距离，完成任务还有 +1 分'
      : '点一张卡片就出发';
    ui.$('#taskCards').innerHTML = ORDER.map(taskCard).join('');
    ui.show('screen-taskselect');
  }

  function stopCurrent() {
    if (current && current.stop) { current.stop(); }
    current = null;
    currentId = null;
  }

  var starting = false;
  function startTask(id) {
    if (starting) { return; }             // 防止快速连点开两局
    var game = RS.taskGames[id];
    var t = cfg.tasks[id];
    if (!game || !t) { return; }
    starting = true;
    window.setTimeout(function () { starting = false; }, 400);

    stopCurrent();
    current = game;
    currentId = id;
    ui.$('#taskPlayTitle').innerHTML =
      '<span class="play__icon">' + RS.icons.get(t.icon, 'icon--chip') + '</span>' + t.name;
    var area = ui.$('#taskArea');
    area.innerHTML = '';
    ui.show('screen-task');
    RS.sound.play('tap');

    var done = false;
    game.start(area, function (result) {
      if (done) { return; }               // 小游戏只结算一次
      done = true;
      settle(id, result);
    });
  }

  /* ---------------- 结算 ---------------- */
  function settle(id, result) {
    var t = cfg.tasks[id];
    var s = RS.state.get();
    var lines = (result.lines || []).slice();
    var total = Math.max(0, Math.floor(result.points || 0));

    if (result.success) {
      if (s.role === 'captain') {
        total += 1;
        lines.push('🧑‍✈️ 船长领航奖励 · +1 分');
      }
      if (s.mealBonus > 0) {
        total += s.mealBonus;
        lines.push('🍽️ 吃饱了的能量 · +' + s.mealBonus + ' 分');
        RS.state.setMealBonus(0);
      }
    }

    lines = lines.concat(recordCollection(result));

    var broken = checkBreakage(t.usesGear || []);
    broken.forEach(function (b) { lines.push('🔧 ' + b.name + b.why + '，回便利店换个新的就好'); });

    if (total > 0) { RS.state.addScore(total); }
    RS.state.countTask(!!result.success);

    stopCurrent();
    rollDistances();
    showResult(t, result, total, lines, broken);
  }

  /* 把这次任务的收获写进图鉴，并返回要显示在结算里的额外说明 */
  function recordCollection(result) {
    var c = result.collect;
    var extra = [];
    if (!result.success || !c) { return extra; }

    if (c.fish) {
      /* 捕鱼：新鱼种的提示已经由捕鱼任务自己写好了 */
      RS.state.recordFish(c.fish, c.catchTotal || 0);
    }
    if (c.animal) {
      RS.state.recordAnimal(c.animal);
      if (c.firstTime) {
        var animal = null;
        cfg.tasks.rescue.animals.forEach(function (a) { if (a.id === c.animal) { animal = a; } });
        if (animal) { extra.push('📖 图鉴收录新朋友：' + animal.name + '！'); }
      }
    }
    if (c.treasure) { RS.state.recordTreasure(); }
    return extra;
  }

  function checkBreakage(gearIds) {
    var broken = [];
    var isCrew = RS.state.get().role === 'crew';
    var chance = cfg.breakage.chance * (isCrew ? cfg.breakage.crewMultiplier : 1);
    gearIds.forEach(function (gid) {
      var item = null;
      cfg.shopItems.forEach(function (it) { if (it.id === gid) { item = it; } });
      if (!item || !item.breakable) { return; }
      if (!RS.state.has(gid)) { return; }
      if (Math.random() < chance) {
        RS.state.removeItem(gid, 1);
        var why = ui.pick(BREAK_LINES[gid] || ['用久了']);
        broken.push({ id: gid, name: item.name, icon: item.icon, why: why });
      }
    });
    return broken;
  }

  function showResult(t, result, total, lines, broken) {
    var ok = !!result.success;
    ui.$('#resultTitle').textContent = ok ? (t.name + ' 完成！') : (t.name + ' 没成功');
    ui.$('#resultArt').innerHTML = ok
      ? RS.icons.get('star', 'icon--result')
      : RS.icons.get('wave', 'icon--result');
    ui.$('#resultMsg').textContent = result.message || '';
    ui.$('#resultLines').innerHTML = lines.map(function (l) {
      return '<li>' + l + '</li>';
    }).join('');
    ui.$('#resultScore').innerHTML = total > 0
      ? '<span class="score-pop">+' + total + '</span><span class="score-pop__unit">分</span>' +
        '<span class="score-total">现在一共 ' + RS.state.get().score + ' 分</span>'
      : '<span class="score-total">积分没有变化：' + RS.state.get().score + ' 分</span>';

    var panel = ui.$('#screen-result').querySelector('.panel');
    panel.classList.remove('is-win', 'is-lose');
    panel.classList.add(ok ? 'is-win' : 'is-lose');

    ui.show('screen-result');
    ui.refreshHud();
    ui.setScoreDisplay(RS.state.get().score, true);

    if (ok) {
      RS.sound.play('score');
      ui.celebrate(total >= 10 ? 26 : 16);
      var pop = ui.$('#resultScore').querySelector('.score-pop');
      if (pop) { window.setTimeout(function () { ui.burstFromEl(pop, 12); }, 200); }
    } else {
      RS.sound.play('soft');
      ui.toast('没关系，不扣分，再来一次！', 'warn', 2400);
    }

    /* 积分和图鉴都写完了，这时候再看有没有解锁新徽章 */
    RS.achievements.check();

    broken.forEach(function (b, i) {
      window.setTimeout(function () {
        RS.sound.play('broke');
        ui.toast('🔧 你的' + b.name + b.why + '！回便利店再换一个～', 'warn', 3200);
      }, 900 + i * 500);
    });
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    rollDistances();

    var cards = ui.$('#taskCards');
    cards.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.task-card') : null;
      if (card) { startTask(card.getAttribute('data-task')); }
    });
    cards.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') { return; }
      var card = e.target.closest ? e.target.closest('.task-card') : null;
      if (card) {
        e.preventDefault();
        startTask(card.getAttribute('data-task'));
      }
    });

    ui.$('#btnAbortTask').addEventListener('click', function () {
      stopCurrent();
      ui.toast('回潜艇啦，不扣分', 'info', 1600);
      ui.show('screen-main');
      RS.submarine.refresh();
    });
  }

  return {
    init: init,
    openSelect: openSelect,
    startTask: startTask,
    stopCurrent: stopCurrent,
    distances: function () { return dist; },
    fuzzyDistance: fuzzyDistance
  };
})();
