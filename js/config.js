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
      intro: '海里游过一群鱼，点中它们就能捕到！普通鱼 +2 分，金色稀有鱼 +5 分。',
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
      intro: '海底有 6 片区域，宝箱藏在其中一片。挖错了会告诉你离宝箱有多远。',
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
      intro: '有海洋动物遇到麻烦了！先慢慢靠近，再拿对工具，最后在合适的时机完成救援。',
      goal: '三个步骤全部做对',
      usesGear: [],
      approachClicks: 3,
      toolTries: 2,
      timingTries: 3,
      zoneWidth: 30,      // 时机条绿色区域宽度（百分比）
      suitExtraZone: 10,  // 有潜水衣时绿色区域更宽
      points: 10,
      animals: [
        { id: 'turtle', name: '小海龟', icon: 'turtle',
          trouble: '被旧渔网缠住了尾巴，动不了。', tool: 'scissors' },
        { id: 'whale', name: '小鲸鱼', icon: 'whale',
          trouble: '游到浅滩上搁浅了，浮不起来。', tool: 'balloon' },
        { id: 'dolphin', name: '小海豚', icon: 'dolphin',
          trouble: '鱼鳍被礁石划伤，流血了。', tool: 'medkit' }
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

  /* ---------------- 潜艇房间 ---------------- */
  rooms: [
    {
      id: 'bridge', name: '驾驶区', icon: 'wheel',
      desc: '这里是船长的位置：大大的方向舵、雷达屏幕和一排闪亮的按钮。从这里出发去任务！',
      action: 'tasks'
    },
    {
      id: 'view', name: '观景区', icon: 'window',
      desc: '一整排方形大窗户，外面就是海底世界：珊瑚、小鱼、还有慢慢飘过的水母。',
      action: 'view'
    },
    {
      id: 'dining', name: '餐厅', icon: 'table',
      desc: '长长的餐桌摆好了：面包、汤、水果和一盘热菜。吃饱了做任务更有劲。',
      action: 'eat'
    },
    {
      id: 'storage', name: '储藏区', icon: 'box',
      desc: '装备和粮食都堆在这里，旁边就是潜艇便利店的小窗口。',
      action: 'shop'
    },
    {
      id: 'toilet', name: '厕所', icon: 'toilet',
      desc: '干干净净的小房间，洗手池会冒出一串小泡泡。出发前记得洗手哦。',
      action: 'wash'
    },
    {
      id: 'stage', name: '舞台', icon: 'stage',
      desc: '彩色的灯光转起来，船员们在这里唱歌跳舞。任务累了就来玩一会儿。',
      action: 'show'
    }
  ],

  /* 随机起名用的词 */
  nameParts: {
    first: ['小', '大', '快乐', '勇敢', '闪光', '皇家'],
    last: ['海豚', '章鱼', '珍珠', '浪花', '海星', '鲸鱼', '船长', '贝壳']
  }
};
