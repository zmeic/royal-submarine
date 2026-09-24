/* ============================================================
 * localStorage 读写。浏览器禁用存储时自动退回到“只在内存里记”，
 * 游戏依然能玩，只是刷新后不保留进度。
 * ============================================================ */
window.RS = window.RS || {};

RS.storage = (function () {
  var KEY = RS.config.storageKey;
  var available = (function () {
    try {
      var probe = '__rs_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  })();

  return {
    available: available,

    /** 读取存档，没有或损坏时返回 null */
    load: function () {
      if (!available) { return null; }
      try {
        var raw = window.localStorage.getItem(KEY);
        if (!raw) { return null; }
        var data = JSON.parse(raw);
        if (!data || typeof data !== 'object') { return null; }
        if (data.version !== RS.config.saveVersion) { return null; } // 版本不符按新游戏处理
        return data;
      } catch (e) {
        return null;
      }
    },

    /** 写入存档 */
    save: function (data) {
      if (!available) { return false; }
      try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
        return true;
      } catch (e) {
        return false;
      }
    },

    /** 清空存档 */
    clear: function () {
      if (!available) { return false; }
      try {
        window.localStorage.removeItem(KEY);
        return true;
      } catch (e) {
        return false;
      }
    }
  };
})();
