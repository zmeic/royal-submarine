/* ============================================================
 * 潜艇便利店：显示积分 / 已拥有装备 / 商品与价格 / 购买按钮。
 * 积分不足或已买满时按钮变灰，并给出清楚提示。
 * ============================================================ */
window.RS = window.RS || {};

RS.shop = (function () {
  var cfg = RS.config;
  var ui = RS.ui;

  function ownText() {
    var gear = RS.state.gearList();
    if (!gear.length) { return '空空的'; }
    return gear.map(function (g) {
      return g.item.name + (g.count > 1 ? '×' + g.count : '');
    }).join('、');
  }

  function cardHtml(item) {
    var s = RS.state.get();
    var owned = RS.state.count(item.id);
    var full = owned >= item.max;
    var poor = s.score < item.price;
    var disabled = full || poor;
    var note = '';
    if (full) { note = '<p class="shop-card__note">已经带满了（最多 ' + item.max + ' 个）</p>'; }
    else if (poor) { note = '<p class="shop-card__note shop-card__note--warn">还差 ' + (item.price - s.score) + ' 分，再去做个任务吧！</p>'; }

    return '<article class="shop-card' + (disabled ? ' is-disabled' : '') + '">' +
      '<div class="shop-card__art">' + RS.icons.get(item.icon, 'icon--shop') +
        (item.breakable ? '<span class="shop-card__tag">会损坏</span>' : '') +
      '</div>' +
      '<h3 class="shop-card__name">' + item.name + '</h3>' +
      '<p class="shop-card__price">' + item.price + ' 分</p>' +
      '<p class="shop-card__desc">' + item.desc + '</p>' +
      '<p class="shop-card__owned">已拥有：' + owned + '</p>' + note +
      '<button class="btn ' + (disabled ? 'btn--ghost' : 'btn--primary') + ' btn--lg btn--wide" type="button" ' +
        'data-buy="' + item.id + '"' + (disabled ? ' disabled aria-disabled="true"' : '') + '>' +
        (full ? '已带满' : '购买') + '</button>' +
      '</article>';
  }

  function render() {
    var s = RS.state.get();
    ui.$('#shopScore').textContent = String(s.score);
    ui.$('#shopOwn').textContent = ownText();
    ui.$('#shopGrid').innerHTML = cfg.shopItems.map(cardHtml).join('');
  }

  function buy(itemId, btn) {
    var item = null;
    cfg.shopItems.forEach(function (it) { if (it.id === itemId) { item = it; } });
    if (!item) { return; }
    var s = RS.state.get();

    if (RS.state.count(itemId) >= item.max) {
      ui.toast(item.name + '已经带满了，先用一用吧', 'warn');
      return;
    }
    if (s.score < item.price) {
      ui.toast('积分不够啦！' + item.name + '要 ' + item.price + ' 分，你还差 ' +
        (item.price - s.score) + ' 分', 'warn', 2800);
      return;
    }
    RS.state.spend(item.price);
    RS.state.addItem(itemId, 1);
    ui.toast('买到' + item.name + '啦！', 'good');
    if (btn) { ui.floatFromEl('-' + item.price + ' 分', btn, 'cost'); }
    render();
    ui.refreshHud();
    ui.setScoreDisplay(RS.state.get().score, true);
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
