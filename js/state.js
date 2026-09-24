/* ============================================================
 * 游戏状态：玩家姓名、身份、积分、装备、完成任务数量。
 * 任何改动都会立刻写进 localStorage。
 * ============================================================ */
window.RS = window.RS || {};

RS.state = (function () {
  var cfg = RS.config;

  /* 图鉴与成就的收集记录。旧存档没有这一段时会自动补上空的。 */
  function emptyCollection() {
    return {
      fish: {},        // { blue: 3, gold: 1 }  每种鱼捕到的次数
      animals: {},     // { turtle: 2 }         每种动物救助的次数
      treasures: 0,    // 挖到宝藏的次数
      bestCatch: 0,    // 单次捕鱼任务捕到最多的条数
      badges: {}       // { firstFish: 时间戳 }  已获得的成就
    };
  }

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
      collection: emptyCollection(),
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

  function countMap(raw, validIds) {
    var out = {};
    if (!raw || typeof raw !== 'object') { return out; }
    validIds.forEach(function (id) {
      var n = Math.floor(Number(raw[id]) || 0);
      if (n > 0) { out[id] = Math.min(n, 9999); }
    });
    return out;
  }

  /* 老存档（V1.2 及以前）没有 collection，这里补一个空的，不会丢掉积分和装备 */
  function sanitizeCollection(raw) {
    var clean = emptyCollection();
    if (!raw || typeof raw !== 'object') { return clean; }
    clean.fish = countMap(raw.fish, cfg.species.map(function (sp) { return sp.id; }));
    clean.animals = countMap(raw.animals, cfg.tasks.rescue.animals.map(function (a) { return a.id; }));
    clean.treasures = Math.max(0, Math.floor(Number(raw.treasures) || 0));
    clean.bestCatch = Math.max(0, Math.floor(Number(raw.bestCatch) || 0));
    if (raw.badges && typeof raw.badges === 'object') {
      cfg.achievements.forEach(function (a) {
        var t = Number(raw.badges[a.id]);
        if (t > 0) { clean.badges[a.id] = t; }
      });
    }
    return clean;
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
    clean.collection = sanitizeCollection(raw.collection);
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

    /* ---- 图鉴 ---- */
    collection: function () { return data.collection; },
    fishCaught: function (speciesId) { return data.collection.fish[speciesId] || 0; },
    animalSaved: function (animalId) { return data.collection.animals[animalId] || 0; },
    hasBadge: function (badgeId) { return !!data.collection.badges[badgeId]; },
    /** 图鉴统计：给成就判断和图鉴界面用 */
    stats: function () {
      var c = data.collection;
      var fishTotal = 0, rareTotal = 0, fishKinds = 0;
      cfg.species.forEach(function (sp) {
        var n = c.fish[sp.id] || 0;
        if (n > 0) { fishKinds += 1; }
        fishTotal += n;
        if (sp.rare) { rareTotal += n; }
      });
      var animalTotal = 0, animalKinds = 0;
      cfg.tasks.rescue.animals.forEach(function (a) {
        var n = c.animals[a.id] || 0;
        if (n > 0) { animalKinds += 1; }
        animalTotal += n;
      });
      var gearKinds = 0;
      cfg.shopItems.forEach(function (it) {
        if (it.id !== 'food' && (data.inventory[it.id] || 0) > 0) { gearKinds += 1; }
      });
      return {
        fishTotal: fishTotal, rareTotal: rareTotal, fishKinds: fishKinds,
        treasure: c.treasures, bestCatch: c.bestCatch,
        animalTotal: animalTotal, animalKinds: animalKinds,
        tasks: data.tasksCompleted, score: data.score, gearKinds: gearKinds,
        fish: c.fish, badgeCount: Object.keys(c.badges).length
      };
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
    /** 记录捕到的鱼（一次捕鱼任务结束时统一写入） */
    recordFish: function (counts, catchTotal) {
      var changed = false;
      Object.keys(counts || {}).forEach(function (id) {
        var n = Math.floor(counts[id] || 0);
        if (n <= 0) { return; }
        data.collection.fish[id] = (data.collection.fish[id] || 0) + n;
        changed = true;
      });
      var best = Math.floor(catchTotal || 0);
      if (best > data.collection.bestCatch) { data.collection.bestCatch = best; changed = true; }
      if (changed) { persist(); }
    },
    /** 记录救助成功的动物 */
    recordAnimal: function (animalId) {
      if (!animalId) { return; }
      data.collection.animals[animalId] = (data.collection.animals[animalId] || 0) + 1;
      persist();
    },
    /** 记录挖到的宝藏 */
    recordTreasure: function () {
      data.collection.treasures += 1;
      persist();
    },
    /** 记下一个新拿到的成就徽章 */
    awardBadge: function (badgeId) {
      if (data.collection.badges[badgeId]) { return false; }
      data.collection.badges[badgeId] = Date.now();
      persist();
      return true;
    },

    /** 存档能用吗（浏览器可能禁用了 localStorage） */
    storageWorks: function () { return RS.storage.available; }
  };
})();
