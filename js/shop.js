/* ============================================================
 * 潜艇便利店
 * 显示积分 / 已有装备 / 商品与价格 / 购买按钮。
 * 积分不足或已买满时按钮变灰，并直接告诉孩子还差几分。
 * ============================================================ */
window.RS = window.RS || {};

RS.shop = (function () {
  var cfg = RS.config;
  var ui = RS.ui;

  function ownHtml() {
    var gear = RS.state.gearList();
    if (!gear.length) { return '<span class="shop__empty">还是空的</span>'; }
    return gear.map(function (g) {
      return '<span class="own-chip">' + RS.icons.get(g.item.icon, 'icon--chip') +
        g.item.name + (g.count > 1 ? '×' + g.count : '') + '</span>';
    }).join('');
  }

  function cardHtml(item) {
    var s = RS.state.get();
    var owned = RS.state.count(item.id);
    var full = owned >= item.max;
    var poor = s.score < item.price;
    var disabled = full || poor;
    var note = '';
    if (full) { note = '<p class="shop-card__note">已经带满了</p>'; }
    else if (poor) { note = '<p class="shop-card__note shop-card__note--warn">还差 ' + (item.price - s.score) + ' 分</p>'; }
    else { note = '<p class="shop-card__note shop-card__note--ok">积分够啦！</p>'; }

    return '<article class="shop-card' + (disabled ? ' is-disabled' : '') + '" data-card="' + item.id + '">' +
      '<div class="shop-card__art">' + RS.icons.get(item.icon, 'icon--shop') +
        (item.breakable ? '<span class="shop-card__tag">会损坏</span>' : '') +
      '</div>' +
      '<h3 class="shop-card__name">' + item.name + '</h3>' +
      '<p class="shop-card__price"><span class="coin">🪙</span>' + item.price + ' 分</p>' +
      '<p class="shop-card__desc">' + item.desc + '</p>' +
      '<p class="shop-card__owned">' + (owned > 0 ? '已有 ' + owned + ' 个' : '还没有') + '</p>' + note +
      '<button class="btn ' + (disabled ? 'btn--ghost' : 'btn--primary') + ' btn--lg btn--wide" type="button" ' +
        'data-buy="' + item.id + '"' + (disabled ? ' disabled aria-disabled="true"' : '') + '>' +
        (full ? '已带满' : (poor ? '积分不够' : '购买')) + '</button>' +
      '</article>';
  }

  function render() {
    var s = RS.state.get();
    ui.$('#shopScore').textContent = String(s.score);
    ui.$('#shopOwn').innerHTML = ownHtml();
    ui.$('#shopGrid').innerHTML = cfg.shopItems.map(cardHtml).join('');
  }

  var busy = false;
  function buy(itemId, btn) {
    if (busy) { return; }                 // 防止快速连点买两件
    var item = null;
    cfg.shopItems.forEach(function (it) { if (it.id === itemId) { item = it; } });
    if (!item) { return; }
    var s = RS.state.get();

    if (RS.state.count(itemId) >= item.max) {
      ui.toast(item.name + '已经带满啦', 'warn');
      return;
    }
    if (s.score < item.price) {
      RS.sound.play('soft');
      ui.toast('还差 ' + (item.price - s.score) + ' 分，再做个任务就够了！', 'warn', 2600);
      return;
    }

    busy = true;
    var card = btn.closest('.shop-card');
    RS.state.spend(item.price);
    RS.state.addItem(itemId, 1);
    RS.sound.play('buy');
    ui.floatFromEl('-' + item.price + ' 分', btn, 'cost');
    if (card) {
      card.classList.add('is-bought');
      ui.burstFromEl(card, 10);
    }
    ui.toast('买到' + item.name + '啦！', 'good', 1800);

    window.setTimeout(function () {
      render();
      ui.refreshHud();
      ui.setScoreDisplay(RS.state.get().score, true);
      busy = false;
    }, 420);
  }

  function init() {
    ui.$('#shopGrid').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-buy]') : null;
      if (!btn || btn.disabled) { return; }
      buy(btn.getAttribute('data-buy'), btn);
    });
  }

  return {
    init: init,
    render: render,
    open: function () {
      render();
      ui.show('screen-shop');
    }
  };
})();
