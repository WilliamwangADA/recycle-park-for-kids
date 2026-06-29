/* ===========================================================================
   回收乐园 · 游戏数据层
   定义：垃圾种类 / 分类桶 / 再生材料 / 造物配方 / 可摆放物品 / 关卡 / 小动物
   所有美术都由 sprites.js 程序绘制（key 对应一个绘制函数），方便日后替换为
   AI 生成的 PNG（把 assets/sprites/<key>.png 放进去即可，sprites.js 会优先用图）。
   =========================================================================== */
window.DATA = (function () {

  /* ---- 四个分类桶 ---- */
  const BINS = [
    { id: 'recycle',  name: '可回收',  color: '#2e86de', tip: '瓶子、罐子、纸、玻璃' },
    { id: 'kitchen',  name: '厨余',    color: '#27ae60', tip: '果皮、剩饭、菜叶' },
    { id: 'hazard',   name: '有害',    color: '#c0392b', tip: '电池、灯泡、药品' },
    { id: 'other',    name: '其他',    color: '#7f8c8d', tip: '不好回收的东西' },
  ];

  /* ---- 再生材料（分对类的垃圾炼成的材料）---- */
  const MATERIALS = {
    plastic: { name: '再生塑料', color: '#ff9f43', icon: 'm_plastic' },
    metal:   { name: '金属锭',   color: '#a4b0be', icon: 'm_metal' },
    glass:   { name: '玻璃砂',   color: '#48dbfb', icon: 'm_glass' },
    paper:   { name: '纸浆',     color: '#d6a96a', icon: 'm_paper' },
    compost: { name: '堆肥',     color: '#8d6e3a', icon: 'm_compost' },
  };

  /* ---- 垃圾种类 ----
     bin: 正确的分类桶  yield: 分对后产出的材料（hazard 类不产材料，但分对得星）  */
  const TRASH = {
    bottle:  { name: '塑料瓶',  sprite: 't_bottle',  bin: 'recycle', yield: 'plastic' },
    bag:     { name: '塑料袋',  sprite: 't_bag',     bin: 'recycle', yield: 'plastic' },
    cup:     { name: '塑料杯',  sprite: 't_cup',     bin: 'recycle', yield: 'plastic' },
    can:     { name: '易拉罐',  sprite: 't_can',     bin: 'recycle', yield: 'metal' },
    tin:     { name: '罐头盒',  sprite: 't_tin',     bin: 'recycle', yield: 'metal' },
    glass:   { name: '玻璃瓶',  sprite: 't_glass',   bin: 'recycle', yield: 'glass' },
    news:    { name: '旧报纸',  sprite: 't_news',    bin: 'recycle', yield: 'paper' },
    box:     { name: '纸箱',    sprite: 't_box',     bin: 'recycle', yield: 'paper' },
    banana:  { name: '香蕉皮',  sprite: 't_banana',  bin: 'kitchen', yield: 'compost' },
    apple:   { name: '苹果核',  sprite: 't_apple',   bin: 'kitchen', yield: 'compost' },
    fishbone:{ name: '鱼骨头',  sprite: 't_fishbone',bin: 'kitchen', yield: 'compost' },
    battery: { name: '废电池',  sprite: 't_battery', bin: 'hazard',  yield: null },
    bulb:    { name: '旧灯泡',  sprite: 't_bulb',    bin: 'hazard',  yield: null },
    foam:    { name: '泡沫块',  sprite: 't_foam',    bin: 'other',   yield: null },
  };

  /* ---- 可制造的物品（配方 = 各种材料数量）----
     putInPark: true 的可以摆进乐园装饰  */
  const ITEMS = {
    stool:    { name: '小凳子',  sprite: 'i_stool',   cost: { plastic: 2 },              charm: 2 },
    table:    { name: '小桌子',  sprite: 'i_table',   cost: { plastic: 3, metal: 1 },    charm: 3 },
    cupware:  { name: '小杯子',  sprite: 'i_cupware', cost: { glass: 2 },                charm: 2 },
    planter:  { name: '花盆',    sprite: 'i_planter', cost: { glass: 1, compost: 1 },    charm: 3 },
    flowers:  { name: '花丛',    sprite: 'i_flowers', cost: { compost: 2 },              charm: 3 },
    tree:     { name: '小树',    sprite: 'i_tree',    cost: { compost: 3 },              charm: 4 },
    bench:    { name: '长椅',    sprite: 'i_bench',   cost: { plastic: 3, paper: 2 },    charm: 4 },
    campchair:{ name: '露营椅',  sprite: 'i_campchair',cost:{ metal: 2, paper: 1 },      charm: 4 },
    pinwheel: { name: '风车',    sprite: 'i_pinwheel',cost: { plastic: 1, paper: 1 },    charm: 3 },
    lamp:     { name: '小路灯',  sprite: 'i_lamp',    cost: { metal: 2, glass: 1 },      charm: 4 },
    seesaw:   { name: '跷跷板',  sprite: 'i_seesaw',  cost: { metal: 3, plastic: 2 },    charm: 6 },
    swing:    { name: '秋千',    sprite: 'i_swing',   cost: { metal: 3, paper: 2 },      charm: 6 },
    slide:    { name: '滑梯',    sprite: 'i_slide',   cost: { plastic: 4, metal: 2 },    charm: 8 },
    bike:     { name: '自行车',  sprite: 'i_bike',    cost: { metal: 4, plastic: 1 },    charm: 6 },
    tent:     { name: '帐篷',    sprite: 'i_tent',    cost: { paper: 3, plastic: 2 },    charm: 7 },
  };

  /* ---- 关卡（v0.1 只解锁大海，其余 coming soon）----
     trash: 这一关会出现的垃圾种类  */
  const LEVELS = [
    { id: 'ocean',  name: '大海',   theme: 'ocean',  unlocked: true,
      trash: ['bottle','bag','cup','can','glass','box','banana','fishbone','battery','foam'] },
    { id: 'park',   name: '公园',   theme: 'park',   unlocked: false,
      trash: ['bottle','can','news','banana','apple','bulb'] },
    { id: 'town',   name: '小区',   theme: 'town',   unlocked: false,
      trash: ['box','bottle','can','battery','apple','foam'] },
    { id: 'school', name: '学校',   theme: 'school', unlocked: false,
      trash: ['news','cup','glass','apple','bulb'] },
    { id: 'forest', name: '森林',   theme: 'forest', unlocked: false,
      trash: ['bottle','bag','can','banana','fishbone'] },
    { id: 'mount',  name: '大山',   theme: 'mount',  unlocked: false,
      trash: ['glass','tin','box','apple','battery'] },
    { id: 'city',   name: '城市',   theme: 'city',   unlocked: false,
      trash: ['bottle','can','box','foam','bulb','battery'] },
  ];

  /* ---- 会被乐园吸引来的小动物 / 小朋友（人气达标解锁）---- */
  const VISITORS = [
    { id: 'cat',    name: '小猫',   sprite: 'v_cat',    need: 3 },
    { id: 'bunny',  name: '小兔',   sprite: 'v_bunny',  need: 8 },
    { id: 'bird',   name: '小鸟',   sprite: 'v_bird',   need: 14 },
    { id: 'bear',   name: '小熊',   sprite: 'v_bear',   need: 22 },
    { id: 'kid',    name: '小朋友', sprite: 'v_kid',    need: 32 },
    { id: 'fox',    name: '小狐狸', sprite: 'v_fox',    need: 44 },
  ];

  return { BINS, MATERIALS, TRASH, ITEMS, LEVELS, VISITORS };
})();
