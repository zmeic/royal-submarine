/* ============================================================
 * 游戏状态：玩家姓名、身份、积分、装备、完成任务数量。
 * 任何改动都会立刻写进 localStorage。
 * ============================================================ */
window.RS = window.RS || {};

RS.state = (function () {
  var cfg = RS.config;

  function emptyState() {
    return {
      version: cfg.saveVersion,
      name: '',
      role: '',            // captain / diver / crew
      score: 0,
      inventory: {},       // { hook: 1, food: 2, ... }
      tasksCompleted: 0,
      tasksTried: 0,
      mealBonus: 0,        // 吃过粮食后，下一个完成的任务额外加分
      updatedAt: 0
    };
  }

  var data = emptyState();
  var listeners = [];

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](data); } catch (e) { /* 单个监听出错不影响其他 */ }
    }
  }

  function persist() {
    data.updatedAt = Date.now();
    RS.storage.save(data);
    notify();
  }

  /* 清理外部数据，避免坏存档把游戏弄崩 */
  function sanitize(raw) {
    var clean = emptyState();
    if (!raw) { return clean; }
    if (typeof raw.name === 'string') { clean.name = raw.name.slice(0, 8); }
    if (cfg.roles[raw.role]) { clean.role = raw.role; }
    clean.score = Math.max(0, Math.floor(Number(raw.score) || 0));
    clean.tasksCompleted = Math.max(0, Math.floor(Number(raw.tasksCompleted) || 0));
    clean.tasksTried = Math.max(0, Math.floor(Number(raw.tasksTried) || 0));
    clean.mealBonus = Math.max(0, Math.floor(Number(raw.mealBonus) || 0));
    clean.updatedAt = Number(raw.updatedAt) || 0;
    if (raw.inventory && typeof raw.inventory === 'object') {
      cfg.shopItems.forEach(function (item) {
        var n = Math.floor(Number(raw.inventory[item.id]) || 0);
        if (n > 0) { clean.inventory[item.id] = Math.min(n, item.max); }
      });
    }
    return clean;
  }

  return {
    /* ---- 读取 ---- */
    get: function () { return data; },
    isReady: function () { return !!(data.name && data.role); },
    roleInfo: function () { return cfg.roles[data.role] || null; },
    count: function (itemId) { return data.inventory[itemId] || 0; },
    has: function (itemId) { return (data.inventory[itemId] || 0) > 0; },
    /** 装备列表（不含粮食以外的数量为 0 的项） */
    gearList: function () {
      var out = [];
      cfg.shopItems.forEach(function (item) {
        var n = data.inventory[item.id] || 0;
        if (n > 0) { out.push({ item: item, count: n }); }
      });
      return out;
    },

    /* ---- 订阅 ---- */
    onChange: function (fn) { listeners.push(fn); },

    /* ---- 写入 ---- */
    loadFromSave: function () {
      var raw = RS.storage.load();
      if (!raw) { return false; }
      data = sanitize(raw);
      notify();
      return true;
    },
    hasSave: function () {
      var raw = RS.storage.load();
      return !!(raw && raw.name && cfg.roles[raw.role]);
    },
    savedSummary: function () {
      var raw = RS.storage.load();
      if (!raw || !raw.name) { return null; }
      var role = cfg.roles[raw.role];
      return {
        name: raw.name,
        roleName: role ? role.name : '船员',
        score: Math.max(0, Math.floor(Number(raw.score) || 0)),
        tasksCompleted: Math.max(0, Math.floor(Number(raw.tasksCompleted) || 0))
      };
    },
    reset: function () {
      data = emptyState();
      RS.storage.clear();
      notify();
    },
    setRole: function (roleId) {
      if (!cfg.roles[roleId]) { return; }
      data.role = roleId;
      persist();
    },
    setName: function (name) {
      data.name = String(name || '').trim().slice(0, 8);
      persist();
    },
    addScore: function (n) {
      data.score = Math.max(0, data.score + Math.floor(n || 0));
      persist();
      return data.score;
    },
    spend: function (n) {
      n = Math.floor(n || 0);
      if (data.score < n) { return false; }
      data.score -= n;
      persist();
      return true;
    },
    addItem: function (itemId, n) {
      var item = null;
      cfg.shopItems.forEach(function (it) { if (it.id === itemId) { item = it; } });
      if (!item) { return false; }
      var cur = data.inventory[itemId] || 0;
      var next = Math.min(cur + (n || 1), item.max);
      if (next === cur) { return false; }
      data.inventory[itemId] = next;
      persist();
      return true;
    },
    removeItem: function (itemId, n) {
      var cur = data.inventory[itemId] || 0;
      if (cur <= 0) { return false; }
      var next = cur - (n || 1);
      if (next > 0) { data.inventory[itemId] = next; }
      else { delete data.inventory[itemId]; }
      persist();
      return true;
    },
    setMealBonus: function (n) {
      data.mealBonus = Math.max(0, Math.floor(n || 0));
      persist();
    },
    countTask: function (completed) {
      data.tasksTried += 1;
      if (completed) { data.tasksCompleted += 1; }
      persist();
    },
    /** 存档能用吗（浏览器可能禁用了 localStorage） */
    storageWorks: function () { return RS.storage.available; }
  };
})();
