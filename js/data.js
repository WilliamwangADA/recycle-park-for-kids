/* ===========================================================================
   回收乐园 · 游戏数据层 (v0.2 玩法重做)
   玩法：垃圾漂在场景里 → 直接拖进对应分类箱 → 转成再生原料计入计分牌 →
         随时切到建造页用原料造物 → 原料不够就回场景/刷新场景再搜。
   美术 key 对应 sprites.js 程序绘制，放 assets/sprites/<key>.png 可覆盖。
   =========================================================================== */
window.DATA = (function () {

  /* ---- 四个分类箱 ---- */
  const BINS = [
    { id: 'recycle', name: '可回收', color: '#2e86de', tip: '瓶罐 纸 木 玻璃', icon: '♻️' },
    { id: 'kitchen', name: '厨余',   color: '#27ae60', tip: '果皮 鱼骨 菜叶', icon: '🍎' },
    { id: 'hazard',  name: '有害',   color: '#c0392b', tip: '电池 灯泡',     icon: '🔋' },
    { id: 'other',   name: '其他',   color: '#8395a7', tip: '泡沫 橡胶',     icon: '🗑️' },
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
    // —— 各关专属垃圾 ——
    icecream: { name: '雪糕',   sprite: 't_icecream', bin: 'kitchen', yield: null },
    pizza:    { name: '披萨',   sprite: 't_pizza',    bin: 'kitchen', yield: null },
    egg:      { name: '蛋壳',   sprite: 't_egg',      bin: 'kitchen', yield: null },
    juicebox: { name: '饮料盒', sprite: 't_juicebox', bin: 'recycle', yield: 'paper' },
    coffee:   { name: '咖啡杯', sprite: 't_coffee',   bin: 'recycle', yield: 'paper' },
    pencil:   { name: '铅笔头', sprite: 't_pencil',   bin: 'recycle', yield: 'wood' },
    mask:     { name: '旧口罩', sprite: 't_mask',     bin: 'other',   yield: null },
    chips:    { name: '薯片袋', sprite: 't_chips',    bin: 'other',   yield: null },
    // —— 新增垃圾 ——
    straw:      { name: '塑料吸管', sprite: 't_straw',      bin: 'recycle', yield: 'plastic' },
    magazine:   { name: '旧杂志',   sprite: 't_magazine',   bin: 'recycle', yield: 'paper' },
    jar:        { name: '玻璃罐',   sprite: 't_jar',        bin: 'recycle', yield: 'glass' },
    chicken:    { name: '鸡骨头',   sprite: 't_chicken',    bin: 'kitchen', yield: null },
    corn:       { name: '玉米棒',   sprite: 't_corn',       bin: 'kitchen', yield: null },
    teabag:     { name: '茶包',     sprite: 't_teabag',     bin: 'kitchen', yield: null },
    medicine:   { name: '过期药',   sprite: 't_medicine',   bin: 'hazard',  yield: null },
    paint:      { name: '油漆桶',   sprite: 't_paint',      bin: 'hazard',  yield: null },
    spray:      { name: '杀虫剂',   sprite: 't_spray',      bin: 'hazard',  yield: null },
    ceramic:    { name: '碎陶瓷',   sprite: 't_ceramic',    bin: 'other',   yield: null },
    tissue:     { name: '脏纸巾',   sprite: 't_tissue',     bin: 'other',   yield: null },
    cig:        { name: '烟头',     sprite: 't_cig',        bin: 'other',   yield: null },
    // —— 再增一批垃圾 ——
    foil:        { name: '锡纸球',   sprite: 't_foil',        bin: 'recycle', yield: 'metal' },
    cd:          { name: '旧光盘',   sprite: 't_cd',          bin: 'recycle', yield: 'plastic' },
    cap:         { name: '瓶盖',     sprite: 't_cap',         bin: 'recycle', yield: 'plastic' },
    wire:        { name: '旧电线',   sprite: 't_wire',        bin: 'recycle', yield: 'metal' },
    bread:       { name: '面包块',   sprite: 't_bread',       bin: 'kitchen', yield: null },
    shrimp:      { name: '虾壳',     sprite: 't_shrimp',      bin: 'kitchen', yield: null },
    rind:        { name: '西瓜皮',   sprite: 't_rind',        bin: 'kitchen', yield: null },
    bone:        { name: '大骨头',   sprite: 't_bone',        bin: 'kitchen', yield: null },
    lighter:     { name: '打火机',   sprite: 't_lighter',     bin: 'hazard',  yield: null },
    thermo:      { name: '温度计',   sprite: 't_thermo',      bin: 'hazard',  yield: null },
    polish:      { name: '指甲油',   sprite: 't_polish',      bin: 'hazard',  yield: null },
    sponge:      { name: '旧海绵',   sprite: 't_sponge',      bin: 'other',   yield: null },
  };

  /* ---- 可制造物品 ----
     cost=配方  charm=人气  scale=乐园里相对大小(杯小桌大)
     surface=true 是台面(可叠放小物)  onTop=true 是小物(更适合放台面上) ---- */
  const ITEMS = {
    // —— 小物 / 可放台面 ——
    plate:    { name: '餐盘',   sprite: 'i_plate',    cost: { glass: 1 },                charm: 2, scale: 0.5,  onTop: true },
    cupware:  { name: '小杯子', sprite: 'i_cupware',  cost: { glass: 2 },                charm: 2, scale: 0.5,  onTop: true },
    teapot:   { name: '茶壶',   sprite: 'i_teapot',   cost: { metal: 1, glass: 1 },      charm: 3, scale: 0.6,  onTop: true },
    // —— 家具(台面，可在上面叠放小物) ——
    stool:    { name: '小凳子', sprite: 'i_stool',    cost: { wood: 2 },                 charm: 2, scale: 0.7,  surface: true },
    table:    { name: '小桌子', sprite: 'i_table',    cost: { wood: 3, metal: 1 },       charm: 3, scale: 1.0,  surface: true },
    bench:    { name: '长椅',   sprite: 'i_bench',    cost: { wood: 3, metal: 2 },       charm: 4, scale: 1.1,  surface: true },
    campchair:{ name: '露营椅', sprite: 'i_campchair',cost: { metal: 2, paper: 1 },      charm: 4, scale: 0.9 },
    // —— 装饰 ——
    planter:  { name: '花盆',   sprite: 'i_planter',  cost: { glass: 1, plastic: 1 },    charm: 3, scale: 0.8 },
    flowers:  { name: '花丛',   sprite: 'i_flowers',  cost: { paper: 2 },                charm: 3, scale: 0.85 },
    pinwheel: { name: '风车',   sprite: 'i_pinwheel', cost: { plastic: 1, paper: 1 },    charm: 3, scale: 0.8 },
    lamp:     { name: '小路灯', sprite: 'i_lamp',     cost: { metal: 2, glass: 1 },      charm: 4, scale: 1.15 },
    mailbox:  { name: '小信箱', sprite: 'i_mailbox',  cost: { metal: 2, paper: 1 },      charm: 3, scale: 0.75 },
    flag:     { name: '小旗',   sprite: 'i_flag',     cost: { paper: 1, wood: 1 },       charm: 2, scale: 1.0 },
    balloon:  { name: '气球',   sprite: 'i_balloon',  cost: { rubber: 1, plastic: 1 },   charm: 3, scale: 0.95 },
    kite:     { name: '风筝',   sprite: 'i_kite',     cost: { paper: 2, plastic: 1 },    charm: 4, scale: 0.95 },
    umbrella: { name: '遮阳伞', sprite: 'i_umbrella', cost: { paper: 2, metal: 1 },      charm: 4, scale: 1.3 },
    picnic:   { name: '野餐篮', sprite: 'i_picnic',   cost: { paper: 2, plastic: 1 },    charm: 3, scale: 0.8 },
    statue:   { name: '小石像', sprite: 'i_statue',   cost: { glass: 2, metal: 2 },      charm: 5, scale: 1.1 },
    // —— 大件 / 游乐 ——
    tree:     { name: '小树',   sprite: 'i_tree',     cost: { wood: 3 },                 charm: 4, scale: 1.7 },
    fountain: { name: '喷泉',   sprite: 'i_fountain', cost: { glass: 3, metal: 2 },      charm: 7, scale: 1.4 },
    seesaw:   { name: '跷跷板', sprite: 'i_seesaw',   cost: { wood: 2, metal: 3 },       charm: 6, scale: 1.4 },
    swing:    { name: '秋千',   sprite: 'i_swing',    cost: { metal: 3, rubber: 2 },     charm: 6, scale: 1.5 },
    slide:    { name: '滑梯',   sprite: 'i_slide',    cost: { plastic: 4, metal: 2 },    charm: 8, scale: 1.6 },
    bike:     { name: '自行车', sprite: 'i_bike',     cost: { metal: 4, rubber: 2 },     charm: 7, scale: 1.2 },
    tent:     { name: '帐篷',   sprite: 'i_tent',     cost: { plastic: 2, paper: 3 },    charm: 7, scale: 1.55, home: true },

    // —— 客厅 / 家居 ——
    sofa:     { name: '沙发',   sprite: 'i_sofa',     cost: { wood: 3, rubber: 2 },      charm: 5, scale: 1.3, surface: true, room: 'living' },
    tv:       { name: '电视',   sprite: 'i_tv',       cost: { plastic: 3, glass: 2 },    charm: 5, scale: 1.0, room: 'living' },
    books:    { name: '书架',   sprite: 'i_books',    cost: { wood: 2, paper: 2 },       charm: 4, scale: 1.0, surface: true, room: 'living' },
    picture:  { name: '挂画',   sprite: 'i_picture',  cost: { paper: 1, wood: 1 },       charm: 2, scale: 0.55, room: 'living' },
    clock:    { name: '座钟',   sprite: 'i_clock',    cost: { metal: 1, glass: 1 },      charm: 2, scale: 0.55, onTop: true, room: 'living' },
    candle:   { name: '蜡烛',   sprite: 'i_candle',   cost: { wood: 1 },                 charm: 2, scale: 0.4,  onTop: true, room: 'living' },
    vase:     { name: '花瓶',   sprite: 'i_vase',     cost: { glass: 1, paper: 1 },      charm: 3, scale: 0.5,  onTop: true, surface: true, room: 'living' },
    guitar:   { name: '吉他',   sprite: 'i_guitar',   cost: { wood: 2, plastic: 1 },     charm: 4, scale: 0.95, room: 'living' },
    piano:    { name: '钢琴',   sprite: 'i_piano',    cost: { wood: 4, metal: 2 },       charm: 7, scale: 1.2, room: 'living' },
    lantern:  { name: '灯笼',   sprite: 'i_lantern',  cost: { paper: 1, metal: 1 },      charm: 3, scale: 0.6,  room: 'living' },
    // —— 厨房 ——
    pan:      { name: '煎锅',   sprite: 'i_pan',      cost: { metal: 1 },                charm: 2, scale: 0.5,  onTop: true, room: 'kitchen' },
    pot:      { name: '汤锅',   sprite: 'i_pot',      cost: { metal: 2 },                charm: 2, scale: 0.55, onTop: true, room: 'kitchen' },
    cake:     { name: '蛋糕',   sprite: 'i_cake',     cost: { paper: 1, glass: 1 },      charm: 3, scale: 0.5,  onTop: true, room: 'kitchen' },
    watermelon:{ name: '西瓜',  sprite: 'i_watermelon',cost: { glass: 1 },               charm: 2, scale: 0.55, onTop: true, room: 'kitchen' },
    strawberry:{ name: '草莓',  sprite: 'i_strawberry',cost: { glass: 1 },               charm: 2, scale: 0.42, onTop: true, room: 'kitchen' },
    fork:     { name: '餐具',   sprite: 'i_fork',     cost: { metal: 1 },                charm: 1, scale: 0.42, onTop: true, room: 'kitchen' },
    // —— 卧室 ——
    bed:      { name: '小床',   sprite: 'i_bed',      cost: { wood: 4, paper: 2 },       charm: 6, scale: 1.5, surface: true, room: 'bedroom' },
    teddy:    { name: '泰迪熊', sprite: 'i_teddy',    cost: { paper: 2 },                charm: 4, scale: 0.7,  onTop: true, room: 'bedroom' },
    mirror:   { name: '镜子',   sprite: 'i_mirror',   cost: { glass: 2, wood: 1 },       charm: 3, scale: 0.9, room: 'bedroom' },
    alarm:    { name: '闹钟',   sprite: 'i_alarm',    cost: { metal: 1, glass: 1 },      charm: 2, scale: 0.42, onTop: true, room: 'bedroom' },
    cactus:   { name: '仙人掌', sprite: 'i_cactus',   cost: { glass: 1 },                charm: 2, scale: 0.65, room: 'bedroom' },
    // —— 厕所 ——
    toilet:   { name: '马桶',   sprite: 'i_toilet',   cost: { plastic: 3, glass: 1 },    charm: 3, scale: 0.95, room: 'bathroom' },
    bathtub:  { name: '浴缸',   sprite: 'i_bathtub',  cost: { plastic: 4, glass: 2 },    charm: 5, scale: 1.4, surface: true, room: 'bathroom' },
    shower:   { name: '淋浴',   sprite: 'i_shower',   cost: { metal: 2, plastic: 2 },    charm: 4, scale: 1.0, room: 'bathroom' },
    soap:     { name: '香皂',   sprite: 'i_soap',     cost: { plastic: 1 },              charm: 1, scale: 0.4,  onTop: true, room: 'bathroom' },
    toothbrush:{ name: '牙刷',  sprite: 'i_toothbrush',cost: { plastic: 1 },             charm: 1, scale: 0.4,  onTop: true, room: 'bathroom' },
    // —— 玩具 / 装饰 ——
    gift:     { name: '礼物',   sprite: 'i_gift',     cost: { paper: 2 },                charm: 3, scale: 0.55, onTop: true },
    car:      { name: '玩具车', sprite: 'i_car',      cost: { plastic: 2, rubber: 1 },   charm: 3, scale: 0.6 },
    robot:    { name: '机器人', sprite: 'i_robot',    cost: { metal: 2, plastic: 1 },    charm: 4, scale: 0.7 },
    ball:     { name: '皮球',   sprite: 'i_ball',     cost: { rubber: 1 },               charm: 2, scale: 0.5 },
    trophy:   { name: '奖杯',   sprite: 'i_trophy',   cost: { metal: 2, glass: 1 },      charm: 4, scale: 0.5,  onTop: true },
    sunflower:{ name: '向日葵', sprite: 'i_sunflower',cost: { paper: 1 },                charm: 3, scale: 0.55, onTop: true },
    rose:     { name: '玫瑰',   sprite: 'i_rose',     cost: { paper: 1 },                charm: 2, scale: 0.45, onTop: true },
    xmastree: { name: '圣诞树', sprite: 'i_xmastree', cost: { wood: 3, glass: 2 },       charm: 7, scale: 1.5 },
    snowman:  { name: '雪人',   sprite: 'i_snowman',  cost: { glass: 2 },                charm: 4, scale: 1.0 },
    // —— 可放水里的物品（只能放到水域）——
    boat:       { name: '小船',   sprite: 'i_boat',       cost: { wood: 3, metal: 1 },      charm: 7, scale: 1.3,  water: true },
    sailboat:   { name: '帆船',   sprite: 'i_sailboat',   cost: { wood: 2, paper: 2 },      charm: 7, scale: 1.2,  water: true },
    rubberduck: { name: '橡皮鸭', sprite: 'i_rubberduck', cost: { rubber: 2 },              charm: 4, scale: 0.5,  water: true },
    swimring:   { name: '游泳圈', sprite: 'i_swimring',   cost: { rubber: 2, plastic: 1 },  charm: 4, scale: 0.85, water: true },
    // —— 可插进花瓶的花 ——
    bouquet:    { name: '花束',   sprite: 'i_bouquet',    cost: { paper: 2 },               charm: 5, scale: 0.6,  onTop: true },
    tulip:      { name: '郁金香', sprite: 'i_tulip',      cost: { paper: 1 },               charm: 3, scale: 0.45, onTop: true },
  };

  /* ---- 关卡（v0.1 只解锁大海；每关一套垃圾池）---- */
  // unlocked 仅表示初始解锁（大海）；其余靠通关前一关解锁（见场景 isUnlocked）
  const LEVELS = [
    { id: 'ocean',  name: '大海', theme: 'ocean', icon: '🌊', unlocked: true, tool: 'net',
      trash: ['bottle','bag','cup','can','tin','glass','box','news','driftwood','plank','tire','banana','fishbone','battery','foam','boot','mask','straw','jar','chicken','corn','ceramic','medicine','tissue','cig','foil','cap','shrimp','sponge','rind'] },
    { id: 'park',   name: '公园', theme: 'park',  icon: '🌳', unlocked: false, tool: 'tongs',
      trash: ['bottle','bag','cup','can','news','banana','apple','foam','icecream','juicebox','chips','corn','teabag','spray','magazine','cd','cap','bread','rind','lighter','sponge','bone'] },
    { id: 'town',   name: '小区', theme: 'town',  icon: '🏘️', unlocked: false, tool: 'broom',
      trash: ['box','bottle','can','battery','apple','foam','news','bag','coffee','mask','chips','magazine','medicine','tissue','jar','wire','lighter','polish','foil'] },
    { id: 'school', name: '学校', theme: 'school',icon: '🏫', unlocked: false, tool: 'tongs',
      trash: ['news','cup','glass','apple','bulb','box','pencil','juicebox','egg','chips','straw','magazine','teabag','spray','cd','bread','thermo','sponge'] },
    { id: 'forest', name: '森林', theme: 'forest',icon: '🌲', unlocked: false, tool: 'tongs',
      trash: ['bottle','bag','can','banana','apple','foam','box','glass','icecream','egg','chicken','corn','cig','jar','cap','bread','shrimp','bone'] },
    { id: 'mount',  name: '大山', theme: 'mount', icon: '⛰️', unlocked: false, tool: 'broom',
      trash: ['glass','tin','box','apple','battery','bottle','can','foam','coffee','chips','spray','ceramic','jar','paint','wire','thermo','rind','bone'] },
    { id: 'city',   name: '城市', theme: 'city',  icon: '🏙️', unlocked: false, tool: 'broom',
      trash: ['bottle','can','box','foam','bulb','battery','cup','bag','pizza','mask','coffee','chips','magazine','straw','paint','cig','tissue','medicine','foil','cd','wire','lighter','polish'] },
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
