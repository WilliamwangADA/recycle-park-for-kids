/* ===========================================================================
   回收乐园 · 游戏数据层 (v0.2 玩法重做)
   玩法：垃圾漂在场景里 → 直接拖进对应分类箱 → 转成再生原料计入计分牌 →
         随时切到建造页用原料造物 → 原料不够就回场景/刷新场景再搜。
   美术 key 对应 sprites.js 程序绘制，放 assets/sprites/<key>.png 可覆盖。
   =========================================================================== */
window.DATA = (function () {

  /* ---- 四个分类箱 ---- */
  const BINS = [
    { id: 'recycle', name: '可回收', color: '#2e86de', tip: '瓶罐 纸 木 玻璃' },
    { id: 'kitchen', name: '厨余',   color: '#27ae60', tip: '果皮 鱼骨 菜叶' },
    { id: 'hazard',  name: '有害',   color: '#c0392b', tip: '电池 灯泡' },
    { id: 'other',   name: '其他',   color: '#8395a7', tip: '泡沫 橡胶' },
  ];

  /* ---- 再生原料（计分牌 & 建造配方都用它）---- */
  const MATERIALS = {
    wood:    { name: '木材', color: '#c08a4e', icon: 'm_wood' },
    plastic: { name: '塑料', color: '#ff9f43', icon: 'm_plastic' },
    metal:   { name: '金属', color: '#9aa7b5', icon: 'm_metal' },
    glass:   { name: '玻璃', color: '#34c6e0', icon: 'm_glass' },
    paper:   { name: '纸',   color: '#d6a96a', icon: 'm_paper' },
    rubber:  { name: '橡胶', color: '#555e6b', icon: 'm_rubber' },
  };

  /* ---- 垃圾种类（bin=正确箱；yield=分对产出的原料；hazard 类无原料只得星）---- */
  const TRASH = {
    bottle:   { name: '塑料瓶', sprite: 't_bottle',   bin: 'recycle', yield: 'plastic' },
    bag:      { name: '塑料袋', sprite: 't_bag',      bin: 'recycle', yield: 'plastic' },
    cup:      { name: '塑料杯', sprite: 't_cup',      bin: 'recycle', yield: 'plastic' },
    can:      { name: '易拉罐', sprite: 't_can',      bin: 'recycle', yield: 'metal' },
    tin:      { name: '罐头盒', sprite: 't_tin',      bin: 'recycle', yield: 'metal' },
    glass:    { name: '玻璃瓶', sprite: 't_glass',    bin: 'recycle', yield: 'glass' },
    news:     { name: '旧报纸', sprite: 't_news',     bin: 'recycle', yield: 'paper' },
    box:      { name: '纸箱',   sprite: 't_box',      bin: 'recycle', yield: 'paper' },
    driftwood:{ name: '浮木',   sprite: 't_driftwood',bin: 'recycle', yield: 'wood' },
    plank:    { name: '旧木板', sprite: 't_plank',    bin: 'recycle', yield: 'wood' },
    tire:     { name: '旧轮胎', sprite: 't_tire',     bin: 'recycle', yield: 'rubber' },
    banana:   { name: '香蕉皮', sprite: 't_banana',   bin: 'kitchen', yield: null },
    apple:    { name: '苹果核', sprite: 't_apple',    bin: 'kitchen', yield: null },
    fishbone: { name: '鱼骨头', sprite: 't_fishbone', bin: 'kitchen', yield: null },
    battery:  { name: '废电池', sprite: 't_battery',  bin: 'hazard',  yield: null },
    bulb:     { name: '旧灯泡', sprite: 't_bulb',     bin: 'hazard',  yield: null },
    foam:     { name: '泡沫块', sprite: 't_foam',     bin: 'other',   yield: null },
    boot:     { name: '旧靴子', sprite: 't_boot',     bin: 'other',   yield: 'rubber' },
  };

  /* ---- 可制造物品（配方=各原料数量；charm=摆进乐园加的人气）---- */
  const ITEMS = {
    stool:    { name: '小凳子', sprite: 'i_stool',    cost: { wood: 2 },                 charm: 2 },
    table:    { name: '小桌子', sprite: 'i_table',    cost: { wood: 3, metal: 1 },       charm: 3 },
    cupware:  { name: '小杯子', sprite: 'i_cupware',  cost: { glass: 2 },                charm: 2 },
    planter:  { name: '花盆',   sprite: 'i_planter',  cost: { glass: 1, plastic: 1 },    charm: 3 },
    flowers:  { name: '花丛',   sprite: 'i_flowers',  cost: { paper: 2 },                charm: 3 },
    tree:     { name: '小树',   sprite: 'i_tree',     cost: { wood: 3 },                 charm: 4 },
    bench:    { name: '长椅',   sprite: 'i_bench',    cost: { wood: 3, metal: 2 },       charm: 4 },
    campchair:{ name: '露营椅', sprite: 'i_campchair',cost: { metal: 2, paper: 1 },      charm: 4 },
    pinwheel: { name: '风车',   sprite: 'i_pinwheel', cost: { plastic: 1, paper: 1 },    charm: 3 },
    lamp:     { name: '小路灯', sprite: 'i_lamp',     cost: { metal: 2, glass: 1 },      charm: 4 },
    seesaw:   { name: '跷跷板', sprite: 'i_seesaw',   cost: { wood: 2, metal: 3 },       charm: 6 },
    swing:    { name: '秋千',   sprite: 'i_swing',    cost: { metal: 3, rubber: 2 },     charm: 6 },
    slide:    { name: '滑梯',   sprite: 'i_slide',    cost: { plastic: 4, metal: 2 },    charm: 8 },
    bike:     { name: '自行车', sprite: 'i_bike',     cost: { metal: 4, rubber: 2 },     charm: 7 },
    tent:     { name: '帐篷',   sprite: 'i_tent',     cost: { plastic: 2, paper: 3 },    charm: 7 },
  };

  /* ---- 关卡（v0.1 只解锁大海；每关一套垃圾池）---- */
  const LEVELS = [
    { id: 'ocean',  name: '大海', theme: 'ocean', unlocked: true,
      trash: ['bottle','bag','cup','can','tin','glass','box','news','driftwood','plank','tire','banana','fishbone','battery','foam','boot'] },
    { id: 'park',   name: '公园', theme: 'park',  unlocked: false, trash: [] },
    { id: 'town',   name: '小区', theme: 'town',  unlocked: false, trash: [] },
    { id: 'school', name: '学校', theme: 'school',unlocked: false, trash: [] },
    { id: 'forest', name: '森林', theme: 'forest',unlocked: false, trash: [] },
    { id: 'mount',  name: '大山', theme: 'mount', unlocked: false, trash: [] },
    { id: 'city',   name: '城市', theme: 'city',  unlocked: false, trash: [] },
  ];

  /* ---- 乐园访客（人气达标解锁）---- */
  const VISITORS = [
    { id: 'cat',   name: '小猫',   sprite: 'v_cat',   need: 3 },
    { id: 'bunny', name: '小兔',   sprite: 'v_bunny', need: 8 },
    { id: 'bird',  name: '小鸟',   sprite: 'v_bird',  need: 14 },
    { id: 'bear',  name: '小熊',   sprite: 'v_bear',  need: 22 },
    { id: 'kid',   name: '小朋友', sprite: 'v_kid',   need: 32 },
    { id: 'fox',   name: '小狐狸', sprite: 'v_fox',   need: 44 },
  ];

  return { BINS, MATERIALS, TRASH, ITEMS, LEVELS, VISITORS };
})();
