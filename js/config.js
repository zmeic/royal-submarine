/* ============================================================
 * 《皇家潜艇》配置文件
 * 想调整数值（分数、价格、损坏概率、任务难度）只改这里就够了。
 * ============================================================ */
window.RS = window.RS || {};

RS.config = {
  /* 存档键名。改动存档结构时把版本号 +1，旧存档会被自动忽略。 */
  storageKey: 'royal-submarine-save-v1',
  saveVersion: 1,

  /* ---------------- 身份 ---------------- */
  roles: {
    captain: {
      id: 'captain',
      name: '船长',
      icon: 'captain',
      duties: ['驾驶潜艇', '查看任务距离', '选择任务地点'],
      perk: '看得见每个任务的准确距离，完成任务再加 1 分领航奖励。',
      perkShort: '完成任务 +1 分'
    },
    diver: {
      id: 'diver',
      name: '潜水员',
      icon: 'diver',
      duties: ['下潜', '捕鱼', '寻找宝藏', '救助海洋动物'],
      perk: '捕鱼时间多 5 秒，寻宝多挖一次。',
      perkShort: '下海更擅长'
    },
    crew: {
      id: 'crew',
      name: '船员',
      icon: 'crew',
      duties: ['做饭', '照顾海洋动物', '管理粮食'],
      perk: '装备保养得好，损坏概率减半；吃粮食的加成翻倍。',
      perkShort: '装备更耐用'
    }
  },

  /* ---------------- 鱼的种类（图鉴用） ----------------
   * weight 越大越常见；rare: true 的鱼归到「稀有鱼」一档。
   * points 不写就用 tasks.fishing 里的 normalPoints / rarePoints。
   * 颜色会直接画进 SVG，换成孩子的画时在 js/art.js 里写 image 即可。 */
  species: [
    { id: 'blue', name: '蓝点鱼', rare: false, weight: 26, pattern: 'plain',
      body: '#6ed0f0', fin: '#4bb8dd', belly: '#a8e6fb',
      note: '海里最常见的小鱼，喜欢一大群一起游。' },
    { id: 'clown', name: '小丑鱼', rare: false, weight: 20, pattern: 'stripe',
      body: '#ff9a52', fin: '#f2722f', belly: '#ffd6b0', mark: '#fff6e4',
      note: '橙白条纹，住在软软的海葵里，一点都不怕蜇。' },
    { id: 'grass', name: '海草鱼', rare: false, weight: 18, pattern: 'plain',
      body: '#8fd6bd', fin: '#5bb79a', belly: '#d8f3e8',
      note: '躲在海草里几乎看不见，只有尾巴会露出来。' },
    { id: 'coral', name: '珊瑚鱼', rare: false, weight: 14, pattern: 'spot',
      body: '#ff9aa2', fin: '#e8707c', belly: '#ffd6da', mark: '#fff2f3',
      note: '身上有小圆点，一直绕着珊瑚打转。' },
    { id: 'puffer', name: '小河豚', rare: false, weight: 10, pattern: 'spot',
      body: '#ffd45e', fin: '#e8b13c', belly: '#fff3c4', mark: '#6b503a',
      note: '受惊的时候会鼓成一个球，其实很温柔。' },
    { id: 'night', name: '夜光鱼', rare: false, weight: 7, pattern: 'stripe',
      body: '#9d8bdc', fin: '#7a67c0', belly: '#ddd5ff', mark: '#f2f0ff',
      note: '越深的地方越亮，像会游泳的小夜灯。' },
    { id: 'gold', name: '黄金鱼', rare: true, weight: 24, pattern: 'plain',
      body: '#ffd971', fin: '#f5b53c', belly: '#fff3c4',
      note: '浑身金光闪闪，船长说见到它今天就会顺利。' },
    { id: 'rainbow', name: '彩虹鱼', rare: true, weight: 14, pattern: 'stripe',
      body: '#7fe3c8', fin: '#ff9aa2', belly: '#fff0b8', mark: '#9be3ff',
      note: '每一片鳞的颜色都不一样，游起来像一道小彩虹。' },
    { id: 'crownfish', name: '皇冠鱼', rare: true, weight: 4, pattern: 'crown', points: 8,
      body: '#ffe08a', fin: '#f0a93c', belly: '#fff8dc', mark: '#ffd45e',
      note: '头上有一顶小皇冠，整片海里只有皇家潜艇见过它。' }
  ],

  /* ---------------- 便利店商品 ---------------- */
  shopItems: [
    {
      id: 'suit', name: '潜水衣', price: 10, icon: 'suit', breakable: false, max: 1,
      desc: '下水更暖更安全：寻宝多挖一次，救援时容错更大。'
    },
    {
      id: 'hook', name: '鱼钩', price: 9, icon: 'hook', breakable: true, max: 3,
      desc: '捕鱼时鱼更多、更好点中。用久了可能会坏。'
    },
    {
      id: 'spear', name: '鱼枪', price: 20, icon: 'spear', breakable: true, max: 2,
      desc: '稀有鱼出现得更多（稀有鱼 +5 分）。用久了可能会坏。'
    },
    {
      id: 'oxygen', name: '氧气瓶', price: 4, icon: 'oxygen', breakable: false, max: 5,
      desc: '在水下多待 5 秒，捕鱼时间更长。'
    },
    {
      id: 'food', name: '粮食', price: 2, icon: 'food', breakable: false, max: 9,
      desc: '去餐厅吃掉它，下一个任务额外加分。'
    }
  ],

  /* ---------------- 装备损坏 ---------------- */
  breakage: {
    chance: 0.12,        // 每次任务中使用过的鱼钩/鱼枪的损坏概率
    crewMultiplier: 0.5  // 船员身份减半
  },

  /* ---------------- 粮食加成 ---------------- */
  meal: {
    bonus: 1,      // 吃一份粮食，下一个完成的任务 +1 分
    crewBonus: 2   // 船员 +2 分
  },

  /* ---------------- 任务 ---------------- */
  tasks: {
    fishing: {
      id: 'fishing',
      name: '捕鱼任务',
      icon: 'fish',
      intro: '点中游过的鱼就能捕到！',
      goal: '至少捕到 1 条鱼就算完成',
      usesGear: ['hook', 'spear'],
      duration: 30,          // 秒
      diverBonusTime: 5,
      oxygenBonusTime: 5,
      spawnEvery: 900,       // 毫秒
      hookSpawnFaster: 250,  // 有鱼钩时每条鱼来得更快（毫秒）
      rareChance: 0.2,
      spearRareChance: 0.38,
      normalPoints: 2,
      rarePoints: 5
    },
    treasure: {
      id: 'treasure',
      name: '寻宝任务',
      icon: 'chest',
      intro: '宝箱藏在 6 片区域里，挖错会提示远近。',
      goal: '在机会用完前挖到宝箱',
      usesGear: ['hook'],
      zones: 6,
      attempts: 2,
      diverExtraAttempt: 1,
      suitExtraAttempt: 1,
      points: 6
    },
    rescue: {
      id: 'rescue',
      name: '海洋救援任务',
      icon: 'turtle',
      intro: '三步救助遇到麻烦的海洋动物。',
      goal: '三个步骤全部做对',
      usesGear: [],
      approachClicks: 3,
      toolTries: 3,
      timingTries: 3,
      zoneWidth: 30,      // 时机条绿色区域宽度（百分比）
      suitExtraZone: 10,  // 有潜水衣时绿色区域更宽
      points: 10,
      animals: [
        { id: 'turtle', name: '小海龟', icon: 'turtle',
          trouble: '被旧渔网缠住了尾巴，动不了。', tool: 'scissors',
          note: '慢吞吞的老朋友，能在海里游上好几十年。' },
        { id: 'whale', name: '小鲸鱼', icon: 'whale',
          trouble: '游到浅滩上搁浅了，浮不起来。', tool: 'balloon',
          note: '会用歌声跟很远的同伴说话，声音低低的。' },
        { id: 'dolphin', name: '小海豚', icon: 'dolphin',
          trouble: '鱼鳍被礁石划伤，流血了。', tool: 'medkit',
          note: '最爱跟着潜艇跳来跳去，聪明又爱玩。' }
      ],
      tools: [
        { id: 'scissors', name: '安全剪刀', icon: 'scissors', hint: '剪开缠住的东西' },
        { id: 'balloon',  name: '浮力气囊', icon: 'balloon',  hint: '把动物托起来' },
        { id: 'medkit',   name: '海洋急救箱', icon: 'medkit', hint: '给伤口上药包扎' }
      ]
    }
  },

  /* 任务地点距离（米）随机范围，船长能看到准确数字 */
  distance: { min: 200, max: 3200 },

  /* ---------------- 成就徽章 ----------------
   * type 决定用哪个统计值来判断（见 js/achievements.js）：
   *   fishTotal 捕鱼总数 / fishKinds 鱼图鉴种类 / rareTotal 稀有鱼总数
   *   treasure 宝藏次数 / animalKinds 救过的动物种类 / animalTotal 救助总数
   *   tasks 完成任务数 / score 当前积分 / bestCatch 单次捕鱼最多条数
   *   gearKinds 同时拥有的装备种类 / species:<id> 抓到过某种鱼
   * need 是达成需要的数量。 */
  achievements: [
    { id: 'firstFish', name: '第一条鱼', icon: 'fish', type: 'fishTotal', need: 1,
      desc: '捕到人生中第一条鱼' },
    { id: 'fish10', name: '小渔夫', icon: 'fish', type: 'fishTotal', need: 10,
      desc: '一共捕到 10 条鱼' },
    { id: 'fish30', name: '捕鱼高手', icon: 'hook', type: 'fishTotal', need: 30,
      desc: '一共捕到 30 条鱼' },
    { id: 'bigCatch', name: '大丰收', icon: 'star', type: 'bestCatch', need: 6,
      desc: '一次捕鱼任务里捕到 6 条鱼' },
    { id: 'firstRare', name: '闪闪发光', icon: 'rareFish', type: 'rareTotal', need: 1,
      desc: '捕到第一条稀有鱼' },
    { id: 'crownFish', name: '皇冠加冕', icon: 'crown', type: 'species:crownfish', need: 1,
      desc: '捕到传说中的皇冠鱼' },
    { id: 'fishAll', name: '鱼类图鉴大师', icon: 'chestOpen', type: 'fishKinds', need: 9,
      desc: '把图鉴里的每一种鱼都捕到一次' },
    { id: 'firstTreasure', name: '开箱时刻', icon: 'chest', type: 'treasure', need: 1,
      desc: '第一次挖到宝藏' },
    { id: 'treasure5', name: '寻宝猎人', icon: 'chestOpen', type: 'treasure', need: 5,
      desc: '一共挖到 5 次宝藏' },
    { id: 'firstRescue', name: '海洋朋友', icon: 'turtle', type: 'animalTotal', need: 1,
      desc: '第一次成功救助海洋动物' },
    { id: 'rescueAll', name: '海洋守护者', icon: 'sparkle', type: 'animalKinds', need: 3,
      desc: '小海龟、小鲸鱼、小海豚都救过' },
    { id: 'tasks10', name: '出勤十次', icon: 'wheel', type: 'tasks', need: 10,
      desc: '完成 10 个任务' },
    { id: 'score50', name: '积分小富翁', icon: 'star', type: 'score', need: 50,
      desc: '身上同时有 50 分' },
    { id: 'gearFull', name: '全副武装', icon: 'suit', type: 'gearKinds', need: 4,
      desc: '同时拥有潜水衣、鱼钩、鱼枪、氧气瓶' }
  ],

  /* ---------------- 潜艇房间（顺序按原画的分区：上层左→右，下层左→右） ---------------- */
  rooms: [
    {
      id: 'rest', name: '休息区', icon: 'bed',
      desc: '软软的小床和暖暖的夜灯，累了来躺一会儿。',
      action: 'rest'
    },
    {
      id: 'dining', name: '餐厅', icon: 'table',
      desc: '大圆桌摆好了热菜，吃饱更有劲。',
      action: 'eat'
    },
    {
      id: 'stage', name: '舞台', icon: 'stage',
      desc: '灯球转起来，上台唱歌跳舞！',
      action: 'show'
    },
    {
      id: 'bridge', name: '驾驶区', icon: 'wheel',
      desc: '大方向舵 + 雷达屏，从这里出发去任务！',
      action: 'tasks'
    },
    {
      id: 'toilet', name: '厕所', icon: 'toilet',
      desc: '洗手池会冒小泡泡，出发前记得洗手。',
      action: 'wash'
    },
    {
      id: 'engine', name: '设备区', icon: 'gear',
      desc: '管道、氧气罐和大阀门，潜艇靠它们前进。',
      action: 'engine'
    },
    {
      id: 'storage', name: '储藏区', icon: 'box',
      desc: '宝箱、货架和小机器人都在这儿。',
      action: 'shop'
    },
    {
      id: 'view', name: '观景区', icon: 'window',
      desc: '一整面落地舷窗，外面就是海底世界。',
      action: 'view'
    }
  ],

  /* 随机起名用的词 */
  nameParts: {
    first: ['小', '大', '快乐', '勇敢', '闪光', '皇家'],
    last: ['海豚', '章鱼', '珍珠', '浪花', '海星', '鲸鱼', '船长', '贝壳']
  }
};
