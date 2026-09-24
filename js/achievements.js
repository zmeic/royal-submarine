/* ============================================================
 * 成就徽章：拿到新徽章时弹一个小卡片出来。
 * 徽章清单在 js/config.js 的 achievements 里，这里只负责判断和展示。
 * ============================================================ */
window.RS = window.RS || {};

RS.achievements = (function () {
  var cfg = RS.config;
  var ui = RS.ui;

  /** 这个徽章现在拿到了多少 / 需要多少 */
  function progress(def, stats) {
    var need = Math.max(1, def.need || 1);
    var have;
    if (def.type.indexOf('species:') === 0) {
      have = (stats.fish[def.type.slice(8)] || 0);
    } else {
      have = Number(stats[def.type]) || 0;
    }
    return { have: Math.min(have, need), raw: have, need: need, done: have >= need };
  }

  function list() {
    var stats = RS.state.stats();
    return cfg.achievements.map(function (def) {
      var p = progress(def, stats);
      return {
        def: def,
        owned: RS.state.hasBadge(def.id),
        have: p.have, need: p.need, done: p.done
      };
    });
  }

  function ownedCount() {
    var n = 0;
    cfg.achievements.forEach(function (def) { if (RS.state.hasBadge(def.id)) { n += 1; } });
    return n;
  }

  /* ---------------- 新徽章弹卡 ---------------- */
  /* 弹卡期间给 body 加个标记，提示条会自动让位（见 css/collection.css） */
  var showing = 0;
  function holdToasts(on) {
    showing = Math.max(0, showing + (on ? 1 : -1));
    document.body.classList.toggle('is-badging', showing > 0);
  }

  function popup(def, delay) {
    window.setTimeout(function () {
      var box = ui.el('div', 'badge-pop',
        '<span class="badge-pop__medal">' + RS.icons.get('medal', 'icon--badge') + '</span>' +
        '<span class="badge-pop__text">' +
          '<span class="badge-pop__label">🏅 得到新徽章</span>' +
          '<strong class="badge-pop__name">' + def.name + '</strong>' +
          '<span class="badge-pop__desc">' + def.desc + '</span>' +
        '</span>');
      ui.$('#badgeWrap').appendChild(box);
      holdToasts(true);
      RS.sound.play('badge');
      ui.burstFromEl(box, 14, 150);
      window.setTimeout(function () { box.classList.add('is-out'); }, 3600);
      window.setTimeout(function () {
        if (box.parentNode) { box.parentNode.removeChild(box); }
        holdToasts(false);
      }, 4200);
    }, delay || 0);
  }

  /**
   * 检查有没有拿到新徽章。任何可能改变统计的地方调用一次就行，
   * 重复调用不会重复发徽章。
   * @returns {Array} 这次新拿到的徽章定义
   */
  function check(options) {
    if (!RS.state.isReady()) { return []; }
    var stats = RS.state.stats();
    var fresh = [];
    cfg.achievements.forEach(function (def) {
      if (RS.state.hasBadge(def.id)) { return; }
      if (!progress(def, stats).done) { return; }
      if (RS.state.awardBadge(def.id)) { fresh.push(def); }
    });
    if (!(options && options.silent)) {
      fresh.forEach(function (def, i) { popup(def, 500 + i * 900); });
    }
    return fresh;
  }

  return {
    check: check,
    list: list,
    ownedCount: ownedCount,
    total: function () { return cfg.achievements.length; }
  };
})();
