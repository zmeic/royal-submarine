/* ============================================================
 * 图鉴：捕到过的鱼、救助过的海洋朋友、拿到的成就徽章。
 * 没收集到的条目显示成灰色剪影 + 问号，留着让孩子去凑齐。
 * ============================================================ */
window.RS = window.RS || {};

RS.collection = (function () {
  var cfg = RS.config;
  var ui = RS.ui;
  var tab = 'fish';

  function speciesById(id) {
    var found = null;
    cfg.species.forEach(function (sp) { if (sp.id === id) { found = sp; } });
    return found;
  }

  /** 这条鱼值多少分（种类里写了就用种类的） */
  function pointsFor(sp) {
    if (typeof sp.points === 'number') { return sp.points; }
    return sp.rare ? cfg.tasks.fishing.rarePoints : cfg.tasks.fishing.normalPoints;
  }

  /** 按 weight 抽一种鱼；rare 决定在普通鱼还是稀有鱼里抽 */
  function randomSpecies(rare) {
    var pool = cfg.species.filter(function (sp) { return !!sp.rare === !!rare; });
    if (!pool.length) { pool = cfg.species; }
    var total = 0;
    pool.forEach(function (sp) { total += (sp.weight || 1); });
    var roll = Math.random() * total;
    for (var i = 0; i < pool.length; i++) {
      roll -= (pool[i].weight || 1);
      if (roll <= 0) { return pool[i]; }
    }
    return pool[pool.length - 1];
  }

  /* ---------------- 各分页的卡片 ---------------- */

  function fishCard(sp) {
    var n = RS.state.fishCaught(sp.id);
    var got = n > 0;
    var cls = 'dex-card' + (got ? '' : ' is-locked') + (sp.rare ? ' dex-card--rare' : '');
    return '<article class="' + cls + '">' +
      '<div class="dex-card__art">' +
        (got ? RS.icons.species(sp, 'icon--dex') : RS.icons.get('unknown', 'icon--dex')) +
      '</div>' +
      '<h4 class="dex-card__name">' + (got ? sp.name : '？？？') + '</h4>' +
      '<p class="dex-card__note">' + (got ? sp.note : '还没有捕到过这种鱼') + '</p>' +
      '<p class="dex-card__foot">' +
        (sp.rare ? '<span class="chip chip--gold">稀有 +' + pointsFor(sp) + '</span>'
                 : '<span class="chip">+' + pointsFor(sp) + '</span>') +
        (got ? '<span class="dex-card__count">捕到过 ' + n + ' 条</span>'
             : '<span class="dex-card__count dex-card__count--none">未收集</span>') +
      '</p>' +
      '</article>';
  }

  function animalCard(a) {
    var n = RS.state.animalSaved(a.id);
    var got = n > 0;
    return '<article class="dex-card' + (got ? '' : ' is-locked') + '">' +
      '<div class="dex-card__art">' +
        (got ? RS.icons.get(a.icon, 'icon--dex') : RS.icons.get('unknown', 'icon--dex')) +
      '</div>' +
      '<h4 class="dex-card__name">' + (got ? a.name : '？？？') + '</h4>' +
      '<p class="dex-card__note">' + (got ? (a.note || a.trouble) : '还没有救助过这位朋友') + '</p>' +
      '<p class="dex-card__foot">' +
        '<span class="chip chip--gold">救助 +' + cfg.tasks.rescue.points + '</span>' +
        (got ? '<span class="dex-card__count">救助过 ' + n + ' 次</span>'
             : '<span class="dex-card__count dex-card__count--none">未收集</span>') +
      '</p>' +
      '</article>';
  }

  function badgeCard(row) {
    var owned = row.owned;
    return '<article class="dex-card dex-card--badge' + (owned ? ' is-owned' : ' is-locked') + '">' +
      '<div class="dex-card__art">' +
        (owned ? RS.icons.get('medal', 'icon--dex') : RS.icons.get(row.def.icon, 'icon--dex')) +
      '</div>' +
      '<h4 class="dex-card__name">' + row.def.name + '</h4>' +
      '<p class="dex-card__note">' + row.def.desc + '</p>' +
      '<p class="dex-card__foot">' +
        (owned
          ? '<span class="chip chip--gold">已获得 🏅</span>'
          : '<span class="dex-bar"><span class="dex-bar__fill" style="width:' +
            Math.round(row.have / row.need * 100) + '%"></span></span>' +
            '<span class="dex-card__count">' + row.have + ' / ' + row.need + '</span>') +
      '</p>' +
      '</article>';
  }

  /* ---------------- 渲染 ---------------- */

  function summaryHtml() {
    var stats = RS.state.stats();
    var cells = [
      { label: '鱼类', value: stats.fishKinds + ' / ' + cfg.species.length, icon: 'fish' },
      { label: '海洋朋友', value: stats.animalKinds + ' / ' + cfg.tasks.rescue.animals.length, icon: 'turtle' },
      { label: '徽章', value: RS.achievements.ownedCount() + ' / ' + RS.achievements.total(), icon: 'medal' },
      { label: '挖到宝藏', value: stats.treasure + ' 次', icon: 'chest' }
    ];
    return cells.map(function (c) {
      return '<div class="dex-summary__cell">' +
        '<span class="dex-summary__icon">' + RS.icons.get(c.icon, 'icon--chip') + '</span>' +
        '<span class="dex-summary__value">' + c.value + '</span>' +
        '<span class="dex-summary__label">' + c.label + '</span>' +
        '</div>';
    }).join('');
  }

  function render() {
    ui.$('#dexSummary').innerHTML = summaryHtml();

    var tabs = document.querySelectorAll('#dexTabs [data-dex-tab]');
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute('data-dex-tab') === tab;
      tabs[i].classList.toggle('is-active', on);
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }

    var html, hint;
    if (tab === 'fish') {
      html = cfg.species.map(fishCard).join('');
      hint = '去捕鱼任务把每一种鱼都抓一次，图鉴就集齐啦。';
    } else if (tab === 'animals') {
      html = cfg.tasks.rescue.animals.map(animalCard).join('');
      hint = '每救助成功一次，这位海洋朋友就会记在册子上。';
    } else {
      html = RS.achievements.list().map(badgeCard).join('');
      hint = '徽章会自己解锁，灰色的下面写着还差多少。';
    }
    ui.$('#dexHint').textContent = hint;
    ui.$('#dexGrid').innerHTML = html;
  }

  function open(which) {
    if (which) { tab = which; }
    render();
    ui.show('screen-collection');
  }

  function init() {
    /* 图鉴开着的时候拿到新徽章 / 新鱼，数字要跟着变 */
    RS.state.onChange(function () {
      if (ui.screen() === 'screen-collection') { render(); }
    });

    ui.$('#dexTabs').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-dex-tab]') : null;
      if (!btn) { return; }
      tab = btn.getAttribute('data-dex-tab');
      RS.sound.play('tap');
      render();
    });
  }

  return {
    init: init,
    open: open,
    render: render,
    speciesById: speciesById,
    randomSpecies: randomSpecies,
    pointsFor: pointsFor
  };
})();
