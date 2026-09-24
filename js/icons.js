/* ============================================================
 * 占位美术：默认全部是内联 SVG，不依赖任何外部图片。
 *
 * 用法：RS.icons.get('fish')  ->  '<svg ...>...</svg>'
 *
 * 换成真正的图片：在 js/art.js 的 RS.art.images 里写上
 *   fish: 'assets/fish-normal.png'
 * 这里就会自动改成 <img>，其它代码一行都不用动。
 * ============================================================ */
window.RS = window.RS || {};

RS.icons = (function () {
  /* 统一 48x48 画布，方便随意缩放 */
  function wrap(inner, extraClass, bare) {
    // bare = true 时不加基础 .icon 类（.icon 的 width:100% 会把 SVG 内嵌图标撑爆）
    var cls = bare ? (extraClass || '') : ('icon ' + (extraClass || ''));
    return '<svg class="' + cls + '" viewBox="0 0 48 48" ' +
      'xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  var head = '<circle cx="24" cy="17" r="8" fill="#ffd9b0"/>' +
    '<circle cx="21" cy="16" r="1.4" fill="#2b2b2b"/><circle cx="27" cy="16" r="1.4" fill="#2b2b2b"/>' +
    '<path d="M21 21q3 2.5 6 0" stroke="#c9704f" stroke-width="1.6" fill="none" stroke-linecap="round"/>';

  var shapes = {
    /* ---- 身份 ---- */
    captain:
      '<path d="M10 40q14-9 28 0z" fill="#1b4f72"/>' +
      '<path d="M12 42h24v3H12z" fill="#123c5a"/>' +
      head +
      '<path d="M12 11h24l-2-4H14z" fill="#0d3b5c"/>' +
      '<rect x="10" y="10" width="28" height="4" rx="2" fill="#f2f6f9"/>' +
      '<circle cx="24" cy="8" r="2" fill="#ffc34d"/>',
    diver:
      '<path d="M9 41q15-10 30 0z" fill="#0e88c4"/>' +
      '<circle cx="24" cy="18" r="11" fill="#cfefff" stroke="#f2a33c" stroke-width="3"/>' +
      '<circle cx="24" cy="18" r="7" fill="#7fd8f7"/>' +
      '<circle cx="21" cy="17" r="1.3" fill="#20536b"/><circle cx="27" cy="17" r="1.3" fill="#20536b"/>' +
      '<path d="M21 21q3 2 6 0" stroke="#20536b" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
      '<rect x="35" y="16" width="6" height="14" rx="3" fill="#ff9f43"/>',
    crew:
      '<path d="M10 41q14-10 28 0z" fill="#3ddc97"/>' +
      head +
      '<path d="M13 12q11-8 22 0z" fill="#ffffff"/>' +
      '<rect x="11" y="11" width="26" height="3" rx="1.5" fill="#e7eef3"/>' +
      '<circle cx="18" cy="35" r="2" fill="#ffffff"/><circle cx="24" cy="38" r="2" fill="#ffffff"/>',

    /* ---- 装备 ---- */
    suit:
      '<path d="M16 8h16l3 10-5 2v20H18V20l-5-2z" fill="#0e88c4"/>' +
      '<circle cx="24" cy="15" r="5" fill="#cfefff"/>' +
      '<rect x="20" y="26" width="8" height="10" rx="2" fill="#ffc34d"/>',
    hook:
      '<path d="M24 5v16" stroke="#cfd8dc" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M24 21q9 3 9 11 0 8-8 8-6 0-7-6" stroke="#9aa7ad" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="24" cy="5" r="3" fill="#ffc34d"/>',
    spear:
      '<path d="M8 40L34 14" stroke="#b07a3c" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M32 16l10-10-4 12z" fill="#cfd8dc"/>' +
      '<path d="M14 34l6 6" stroke="#8d5d29" stroke-width="4" stroke-linecap="round"/>',
    oxygen:
      '<rect x="15" y="12" width="18" height="30" rx="9" fill="#3ddc97"/>' +
      '<rect x="21" y="6" width="6" height="8" rx="2" fill="#9aa7ad"/>' +
      '<rect x="19" y="20" width="10" height="4" rx="2" fill="#ffffff" opacity=".8"/>',
    food:
      '<rect x="8" y="16" width="32" height="22" rx="5" fill="#f2a33c"/>' +
      '<rect x="12" y="20" width="10" height="14" rx="3" fill="#fff3d6"/>' +
      '<circle cx="31" cy="24" r="4" fill="#ff7a6b"/>' +
      '<circle cx="31" cy="32" r="3" fill="#3ddc97"/>' +
      '<path d="M8 16q16-8 32 0z" fill="#ffc34d"/>',

    /* ---- 任务相关 ---- */
    fish:
      '<path d="M5 24q11-12 23-12 11 0 15 12-4 12-15 12-12 0-23-12z" fill="#4ec3f0"/>' +
      '<path d="M5 24q7 5 15 6-5 5-15 4z" fill="#3aafe0"/>' +
      '<path d="M43 24l-9-7v14z" fill="#2aa4d4"/>' +
      '<path d="M24 32q5 5 11 3-4 4-11 3z" fill="#7fd8f7"/>' +
      '<circle cx="17" cy="21" r="2.8" fill="#fff"/><circle cx="17.6" cy="21" r="1.4" fill="#123"/>' +
      '<path d="M23 13q5 4 1 9" stroke="#2aa4d4" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    rareFish:
      '<path d="M5 24q11-12 23-12 11 0 15 12-4 12-15 12-12 0-23-12z" fill="#ffd45e"/>' +
      '<path d="M5 24q7 5 15 6-5 5-15 4z" fill="#f7b937"/>' +
      '<path d="M43 24l-9-7v14z" fill="#f2a33c"/>' +
      '<path d="M24 32q5 5 11 3-4 4-11 3z" fill="#fff3c4"/>' +
      '<circle cx="17" cy="21" r="3" fill="#fff"/><circle cx="17.6" cy="21" r="1.5" fill="#123"/>' +
      '<path d="M27 12l2.4 5 5 2.4-5 2.4-2.4 5-2.4-5-5-2.4 5-2.4z" fill="#fffbe8"/>' +
      '<path d="M11 29q9 5 20 1" stroke="#f2a33c" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
    chest:
      '<rect x="8" y="22" width="32" height="18" rx="3" fill="#b07a3c"/>' +
      '<path d="M8 22q16-12 32 0z" fill="#d79a4e"/>' +
      '<rect x="8" y="27" width="32" height="4" fill="#ffc34d"/>' +
      '<rect x="21" y="25" width="6" height="8" rx="2" fill="#ffe9a8"/>' +
      '<circle cx="24" cy="29" r="1.6" fill="#8d5d29"/>',
    turtle:
      '<ellipse cx="24" cy="26" rx="14" ry="11" fill="#3ddc97"/>' +
      '<path d="M24 15v22M13 22h22M13 30h22" stroke="#22a273" stroke-width="2"/>' +
      '<circle cx="40" cy="22" r="5" fill="#7ee8b6"/>' +
      '<circle cx="41" cy="21" r="1.3" fill="#123"/>' +
      '<ellipse cx="12" cy="37" rx="4" ry="3" fill="#7ee8b6"/>' +
      '<ellipse cx="36" cy="37" rx="4" ry="3" fill="#7ee8b6"/>',
    whale:
      '<path d="M6 26q8-12 20-12 14 0 16 14-8 8-20 8-12 0-16-10z" fill="#5aa9e6"/>' +
      '<path d="M6 26q6 6 14 6-4 5-10 4z" fill="#3f8fcc"/>' +
      '<circle cx="34" cy="22" r="2" fill="#fff"/><circle cx="34" cy="22" r="1" fill="#123"/>' +
      '<path d="M26 12q2-6 6-6-3 4-1 7z" fill="#cfefff"/>',
    dolphin:
      '<path d="M8 32q4-16 20-18 12-2 14 6-8 2-12 8-4 6-12 8z" fill="#8fd3f4"/>' +
      '<path d="M22 16q4-8 8-6-4 3-3 8z" fill="#6cbde4"/>' +
      '<circle cx="34" cy="22" r="1.8" fill="#123"/>' +
      '<path d="M8 32q6 4 14 2-6 6-14 4z" fill="#6cbde4"/>',
    scissors:
      '<path d="M14 8l20 24M34 8L14 32" stroke="#9aa7ad" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="14" cy="38" r="6" fill="#ff7a6b"/>' +
      '<circle cx="34" cy="38" r="6" fill="#ff7a6b"/>',
    balloon:
      '<circle cx="24" cy="20" r="14" fill="#ffc34d"/>' +
      '<path d="M24 34v10" stroke="#8d5d29" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="19" cy="15" rx="4" ry="5" fill="#fff6d6" opacity=".8"/>',
    medkit:
      '<rect x="7" y="15" width="34" height="24" rx="5" fill="#ff7a6b"/>' +
      '<rect x="19" y="9" width="10" height="7" rx="2" fill="#e05a4d"/>' +
      '<rect x="21" y="20" width="6" height="14" rx="2" fill="#fff"/>' +
      '<rect x="17" y="24" width="14" height="6" rx="2" fill="#fff"/>',

    /* ---- 房间 ---- */
    wheel:
      '<circle cx="24" cy="24" r="14" fill="none" stroke="#b07a3c" stroke-width="5"/>' +
      '<circle cx="24" cy="24" r="4" fill="#d79a4e"/>' +
      '<path d="M24 6v8M24 34v8M6 24h8M34 24h8" stroke="#b07a3c" stroke-width="4" stroke-linecap="round"/>',
    window:
      '<rect x="8" y="8" width="32" height="32" rx="4" fill="#7fd8f7" stroke="#f2f6f9" stroke-width="4"/>' +
      '<path d="M10 30q8-6 16 0t12-2v10H10z" fill="#0e88c4"/>' +
      '<circle cx="18" cy="18" r="3" fill="#ffe9a8"/>',
    table:
      '<rect x="6" y="24" width="36" height="5" rx="2" fill="#d79a4e"/>' +
      '<path d="M11 29v11M37 29v11" stroke="#b07a3c" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="17" cy="20" r="4" fill="#ff7a6b"/>' +
      '<rect x="24" y="16" width="10" height="8" rx="2" fill="#ffe9a8"/>' +
      '<circle cx="29" cy="14" r="2" fill="#3ddc97"/>',
    box:
      '<rect x="9" y="16" width="30" height="24" rx="3" fill="#d79a4e"/>' +
      '<path d="M9 22h30" stroke="#b07a3c" stroke-width="3"/>' +
      '<rect x="20" y="16" width="8" height="24" fill="#ffc34d" opacity=".8"/>',
    toilet:
      '<rect x="14" y="8" width="20" height="12" rx="3" fill="#e7eef3"/>' +
      '<path d="M12 22h24l-3 12a6 6 0 0 1-6 4h-6a6 6 0 0 1-6-4z" fill="#f2f6f9"/>' +
      '<ellipse cx="24" cy="24" rx="10" ry="3" fill="#7fd8f7"/>',
    stage:
      '<path d="M6 34h36l-4 8H10z" fill="#b07a3c"/>' +
      '<path d="M14 6l6 26h-12z" fill="#ffe9a8" opacity=".7"/>' +
      '<path d="M34 6l6 26H28z" fill="#ffd1f0" opacity=".7"/>' +
      '<circle cx="24" cy="20" r="6" fill="#ff7a6b"/>' +
      '<circle cx="24" cy="12" r="3" fill="#ffd9b0"/>',

    /* ---- 其他 ---- */
    sub:
      '<ellipse cx="24" cy="26" rx="19" ry="10" fill="#ffc34d"/>' +
      '<rect x="20" y="10" width="9" height="8" rx="3" fill="#f2a33c"/>' +
      '<path d="M5 26l-4-6v12z" fill="#e0902f"/>' +
      '<rect x="12" y="22" width="6" height="6" rx="1.5" fill="#cfefff" stroke="#fff" stroke-width="1.5"/>' +
      '<rect x="24" y="22" width="6" height="6" rx="1.5" fill="#cfefff" stroke="#fff" stroke-width="1.5"/>' +
      '<circle cx="24" cy="8" r="2" fill="#ff7a6b"/>',
    star:
      '<path d="M24 6l5.5 11.5L42 19l-9 9 2.2 12.5L24 34.5 12.8 40.5 15 28l-9-9 12.5-1.5z" fill="#ffc34d"/>',
    bubble:
      '<circle cx="24" cy="24" r="16" fill="#cfefff" opacity=".7"/>' +
      '<circle cx="18" cy="18" r="5" fill="#fff" opacity=".8"/>',
    sparkle:
      '<path d="M24 4l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="#fff3c4"/>' +
      '<circle cx="24" cy="24" r="4" fill="#fff"/>',
    chestOpen:
      '<path d="M8 20q16-14 32 0l-2 4H10z" fill="#d79a4e"/>' +
      '<rect x="8" y="24" width="32" height="16" rx="3" fill="#b07a3c"/>' +
      '<rect x="8" y="26" width="32" height="4" fill="#ffc34d"/>' +
      '<circle cx="17" cy="34" r="4" fill="#ffe066"/><circle cx="25" cy="36" r="4" fill="#ffd166"/>' +
      '<circle cx="33" cy="34" r="4" fill="#fff0b8"/>' +
      '<path d="M24 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fffbe8"/>',
    wave:
      '<path d="M2 28q8-8 16 0t16 0 12-4" stroke="#7fd8f7" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M2 38q8-8 16 0t16 0 12-4" stroke="#cfefff" stroke-width="4" fill="none" stroke-linecap="round"/>'
  };

  return {
    /** 取得某个图标（优先用 RS.art.images 里配置的图片） */
    get: function (name, extraClass, bare) {
      var img = (window.RS && RS.art && RS.art.imageFor) ? RS.art.imageFor(name) : null;
      if (img && !bare) {
        return '<img class="icon icon--img ' + (extraClass || '') + '" src="' + img +
          '" alt="" aria-hidden="true" draggable="false" />';
      }
      var inner = shapes[name];
      if (!inner) { inner = shapes.bubble; }
      return wrap(inner, extraClass, bare);
    },
    has: function (name) { return !!shapes[name]; }
  };
})();
