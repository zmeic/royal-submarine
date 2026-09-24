/* ============================================================
 * 轻量音效系统
 * 全部用 Web Audio API 现场合成，不加载任何音频文件，
 * 所以不会拖慢加载，也不用担心素材版权。
 *
 * 用法：RS.sound.play('score')
 * 开关：RS.sound.toggle()  /  RS.sound.isOn()
 * ============================================================ */
window.RS = window.RS || {};

RS.sound = (function () {
  var KEY = 'royal-submarine-sound';
  var ctx = null;
  var master = null;
  var on = true;
  var listeners = [];

  /* 读取上次的开关状态 */
  try {
    var saved = window.localStorage.getItem(KEY);
    if (saved === 'off') { on = false; }
  } catch (e) { /* 隐私模式下忽略 */ }

  function ensureCtx() {
    if (ctx) {
      // 浏览器可能在没有用户操作前把音频挂起
      if (ctx.state === 'suspended' && ctx.resume) { ctx.resume(); }
      return ctx;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return null; }
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;      // 默认音量不吵
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  /* 一个音符：类型、频率、时长、音量、起始延迟 */
  function tone(opts) {
    var c = ensureCtx();
    if (!c) { return; }
    var t0 = c.currentTime + (opts.delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.toFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.toFreq), t0 + opts.dur);
    }
    var vol = (opts.vol === undefined ? 0.6 : opts.vol);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.03);
  }

  /* 一小段噪声：用来做“泡泡”“水花”的质感 */
  function noise(dur, vol, filterHz, delay) {
    var c = ensureCtx();
    if (!c) { return; }
    var t0 = c.currentTime + (delay || 0);
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    var src = c.createBufferSource();
    src.buffer = buf;
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filterHz || 1200;
    var gain = c.createGain();
    gain.gain.value = vol === undefined ? 0.35 : vol;
    src.connect(lp); lp.connect(gain); gain.connect(master);
    src.start(t0);
  }

  /* 音色表：每个名字对应一小段旋律 */
  var RECIPES = {
    /* 按钮点击：短促的“嘟” */
    click: function () {
      tone({ type: 'triangle', freq: 520, toFreq: 700, dur: 0.07, vol: 0.35 });
    },
    /* 轻微反馈：翻页、选房间 */
    tap: function () {
      tone({ type: 'sine', freq: 380, toFreq: 520, dur: 0.09, vol: 0.3 });
    },
    /* 得分：向上三连音 */
    score: function () {
      tone({ type: 'sine', freq: 660, dur: 0.1, vol: 0.5 });
      tone({ type: 'sine', freq: 880, dur: 0.12, vol: 0.45, delay: 0.08 });
    },
    /* 捕到普通鱼：一小声水花 */
    fish: function () {
      noise(0.16, 0.28, 900);
      tone({ type: 'sine', freq: 740, toFreq: 980, dur: 0.1, vol: 0.35 });
    },
    /* 捕到稀有鱼：闪亮的琶音 */
    rare: function () {
      [784, 988, 1175, 1568].forEach(function (f, i) {
        tone({ type: 'triangle', freq: f, dur: 0.16, vol: 0.45, delay: i * 0.07 });
      });
      noise(0.3, 0.18, 2600, 0.02);
    },
    /* 找到宝藏：开箱的大和弦 */
    treasure: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone({ type: 'triangle', freq: f, dur: 0.5, vol: 0.4, delay: i * 0.05 });
      });
      noise(0.25, 0.22, 1800);
    },
    /* 救援成功：温柔的上行 */
    rescue: function () {
      [523, 587, 659, 784, 1047].forEach(function (f, i) {
        tone({ type: 'sine', freq: f, dur: 0.28, vol: 0.4, delay: i * 0.09 });
      });
    },
    /* 买到装备：收银机“叮咚” */
    buy: function () {
      tone({ type: 'square', freq: 880, dur: 0.08, vol: 0.28 });
      tone({ type: 'square', freq: 1320, dur: 0.16, vol: 0.24, delay: 0.07 });
    },
    /* 没成功：柔和的两声下行（不要有挫败感） */
    soft: function () {
      tone({ type: 'sine', freq: 440, dur: 0.14, vol: 0.3 });
      tone({ type: 'sine', freq: 370, dur: 0.2, vol: 0.26, delay: 0.11 });
    },
    /* 装备坏掉：滑稽的“啵” */
    broke: function () {
      tone({ type: 'triangle', freq: 300, toFreq: 130, dur: 0.22, vol: 0.35 });
      noise(0.12, 0.2, 600, 0.04);
    },
    /* 抽签转动：每格一声 */
    tick: function () {
      tone({ type: 'square', freq: 1000, dur: 0.035, vol: 0.16 });
    },
    /* 抽签定格 */
    reveal: function () {
      [659, 880, 1109].forEach(function (f, i) {
        tone({ type: 'triangle', freq: f, dur: 0.22, vol: 0.4, delay: i * 0.06 });
      });
    },
    /* 步骤推进 */
    step: function () {
      tone({ type: 'sine', freq: 620, toFreq: 820, dur: 0.12, vol: 0.34 });
    },
    /* 泡泡（洗手、观景） */
    bubble: function () {
      for (var i = 0; i < 3; i++) {
        tone({ type: 'sine', freq: 420 + i * 160, toFreq: 900 + i * 200, dur: 0.1, vol: 0.2, delay: i * 0.08 });
      }
    }
  };

  function notify() {
    listeners.forEach(function (fn) { try { fn(on); } catch (e) { /* 忽略 */ } });
  }

  return {
    isOn: function () { return on; },
    onChange: function (fn) { listeners.push(fn); },
    setOn: function (v) {
      on = !!v;
      try { window.localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* 忽略 */ }
      if (on) { ensureCtx(); RECIPES.tap(); }
      notify();
    },
    toggle: function () { this.setOn(!on); },
    play: function (name) {
      if (!on) { return; }
      var fn = RECIPES[name];
      if (fn) { try { fn(); } catch (e) { /* 音频失败不能影响游戏 */ } }
    },
    /* 第一次用户交互时把音频上下文唤醒（浏览器自动播放策略） */
    warmUp: function () { if (on) { ensureCtx(); } }
  };
})();
