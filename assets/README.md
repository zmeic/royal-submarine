# assets/

第一版**不使用任何外部图片素材**，所有美术都是内联 SVG 或 CSS 画的：

- 角色、装备、鱼、宝箱、海洋动物等图标：`js/icons.js`
- 潜艇平面图（艇身、方形窗户、六个房间）：`js/submarine.js` 里的 `mapSvg()`
- 海水、光柱、气泡、海浪、珊瑚、舞台灯光：`css/*.css`

这个目录目前只放 `favicon.svg`（浏览器标签页图标）。

## 第二阶段接入正式美术时

1. 把图片（建议 `.svg` 或 `.png`）放进这个目录，例如 `assets/fish-normal.svg`；
2. 在 `js/icons.js` 里把对应图标的返回值改成 `<img src="assets/fish-normal.svg" alt="">`
   （或者直接替换内部的 SVG 图形代码）；
3. 其他代码不用改——所有地方都是通过 `RS.icons.get('名字')` 取图的。
