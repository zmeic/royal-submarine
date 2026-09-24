/* ============================================================
 * 任务调度与结算：
 *  - 任务地点与距离
 *  - 任务选择界面
 *  - 启动 / 停止小游戏
 *  - 积分结算（身份奖励、粮食加成、装备损坏）
 *  - 结果界面
 * ============================================================ */
window.RS = window.RS || {};

RS.tasks = (function () {
  var cfg = RS.config;
  var ui = RS.ui;
  var ORDER = ['fishing', 'treasure', 'rescue'];

  var current = null;      // 正在进行的小游戏模块
  var currentId = null;
  var dist = {};

  function rollDistances() {
    ORDER.forEach(function (id) {
      dist[id] = ui.randInt(cfg.distance.min, cfg.distance.max);
    });
  }

  function fuzzyDistance(d) {
    if (d < 1000) { return '很近，一会儿就到'; }
    if (d < 2200) { return '有点远，要开一段'; }
    return '很远，要开好久';
  }

  function rewardText(id) {
    if (id === 'fishing') { return '普通鱼 +2 分 ｜ 稀有鱼 +5 分'; }
    if (id === 'treasure') { return '找到宝藏 +6 分'; }
    return '成功救助 +10 分';
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
      '<p class="task-card__reward">🏅 ' + rewardText(id) + '</p>' +
      '<p class="task-card__dist">📍 距离：' + (isCaptain ? (d + ' 米') : fuzzyDistance(d)) + '</p>' +
      '<span class="task-card__go">出发 →</span>' +
      '</article>';
  }

  function openSelect() {
    var s = RS.state.get();
    var isCaptain = s.role === 'captain';
    ui.$('#taskSelHint').textContent = isCaptain
      ? '你是船长，可以看到准确距离，完成任务还有 +1 分领航奖励。'
      : '点一张卡片就出发。（船长才能看到准确距离哦）';
    ui.$('#taskCards').innerHTML = ORDER.map(taskCard).join('');
    ui.show('screen-taskselect');
  }

  function stopCurrent() {
    if (current && current.stop) { current.stop(); }
    current = null;
    currentId = null;
  }

  function startTask(id) {
    var game = RS.taskGames[id];
    var t = cfg.tasks[id];
    if (!game || !t) { return; }
    stopCurrent();
    current = game;
    currentId = id;
    ui.$('#taskPlayTitle').textContent = t.name;
    var area = ui.$('#taskArea');
    area.innerHTML = '';
    ui.show('screen-task');
    game.start(area, function (result) { settle(id, result); });
  }

  /* ---------------- 结算 ---------------- */
  function settle(id, result) {
    var t = cfg.tasks[id];
    var s = RS.state.get();
    var lines = (result.lines || []).slice();
    var total = Math.max(0, Math.floor(result.points || 0));

    if (result.success) {
      // 船长领航奖励
      if (s.role === 'captain') {
        total += 1;
        lines.push('船长领航奖励：+1 分');
      }
      // 粮食加成
      if (s.mealBonus > 0) {
        total += s.mealBonus;
        lines.push('吃饱了的能量加成：+' + s.mealBonus + ' 分');
        RS.state.setMealBonus(0);
      }
    } else {
      lines.push('任务没完成：不加分，也不扣分');
    }

    // 装备损坏检查
    var broken = checkBreakage(t.usesGear || []);
    broken.forEach(function (name) {
      lines.push('⚠️ ' + name + '用旧了，坏掉了');
    });

    if (total > 0) { RS.state.addScore(total); }
    RS.state.countTask(!!result.success);

    stopCurrent();
    rollDistances();
    showResult(t, result, total, lines, broken);
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
        broken.push(item.name);
      }
    });
    return broken;
  }

  function showResult(t, result, total, lines, broken) {
    var ok = !!result.success;
    ui.$('#resultTitle').textContent = ok ? (t.name + ' 完成！') : (t.name + ' 没完成');
    ui.$('#resultArt').innerHTML = RS.icons.get(ok ? 'star' : 'bubble', 'icon--result');
    ui.$('#resultMsg').textContent = result.message || '';
    ui.$('#resultLines').innerHTML = lines.map(function (l) {
      return '<li>' + l + '</li>';
    }).join('');
    ui.$('#resultScore').innerHTML = total > 0
      ? '<span class="score-pop">+' + total + ' 分</span>' +
        '<span class="score-total">现在一共 ' + RS.state.get().score + ' 分</span>'
      : '<span class="score-total">积分没有变化：' + RS.state.get().score + ' 分</span>';

    var panel = ui.$('#screen-result').querySelector('.panel');
    panel.classList.remove('is-win', 'is-lose');
    panel.classList.add(ok ? 'is-win' : 'is-lose');

    ui.show('screen-result');
    ui.refreshHud();
    ui.setScoreDisplay(RS.state.get().score, true);

    if (ok) { ui.toast('任务完成！获得 ' + total + ' 分', 'good'); }
    else { ui.toast('这次没成功，不扣分，再来一次！', 'warn', 2600); }
    broken.forEach(function (name) {
      ui.toast('你的' + name + '坏掉了，回便利店再换一个吧', 'warn', 3200);
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
      ui.toast('任务放弃了，不扣分', 'info', 1800);
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
