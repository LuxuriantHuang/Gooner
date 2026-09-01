// ═══════════════════════════════════════════════════════
// Gooner · 工业矩阵 — 渲染进程 app.js
// ═══════════════════════════════════════════════════════

(function () {
  "use strict";

  // ── SVG 图标库 ──
  const I = {
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',
    chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4ZM8 10h8M8 14h5"/>',
    ghost: '<path d="M9 3h6l1 4H8Zm-6 18 4-4 4 4 4-4 4 4 4-4v4H3Z"/><circle cx="12" cy="10" r="2"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/>',
    xray: '<circle cx="12" cy="12" r="8" opacity=".6"/><circle cx="12" cy="12" r="3"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M16.3 7.7l-1.4 1.4M7.7 16.3l-1.4 1.4"/>',
    fall: '<rect x="8" y="2" width="8" height="10" rx="1"/><path d="M12 12v3M10 18l2 2 2-2M8 8h2M14 8h2"/>',
    flash: '<path d="M13 2 3 14h6l-2 8 10-12h-6l2-8Z"/>',
    keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h1M11 10h1M15 10h1M8 14h8"/>',
    folder: '<path d="M3 6h7l2 2h9v10H3Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/><path d="M6 5 4 3M18 5l2-2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    spark: '<path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18 12h3M16.3 7.7l2.1-2.1M8 16a5 5 0 1 1 8 0l-2 2v2h-4v-2Z"/>',
    shield: '<path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6Zm-3 9 2 2 4-4"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    monitor: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/><path d="M8 10h8M13 7l3 3-3 3"/>',
    hidden: '<path d="M3 12s4-7 9-7c2 0 3.8 1 5.3 2.2M21 12s-4 7-9 7c-2 0-3.8-1-5.3-2.2M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
    profile: '<path d="M4 6h2l2-2h8l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3"/>',
    play: '<polygon points="6,3 20,12 6,21"/>',
    pause: '<rect x="5" y="3" width="5" height="18"/><rect x="14" y="3" width="5" height="18"/>',
    stop: '<rect x="4" y="4" width="16" height="16" rx="1"/>',
    x: '<path d="M6 6l12 12M18 6l-12 12"/>'
  };

  function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (I[name] || '') + '</svg>'; }
  function arrowRight() { return '<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>'; }

  // ── 卡片定义 ──
  // { id, name, meta, icon, hint, configKey, tone, count, section, idx }
  let CARD_DEFS = [
    // 核心功能 (section: "core")
    { id: "popup", name: "媒体弹窗", meta: "popup.engine", icon: "bell", hint: "全局总开关。关闭后停止创建新弹窗，并关闭当前所有媒体窗口。", configKey: "popupsEnabled", tone: "", section: "core" },
    { id: "wallpaper", name: "自动换壁纸", meta: "wallpaper", icon: "image", hint: "按设定间隔自动更换桌面壁纸，支持普通图片与智能角色随机切换。", configKey: "wallpaperEnabled", tone: "", section: "core" },
    { id: "ai-popup", name: "AI 文本弹窗", meta: "gen.text", icon: "chat", hint: "生成短文本并以独立窗口展示，含主动互动子模块。", configKey: "aiPopupScheduleEnabled", tone: "", section: "core" },
    { id: "ghost", name: "幽灵底片", meta: "ghost.gallery", icon: "ghost", hint: "半透明图片持续覆盖屏幕，按设定间隔自动切换新图片。可调透明度和切换频率。", configKey: "visualGhostEnabled", tone: "", section: "core" },
    { id: "xray", name: "X 光模式", meta: "xray.reveal", icon: "xray", hint: "鼠标周围圆形区域显示完整图片，其余部分被遮罩。可调半径和遮罩透明度。", configKey: "visualXrayEnabled", tone: "", section: "core" },
    { id: "waterfall", name: "媒体瀑布", meta: "media.waterfall", icon: "fall", hint: "图片从屏幕顶部持续下落，可调速度、数量、大小和透明度。", configKey: "visualWaterfallEnabled", tone: "", section: "core" },
    { id: "flash", name: "潜意识闪烁", meta: "subliminal.flash", icon: "flash", hint: "按随机间隔在屏幕上短暂闪烁图片。⚠ 光敏性癫痫患者请勿开启。", configKey: "visualFlashEnabled", tone: "danger", section: "core" },
    { id: "pollution", name: "输入干预", meta: "input.control", icon: "keyboard", hint: "剪贴板污染 + 输入框注入。所有细分能力可在详情中单独开关。", configKey: "pollutionEnabled", tone: "", section: "core" },

    // 智能与系统 (section: "system")
    { id: "process-rules", name: "进程规则", meta: "process.gate", icon: "shield", hint: "根据运行中软件的允许/排除名单，自动启停弹窗调度。", configKey: "processRulesEnabled", tone: "", section: "system" },
    { id: "peer-share", name: "联机共享", meta: "p2p.share", icon: "globe", hint: "创建/加入房间，与好友直接互传图片和视频，接收内容只在内存中预览，不落盘。", configKey: "peerShareEnabled", tone: "", section: "system" },
    { id: "hardcore", name: "强控模式", meta: "restricted.ui", icon: "lock", hint: "隐藏主窗口和任务栏。请先配置全局快捷键，确保始终可恢复控制。", configKey: "hardcoreMode", tone: "danger", section: "system" },
    { id: "autostart", name: "开机自启", meta: "auto.launch", icon: "monitor", hint: "Windows 登录后自动运行应用，可在系统设置中随时关闭。", configKey: "autoStartOnBoot", tone: "", section: "system" },
    { id: "silent", name: "静默模式", meta: "silent.boot", icon: "hidden", hint: "启动后自动收起主窗口。通知区图标和快捷键仍可用于控制。", configKey: "silentMode", tone: "", section: "system" },
  ];

  let SECTIONS = [
    { key: "core", name: "核心功能", cls: "core-section" },
    { key: "system", name: "智能与系统", cls: "" }
  ];

  // ── 全局状态 ──
  let currentConfig = null;
  let currentAiConfig = { cards: [] };
  let aiActiveEditCardId = "";
  let aiModalTargetFeature = "";
  let currentState = null;
  let cachedProfiles = [];
  let currentLocale = (window.appI18n && window.appI18n.resolveLanguage("system", navigator.language)) || "zh-CN";
  let shortcutTransientFeedback = {};
  let autoSaveTimer = null;
  let processPickerTarget = null;
  let processPickerItems = [];
  let renameTargetProfileId = "";
  let cardNum = 0;

  const AUTO_SAVE_DELAY_MS = 300;

  // ── i18n ──
  const { resolveLanguage, translate } = window.appI18n || {
    resolveLanguage: (v, fb) => v || fb || "zh-CN",
    translate: (_l, k) => k
  };
  function t(key, params) { return translate(currentLocale, key, params); }

  // ── IPC 桥接 ──
  function getMediaPopup() { return window.mediaPopup; }

  // ── 日志 ──
  function log(msg) {
    const el = document.getElementById("logOutput");
    if (!el) return;
    const time = new Date().toLocaleTimeString();
    el.textContent = "[" + time + "] " + msg + "\n" + el.textContent;
    el.textContent = el.textContent.trim();
  }

  // ── 自动保存 ──
  async function saveConfig() {
    const mp = getMediaPopup();
    if (!mp || !mp.saveConfig) return { blocked: true };
    try {
      const result = await mp.saveConfig(currentConfig);
      if (result && result.ok) log("配置已保存");
      return result || { ok: true };
    } catch (e) { console.error("saveConfig error", e); return { blocked: true }; }
  }

  async function scheduleAutoSave(opts) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    if (opts && opts.immediate) {
      await saveConfig();
      return;
    }
    autoSaveTimer = setTimeout(() => saveConfig(), AUTO_SAVE_DELAY_MS);
  }

  // ── 获取卡片开关状态 ──
  function getCardState(card) {
    if (!currentConfig) return false;
    if (card.id === "folders") return true;
    if (card.id === "hardcore") return currentConfig.hardcoreMode || false;
    if (card.id === "autostart") return currentConfig.autoStartOnBoot || false;
    if (card.id === "silent") return currentConfig.silentMode || false;
    if (card.id === "interaction") {
      const ai = currentConfig.ai || {};
      return ai.interactionEnabled || false;
    }
    if (card.id === "ai-popup") {
      const ai = currentConfig.ai || {};
      return ai.popupScheduleEnabled || false;
    }
    if (card.configKey) {
      const key = card.configKey;
      // 处理嵌套 config
      if (key === "visualGhostEnabled") return !!(currentConfig.visualIntervention && currentConfig.visualIntervention.ghostEnabled);
      if (key === "visualXrayEnabled") return !!(currentConfig.visualIntervention && currentConfig.visualIntervention.xrayEnabled);
      if (key === "visualWaterfallEnabled") return !!(currentConfig.visualIntervention && currentConfig.visualIntervention.waterfallEnabled);
      if (key === "visualFlashEnabled") return !!(currentConfig.visualIntervention && currentConfig.visualIntervention.flashEnabled);
      if (key === "wallpaperEnabled") return !!(currentConfig.wallpaper && (currentConfig.wallpaper.enabled || currentConfig.wallpaper.characterEnabled));
      if (key === "processRulesEnabled") return !!(currentConfig.processRules && currentConfig.processRules.enabled);
      if (key === "peerShareEnabled") return !!(currentConfig.peerShare && currentConfig.peerShare.enabled);
      return !!(currentConfig[key]);
    }
    return false;
  }

  // ── 设置卡片开关 ──
  async function setCardState(card, on) {
    if (!currentConfig) return;
    if (card.id === "hardcore") { currentConfig.hardcoreMode = on; }
    else if (card.id === "autostart") { currentConfig.autoStartOnBoot = on; }
    else if (card.id === "silent") { currentConfig.silentMode = on; }
    else if (card.id === "interaction") {
      if (!currentConfig.ai) currentConfig.ai = {};
      currentConfig.ai.interactionEnabled = on;
    }
    else if (card.id === "ai-popup") {
      if (!currentConfig.ai) currentConfig.ai = {};
      currentConfig.ai.popupScheduleEnabled = on;
    }
    else if (card.configKey) {
      const key = card.configKey;
      if (key === "visualGhostEnabled") {
        if (!currentConfig.visualIntervention) currentConfig.visualIntervention = {};
        currentConfig.visualIntervention.ghostEnabled = on;
      } else if (key === "visualXrayEnabled") {
        if (!currentConfig.visualIntervention) currentConfig.visualIntervention = {};
        currentConfig.visualIntervention.xrayEnabled = on;
      } else if (key === "visualWaterfallEnabled") {
        if (!currentConfig.visualIntervention) currentConfig.visualIntervention = {};
        currentConfig.visualIntervention.waterfallEnabled = on;
      } else if (key === "visualFlashEnabled") {
        if (!currentConfig.visualIntervention) currentConfig.visualIntervention = {};
        currentConfig.visualIntervention.flashEnabled = on;
      } else if (key === "wallpaperEnabled") {
        if (!currentConfig.wallpaper) currentConfig.wallpaper = {};
        currentConfig.wallpaper.enabled = on;
      } else if (key === "processRulesEnabled") {
        if (!currentConfig.processRules) currentConfig.processRules = {};
        currentConfig.processRules.enabled = on;
      } else if (key === "peerShareEnabled") {
        if (!currentConfig.peerShare) currentConfig.peerShare = {};
        currentConfig.peerShare.enabled = on;
        if (!on) { void leavePeerRoom(); }
        else { void autoJoinPeerShareRoom(); }
      } else {
        currentConfig[key] = on;
      }
    }
    await scheduleAutoSave({ immediate: true });
  }

  // 打开"启用联机共享"开关后自动执行一次连通性自检并直接加入房间（默认公共大厅），
  // 免去用户手动点"测试连通性"+"加入房间"两个按钮。
  var lastPeerSelfTestResult = null;
  function renderPeerSelfTestResult() {
    var el = document.getElementById("peerSelfTestResult");
    if (!el || !lastPeerSelfTestResult) return;
    var r = lastPeerSelfTestResult;
    if (!r.ok) {
      el.textContent = "测试失败: " + r.detail;
      return;
    }
    var parts = [];
    parts.push(r.udpOk ? "本机UDP出入站：正常" : "本机UDP出入站：异常（可能被防火墙拦截）");
    parts.push(r.dhtOk
      ? ("公网DHT发现网络：正常（已连接 " + r.dhtNodeCount + " 个节点）")
      : ("公网DHT发现网络：较弱（仅 " + r.dhtNodeCount + " 个节点，跨网络发现可能较慢，局域网内发现不受影响）"));
    el.textContent = parts.join(" · ");
  }
  async function autoJoinPeerShareRoom() {
    if (!window.PeerShareUI || !currentConfig || !currentConfig.peerShare) return;
    ensurePeerShareCallbacksBound();
    if (window.peerShare && window.peerShare.selfTest) {
      try {
        lastPeerSelfTestResult = await window.peerShare.selfTest();
        renderPeerSelfTestResult();
      } catch (_e) {}
    }
    var useLobby = currentConfig.peerShare.useLobby !== false;
    var code = useLobby ? "" : (currentConfig.peerShare.lastRoomCode || "");
    await window.PeerShareUI.joinRoom(code);
    updatePeerRoomStatus();
  }

  function getFolderCountHtml() {
    const folders = (currentConfig && currentConfig.folders) ? currentConfig.folders : [];
    const count = Array.isArray(folders) ? folders.length : 0;
    return count + ' <em>个来源</em>';
  }

  // ── 渲染卡片 ──
  function renderTile(card) {
    cardNum++;
    const on = getCardState(card);
    var cls = "tile";
    if (on) cls += " on";
    if (card.tone) cls += " " + card.tone;
    if (card.count) cls += " tile-folder";

    var bot = "";
    if (card.count) {
      bot = '<div class="folder-count">' + getFolderCountHtml() + '</div>' +
        '<div class="tile-actions"><button class="link tile-btn-full" data-action="detail" data-id="' + card.id + '">管理 ' + arrowRight() + '</button></div>';
    } else {
      bot = '<div class="tile-actions tile-actions-split"><button class="sw" aria-label="' + (on ? "关闭" : "开启") + card.name + '" data-action="toggle" data-id="' + card.id + '"></button><button class="link" data-action="detail" data-id="' + card.id + '">设置 ' + arrowRight() + '</button></div>';
    }

    return '<article class="' + cls + '" data-card-id="' + card.id + '" data-section="' + card.section + '">' +
      '<span class="tile-grip" title="拖动排序"><svg viewBox="0 0 12 14" width="10" height="12"><circle cx="3" cy="2" r="1.2" fill="currentColor"/><circle cx="9" cy="2" r="1.2" fill="currentColor"/><circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="9" cy="7" r="1.2" fill="currentColor"/><circle cx="3" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/></svg></span>' +
      '<div class="hint">' + card.hint + '</div>' +
      '<div class="tile-top"><span class="glyph">' + icon(card.icon) + '</span><span class="idx">' + String(cardNum).padStart(2, "0") + '</span></div>' +
      '<h3>' + card.name + '</h3>' +
      '<p class="meta">' + card.meta + '</p>' +
      bot +
      '</article>';
  }

  function renderAllCards() {
    // 安全清理 — 防止重建 DOM 时仍处于拖拽态
    if (dragState) clearDragState();
    cardNum = 0;
    var html = "";
    for (var s = 0; s < SECTIONS.length; s++) {
      var sec = SECTIONS[s];
      var cards = CARD_DEFS.filter(function (c) { return c.section === sec.key; });
      if (!cards.length) continue;
      html += '<section class="sec' + (sec.cls ? " " + sec.cls : "") + '" data-section-key="' + sec.key + '">';
      html += '<div class="sec-head"><span class="sec-grip" title="拖动排序分类"><svg viewBox="0 0 12 14" width="10" height="12"><circle cx="3" cy="2" r="1.2" fill="currentColor"/><circle cx="9" cy="2" r="1.2" fill="currentColor"/><circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="9" cy="7" r="1.2" fill="currentColor"/><circle cx="3" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/></svg></span><h2>' + sec.name + '</h2><span class="sec-count">' + cards.length + ' modules</span></div>';
      html += '<div class="grid">';
      for (var i = 0; i < cards.length; i++) { html += renderTile(cards[i]); }
      html += '</div></section>';
    }
    var dash = document.getElementById("dashboard");
    if (dash) dash.innerHTML = html;
    bindCardEvents();
    bindDragEvents();
  }

  // ── 卡片事件绑定 ──
  function bindCardEvents() {
    var links = document.querySelectorAll("#dashboard .link");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (e) {
        e.stopPropagation();
        var id = this.dataset.id;
        if (this.dataset.action === "detail") showDetail(id);
      });
    }

    var sws = document.querySelectorAll("#dashboard .sw");
    for (var j = 0; j < sws.length; j++) {
      sws[j].addEventListener("click", function (e) {
        e.stopPropagation();
        var id = this.dataset.id;
        var tile = this.closest(".tile");
        if (!tile) return;
        var card = CARD_DEFS.find(function (c) { return c.id === id; });
        if (!card) return;
        tile.classList.toggle("on");
        setCardState(card, tile.classList.contains("on"));
      });
    }
  }

  // ── 布局持久化（全局 localStorage，不跟随配置档案） ──
  var UI_LAYOUT_KEY = "gooner_uiLayout";

  function loadGlobalLayout() {
    try {
      var raw = localStorage.getItem(UI_LAYOUT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function applyLayoutOrder() {
    var layout = loadGlobalLayout();
    if (!layout) return;

    // 重排分类
    if (layout.sectionOrder && layout.sectionOrder.length) {
      var secMap = {};
      for (var i = 0; i < SECTIONS.length; i++) {
        secMap[SECTIONS[i].key] = SECTIONS[i];
      }
      var newSections = [];
      for (var j = 0; j < layout.sectionOrder.length; j++) {
        if (secMap[layout.sectionOrder[j]]) {
          newSections.push(secMap[layout.sectionOrder[j]]);
          delete secMap[layout.sectionOrder[j]];
        }
      }
      for (var k in secMap) { newSections.push(secMap[k]); }
      SECTIONS.length = 0;
      for (var m = 0; m < newSections.length; m++) { SECTIONS.push(newSections[m]); }
    }

    // 重排卡片
    if (layout.cardOrder) {
      var cardMap = {};
      for (var ci = 0; ci < CARD_DEFS.length; ci++) {
        cardMap[CARD_DEFS[ci].id] = CARD_DEFS[ci];
      }
      var newDefs = [];
      for (var si = 0; si < SECTIONS.length; si++) {
        var secKey = SECTIONS[si].key;
        var order = layout.cardOrder[secKey] || [];
        for (var oi = 0; oi < order.length; oi++) {
          if (cardMap[order[oi]]) {
            cardMap[order[oi]].section = secKey;
            newDefs.push(cardMap[order[oi]]);
            delete cardMap[order[oi]];
          }
        }
      }
      // 追加缺失卡片
      for (var id in cardMap) { newDefs.push(cardMap[id]); }
      CARD_DEFS.length = 0;
      for (var di = 0; di < newDefs.length; di++) { CARD_DEFS.push(newDefs[di]); }
    }
  }

  function saveLayoutOrder() {
    var layout = {
      sectionOrder: SECTIONS.map(function (s) { return s.key; }),
      cardOrder: {}
    };
    for (var i = 0; i < SECTIONS.length; i++) {
      var secKey = SECTIONS[i].key;
      layout.cardOrder[secKey] = CARD_DEFS
        .filter(function (c) { return c.section === secKey; })
        .map(function (c) { return c.id; });
    }
    try { localStorage.setItem(UI_LAYOUT_KEY, JSON.stringify(layout)); } catch (e) {}
  }

  // ── 鼠标拖拽系统（参考 Toys 成熟方案）──
  var DRAG_THRESHOLD = 12;  // 拖拽启动阈值 px，防止误触
  var dragState = null;     // { type, cardId|sectionKey, sourceSection, startX, startY, offsetX, offsetY, active, sourceEl }
  var dragOverEl = null;
  var dragGhost = null;
  var _lastDragEndTime = 0; // 拖拽结束时间戳，用于防误点

  function createDragGhost() {
    if (dragGhost) return dragGhost;
    dragGhost = document.createElement("div");
    dragGhost.className = "drag-ghost";
    document.body.appendChild(dragGhost);
    return dragGhost;
  }

  function removeDragGhost() {
    if (dragGhost && dragGhost.parentNode) {
      dragGhost.parentNode.removeChild(dragGhost);
    }
    dragGhost = null;
  }

  function moveDragGhost(x, y) {
    var g = createDragGhost();
    g.style.left = x + "px";
    g.style.top = y + "px";
  }

  function clearDragState() {
    var all = document.querySelectorAll(
      "#dashboard .dragging, #dashboard .drag-insert-before, #dashboard .drag-insert-after"
    );
    for (var i = 0; i < all.length; i++) {
      all[i].classList.remove("dragging", "drag-insert-before", "drag-insert-after");
    }
    dragState = null;
    dragOverEl = null;
    removeDragGhost();
    document.body.classList.remove("is-dragging");
  }

  // 获取鼠标所在位置的 tile（排除自身，使用原始位置不受 transform 影响）
  function getTileAt(x, y, excludeId) {
    var tiles = document.querySelectorAll("#dashboard .tile");
    for (var i = 0; i < tiles.length; i++) {
      if (tiles[i].dataset.cardId === excludeId) continue;
      var r = tiles[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return tiles[i];
      }
    }
    return null;
  }

  // 获取鼠标所在位置的 section（排除自身）
  function getSectionAt(x, y, excludeKey) {
    var secs = document.querySelectorAll("#dashboard .sec");
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].dataset.sectionKey === excludeKey) continue;
      var r = secs[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return secs[i];
      }
    }
    return null;
  }



  // ── 卡片拖拽（鼠标事件）──
  function onTileGripMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    var tile = e.currentTarget.closest(".tile");
    if (!tile) return;

    // 拖拽刚结束不久，忽略快速点击
    if (Date.now() - _lastDragEndTime < 250) return;

    var rect = tile.getBoundingClientRect();
    dragState = {
      type: "tile",
      cardId: tile.dataset.cardId,
      sourceSection: tile.dataset.section,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      active: false,           // 未超过阈值，不算真正拖拽
      sourceEl: tile
    };
  }

  function activateTileDrag() {
    if (!dragState || dragState.active) return;
    dragState.active = true;

    var tile = dragState.sourceEl;
    tile.classList.add("dragging");
    document.body.classList.add("is-dragging");

    // 幽灵显示卡片名称 + 图标
    var g = createDragGhost();
    var card = CARD_DEFS.find(function (c) { return c.id === dragState.cardId; });
    if (card) {
      var iconHtml = icon(card.icon);
      g.innerHTML = '<span class="ghost-icon">' + iconHtml + '</span><span class="ghost-label">' + card.name + '</span>';
    }
    moveDragGhost(dragState.startX, dragState.startY);
  }

  function onTileMouseMove(e) {
    if (!dragState || dragState.type !== "tile") return;

    // 阈值检测：未超过阈值不启动拖拽
    if (!dragState.active) {
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      activateTileDrag();
    }

    moveDragGhost(e.clientX, e.clientY);

    var hoverTile = getTileAt(e.clientX, e.clientY, dragState.cardId);

    // 目标不变时跳过更新
    if (hoverTile === dragOverEl) return;

    // 清除旧指示线
    if (dragOverEl) {
      dragOverEl.classList.remove("drag-insert-before", "drag-insert-after");
    }
    dragOverEl = hoverTile;

    if (hoverTile) {
      var r = hoverTile.getBoundingClientRect();
      var midX = r.left + r.width / 2;
      // Grid 水平排列：左右半区判断插在前还是后
      if (e.clientX <= midX) {
        hoverTile.classList.add("drag-insert-before");
      } else {
        hoverTile.classList.add("drag-insert-after");
      }
    }
  }

  function onTileMouseUp(e) {
    if (!dragState || dragState.type !== "tile") { clearDragState(); return; }

    var cardId = dragState.cardId;
    var card = CARD_DEFS.find(function (c) { return c.id === cardId; });

    // 清除指示线
    if (dragOverEl) {
      dragOverEl.classList.remove("drag-insert-before", "drag-insert-after");
    }

    // 只有真正拖拽了（超过阈值）才执行排序
    if (dragState.active) {
      var hoverTile = getTileAt(e.clientX, e.clientY, cardId);
      if (hoverTile && card && hoverTile.dataset.cardId !== cardId) {
        var targetCardId = hoverTile.dataset.cardId;
        var targetSection = hoverTile.dataset.section;

        // 从原位置移除
        var cardIdx = -1;
        for (var ci = 0; ci < CARD_DEFS.length; ci++) {
          if (CARD_DEFS[ci].id === cardId) { cardIdx = ci; break; }
        }
        if (cardIdx !== -1) {
          CARD_DEFS.splice(cardIdx, 1);
          card.section = targetSection;

          // 找到目标位置
          var targetIdx = -1;
          for (var ti = 0; ti < CARD_DEFS.length; ti++) {
            if (CARD_DEFS[ti].id === targetCardId) { targetIdx = ti; break; }
          }
          if (targetIdx !== -1) {
            var r = hoverTile.getBoundingClientRect();
            var midX = r.left + r.width / 2;
            if (e.clientX > midX) targetIdx++;
            CARD_DEFS.splice(targetIdx, 0, card);
          } else {
            CARD_DEFS.push(card);
          }
        }

        saveLayoutOrder();
        renderAllCards();
      }
    }

    _lastDragEndTime = Date.now();
    clearDragState();
  }

  // ── 分类拖拽（鼠标事件）──
  function onSecGripMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    var sec = e.currentTarget.closest(".sec");
    if (!sec) return;

    if (Date.now() - _lastDragEndTime < 250) return;

    dragState = {
      type: "section",
      sectionKey: sec.dataset.sectionKey,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      sourceEl: sec
    };
  }

  function activateSecDrag() {
    if (!dragState || dragState.active) return;
    dragState.active = true;

    var sec = dragState.sourceEl;
    sec.classList.add("dragging");
    document.body.classList.add("is-dragging");

    var g = createDragGhost();
    var secDef = SECTIONS.find(function (s) { return s.key === dragState.sectionKey; });
    if (secDef) g.innerHTML = '<span class="ghost-label">' + secDef.name + '</span>';
    moveDragGhost(dragState.startX, dragState.startY);
  }

  function onSecMouseMove(e) {
    if (!dragState || dragState.type !== "section") return;

    if (!dragState.active) {
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      activateSecDrag();
    }

    moveDragGhost(e.clientX, e.clientY);

    var hoverSec = getSectionAt(e.clientX, e.clientY, dragState.sectionKey);

    if (hoverSec === dragOverEl) return;

    if (dragOverEl) {
      dragOverEl.classList.remove("drag-insert-before", "drag-insert-after");
    }

    dragOverEl = hoverSec;

    if (hoverSec) {
      var r = hoverSec.getBoundingClientRect();
      var midY = r.top + r.height / 2;
      if (e.clientY <= midY) {
        hoverSec.classList.add("drag-insert-before");
      } else {
        hoverSec.classList.add("drag-insert-after");
      }
    }
  }

  function onSecMouseUp(e) {
    if (!dragState || dragState.type !== "section") { clearDragState(); return; }

    var srcKey = dragState.sectionKey;

    if (dragOverEl) {
      dragOverEl.classList.remove("drag-insert-before", "drag-insert-after");
    }

    if (dragState.active) {
      var hoverSec = getSectionAt(e.clientX, e.clientY, srcKey);
      if (hoverSec && hoverSec.dataset.sectionKey !== srcKey) {
        var targetKey = hoverSec.dataset.sectionKey;

        var srcIdx = -1;
        for (var i = 0; i < SECTIONS.length; i++) {
          if (SECTIONS[i].key === srcKey) { srcIdx = i; break; }
        }
        if (srcIdx !== -1) {
          var srcSec = SECTIONS[srcIdx];
          SECTIONS.splice(srcIdx, 1);

          var tgtIdx = -1;
          for (var j = 0; j < SECTIONS.length; j++) {
            if (SECTIONS[j].key === targetKey) { tgtIdx = j; break; }
          }
          if (tgtIdx === -1) {
            SECTIONS.push(srcSec);
          } else {
            var r = hoverSec.getBoundingClientRect();
            var midY = r.top + r.height / 2;
            if (e.clientY > midY) tgtIdx++;
            SECTIONS.splice(tgtIdx, 0, srcSec);
          }
        }

        saveLayoutOrder();
        renderAllCards();
      }
    }

    _lastDragEndTime = Date.now();
    clearDragState();
  }

  var _globalDragMoveBound = false;
  function onGlobalDragMove(e) {
    if (!dragState) return;
    moveDragGhost(e.clientX, e.clientY);
    if (dragState.type === "tile") onTileMouseMove(e);
    else if (dragState.type === "section") onSecMouseMove(e);
  }
  function onGlobalDragUp(e) {
    if (!dragState) return;
    if (dragState.type === "tile") onTileMouseUp(e);
    else if (dragState.type === "section") onSecMouseUp(e);
  }

  function bindDragEvents() {
    var dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    // 卡片拖拽 — 手柄 + tile 上的 mousemove/mouseup
    var grips = dashboard.querySelectorAll(".tile-grip");
    for (var i = 0; i < grips.length; i++) {
      grips[i].addEventListener("mousedown", onTileGripMouseDown);
    }

    var tiles = dashboard.querySelectorAll(".tile");
    for (var j = 0; j < tiles.length; j++) {
      tiles[j].addEventListener("mousemove", onTileMouseMove);
      tiles[j].addEventListener("mouseup", onTileMouseUp);
    }

    // 分类拖拽 — 手柄 + section 上的 mousemove/mouseup
    var secGrips = dashboard.querySelectorAll(".sec-grip");
    for (var k = 0; k < secGrips.length; k++) {
      secGrips[k].addEventListener("mousedown", onSecGripMouseDown);
    }

    var secs = dashboard.querySelectorAll(".sec");
    for (var m = 0; m < secs.length; m++) {
      secs[m].addEventListener("mousemove", onSecMouseMove);
      secs[m].addEventListener("mouseup", onSecMouseUp);
    }

    // 全局 mouseup/mousemove 确保在元素外部松手也能清理（只绑一次）
    if (!_globalDragMoveBound) {
      _globalDragMoveBound = true;
      document.addEventListener("mousemove", onGlobalDragMove);
      document.addEventListener("mouseup", onGlobalDragUp);
    }
  }

  // ═════════════════════════════════════════════════
  // 详情页导航
  // ═════════════════════════════════════════════════

  function showDashboard() {
    document.getElementById("dashboard").style.display = "";
    document.getElementById("detail-view").style.display = "none";
    document.querySelector(".hero").style.display = "";
    // 重新渲染以刷新文件夹计数等
    renderAllCards();
  }

  function showDetail(cardId) {
    document.getElementById("dashboard").style.display = "none";
    document.querySelector(".hero").style.display = "none";
    var dv = document.getElementById("detail-view");
    dv.style.display = "";
    var card = CARD_DEFS.find(function (c) { return c.id === cardId; });
    document.getElementById("detailTitle").textContent = card ? card.name : cardId;
    document.getElementById("detailContent").innerHTML = renderDetailContent(cardId);
    bindDetailEvents(cardId);
  }

  function renderDetailContent(cardId) {
    switch (cardId) {
      case "popup": return renderPopupDetail();
      case "wallpaper": return renderWallpaperDetail();
      case "ai-popup": return renderAiPopupDetail();
      case "ghost": return renderGhostDetail();
      case "xray": return renderXrayDetail();
      case "waterfall": return renderWaterfallDetail();
      case "flash": return renderFlashDetail();
      case "pollution": return renderPollutionDetail();
      case "folders": return renderFoldersDetail();
      case "desktop-char": return renderWallpaperDetail();
      case "interaction": return renderAiPopupDetail();
      case "process-rules": return renderProcessRulesDetail();
      case "peer-share": return renderPeerShareDetail();
      case "hardcore": return renderHardcoreDetail();
      case "autostart": return renderAutostartDetail();
      case "silent": return renderSilentDetail();
      case "global-settings": return renderGlobalSettingsDetail();
      case "stats": return renderStatsDetail();
      default: return "<p>详情页面未实现。</p>";
    }
  }

  function bindDetailEvents(cardId) {
    var backBtn = document.getElementById("detailBackBtn");
    if (backBtn) backBtn.onclick = showDashboard;
    // 子页面特定后期渲染
    if (cardId === "ai-popup") { setTimeout(applyAiPreview, 100); }
    if (cardId === "stats") { loadCalendarData(); loadStats(); }
    if (cardId === "process-rules") { updateProcessRulesStatus(); }
    if (cardId === "peer-share") { setTimeout(initPeerShareDetail, 50); }
    if (cardId === "folders" && currentConfig) {
      var fl = document.getElementById("folderList");
      if (fl) {
        var folders = currentConfig.folders || [];
        fl.innerHTML = folders.length ? folders.map(function(f, i) {
          var p = typeof f === "string" ? f : (f.path || "");
          var w = (typeof f === "object" && f.weight != null) ? f.weight : 1;
          return '<div class="folder-row" data-folder-index="' + i + '">' +
            '<span class="folder-path" title="' + p + '">' + p + '</span>' +
            '<label class="folder-weight"><span>权重</span><input type="range" min="1" max="5" step="1" value="' + w + '" data-action="folderWeight" data-index="' + i + '"><span class="folder-weight-val">' + w + '</span></label>' +
            '<button class="folder-remove-btn" data-action="folderRemove" data-index="' + i + '" title="移除">✕</button>' +
            '</div>';
        }).join("") : '<span style="color:var(--muted);font-size:13px">还没有添加文件夹 — 点击上方按钮添加</span>';
      }
      setTimeout(renderWebsiteLibraryPreview, 100);
    }
  }

  // ═════════════════════════════════════════════════
  // 详情页渲染函数
  // ═════════════════════════════════════════════════

  function panel(title, body, cls) {
    return '<section class="detail-panel' + (cls ? " " + cls : "") + '"><h3>' + title + '</h3>' + body + '</section>';
  }

  function switchRow(label, id, checked) {
    return '<label class="switch-row"><span>' + label + '</span><input type="checkbox" id="' + id + '"' + (checked ? " checked" : "") + '><i></i></label>';
  }

  function clockField(label, idBase, vals) {
    var h = vals && vals[0] != null ? vals[0] : 0;
    var m = vals && vals[1] != null ? vals[1] : 0;
    var s = vals && vals[2] != null ? vals[2] : 0;
    return '<div class="field"><span>' + label + '</span><div class="compact-digital-clock">' +
      '<div class="clock-unit"><span class="clock-unit-label">时</span><input id="' + idBase + 'Hours" type="number" min="0" max="24" step="1" value="' + h + '"></div>' +
      '<span class="clock-colon">:</span>' +
      '<div class="clock-unit"><span class="clock-unit-label">分</span><input id="' + idBase + 'Minutes" type="number" min="0" max="59" step="1" value="' + m + '"></div>' +
      '<span class="clock-colon">:</span>' +
      '<div class="clock-unit"><span class="clock-unit-label">秒</span><input id="' + idBase + 'Seconds" type="number" min="0" max="59" step="1" value="' + s + '"></div>' +
      '</div></div>';
  }

  function numField(label, id, val, min, max, step) {
    return '<label class="field"><span>' + label + '</span><input id="' + id + '" type="number" min="' + (min || 0) + '" max="' + (max || 9999) + '" step="' + (step || 1) + '" value="' + (val != null ? val : "") + '"></label>';
  }

  function selectField(label, id, val, opts) {
    var html = '<label class="field"><span>' + label + '</span><select id="' + id + '">';
    for (var i = 0; i < opts.length; i++) {
      html += '<option value="' + opts[i][0] + '"' + (val === opts[i][0] ? " selected" : "") + '>' + opts[i][1] + '</option>';
    }
    html += '</select></label>';
    return html;
  }

  function colorField(label, id, val) {
    return '<label class="field"><span>' + label + '</span><div style="display:flex;align-items:center;gap:6px"><input id="' + id + '" type="color" value="' + (val || "#000000") + '" style="width:36px;height:28px;padding:2px;border:1px solid var(--line);border-radius:2px;background:transparent;cursor:pointer"><input id="' + id + 'Opacity" type="number" min="0" max="1" step="0.01" value="1" style="width:52px;text-align:center" title="透明度"></div></label>';
  }

  function clampOpacity(v, fb) { var n = Number(v); return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : (fb != null ? fb : 1); }
  function hexToRgba(hex, opacity) {
    if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "rgba(0,0,0," + clampOpacity(opacity, 1) + ")";
    return "rgba(" + parseInt(hex.slice(1,3),16) + "," + parseInt(hex.slice(3,5),16) + "," + parseInt(hex.slice(5,7),16) + "," + clampOpacity(opacity, 1) + ")";
  }

  // AI 弹窗外观实时预览
  function applyAiPreview() {
    var p = document.getElementById("aiPreview");
    var pt = document.getElementById("aiPreviewText");
    var cb = document.getElementById("aiPreviewCloseBtn");
    if (!p || !pt) return;
    var g = function(id, fb) { var el = document.getElementById(id); return el ? (el.type === "checkbox" ? el.checked : el.value) : fb; };
    var gn = function(id, fb) { var v = Number(g(id, null)); return Number.isFinite(v) ? v : fb; };
    var w = gn("aiPopupWidth", 420), h = gn("aiPopupHeight", 320);
    p.style.width = w + "px"; p.style.height = h + "px";
    p.style.backgroundColor = hexToRgba(g("aiPopupBodyBackgroundColor", "#050505"), gn("aiPopupBodyBackgroundOpacity", 1));
    p.style.transform = "scale(" + Math.max(0.2, gn("aiPopupPreviewScale", 1)) + ")";
    p.style.transformOrigin = "top left";
    pt.style.color = hexToRgba(g("aiPopupTextColor", "#f4f7fb"), gn("aiPopupTextOpacity", 1));
    pt.style.fontSize = gn("aiPopupTextFontSize", 16) + "px";
    pt.style.lineHeight = String(gn("aiPopupTextLineHeight", 1.5));
    pt.style.textAlign = g("aiPopupTextAlign", "left");
    pt.style.backgroundColor = hexToRgba(g("aiPopupCardBackgroundColor", "#050505"), gn("aiPopupCardBackgroundOpacity", 1));
    pt.style.borderColor = hexToRgba(g("aiPopupCardBorderColor", "#1f2b33"), gn("aiPopupCardBorderOpacity", 1));
    var bw = gn("aiPopupCardBorderWidth", 0);
    pt.style.borderWidth = bw + "px"; pt.style.borderStyle = bw > 0 ? "solid" : "none";
    pt.style.borderRadius = gn("aiPopupCardBorderRadius", 8) + "px";
    pt.style.padding = gn("aiPopupCardPaddingY", 0) + "px " + gn("aiPopupCardPaddingX", 2) + "px";
    pt.style.boxShadow = gn("aiPopupCardShadowOffsetX", 0) + "px " + gn("aiPopupCardShadowOffsetY", 8) + "px " + gn("aiPopupCardShadowBlur", 24) + "px " + gn("aiPopupCardShadowSpread", 0) + "px " + hexToRgba(g("aiPopupCardShadowColor", "#000000"), gn("aiPopupCardShadowOpacity", 0.45));
    var tsb = Math.max(0, gn("aiPopupTextShadowBlur", 10)) + Math.abs(gn("aiPopupTextShadowSpread", 0));
    pt.style.textShadow = gn("aiPopupTextShadowOffsetX", 0) + "px " + gn("aiPopupTextShadowOffsetY", 2) + "px " + tsb + "px " + hexToRgba(g("aiPopupTextShadowColor", "#000000"), gn("aiPopupTextShadowOpacity", 0.55));
    if (cb) {
      cb.style.fontSize = gn("aiPopupCloseButtonFontSize", 13) + "px";
      cb.style.borderRadius = gn("aiPopupCloseButtonBorderRadius", 6) + "px";
      cb.style.padding = gn("aiPopupCloseButtonPaddingY", 6) + "px " + gn("aiPopupCloseButtonPaddingX", 12) + "px";
      cb.style.left = gn("aiPopupCloseButtonOffsetX", 6) + "px";
      cb.style.top = gn("aiPopupCloseButtonOffsetY", 6) + "px";
      cb.style.backgroundColor = hexToRgba(g("aiPopupCloseButtonBackgroundColor", "#000000"), gn("aiPopupCloseButtonBackgroundOpacity", 1));
      cb.style.color = hexToRgba(g("aiPopupCloseButtonTextColor", "#ffffff"), gn("aiPopupCloseButtonTextOpacity", 1));
      cb.style.borderColor = hexToRgba(g("aiPopupCloseButtonBorderColor", "#ffffff"), gn("aiPopupCloseButtonBorderOpacity", 1));
      cb.dataset.hbg = hexToRgba(g("aiPopupCloseButtonHoverBackgroundColor", "#2f3b45"), gn("aiPopupCloseButtonHoverBackgroundOpacity", 1));
      cb.dataset.hfg = hexToRgba(g("aiPopupCloseButtonHoverTextColor", "#ffffff"), gn("aiPopupCloseButtonHoverTextOpacity", 1));
    }
  }

  function bindAiPreviewEvents() {
    var fields = ["aiPopupWidth","aiPopupHeight","aiPopupPreviewScale","aiPopupBodyBackgroundColor","aiPopupBodyBackgroundOpacity","aiPopupTextColor","aiPopupTextOpacity","aiPopupTextFontSize","aiPopupTextLineHeight","aiPopupTextAlign","aiPopupCardBackgroundColor","aiPopupCardBackgroundOpacity","aiPopupCardBorderColor","aiPopupCardBorderOpacity","aiPopupCardBorderWidth","aiPopupCardBorderRadius","aiPopupCardPaddingX","aiPopupCardPaddingY","aiPopupCardShadowColor","aiPopupCardShadowOpacity","aiPopupCardShadowBlur","aiPopupCardShadowSpread","aiPopupCardShadowOffsetX","aiPopupCardShadowOffsetY","aiPopupTextShadowColor","aiPopupTextShadowOpacity","aiPopupTextShadowBlur","aiPopupTextShadowSpread","aiPopupTextShadowOffsetX","aiPopupTextShadowOffsetY","aiPopupCloseButtonFontSize","aiPopupCloseButtonBorderRadius","aiPopupCloseButtonPaddingX","aiPopupCloseButtonPaddingY","aiPopupCloseButtonOffsetX","aiPopupCloseButtonOffsetY","aiPopupCloseButtonBackgroundColor","aiPopupCloseButtonBackgroundOpacity","aiPopupCloseButtonTextColor","aiPopupCloseButtonTextOpacity","aiPopupCloseButtonBorderColor","aiPopupCloseButtonBorderOpacity","aiPopupCloseButtonHoverBackgroundColor","aiPopupCloseButtonHoverBackgroundOpacity","aiPopupCloseButtonHoverTextColor","aiPopupCloseButtonHoverTextOpacity"];
    for (var i = 0; i < fields.length; i++) {
      document.addEventListener("input", function(e) { if (e.target && fields.indexOf(e.target.id) !== -1) applyAiPreview(); });
      document.addEventListener("change", function(e) { if (e.target && fields.indexOf(e.target.id) !== -1) applyAiPreview(); });
    }
    document.addEventListener("mouseenter", function(e) {
      if (e.target && e.target.id === "aiPreviewCloseBtn") {
        e.target.style.backgroundColor = e.target.dataset.hbg || "";
        e.target.style.color = e.target.dataset.hfg || "";
      }
    }, true);
    document.addEventListener("mouseleave", function(e) {
      if (e.target && e.target.id === "aiPreviewCloseBtn") applyAiPreview();
    }, true);
  }

  function cfg(key, fallback) {
    if (!currentConfig) return fallback;
    if (key.indexOf("visual.") === 0) {
      var vk = key.split(".")[1];
      return (currentConfig.visualIntervention && currentConfig.visualIntervention[vk] != null) ? currentConfig.visualIntervention[vk] : fallback;
    }
    if (key.indexOf("wallpaper.") === 0) {
      var wk = key.split(".")[1];
      return (currentConfig.wallpaper && currentConfig.wallpaper[wk] != null) ? currentConfig.wallpaper[wk] : fallback;
    }
    if (key.indexOf("desktopCharacter.") === 0) {
      var dk = key.split(".")[1];
      // 优先检查新的 wallpaper 子模块配置，再回退到旧独立配置
      if (currentConfig.wallpaper) {
        var charMap = { enabled: 'characterEnabled', folderPath: 'characterFolderPath', mode: 'characterMode', layerMode: 'characterLayerMode', intervalMinutes: 'intervalMinutes' };
        var wk = charMap[dk];
        if (wk && currentConfig.wallpaper[wk] != null) return currentConfig.wallpaper[wk];
      }
      return (currentConfig.desktopCharacter && currentConfig.desktopCharacter[dk] != null) ? currentConfig.desktopCharacter[dk] : fallback;
    }
    if (key.indexOf("onlineMedia.") === 0) {
      var ok = key.split(".")[1];
      return (currentConfig.onlineMedia && currentConfig.onlineMedia[ok] != null) ? currentConfig.onlineMedia[ok] : fallback;
    }
    if (key.indexOf("processRules.") === 0) {
      var pk = key.split(".")[1];
      return (currentConfig.processRules && currentConfig.processRules[pk] != null) ? currentConfig.processRules[pk] : fallback;
    }
    if (key.indexOf("ai.") === 0) {
      var ak = key.split(".")[1];
      var ai = currentConfig.ai || {};
      return (ai[ak] != null) ? ai[ak] : fallback;
    }
    if (key.indexOf("pollution.") === 0) {
      var pok = key.split(".")[1];
      var pol = currentConfig.pollution || {};
      return (pol[pok] != null) ? pol[pok] : fallback;
    }
    return (currentConfig[key] != null) ? currentConfig[key] : fallback;
  }

  // === 媒体弹窗 ===
  function renderPopupDetail() {
    var html = "";
    html += panel("调度参数",
      '<p class="desc-text">控制弹窗的触发频率、数量限制和播放行为。</p>' +
      '<div class="field-row cols-2">' +
      clockField("弹出间隔", "interval", [cfg("intervalHours",0), cfg("intervalMinutes",0), cfg("intervalSeconds",0)]) +
      clockField("随机波动", "jitter", [cfg("jitterHours",0), cfg("jitterMinutes",0), cfg("jitterSeconds",0)]) +
      '</div>' +
      '<div class="field-row cols-4">' +
      numField("每次弹窗数量", "burstCount", cfg("burstCount", 1), 1, 20) +
      numField("最小弹窗数", "minWindows", cfg("minWindows", 0), 0, 500) +
      numField("最大窗口数", "maxWindows", cfg("maxWindows", 50), 1, 500) +
      numField("最大视频数", "maxVideoWindows", cfg("maxVideoWindows", 5), -1, 500) +
      '</div>' +
      selectField("播放顺序", "order", cfg("order", "random"), [["random", "随机"], ["name", "按文件名"]]) +
      switchRow("无限窗口", "unlimitedWindows", cfg("unlimitedWindows")) +
      '<p class="warning-text" id="unlimitedWarning" style="display:none">无限窗口可能迅速耗尽内存或显卡资源，严重时会导致电脑卡死。</p>'
    );

    html += panel("弹窗效果",
      '<div class="field-row cols-2">' +
      clockField("自然消失时间", "popupLifetime", [cfg("popupLifetimeHours",0), cfg("popupLifetimeMinutes",0), cfg("popupLifetimeSeconds",0)]) +
      clockField("消失时间波动", "popupLifetimeJitter", [cfg("popupLifetimeJitterHours",0), cfg("popupLifetimeJitterMinutes",0), cfg("popupLifetimeJitterSeconds",0)]) +
      '</div>' +
      '<p class="desc-text">设为 0:0:0 时不会自动消失；大于 0 时，图片和 AI 文本弹窗会缓慢淡出并关闭。</p>' +
      numField("弹窗透明度 (%)", "popupOpacity", cfg("popupOpacity", 100), 10, 100) +
      '<div class="field-row cols-2">' +
      switchRow("递归扫描子文件夹", "recursive", cfg("recursive")) +
      switchRow("窗口逐渐增多", "gradual", cfg("gradual")) +
      switchRow("置顶显示", "alwaysOnTop", cfg("alwaysOnTop")) +
      switchRow("全屏覆盖", "fullscreen", cfg("fullscreen")) +
      switchRow("视频静音", "muted", cfg("muted")) +
      switchRow("视频完成关闭", "closeVideoOnEnded", cfg("closeVideoOnEnded")) +
      switchRow("混乱视频", "chaosVideo", cfg("chaosVideo")) +
      switchRow("点击关闭", "clickToClose", cfg("clickToClose")) +
      switchRow("关闭按钮随机位", "randomCloseButton", cfg("randomCloseButton")) +
      switchRow("禁止手动关闭", "disableManualClose", cfg("disableManualClose")) +
      switchRow("开发者模式", "developerMode", cfg("developerMode")) +
      '</div>'
    );

    html += panel("窗口尺寸", '<p class="desc-text">为图片和视频分别设置弹窗大小，或使用统一尺寸。</p>' +
      switchRow("分离图片/视频尺寸", "separateMediaSizeSettings", cfg("separateMediaSizeSettings")) +
      // Shared panel
      '<div id="sharedSizePanel"><div class="field-row cols-4">' +
      numField("统一宽度", "sharedBaseWidth", cfg("imageBaseWidth", 400), 100, 2000) +
      numField("统一高度", "sharedBaseHeight", cfg("imageBaseHeight", 300), 100, 2000) +
      numField("尺寸波动", "sharedSizeJitter", cfg("imageSizeJitter", 0), 0, 1000) +
      '</div></div>' +
      // Separate panels
      '<div id="separateSizePanels" hidden><h4 style="font-size:11px;color:var(--text);margin:8px 0 4px">图片弹窗</h4><div class="field-row cols-4">' +
      numField("图片宽度", "imageBaseWidth", cfg("imageBaseWidth", 400), 100, 2000) +
      numField("图片高度", "imageBaseHeight", cfg("imageBaseHeight", 300), 100, 2000) +
      numField("尺寸波动", "imageSizeJitter", cfg("imageSizeJitter", 0), 0, 1000) +
      '</div><h4 style="font-size:11px;color:var(--text);margin:8px 0 4px">视频弹窗</h4><div class="field-row cols-4">' +
      numField("视频宽度", "videoBaseWidth", cfg("videoBaseWidth", 640), 100, 2000) +
      numField("视频高度", "videoBaseHeight", cfg("videoBaseHeight", 480), 100, 2000) +
      numField("尺寸波动", "videoSizeJitter", cfg("videoSizeJitter", 0), 0, 1000) +
      '</div></div>'
    );

    html += panel("关闭按钮样式",
      '<div class="field-row cols-3">' +
      numField("文字大小", "closeButtonFontSize", cfg("closeButtonFontSize", 13), 8, 48) +
      numField("圆角", "closeButtonBorderRadius", cfg("closeButtonBorderRadius", 6), 0, 32) +
      numField("左右边距", "closeButtonPaddingX", cfg("closeButtonPaddingX", 12), 8, 48) +
      numField("上下边距", "closeButtonPaddingY", cfg("closeButtonPaddingY", 6), 4, 24) +
      numField("X偏移", "closeButtonOffsetX", cfg("closeButtonOffsetX", 6), 0, 120) +
      numField("Y偏移", "closeButtonOffsetY", cfg("closeButtonOffsetY", 6), 0, 120) +
      '</div>'
    );

    return html;
  }

  // === 壁纸（含智能角色子模块） ===
  function renderWallpaperDetail() {
    return panel("自动换壁纸", '<p class="desc-text">按设定间隔自动更换桌面壁纸。同时开启"普通"和"智能角色"时，每次随机选择一种模式。</p>' +
      switchRow("开启普通壁纸", "wallpaperEnabled", cfg("wallpaper.enabled")) +
      '<div class="field-row cols-3">' +
      numField("更换间隔(分钟)", "wallpaperIntervalMinutes", cfg("wallpaper.intervalMinutes", 60), 1, 10080) +
      numField("最低分辨率", "wallpaperMinResolution", cfg("wallpaper.minResolution", 0), 0, 8000) +
      numField("宽高比偏差", "wallpaperMaxRatioDeviation", cfg("wallpaper.maxRatioDeviation", 0.2), 0, 1, 0.01) +
      '</div>' +
      '<hr style="border-color:#2a2e36;margin:12px 0">' +
      '<h3 style="margin:0 0 8px;color:#8892a4">🎭 智能角色（子模块）</h3>' +
      switchRow("开启角色壁纸", "desktopCharacterEnabled", cfg("wallpaper.characterEnabled")) +
      '<label class="field"><span>角色文件夹</span><div style="display:flex;gap:6px"><input id="desktopCharacterFolderPath" readonly value="' + (cfg("wallpaper.characterFolderPath") || "") + '"><button id="chooseDesktopCharacterFolderButton" class="btn">选择</button></div></label>' +
      '<div class="field-row cols-3">' +
      selectField("融合模式", "desktopCharacterMode", cfg("wallpaper.characterMode", "diffuse"), [["diffuse", "弥散光"], ["directional", "定向渐变"], ["mask", "UI 掩膜"]]) +
      selectField("桌面层级", "desktopCharacterLayerMode", cfg("wallpaper.characterLayerMode", "system-wallpaper"), [
        ["system-wallpaper", "系统壁纸"],
        ["progman-behind-icons", "桌面背后"],
        ["progman-front", "桌面前景"],
        ["top-level-behind-icons", "顶层(图标后)"],
        ["top-level-bottom", "顶层(底部)"],
        ["top-level-front", "顶层(前)"]
      ]) +
      switchRow("失焦自动换回", "wallpaperFocusRestoreEnabled", cfg("wallpaper.focusRestoreEnabled")) +
      '</div>' +
      '<p class="desc-text" style="margin-top:4px;color:#6b7385">失焦换回：切换到其他窗口时记录壁纸，返回桌面时恢复并换新。普通壁纸与角色壁纸均适用。</p>' +
      '<div class="actions-row"><button id="testWallpaperButton" class="btn">测试普通壁纸</button><button id="refreshDesktopCharacterButton" class="btn">刷新角色壁纸</button></div>'
    );
  }
  
  // === 智能角色（已合并到壁纸面板，此处作为快捷入口） ===
  // === AI 文本弹窗 ===
  function renderAiPopupDetail() {
    var ai = (currentConfig && currentConfig.ai) ? currentConfig.ai : {};
    var pa = ai.popupAppearance || {};
    var nn = function(v, fb) { var n = Number(v); return Number.isFinite(n) ? n : fb; };
    return (
      panel("基础配置", '<p class="desc-text">配置 AI 模型和基本行为。</p>' +
        switchRow("让 AI 参与弹窗调度", "aiPopupScheduleEnabled", cfg("ai.popupScheduleEnabled")) +
        switchRow("单弹窗模式", "aiSinglePopupMode", cfg("ai.singlePopupMode", true)) +
        switchRow("即时回复", "aiImmediateReplyEnabled", cfg("ai.immediateReplyEnabled", true)) +
        '<div class="field-row cols-2">' +
        '<label class="field"><span>AI 提供商</span><select id="aiProvider"><option value="deepseek"' + (ai.provider === "deepseek" ? " selected" : "") + '>DeepSeek</option></select></label>' +
        '<label class="field"><span>模型</span><input id="aiModel" value="' + (ai.model || "deepseek-chat") + '"></label>' +
        '</div>' +
        '<label class="field"><span>API Key</span><input id="aiApiKey" type="password" value="' + (ai.apiKey || "") + '"></label>' +
        '<div class="actions-row"><button id="aiShowPopupButton" class="btn primary">测试 AI 弹窗</button><button id="aiTestInteractionButton" class="btn">测试主动互动</button></div>'
      ) +
      panel("弹窗外观 · 窗口", '<div class="field-row cols-3">' +
        numField("窗口宽度", "aiPopupWidth", nn(pa.popupWidth, 420), 200, 2000) +
        numField("窗口高度", "aiPopupHeight", nn(pa.popupHeight, 320), 150, 2000) +
        numField("预览缩放", "aiPopupPreviewScale", 1, 0.2, 2, 0.1) +
        colorField("背景色", "aiPopupBodyBackgroundColor", pa.bodyBackgroundColor || "#050505") +
        numField("文本字号", "aiPopupTextFontSize", nn(pa.textFontSize, 16), 10, 48) +
        numField("行高", "aiPopupTextLineHeight", nn(pa.textLineHeight, 1.5), 0.5, 3, 0.1) +
        selectField("对齐", "aiPopupTextAlign", pa.textAlign || "left", [["left","左对齐"],["center","居中"],["right","右对齐"]]) +
        colorField("文字色", "aiPopupTextColor", pa.textColor || "#f4f7fb") +
        '</div>'
      ) +
      panel("弹窗外观 · 卡片", '<div class="field-row cols-3">' +
        colorField("卡背景", "aiPopupCardBackgroundColor", pa.cardBackgroundColor || "#050505") +
        colorField("卡边框", "aiPopupCardBorderColor", pa.cardBorderColor || "#1f2b33") +
        numField("边框宽", "aiPopupCardBorderWidth", nn(pa.cardBorderWidth, 0), 0, 20) +
        numField("圆角", "aiPopupCardBorderRadius", nn(pa.cardBorderRadius, 8), 0, 40) +
        numField("内边X", "aiPopupCardPaddingX", nn(pa.cardPaddingX, 2), 0, 80) +
        numField("内边Y", "aiPopupCardPaddingY", nn(pa.cardPaddingY, 0), 0, 80) +
        '</div>'
      ) +
      panel("弹窗外观 · 阴影", '<div class="field-row cols-3">' +
        colorField("投影色", "aiPopupCardShadowColor", pa.cardShadowColor || "#000000") +
        numField("投影模糊", "aiPopupCardShadowBlur", nn(pa.cardShadowBlur, 24), 0, 100) +
        numField("投影扩展", "aiPopupCardShadowSpread", nn(pa.cardShadowSpread, 0), 0, 50) +
        numField("投影X", "aiPopupCardShadowOffsetX", nn(pa.cardShadowOffsetX, 0), -50, 50) +
        numField("投影Y", "aiPopupCardShadowOffsetY", nn(pa.cardShadowOffsetY, 8), -50, 50) +
        colorField("字阴影色", "aiPopupTextShadowColor", pa.textShadowColor || "#000000") +
        numField("字阴影模糊", "aiPopupTextShadowBlur", nn(pa.textShadowBlur, 10), 0, 50) +
        numField("字阴影扩展", "aiPopupTextShadowSpread", nn(pa.textShadowSpread, 0), 0, 20) +
        numField("字阴影X", "aiPopupTextShadowOffsetX", nn(pa.textShadowOffsetX, 0), -20, 20) +
        numField("字阴影Y", "aiPopupTextShadowOffsetY", nn(pa.textShadowOffsetY, 2), -20, 20) +
        '</div>'
      ) +
      panel("弹窗外观 · 关闭按钮", '<div class="field-row cols-3">' +
        numField("字号", "aiPopupCloseButtonFontSize", nn(pa.closeButtonFontSize, 13), 8, 36) +
        numField("圆角", "aiPopupCloseButtonBorderRadius", nn(pa.closeButtonBorderRadius, 6), 0, 20) +
        numField("内边X", "aiPopupCloseButtonPaddingX", nn(pa.closeButtonPaddingX, 12), 4, 40) +
        numField("内边Y", "aiPopupCloseButtonPaddingY", nn(pa.closeButtonPaddingY, 6), 2, 20) +
        numField("偏移X", "aiPopupCloseButtonOffsetX", nn(pa.closeButtonOffsetX, 6), 0, 80) +
        numField("偏移Y", "aiPopupCloseButtonOffsetY", nn(pa.closeButtonOffsetY, 6), 0, 80) +
        colorField("背景色", "aiPopupCloseButtonBackgroundColor", pa.closeButtonBackgroundColor || "#000000") +
        colorField("文字色", "aiPopupCloseButtonTextColor", pa.closeButtonTextColor || "#ffffff") +
        colorField("边框色", "aiPopupCloseButtonBorderColor", pa.closeButtonBorderColor || "#ffffff") +
        colorField("悬浮背景", "aiPopupCloseButtonHoverBackgroundColor", pa.closeButtonHoverBackgroundColor || "#2f3b45") +
        colorField("悬浮文字", "aiPopupCloseButtonHoverTextColor", pa.closeButtonHoverTextColor || "#ffffff") +
        '</div>'
      ) +
      panel("主动互动", '<p class="desc-text">根据预设上下文定时生成主动互动内容。</p>' +
        switchRow("开启主动互动", "aiInteractionEnabled", cfg("ai.interactionEnabled")) +
        clockField("互动间隔", "aiInteractionInterval", [cfg("ai.interactionIntervalHours", 0), cfg("ai.interactionIntervalMinutes", 10), cfg("ai.interactionIntervalSeconds", 0)]) +
        selectField("语气", "aiInteractionTone", cfg("ai.interactionTone", "teasing"), [["teasing", "调戏"], ["gentle", "温柔"], ["strict", "严厉"], ["playful", "玩耍"]]) +
        switchRow("包含前台应用信息", "aiInteractionIncludeForegroundApp", cfg("ai.interactionIncludeForegroundApp"))
      ) +
      // Live preview panel
      '<section class="detail-panel"><h3>实时预览</h3><div style="overflow:auto;border:1px solid var(--line);border-radius:2px;background:var(--bg);padding:10px;min-height:200px">' +
      '<div id="aiPreview" style="position:relative;overflow:hidden;width:420px;height:320px;background:#050505;transform:scale(1);transform-origin:top left">' +
      '<div id="aiPreviewText" style="color:#f4f7fb;font-size:16px;line-height:1.5;text-align:left;padding:0 2px;margin:20px;border:0 solid #1f2b33;border-radius:8px;box-shadow:0 8px 24px 0 rgba(0,0,0,0.45);text-shadow:0 2px 10px rgba(0,0,0,0.55)">预览文本 — Preview Text</div>' +
      '<button id="aiPreviewCloseBtn" style="position:absolute;left:6px;top:6px;font-size:13px;border-radius:6px;padding:6px 12px;background:#000;color:#fff;border:1px solid #fff;cursor:default">✕</button>' +
      '</div></div></section>'
    );
  }

  // === 幽灵底片 ===
  function renderGhostDetail() {
    return panel("幽灵底片", '<p class="desc-text">半透明图片持续覆盖屏幕，按设定间隔自动切换。</p>' +
      switchRow("开启幽灵底片", "visualGhostEnabled", cfg("visual.ghostEnabled")) +
      '<div class="field-row cols-2">' +
      numField("透明度 (%)", "visualGhostOpacity", cfg("visual.ghostOpacity", 5), 1, 100) +
      clockField("切换间隔", "visualGhostInterval", [cfg("visual.ghostIntervalMinutes", 5), cfg("visual.ghostIntervalSeconds", 0)]) +
      '</div>'
    );
  }

  // === X光模式 ===
  function renderXrayDetail() {
    return panel("X 光模式", '<p class="desc-text">鼠标周围圆形区域显示完整图片，其余部分被遮罩。</p>' +
      switchRow("开启 X 光", "visualXrayEnabled", cfg("visual.xrayEnabled")) +
      '<div class="field-row cols-2">' +
      numField("半径 (px)", "visualXrayRadius", cfg("visual.xrayRadius", 200), 50, 1000) +
      numField("遮罩透明度 (%)", "visualXrayOpacity", cfg("visual.xrayOpacity", 60), 0, 100) +
      '</div>'
    );
  }

  // === 媒体瀑布 ===
  function renderWaterfallDetail() {
    return panel("媒体瀑布", '<p class="desc-text">图片从屏幕顶部持续下落，可调速度、数量、大小和透明度。</p>' +
      switchRow("开启瀑布", "visualWaterfallEnabled", cfg("visual.waterfallEnabled")) +
      '<div class="field-row cols-4">' +
      numField("速度", "visualWaterfallSpeed", cfg("visual.waterfallSpeed", 50), 1, 100) +
      numField("数量", "visualWaterfallCount", cfg("visual.waterfallCount", 15), 1, 50) +
      numField("大小 (px)", "visualWaterfallSize", cfg("visual.waterfallSize", 150), 50, 500) +
      numField("透明度 (%)", "visualWaterfallOpacity", cfg("visual.waterfallOpacity", 60), 1, 100) +
      '</div>'
    );
  }

  // === 潜意识闪烁 ===
  function renderFlashDetail() {
    return panel("潜意识闪烁", '<p class="desc-text">⚠️ 癫痫警告：开启此功能会以不可预知的频率瞬间全屏闪烁图像，光敏性癫痫患者请勿开启！</p>' +
      switchRow("开启闪烁", "visualFlashEnabled", cfg("visual.flashEnabled")) +
      '<div class="field-row cols-2">' +
      clockField("触发间隔", "visualFlashInterval", [cfg("visual.flashIntervalHours", 0), cfg("visual.flashIntervalMinutes", 0), cfg("visual.flashIntervalSeconds", 0)]) +
      clockField("随机波动", "visualFlashJitter", [cfg("visual.flashJitterHours", 0), cfg("visual.flashJitterMinutes", 0), cfg("visual.flashJitterSeconds", 0)]) +
      '</div>', "danger-panel"
    );
  }

  // === 输入干预 ===
  function renderPollutionDetail() {
    return panel("输入干预", '<p class="desc-text">剪贴板污染 + 输入框注入。所有细分能力可单独开关。</p>' +
      switchRow("启用全局干预", "pollutionEnabled", cfg("pollutionEnabled")) +
      switchRow("剪贴板污染", "pollutionClipboardEnabled", cfg("pollution.clipboardEnabled")) +
      switchRow("输入框注入", "pollutionInputEnabled", cfg("pollution.inputEnabled")) +
      '<div class="field-row cols-3">' +
      switchRow("词组模式", "pollutionModePhrase", cfg("pollution.modePhrase")) +
      switchRow("语料库模式", "pollutionModeCorpus", cfg("pollution.modeCorpus")) +
      switchRow("AI 模式", "pollutionModeAi", cfg("pollution.modeAi")) +
      '</div>' +
      '<label class="field"><span>词组池（逗号分隔）</span><textarea id="pollutionPhrases" rows="2">' + (cfg("pollution.phrases") || "") + '</textarea></label>' +
      '<label class="field"><span>语料库路径</span><div style="display:flex;gap:6px"><input id="pollutionCorpusPath" value="' + (cfg("pollution.corpusPath") || "") + '"><button id="pollutionChooseCorpusBtn" class="btn">...</button></div></label>' +
      '<div class="field-row cols-2">' +
      numField("语料最小字数", "pollutionCorpusMinLength", cfg("pollution.corpusMinLength", 10), 1, 1000) +
      numField("剪贴板概率 (%)", "pollutionClipboardChance", cfg("pollution.clipboardChance", 20), 1, 100) +
      numField("输入间隔最小值(分)", "pollutionInputIntervalMin", cfg("pollution.inputIntervalMin", 10), 1, 10080) +
      numField("输入间隔最大值(分)", "pollutionInputIntervalMax", cfg("pollution.inputIntervalMax", 30), 1, 10080) +
      '</div>'
    );
  }

  // === 媒体文件夹（含在线媒体源 & 网站库） ===
  function renderFoldersDetail() {
    return panel("本地文件夹", '<p class="desc-text">管理本地图片和视频文件夹。</p>' +
      '<div id="folderList" class="detail-panel" style="min-height:60px;border:1px dashed var(--line);padding:12px;color:var(--muted);">加载中...</div>' +
      '<div class="actions-row"><button id="addFoldersButton" class="btn primary">添加文件夹</button><button id="scanButton" class="btn">扫描媒体</button></div>'
    ) +
    panel("在线媒体源", switchRow("启用网络媒体", "onlineMediaEnabled", cfg("onlineMedia.enabled")) +
      '<label class="field"><span>媒体源 URL</span><input id="onlineMediaSourceUrl" value="' + (cfg("onlineMedia.sourceUrl") || "") + '" placeholder="https://raw.githubusercontent.com/..."></label>' +
      '<div class="actions-row"><button id="testOnlineMediaButton" class="btn">测试弹出一条网络媒体</button></div>'
    ) +
    panel("网站库", switchRow("网站参与弹窗调度", "websiteLibraryEnabled", cfg("websiteLibrary.enabled")) +
      '<label class="field"><span>批量编辑链接</span><textarea id="websiteLibraryText" rows="8">' + (cfg("websiteLibrary.text") || getWebsiteTextFromEntries()) + '</textarea></label>' +
      '<p class="desc-text">每行: 名称 | 链接。! 禁用，# 注释。</p>' +
      '<div class="actions-row"><button id="websiteShowPopupButton" class="btn">测试网站弹窗</button><button id="websiteSaveButton" class="btn primary">保存网站库</button></div>' +
      '<input id="websiteLibrarySearch" type="text" placeholder="搜索链接..." style="margin-top:8px;width:100%"><div id="websiteLibraryList"></div>'
    );
  }

  // === 进程规则 ===
  function renderProcessRulesDetail() {
    return panel("进程规则", '<p class="desc-text">根据运行中软件的名单，自动启停弹窗调度。每行一个进程名。</p>' +
      switchRow("启用进程规则", "processRulesEnabled", cfg("processRules.enabled")) +
      '<div class="field-row cols-2">' +
      '<label class="field"><span>黑名单</span><textarea id="processRulesBlacklist" rows="4">' + (cfg("processRules.blacklist") ? cfg("processRules.blacklist").join("\n") : "") + '</textarea><button id="chooseBlacklistProcessButton" class="btn" style="margin-top:4px">选择运行中进程</button></label>' +
      '<label class="field"><span>白名单</span><textarea id="processRulesWhitelist" rows="4">' + (cfg("processRules.whitelist") ? cfg("processRules.whitelist").join("\n") : "") + '</textarea><button id="chooseWhitelistProcessButton" class="btn" style="margin-top:4px">选择运行中进程</button></label>' +
      '</div>' +
      '<div class="field-row cols-3">' +
      switchRow("命中白名单自动启动", "processRulesAutoStartOnWhitelist", cfg("processRules.autoStartOnWhitelist")) +
      switchRow("命中黑名单自动停止", "processRulesStopOnBlacklist", cfg("processRules.stopOnBlacklist")) +
      switchRow("退出白名单自动停止", "processRulesStopOnWhitelistExit", cfg("processRules.stopOnWhitelistExit")) +
      '</div>' +
      numField("检测间隔(秒)", "processRulesCheckIntervalSeconds", cfg("processRules.checkIntervalSeconds", 5), 2, 300) +
      '<p id="processRulesStatus" class="desc-text"></p>'
    );
  }

  // === 联机共享 ===
  function renderPeerShareDetail() {
    return panel("联机共享", '<p class="desc-text">与好友创建/加入同一个房间码，直接通过 WebRTC 互传图片和视频。接收到的内容只保存在内存中用于预览，关闭预览即释放，不写入磁盘、不经过任何云端服务器。</p>' +
      switchRow("启用联机共享", "peerShareEnabled", cfg("peerShare.enabled")) +
      '<label class="field"><span>显示昵称</span><input id="peerDisplayName" value="' + (cfg("peerShare.displayName") || "") + '" placeholder="给好友看到的名字（可选）"></label>' +
      '<div class="field-row cols-2">' +
      numField("单文件大小上限(MB)", "peerMaxFileSizeMb", cfg("peerShare.maxFileSizeMb", 200), 1, 2048) +
      numField("同时传输数上限", "peerMaxConcurrentTransfers", cfg("peerShare.maxConcurrentTransfers", 2), 1, 10) +
      '</div>' +
      switchRow("同房间自动接收（不再逐个确认）", "peerAutoAcceptFromRoom", cfg("peerShare.autoAcceptFromRoom")) +
      '<div class="actions-row" style="margin-top:8px"><button id="peerSelfTestBtn" class="btn">测试联机连通性</button></div>' +
      '<p id="peerSelfTestResult" class="desc-text"></p>'
    ) +
    panel("房间", '<p class="desc-text">默认所有开启联机共享的用户会自动加入同一个公共大厅，方便直接互相发现和交流；如果想小范围交流，关闭"使用公共大厅"并输入/生成自己的房间码即可。</p>' +
      switchRow("使用公共大厅（推荐）", "peerUseLobby", cfg("peerShare.useLobby", true) !== false) +
      '<div class="field-row cols-2" id="peerCustomRoomRow">' +
      '<label class="field"><span>自定义房间码</span><input id="peerRoomCodeInput" value="' + (cfg("peerShare.lastRoomCode") || "") + '" placeholder="输入或生成一个房间码"></label>' +
      '<label class="field"><span>&nbsp;</span><div class="actions-row"><button id="peerGenerateRoomCodeBtn" class="btn">随机生成</button></div></label>' +
      '</div>' +
      '<div class="actions-row"><button id="peerJoinRoomBtn" class="btn primary">加入房间</button><button id="peerLeaveRoomBtn" class="btn">离开房间</button></div>' +
      '<p id="peerRoomStatus" class="desc-text">未连接</p>' +
      '<div id="peerList" style="margin-top:8px"></div>'
    ) +
    panel("接收保存", '<p class="desc-text">收到的图片/视频默认只在内存中预览；也可以保存到本地文件夹，或开启自动保存到该文件夹。</p>' +
      '<label class="field"><span>接收文件夹</span><input id="peerReceiveFolderInput" readonly value="' + (cfg("peerShare.receiveFolder") || "（未设置，默认为下载目录\\Gooner-Received）") + '"></label>' +
      '<div class="actions-row"><button id="peerChooseReceiveFolderBtn" class="btn">选择文件夹</button></div>' +
      switchRow("接收后自动保存到该文件夹", "peerAutoSaveReceived", cfg("peerShare.autoSaveReceived"))
    ) +
    panel("发送文件", '<p class="desc-text">选择一张图片或一段视频发送给上方"房间"里勾选的对端；不勾选默认发给所有已连接的人。</p>' +
      '<div class="actions-row"><button id="peerPickFileBtn" class="btn">选择文件</button></div>' +
      '<div id="peerSendStatus" class="desc-text"></div>'
    ) +
    panel("接收记录", '<div id="peerIncomingList" style="min-height:40px;color:var(--muted);font-size:13px">暂无接收记录</div>');
  }


  function renderHardcoreDetail() {
    return panel("强控模式", '<p class="desc-text">开启后主窗口和任务栏图标完全隐藏。请先配置全局快捷键确保可恢复。</p>' +
      switchRow("启用强控模式", "hardcoreModeToggle", cfg("hardcoreMode")), "danger-panel"
    );
  }

  // === 开机自启 ===
  function renderAutostartDetail() {
    return panel("开机自启", '<p class="desc-text">Windows 登录后自动运行应用。</p>' +
      switchRow("开机自启", "autoStartOnBoot", cfg("autoStartOnBoot")) +
      switchRow("启动后自动开始调度", "autoRunScheduler", cfg("autoRunScheduler"))
    );
  }

  // === 静默模式 ===
  function renderSilentDetail() {
    return panel("静默模式", '<p class="desc-text">启动后自动收起主窗口。通知区图标和快捷键仍可用于控制。</p>' +
      switchRow("静默模式", "silentMode", cfg("silentMode"))
    );
  }

  // === 配置档案 ===
  function renderProfilesDetail() {
    return panel("配置档案", '<p class="desc-text">管理多套配置档案，一键切换不同设定组合。</p>' +
      '<div class="actions-row"><button id="btnNewProfile" class="btn primary">新建档案</button></div>' +
      '<div id="profileGrid" class="profile-grid" style="margin-top:12px">加载中...</div>'
    );
  }

  // === 全局设置（齿轮按钮，含主题+语言+快捷键） ===
  function renderGlobalSettingsDetail() {
    var gLang = getGlobalLanguage();
    return panel("外观与语言", '<p class="desc-text">UI 主题跟随配置档案，界面语言全局生效。</p>' +
      '<label class="field"><span>UI 主题</span><select id="uiThemeSelector">' +
      '<option value="default"' + (cfg("uiTheme", "default") === "default" ? " selected" : "") + '>默认暗色 (工业矩阵)</option>' +
      '<option value="light"' + (cfg("uiTheme") === "light" ? " selected" : "") + '>极简白噪音</option>' +
      '<option value="matrix"' + (cfg("uiTheme") === "matrix" ? " selected" : "") + '>黑客帝国</option>' +
      '<option value="cyberpunk"' + (cfg("uiTheme") === "cyberpunk" ? " selected" : "") + '>赛博朋克</option>' +
      '<option value="bnwo"' + (cfg("uiTheme") === "bnwo" ? " selected" : "") + '>BNWO</option>' +
      '<option value="space"' + (cfg("uiTheme") === "space" ? " selected" : "") + '>深邃星空</option>' +
      '</select></label>' +
      '<label class="field"><span>界面语言</span><select id="language">' +
      '<option value="system"' + (gLang === "system" ? " selected" : "") + '>跟随系统</option>' +
      '<option value="zh-CN"' + (gLang === "zh-CN" ? " selected" : "") + '>简体中文</option>' +
      '<option value="en-US"' + (gLang === "en-US" ? " selected" : "") + '>English</option>' +
      '</select></label>'
    ) +
    panel("快捷键", '<p class="desc-text">点击输入框后直接按组合键录制。Backspace/Delete 清空。</p>' +
      '<div class="field-row cols-2">' +
      '<label class="field"><span>启动</span><input id="startShortcut" class="shortcut-input" readonly value="' + (cfg("startShortcut") || "") + '"><div id="startShortcutStatus" class="shortcut-status"></div></label>' +
      '<label class="field"><span>暂停</span><input id="pauseShortcut" class="shortcut-input" readonly value="' + (cfg("pauseShortcut") || "") + '"><div id="pauseShortcutStatus" class="shortcut-status"></div></label>' +
      '<label class="field"><span>停止</span><input id="stopShortcut" class="shortcut-input" readonly value="' + (cfg("stopShortcut") || "") + '"><div id="stopShortcutStatus" class="shortcut-status"></div></label>' +
      '<label class="field"><span>关闭全部</span><input id="closeAllShortcut" class="shortcut-input" readonly value="' + (cfg("closeAllShortcut") || "") + '"><div id="closeAllShortcutStatus" class="shortcut-status"></div></label>' +
      '</div>'
    );
  }

  // === 生涯记录 ===
  function renderStatsDetail() {
    return panel(t("stats.panel.title"),
      '<div class="stats-grid"><div class="stat-card"><div class="stat-label">' + t("stats.totalPlayTime") + '</div><div class="stat-value" id="statPlayTime">-</div></div>' +
      '<div class="stat-card"><div class="stat-label">' + t("stats.totalUptime") + '</div><div class="stat-value" id="statUptime">-</div></div>' +
      '<div class="stat-card"><div class="stat-label">' + t("stats.longestSession") + '</div><div class="stat-value" id="statLongestSession">-</div></div>' +
      '<div class="stat-card"><div class="stat-label">' + t("stats.dailyAverage") + '</div><div class="stat-value" id="statDailyAverage">-</div></div></div>' +
      '<div class="stats-grid stats-grid-secondary" style="margin-top:12px">' +
      '<div class="stat-card"><div class="stat-label">' + t("stats.popups") + '</div><div class="stat-sub-values">' +
        '<span>' + t("stats.popup.image") + ': <span id="statPopupImage" class="stat-accent">0</span></span>' +
        '<span>' + t("stats.popup.video") + ': <span id="statPopupVideo" class="stat-accent">0</span></span>' +
        '<span>' + t("stats.popup.website") + ': <span id="statPopupWebsite" class="stat-accent">0</span></span>' +
        '<span>' + t("stats.popup.ai") + ': <span id="statPopupAi" class="stat-accent">0</span></span>' +
      '</div></div>' +
      '<div class="stat-card"><div class="stat-label">' + t("stats.closes") + '</div><div class="stat-sub-values">' +
        '<span>' + t("stats.close.manual") + ': <span id="statCloseManual" class="stat-accent">0</span></span>' +
        '<span>' + t("stats.close.auto") + ': <span id="statCloseAuto" class="stat-accent">0</span></span>' +
      '</div></div></div>'
    ) +
    panel("日历热力图",
      '<div class="calendar-header"><button id="prevMonthBtn" class="calendar-nav-btn">&lt;</button>' +
      '<h3 id="calendarMonthLabel" class="calendar-title"></h3><button id="nextMonthBtn" class="calendar-nav-btn">&gt;</button></div>' +
      '<div class="calendar-days-header"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>' +
      '<div class="calendar-wrapper"><div id="calendarGrid" class="calendar-grid"></div>' +
      '<div id="fullMonthStamp" class="full-month-stamp hidden"><div class="stamp-inner">' + t("stamp.fullMonth") + '</div></div></div>'
    );
  }

  function updateProcessRulesStatus() {
    var el = document.getElementById("processRulesStatus");
    if (!el || !currentConfig || !currentConfig.processRules) return;
    var rules = currentConfig.processRules;
    if (!rules.enabled) { el.textContent = "进程规则未启用"; return; }
    var bl = (rules.blacklist || []).join(", ");
    var wl = (rules.whitelist || []).join(", ");
    var parts = ["进程规则已启用"];
    if (bl) parts.push("黑名单: " + bl);
    if (wl) parts.push("白名单: " + wl);
    el.textContent = parts.join(" · ");
  }

  // ═════════════════════════════════════════════════
  // 联机共享 (peer-share.js 提供底层 SimplePeer/IPC 逻辑，这里只做 UI 绑定)
  // ═════════════════════════════════════════════════

  var peerIncomingRecords = [];
  var peerSelectedTargets = {}; // peerId -> true 已勾选为发送对象，默认全选

  async function leavePeerRoom() {
    if (window.PeerShareUI) {
      await window.PeerShareUI.leaveRoom();
    }
    peerSelectedTargets = {};
    updatePeerRoomStatus();
  }

  function updatePeerRoomStatus() {
    var statusEl = document.getElementById("peerRoomStatus");
    var listEl = document.getElementById("peerList");
    if (!window.PeerShareUI) return;
    var s = window.PeerShareUI.getState();
    if (statusEl) {
      statusEl.textContent = s.active
        ? ("已加入房间 \"" + s.roomCode + "\" · 本机 ID " + s.selfPeerId.slice(0, 8) + " · 已连接 " + s.peers.length + " 个对端")
        : "未连接";
    }
    if (listEl) {
      // 默认全选所有对端；新出现的对端也默认勾选为发送目标，方便在多人房间里指定发给谁。
      s.peers.forEach(function (id) {
        if (!(id in peerSelectedTargets)) peerSelectedTargets[id] = true;
      });
      listEl.innerHTML = s.active && s.peers.length
        ? '<div style="font-size:12px;color:var(--muted);padding:2px 0 4px">发送目标（勾选要发给谁，默认全部）：</div>' +
          s.peers.map(function (id) {
            var checked = peerSelectedTargets[id] !== false ? " checked" : "";
            var nick = s.peerDisplayNames && s.peerDisplayNames[id];
            var label = nick ? (nick + " (" + id.slice(0, 8) + ")") : ("对端 " + id.slice(0, 8));
            return '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:2px 0">' +
              '<input type="checkbox" data-peer-target="' + id + '"' + checked + '> ' + label +
              '</label>';
          }).join("")
        : '<span style="color:var(--muted);font-size:12px">' + (s.active ? "等待对端加入房间..." : "") + '</span>';
      var targetChecks = listEl.querySelectorAll("[data-peer-target]");
      for (var t = 0; t < targetChecks.length; t++) {
        targetChecks[t].addEventListener("change", function () {
          peerSelectedTargets[this.getAttribute("data-peer-target")] = this.checked;
        });
      }
    }
  }

  function renderPeerIncomingList() {
    var el = document.getElementById("peerIncomingList");
    if (!el) return;
    if (!peerIncomingRecords.length) {
      el.innerHTML = "暂无接收记录";
      return;
    }
    el.innerHTML = peerIncomingRecords.map(function (rec, idx) {
      var sizeKb = Math.round(rec.size / 1024);
      if (rec.status === "pending") {
        return '<div class="detail-panel" style="padding:8px;margin-bottom:6px">' +
          '<div>' + rec.fileName + ' · ' + sizeKb + 'KB · 来自 ' + rec.fromPeerId.slice(0, 8) + '</div>' +
          '<div class="actions-row" style="margin-top:4px"><button class="btn primary" data-peer-accept="' + rec.transferId + '">接收</button><button class="btn" data-peer-reject="' + rec.transferId + '">拒绝</button></div>' +
          '</div>';
      }
      if (rec.status === "receiving") {
        var pct = rec.size ? Math.round((rec.receivedSize / rec.size) * 100) : 0;
        return '<div class="detail-panel" style="padding:8px;margin-bottom:6px">' + rec.fileName + ' · 接收中 ' + pct + '%</div>';
      }
      if (rec.status === "done") {
        var isImage = rec.offer && rec.offer.kind === "image";
        var isVideo = rec.offer && rec.offer.kind === "video";
        var preview = isImage
          ? '<img src="' + rec.url + '" style="max-width:100%;max-height:160px;display:block;margin-top:6px;border-radius:4px">'
          : isVideo
            ? '<video src="' + rec.url + '" controls style="max-width:100%;max-height:200px;display:block;margin-top:6px;border-radius:4px"></video>'
            : "";
        var saveInfo = rec.saveResult
          ? (rec.saveResult.ok ? '<div style="color:var(--muted);font-size:12px;margin-top:4px">已保存: ' + rec.saveResult.filePath + '</div>' : '<div style="color:#e66;font-size:12px;margin-top:4px">保存失败: ' + rec.saveResult.detail + '</div>')
          : "";
        return '<div class="detail-panel" style="padding:8px;margin-bottom:6px">' +
          '<div>' + rec.fileName + ' · ' + sizeKb + 'KB · 来自 ' + rec.fromPeerId.slice(0, 8) + '</div>' +
          preview +
          saveInfo +
          '<div class="actions-row" style="margin-top:4px"><button class="btn" data-peer-save="' + idx + '">保存到本地</button><button class="btn" data-peer-close-preview="' + idx + '">关闭预览并释放内存</button></div>' +
          '</div>';
      }
      return "";
    }).join("");

    var acceptBtns = el.querySelectorAll("[data-peer-accept]");
    for (var i = 0; i < acceptBtns.length; i++) {
      acceptBtns[i].addEventListener("click", function () {
        var transferId = this.getAttribute("data-peer-accept");
        var rec = peerIncomingRecords.find(function (r) { return r.transferId === transferId; });
        if (rec) rec.status = "receiving";
        window.PeerShareUI.acceptIncomingTransfer(transferId);
        renderPeerIncomingList();
      });
    }
    var rejectBtns = el.querySelectorAll("[data-peer-reject]");
    for (var j = 0; j < rejectBtns.length; j++) {
      rejectBtns[j].addEventListener("click", function () {
        var transferId = this.getAttribute("data-peer-reject");
        window.PeerShareUI.rejectIncomingTransfer(transferId);
        peerIncomingRecords = peerIncomingRecords.filter(function (r) { return r.transferId !== transferId; });
        renderPeerIncomingList();
      });
    }
    var saveBtns = el.querySelectorAll("[data-peer-save]");
    for (var m = 0; m < saveBtns.length; m++) {
      saveBtns[m].addEventListener("click", async function () {
        var idx3 = Number(this.getAttribute("data-peer-save"));
        var rec3 = peerIncomingRecords[idx3];
        if (!rec3) return;
        this.textContent = "保存中...";
        var r3 = await savePeerReceivedRecord(rec3);
        rec3.saveResult = r3;
        renderPeerIncomingList();
      });
    }
    var closeBtns = el.querySelectorAll("[data-peer-close-preview]");
    for (var k = 0; k < closeBtns.length; k++) {
      closeBtns[k].addEventListener("click", function () {
        var idx2 = Number(this.getAttribute("data-peer-close-preview"));
        var rec = peerIncomingRecords[idx2];
        if (rec && rec.url) { URL.revokeObjectURL(rec.url); }
        peerIncomingRecords.splice(idx2, 1);
        renderPeerIncomingList();
      });
    }
  }

  var peerCallbacksBound = false;
  function ensurePeerShareCallbacksBound() {
    if (peerCallbacksBound || !window.PeerShareUI) return;
    peerCallbacksBound = true;
    window.PeerShareUI.setCallbacks({
      onStatusChange: function () { updatePeerRoomStatus(); },
      onIncomingOffer: function (fromPeerId, offer) {
        peerIncomingRecords.unshift({
          transferId: offer.transferId,
          fileName: offer.fileName,
          size: offer.size,
          offer: offer,
          fromPeerId: fromPeerId,
          receivedSize: 0,
          status: currentConfig && currentConfig.peerShare && currentConfig.peerShare.autoAcceptFromRoom ? "receiving" : "pending"
        });
        if (currentConfig && currentConfig.peerShare && currentConfig.peerShare.autoAcceptFromRoom) {
          window.PeerShareUI.acceptIncomingTransfer(offer.transferId);
        }
        renderPeerIncomingList();
      },
      onIncomingProgress: function (transferId, receivedSize) {
        var rec = peerIncomingRecords.find(function (r) { return r.transferId === transferId; });
        if (rec) { rec.receivedSize = receivedSize; renderPeerIncomingList(); }
      },
      onIncomingComplete: function (transferId, blob) {
        var rec = peerIncomingRecords.find(function (r) { return r.transferId === transferId; });
        if (rec) {
          rec.status = "done";
          rec.blob = blob;
          rec.url = URL.createObjectURL(blob);
          renderPeerIncomingList();
          if (currentConfig && currentConfig.peerShare && currentConfig.peerShare.autoSaveReceived) {
            savePeerReceivedRecord(rec).then(function (r2) {
              rec.saveResult = r2;
              renderPeerIncomingList();
            });
          }
        }
      }
    });
  }

  function initPeerShareDetail() {
    if (!window.PeerShareUI) return;
    ensurePeerShareCallbacksBound();

    updatePeerRoomStatus();
    renderPeerIncomingList();
    renderPeerSelfTestResult();

    var joinBtn = document.getElementById("peerJoinRoomBtn");
    var leaveBtn = document.getElementById("peerLeaveRoomBtn");
    var genBtn = document.getElementById("peerGenerateRoomCodeBtn");
    var pickBtn = document.getElementById("peerPickFileBtn");
    var roomInput = document.getElementById("peerRoomCodeInput");
    var sendStatusEl = document.getElementById("peerSendStatus");
    var useLobbyToggle = document.getElementById("peerUseLobby");
    var customRoomRow = document.getElementById("peerCustomRoomRow");
    var selfTestBtn = document.getElementById("peerSelfTestBtn");
    var selfTestResultEl = document.getElementById("peerSelfTestResult");

    function syncCustomRoomRowVisibility() {
      if (!customRoomRow) return;
      var useLobby = useLobbyToggle ? useLobbyToggle.checked : true;
      customRoomRow.style.opacity = useLobby ? "0.5" : "1";
      if (roomInput) roomInput.disabled = useLobby;
    }
    syncCustomRoomRowVisibility();
    if (useLobbyToggle) {
      useLobbyToggle.addEventListener("change", syncCustomRoomRowVisibility);
    }

    if (selfTestBtn) {
      selfTestBtn.onclick = async function () {
        if (!window.peerShare || !window.peerShare.selfTest) return;
        selfTestResultEl.textContent = "测试中...";
        lastPeerSelfTestResult = await window.peerShare.selfTest();
        renderPeerSelfTestResult();
      };
    }

    if (joinBtn) {
      joinBtn.onclick = async function () {
        var useLobby = useLobbyToggle ? useLobbyToggle.checked : true;
        var code = useLobby ? "" : (roomInput ? roomInput.value.trim() : "");
        if (!useLobby && !code) { if (sendStatusEl) sendStatusEl.textContent = "请输入或生成房间码"; return; }
        var result = await window.PeerShareUI.joinRoom(code);
        if (!result || !result.ok) {
          if (sendStatusEl) sendStatusEl.textContent = "加入房间失败";
        } else if (sendStatusEl) {
          sendStatusEl.textContent = result.isPublicLobby ? "已加入公共大厅" : ("已加入房间 " + result.roomCode);
        }
        updatePeerRoomStatus();
      };
    }
    if (leaveBtn) {
      leaveBtn.onclick = function () { leavePeerRoom(); };
    }
    if (genBtn) {
      genBtn.onclick = function () {
        if (roomInput) roomInput.value = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      };
    }
    if (pickBtn) {
      pickBtn.onclick = function () {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,video/*";
        input.onchange = async function () {
          var file = input.files && input.files[0];
          if (!file) return;
          var s = window.PeerShareUI.getState();
          var targets = s.peers.filter(function (id) { return peerSelectedTargets[id] !== false; });
          if (!s.active || !targets.length) {
            if (sendStatusEl) sendStatusEl.textContent = s.active ? "请至少勾选一个发送目标" : "请先加入房间并等待对端连接";
            return;
          }
          for (var i = 0; i < targets.length; i++) {
            var res = await window.PeerShareUI.sendFile(targets[i], file);
            if (sendStatusEl) sendStatusEl.textContent = res && res.ok ? ("已发送给 " + targets[i].slice(0, 8)) : ("发送失败: " + (res && res.errorKey));
          }
        };
        input.click();
      };
    }

    var chooseReceiveFolderBtn = document.getElementById("peerChooseReceiveFolderBtn");
    var receiveFolderInput = document.getElementById("peerReceiveFolderInput");
    if (chooseReceiveFolderBtn) {
      chooseReceiveFolderBtn.onclick = async function () {
        if (!window.peerShare || !window.peerShare.chooseReceiveFolder) return;
        var r = await window.peerShare.chooseReceiveFolder();
        if (r && r.ok && receiveFolderInput) {
          receiveFolderInput.value = r.folder;
          if (!currentConfig.peerShare) currentConfig.peerShare = {};
          currentConfig.peerShare.receiveFolder = r.folder;
        }
      };
    }
  }

  // 把已完成接收的记录保存到本地接收文件夹；blob 转为 ArrayBuffer 后经 IPC 传给主进程写盘。
  async function savePeerReceivedRecord(rec) {
    if (!rec || !rec.blob || !window.peerShare || !window.peerShare.saveReceivedFile) return null;
    var buf = await rec.blob.arrayBuffer();
    return window.peerShare.saveReceivedFile(rec.fileName, buf);
  }

  // ═════════════════════════════════════════════════
  // 网站库预览渲染
  // ═════════════════════════════════════════════════

  function parseWebsiteLines(text) {
    var lines = String(text || "").split(/\r?\n/);
    var entries = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;
      var enabled = true;
      if (line.startsWith("!")) { enabled = false; line = line.slice(1).trim(); }
      var sep = line.indexOf("|");
      var label = "", url = "";
      if (sep === -1) { url = line; } else { label = line.slice(0, sep).trim(); url = line.slice(sep + 1).trim(); }
      if (!url) continue;
      if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)) url = "https://" + url;
      entries.push({ label: label || url.replace(/^https?:\/\//, "").split("/")[0], url: url, enabled: enabled });
    }
    return entries;
  }

  function getWebsiteTextFromEntries() {
    var wlib = currentConfig && currentConfig.websiteLibrary;
    var entries = wlib && wlib.entries ? wlib.entries : [];
    if (!entries.length) return "";
    return entries.map(function(e) {
      var prefix = e.enabled === false ? "! " : "";
      return prefix + (e.label || "") + " | " + (e.url || "");
    }).join("\n");
  }

  function renderWebsiteLibraryPreview() {
    var listEl = document.getElementById("websiteLibraryList");
    var textEl = document.getElementById("websiteLibraryText");
    var searchEl = document.getElementById("websiteLibrarySearch");
    if (!listEl) return;
    var text = textEl ? textEl.value : (cfg("websiteLibrary.text") || "");
    var entries = parseWebsiteLines(text);
    var kw = (searchEl && searchEl.value || "").trim().toLowerCase();
    var filtered = kw ? entries.filter(function(e) { return e.label.toLowerCase().indexOf(kw) !== -1 || e.url.toLowerCase().indexOf(kw) !== -1; }) : entries;
    listEl.innerHTML = "";
    if (!filtered.length) { listEl.innerHTML = '<p class="desc-text">没有匹配条目</p>'; return; }
    for (var i = 0; i < filtered.length; i++) {
      var e = filtered[i];
      var row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--line);font-size:11px;gap:8px";
      row.innerHTML = '<span style="color:' + (e.enabled ? "var(--text)" : "var(--subtle)") + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">' +
        (e.enabled ? "" : '<span class="badge badge-danger" style="margin-right:4px">禁用</span>') + e.label +
        '</span><span style="color:var(--subtle);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px">' + e.url + '</span>';
      listEl.appendChild(row);
    }
  }

  function bindWebsitePreviewEvents() {
    document.addEventListener("input", function(e) {
      if (e.target && (e.target.id === "websiteLibraryText" || e.target.id === "websiteLibrarySearch")) {
        renderWebsiteLibraryPreview();
      }
    });
    document.addEventListener("change", function(e) {
      if (e.target && e.target.id === "websiteLibraryEnabled") {
        var wlib = currentConfig && currentConfig.websiteLibrary;
        if (wlib) wlib.enabled = e.target.checked;
      }
    });
  }

  // ═════════════════════════════════════════════════
  // 日历热力图
  // ═════════════════════════════════════════════════

  var currentCalendarDate = new Date();
  var dailyUsageData = {};

  async function loadCalendarData() {
    var mp = getMediaPopup();
    if (!mp || !mp.getStats) return;
    var stats = await mp.getStats();
    dailyUsageData = (stats && stats.dailyUsage) ? stats.dailyUsage : {};
    renderCalendarGrid();
  }

  function renderCalendarGrid() {
    var grid = document.getElementById("calendarGrid");
    var label = document.getElementById("calendarMonthLabel");
    var fullMonthStamp = document.getElementById("fullMonthStamp");
    if (!grid || !label) return;
    var y = currentCalendarDate.getFullYear();
    var m = currentCalendarDate.getMonth();
    label.textContent = y + "年" + (m + 1) + "月";
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    grid.innerHTML = "";
    for (var i = 0; i < firstDay; i++) { grid.appendChild(document.createElement("div")); }
    var validDaysCount = 0;
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var usage = dailyUsageData[dateStr] || {};
      var seconds = usage.playTimeSeconds || 0;
      var div = document.createElement("div");
      div.className = "calendar-day";
      var numSpan = document.createElement("span");
      numSpan.className = "calendar-day-num";
      numSpan.textContent = d;
      div.appendChild(numSpan);
      if (seconds > 0) {
        validDaysCount++;
        div.classList.add("has-stamp");
        // 印章等级
        var stampClass = "", stampTextKey = "";
        if (seconds >= 24 * 3600) { stampClass = "stamp-ultimate"; stampTextKey = "stamp.text.ultimate"; }
        else if (seconds >= 4 * 3600) { stampClass = "stamp-gold"; stampTextKey = "stamp.text.gold"; }
        else if (seconds >= 3600) { stampClass = "stamp-silver"; stampTextKey = "stamp.text.silver"; }
        else { stampClass = "stamp-bronze"; stampTextKey = "stamp.text.bronze"; }
        var rawText = t(stampTextKey) || "...";
        var options = rawText.split("|");
        var seededRandom = Math.sin(y * 1000 + m * 100 + d) * 10000;
        var optionIndex = Math.floor((seededRandom - Math.floor(seededRandom)) * options.length);
        var stampText = options[optionIndex] || options[0];
        var stamp = document.createElement("div");
        stamp.className = "stamp " + stampClass;
        stamp.textContent = stampText;
        // tooltip
        var h = Math.floor(seconds / 3600);
        var mi = Math.floor((seconds % 3600) / 60);
        if (h > 0) { div.title = t("stats.format.hours", { h: h, m: mi }); }
        else { div.title = t("stats.format.minutes", { m: mi, s: 0 }).replace(" 0秒", "").replace(" 0s", ""); }
        div.appendChild(stamp);
      }
      grid.appendChild(div);
    }
    // 大满贯印章
    if (validDaysCount === daysInMonth && daysInMonth > 0) {
      if (fullMonthStamp) fullMonthStamp.classList.remove("hidden");
      grid.classList.add("faded-by-stamp");
    } else {
      if (fullMonthStamp) fullMonthStamp.classList.add("hidden");
      grid.classList.remove("faded-by-stamp");
    }
  }

  function bindCalendarEvents() {
    document.addEventListener("click", function(e) {
      if (e.target && e.target.id === "prevMonthBtn") { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendarGrid(); }
      if (e.target && e.target.id === "nextMonthBtn") { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendarGrid(); }
    });
  }

  // ═════════════════════════════════════════════════
  // 数值拖动调整 (scrubber)
  // ═════════════════════════════════════════════════

  function initNumericScrubbers() {
    document.addEventListener("pointerdown", function(e) {
      var t = e.target;
      if (e.button !== 0 || t.type !== "number" || t.disabled || t.classList.contains("no-scrub")) return;
      var startX = e.clientX;
      var step = Number(t.step) || 1;
      var startVal = Number(t.value) || 0;
      var min = Number(t.min);
      var max = Number(t.max);
      if (!Number.isFinite(min)) min = -Infinity;
      if (!Number.isFinite(max)) max = Infinity;
      var moved = false;
      t.setPointerCapture(e.pointerId);
      document.body.classList.add("scrub-active");

      function onMove(ev) {
        if (ev.pointerId !== e.pointerId) return;
        var delta = ev.clientX - startX;
        if (Math.abs(delta) < 4 && !moved) return;
        moved = true;
        var newVal = startVal + Math.round(delta / 18) * step;
        newVal = Math.min(max, Math.max(min, newVal));
        t.value = String(step >= 1 ? Math.round(newVal) : newVal.toFixed(2));
        t.dispatchEvent(new Event("input", { bubbles: true }));
      }

      function onUp(ev) {
        if (ev.pointerId !== e.pointerId) return;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.body.classList.remove("scrub-active");
        if (!moved) { t.focus(); t.select(); }
        else { t.dispatchEvent(new Event("change", { bubbles: true })); }
      }

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      e.preventDefault();
    });
  }

  // ═════════════════════════════════════════════════
  // 状态栏更新
  // ═════════════════════════════════════════════════

  function updateStatusBar(state) {
    var ind = document.getElementById("statusIndicator");
    var wc = document.getElementById("statusWindowCount");
    var mc = document.getElementById("statusMediaCount");
    if (!state) return;
    if (ind) {
      var running = state.running;
      ind.textContent = running ? "调度器运行中" : (state.paused ? "调度器已暂停" : "调度器已停止");
      ind.className = running ? "live" : "";
    }
    if (wc) wc.textContent = (state.popupCount || 0) + " 个窗口";
    if (mc) mc.textContent = (state.mediaCount || 0) + " 项媒体";
  }

  // ═════════════════════════════════════════════════
  // 控制按钮
  // ═════════════════════════════════════════════════

  function bindControlButtons() {
    var startBtn = document.getElementById("startButton");
    var pauseBtn = document.getElementById("pauseButton");
    var stopBtn = document.getElementById("stopButton");
    var closeAllBtn = document.getElementById("closeAllButton");

    if (startBtn) startBtn.addEventListener("click", async () => {
      var mp = getMediaPopup();
      if (mp) { await mp.saveConfig(currentConfig); await mp.start(); }
    });
    if (pauseBtn) pauseBtn.addEventListener("click", () => {
      var mp = getMediaPopup();
      if (mp) mp.pause();
    });
    if (stopBtn) stopBtn.addEventListener("click", () => {
      var mp = getMediaPopup();
      if (mp) mp.stop();
    });
    if (closeAllBtn) closeAllBtn.addEventListener("click", () => {
      var mp = getMediaPopup();
      if (mp) mp.closeAll();
    });

    // 保存按钮
    var saveBtn = document.getElementById("saveButton");
    if (saveBtn) saveBtn.addEventListener("click", async () => {
      var result = await saveConfig();
      if (!result || !result.blocked) log("配置已手动保存");
    });

    // 快速切换配置档案（Bar 下拉）
    bindBarProfileSwitcher();
  }

  // ═════════════════════════════════════════════════
  // 窗口控制
  // ═════════════════════════════════════════════════

  function bindWindowControls() {
    var minBtn = document.getElementById("minimizeWindowButton");
    var closeBtn = document.getElementById("closeWindowButton");
    if (minBtn) minBtn.addEventListener("click", () => {
      var mp = getMediaPopup();
      if (mp && mp.minimizeWindow) mp.minimizeWindow();
    });
    if (closeBtn) closeBtn.addEventListener("click", () => {
      var mp = getMediaPopup();
      if (mp && mp.closeWindow) mp.closeWindow();
    });
  }

  // ═════════════════════════════════════════════════
  // UI 主题切换
  // ═════════════════════════════════════════════════

  function applyTheme(theme) {
    if (theme && theme !== "default") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function getGlobalLanguage() {
    try { return localStorage.getItem("gooner_language") || "system"; } catch (e) { return "system"; }
  }

  function setGlobalLanguage(lang) {
    try { localStorage.setItem("gooner_language", lang || "system"); } catch (e) {}
    currentLocale = resolveLanguage(lang, navigator.language);
  }

  function bindThemeEvents() {
    // 监听 #uiThemeSelector change (在 detail 页面中)
    document.addEventListener("change", function (e) {
      if (e.target && e.target.id === "uiThemeSelector") {
        applyTheme(e.target.value);
      }
    });
  }

  // ═════════════════════════════════════════════════
  // 自动保存 (详情页控件)
  // ═════════════════════════════════════════════════

  function autoBindDetailControls() {
    document.addEventListener("change", function (e) {
      var el = e.target;
      if (!el) return;
      // 文件夹权重调整
      if (el.dataset && el.dataset.action === "folderWeight") {
        var idx = Number(el.dataset.index);
        var w = Math.max(1, Math.min(5, Number(el.value) || 1));
        el.value = w;
        var valSpan = el.parentElement && el.parentElement.querySelector(".folder-weight-val");
        if (valSpan) valSpan.textContent = w;
        if (currentConfig && Array.isArray(currentConfig.folders) && idx >= 0 && idx < currentConfig.folders.length) {
          var f = currentConfig.folders[idx];
          if (typeof f === "string") { currentConfig.folders[idx] = { path: f, weight: w }; }
          else { f.weight = w; }
          scheduleAutoSave({ immediate: true });
        }
        return;
      }
      if (!el.id) return;
      if (el.closest("#dashboard")) return; // 卡片区有独立处理
      if (el.closest("#detailContent")) {
        applyDetailChange(el);
      }
    });
    document.addEventListener("input", function (e) {
      var el = e.target;
      if (!el) return;
      // 文件夹权重滑块 — 拖动时实时更新数值
      if (el.dataset && el.dataset.action === "folderWeight") {
        var valSpan = el.parentElement && el.parentElement.querySelector(".folder-weight-val");
        if (valSpan) valSpan.textContent = el.value;
        return;
      }
      if (!el.id) return;
      if (el.closest("#detailContent") && (el.tagName === "TEXTAREA" || el.type === "text" || el.type === "password" || el.type === "number" || el.type === "color" || el.type === "range")) {
        applyDetailChange(el);
      }
    });
  }

  function applyDetailChange(el) {
    if (!currentConfig) return;
    var id = el.id;
    var val;
    if (el.type === "checkbox") val = el.checked;
    else if (el.type === "number") val = Number(el.value);
    else val = el.value;

    // 映射到 config key
    setConfigValue(id, val);
    scheduleAutoSave(el.type === "checkbox" ? { immediate: true } : {});
  }

  function setConfigValue(id, val) {
    // 直接映射常见 key
    var directKeys = [
      "popupsEnabled", "recursive", "gradual", "alwaysOnTop", "fullscreen",
      "popupOpacity", "muted", "closeVideoOnEnded", "chaosVideo", "clickToClose",
      "randomCloseButton", "disableManualClose", "developerMode",
      "unlimitedWindows", "order", "autoStartOnBoot", "autoRunScheduler", "silentMode",
      "language", "uiTheme", "hardcoreMode", "hardcoreModeToggle",
      "aiProvider", "aiModel", "aiApiKey", "aiPopupScheduleEnabled",
      "aiSinglePopupMode", "aiImmediateReplyEnabled",
      "burstCount", "minWindows", "maxWindows", "maxVideoWindows",
      "imageBaseWidth", "imageBaseHeight", "imageSizeJitter",
      "videoBaseWidth", "videoBaseHeight", "videoSizeJitter",
      "sharedBaseWidth", "sharedBaseHeight", "sharedSizeJitter", "separateMediaSizeSettings",
      "closeButtonFontSize", "closeButtonBorderRadius", "closeButtonPaddingX", "closeButtonPaddingY",
      "closeButtonOffsetX", "closeButtonOffsetY"
    ];
    if (id === "hardcoreModeToggle") { id = "hardcoreMode"; }
    // 语言全局存储，不写入配置文件
    if (id === "language") { setGlobalLanguage(val); return; }
    if (directKeys.indexOf(id) !== -1) {
      currentConfig[id] = val;
      return;
    }
    // 嵌套对象先处理（必须在时钟检查之前，避免 Hours/Minutes/Seconds 贪婪捕获）
    if (id.indexOf("visual") === 0 || id.indexOf("wallpaper") === 0 ||
        id.indexOf("desktopCharacter") === 0 || id.indexOf("onlineMedia") === 0 ||
        id.indexOf("processRules") === 0 || (id.indexOf("ai") === 0 && directKeys.indexOf(id) === -1) ||
        id.indexOf("pollution") === 0 || id.indexOf("websiteLibrary") === 0) {
      setNestedConfig(id, val);
      return;
    }
    // 时钟字段（仅顶层字段，嵌套已在上面处理）
    if (id.indexOf("Hours") !== -1 || id.indexOf("Minutes") !== -1 || id.indexOf("Seconds") !== -1) {
      currentConfig[id] = Number(val);
      return;
    }
    // 其他嵌套对象
    setNestedConfig(id, val);
  }

  function setNestedConfig(id, val) {
    if (!currentConfig) return;
    // visual.* (config key is actually visualIntervention)
    if (id.indexOf("visual") === 0) {
      if (!currentConfig.visualIntervention) currentConfig.visualIntervention = {};
      var vk = id.replace("visual", "").replace(/^[A-Z]/, function (c) { return c.toLowerCase(); });
      // 修复驼峰
      if (vk === "Ghostenabled") vk = "ghostEnabled";
      if (vk === "Xrayenabled") vk = "xrayEnabled";
      if (vk === "Waterfallenabled") vk = "waterfallEnabled";
      if (vk === "Flashenabled") vk = "flashEnabled";
      if (vk === "Ghostopacity") vk = "ghostOpacity";
      if (vk === "Ghostintervalminutes") vk = "ghostIntervalMinutes";
      if (vk === "Ghostintervalseconds") vk = "ghostIntervalSeconds";
      if (vk === "Xrayradius") vk = "xrayRadius";
      if (vk === "Xrayopacity") vk = "xrayOpacity";
      if (vk === "Waterfallspeed") vk = "waterfallSpeed";
      if (vk === "Waterfallcount") vk = "waterfallCount";
      if (vk === "Waterfallsize") vk = "waterfallSize";
      if (vk === "Waterfallopacity") vk = "waterfallOpacity";
      if (vk === "Flashintervalhours") vk = "flashIntervalHours";
      if (vk === "Flashintervalminutes") vk = "flashIntervalMinutes";
      if (vk === "Flashintervalseconds") vk = "flashIntervalSeconds";
      if (vk === "Flashjitterhours") vk = "flashJitterHours";
      if (vk === "Flashjitterminutes") vk = "flashJitterMinutes";
      if (vk === "Flashjitterseconds") vk = "flashJitterSeconds";
      if (vk === "Enabled") vk = "enabled";
      currentConfig.visualIntervention[vk] = val;
      return;
    }
    // wallpaper.*
    if (id.indexOf("wallpaper") === 0) {
      if (!currentConfig.wallpaper) currentConfig.wallpaper = {};
      if (id === "wallpaperEnabled") currentConfig.wallpaper.enabled = val;
      else if (id === "wallpaperIntervalMinutes") currentConfig.wallpaper.intervalMinutes = Number(val);
      else if (id === "wallpaperMinResolution") currentConfig.wallpaper.minResolution = Number(val);
      else if (id === "wallpaperMaxRatioDeviation") currentConfig.wallpaper.maxRatioDeviation = Number(val);
      else if (id === "wallpaperFocusRestoreEnabled") currentConfig.wallpaper.focusRestoreEnabled = val;
      return;
    }
    // desktopCharacter.* → 写入 wallpaper.* 角色子模块
    if (id.indexOf("desktopCharacter") === 0) {
      if (!currentConfig.wallpaper) currentConfig.wallpaper = {};
      var dk = id.replace("desktopCharacter", "").replace(/^[A-Z]/, function (c) { return c.toLowerCase(); });
      if (dk === "Enabled") dk = "characterEnabled";
      if (dk === "Folderpath") dk = "characterFolderPath";
      if (dk === "Intervalminutes") dk = "intervalMinutes";
      if (dk === "Mode") dk = "characterMode";
      if (dk === "Layermode") dk = "characterLayerMode";
      currentConfig.wallpaper[dk] = val;
      // 同时保持向后兼容
      if (!currentConfig.desktopCharacter) currentConfig.desktopCharacter = {};
      currentConfig.desktopCharacter[dk.replace("character", "").replace(/^[A-Z]/, function(c) { return c.toLowerCase(); })] = val;
      return;
    }
    // onlineMedia.*
    if (id.indexOf("onlineMedia") === 0) {
      if (!currentConfig.onlineMedia) currentConfig.onlineMedia = {};
      if (id === "onlineMediaEnabled") currentConfig.onlineMedia.enabled = val;
      else if (id === "onlineMediaSourceUrl") currentConfig.onlineMedia.sourceUrl = val;
      return;
    }
    // processRules.*
    if (id.indexOf("processRules") === 0) {
      if (!currentConfig.processRules) currentConfig.processRules = {};
      if (id === "processRulesEnabled") currentConfig.processRules.enabled = val;
      else if (id === "processRulesAutoStartOnWhitelist") currentConfig.processRules.autoStartOnWhitelist = val;
      else if (id === "processRulesStopOnBlacklist") currentConfig.processRules.stopOnBlacklist = val;
      else if (id === "processRulesStopOnWhitelistExit") currentConfig.processRules.stopOnWhitelistExit = val;
      else if (id === "processRulesCheckIntervalSeconds") currentConfig.processRules.checkIntervalSeconds = Number(val);
      return;
    }
    // peer*
    if (id.indexOf("peer") === 0) {
      if (!currentConfig.peerShare) currentConfig.peerShare = {};
      if (id === "peerShareEnabled") {
        currentConfig.peerShare.enabled = val;
        if (val) { void autoJoinPeerShareRoom(); } else { void leavePeerRoom(); }
      }
      else if (id === "peerDisplayName") currentConfig.peerShare.displayName = val;
      else if (id === "peerMaxFileSizeMb") currentConfig.peerShare.maxFileSizeMb = Number(val);
      else if (id === "peerMaxConcurrentTransfers") currentConfig.peerShare.maxConcurrentTransfers = Number(val);
      else if (id === "peerAutoAcceptFromRoom") currentConfig.peerShare.autoAcceptFromRoom = val;
      else if (id === "peerUseLobby") currentConfig.peerShare.useLobby = val;
      else if (id === "peerAutoSaveReceived") currentConfig.peerShare.autoSaveReceived = val;
      return;
    }
    // ai.*
    if (id.indexOf("ai") === 0 && id !== "aiPopupScheduleEnabled" && id !== "aiSinglePopupMode" && id !== "aiImmediateReplyEnabled") {
      if (!currentConfig.ai) currentConfig.ai = {};
      if (id === "aiInteractionEnabled") currentConfig.ai.interactionEnabled = val;
      else if (id === "aiInteractionTone") currentConfig.ai.interactionTone = val;
      else if (id === "aiInteractionIncludeForegroundApp") currentConfig.ai.interactionIncludeForegroundApp = val;
      else if (id === "aiInteractionIntervalHours") currentConfig.ai.interactionIntervalHours = Number(val);
      else if (id === "aiInteractionIntervalMinutes") currentConfig.ai.interactionIntervalMinutes = Number(val);
      else if (id === "aiInteractionIntervalSeconds") currentConfig.ai.interactionIntervalSeconds = Number(val);
      else if (id === "aiProvider") currentConfig.ai.provider = val;
      else if (id === "aiModel") currentConfig.ai.model = val;
      else if (id === "aiApiKey") currentConfig.ai.apiKey = val;
      else if (id === "aiPopupScheduleEnabled") currentConfig.ai.popupScheduleEnabled = val;
      return;
    }
    // pollution.*
    if (id.indexOf("pollution") === 0) {
      if (!currentConfig.pollution) currentConfig.pollution = {};
      var pok = id.replace("pollution", "").replace(/^[A-Z]/, function (c) { return c.toLowerCase(); });
      if (pok === "Enabled") pok = "enabled";
      if (pok === "Clipboardenabled") pok = "clipboardEnabled";
      if (pok === "Inputenabled") pok = "inputEnabled";
      if (pok === "Modephrase") pok = "modePhrase";
      if (pok === "Modecorpus") pok = "modeCorpus";
      if (pok === "Modeai") pok = "modeAi";
      if (pok === "Phrases") pok = "phrases";
      if (pok === "Corpuspath") pok = "corpusPath";
      if (pok === "Corpusminlength") pok = "corpusMinLength";
      if (pok === "Clipboardchance") pok = "clipboardChance";
      if (pok === "Inputintervalmin") pok = "inputIntervalMin";
      if (pok === "Inputintervalmax") pok = "inputIntervalMax";
      currentConfig.pollution[pok] = val;
      return;
    }
    // websiteLibrary.*
    if (id === "websiteLibraryEnabled") {
      if (!currentConfig.websiteLibrary) currentConfig.websiteLibrary = {};
      currentConfig.websiteLibrary.enabled = val;
      return;
    }
    // processRules textarea to array
    if (id === "processRulesBlacklist") {
      if (!currentConfig.processRules) currentConfig.processRules = {};
      currentConfig.processRules.blacklist = String(val || "").split(/\r?\n/).map(function(s){return s.trim()}).filter(Boolean);
      return;
    }
    if (id === "processRulesWhitelist") {
      if (!currentConfig.processRules) currentConfig.processRules = {};
      currentConfig.processRules.whitelist = String(val || "").split(/\r?\n/).map(function(s){return s.trim()}).filter(Boolean);
      return;
    }
    // unlimitedWindows warning
    if (id === "unlimitedWindows") {
      currentConfig.unlimitedWindows = val;
      var warn = document.getElementById("unlimitedWarning");
      if (warn) warn.style.display = val ? "" : "none";
      return;
    }
    if (id === "websiteLibraryText") {
      if (!currentConfig.websiteLibrary) currentConfig.websiteLibrary = {};
      currentConfig.websiteLibrary.text = val;
      currentConfig.websiteLibrary.entries = parseWebsiteLines(val);
      return;
    }
    // aiPopup.* appearance fields
    if (id.indexOf("aiPopup") === 0) {
      if (!currentConfig.ai) currentConfig.ai = {};
      if (!currentConfig.ai.popupAppearance) currentConfig.ai.popupAppearance = {};
      var ak2 = id.replace("aiPopup", "");
      // Convert to camelCase
      if (ak2 === "Width") currentConfig.ai.popupAppearance.popupWidth = Number(val);
      else if (ak2 === "Height") currentConfig.ai.popupAppearance.popupHeight = Number(val);
      else if (ak2 === "PreviewScale") {} // preview only, don't save
      else if (ak2 === "BodyBackgroundColor") currentConfig.ai.popupAppearance.bodyBackgroundColor = val;
      else if (ak2 === "BodyBackgroundOpacity") currentConfig.ai.popupAppearance.bodyBackgroundOpacity = clampOpacity(val);
      else if (ak2 === "TextColor") currentConfig.ai.popupAppearance.textColor = val;
      else if (ak2 === "TextOpacity") currentConfig.ai.popupAppearance.textOpacity = clampOpacity(val);
      else if (ak2 === "TextFontSize") currentConfig.ai.popupAppearance.textFontSize = Number(val);
      else if (ak2 === "TextLineHeight") currentConfig.ai.popupAppearance.textLineHeight = Number(val);
      else if (ak2 === "TextAlign") currentConfig.ai.popupAppearance.textAlign = val;
      else if (ak2 === "CardBackgroundColor") currentConfig.ai.popupAppearance.cardBackgroundColor = val;
      else if (ak2 === "CardBackgroundOpacity") currentConfig.ai.popupAppearance.cardBackgroundOpacity = clampOpacity(val);
      else if (ak2 === "CardBorderColor") currentConfig.ai.popupAppearance.cardBorderColor = val;
      else if (ak2 === "CardBorderOpacity") currentConfig.ai.popupAppearance.cardBorderOpacity = clampOpacity(val);
      else if (ak2 === "CardBorderWidth") currentConfig.ai.popupAppearance.cardBorderWidth = Number(val);
      else if (ak2 === "CardBorderRadius") currentConfig.ai.popupAppearance.cardBorderRadius = Number(val);
      else if (ak2 === "CardPaddingX") currentConfig.ai.popupAppearance.cardPaddingX = Number(val);
      else if (ak2 === "CardPaddingY") currentConfig.ai.popupAppearance.cardPaddingY = Number(val);
      else if (ak2 === "CardShadowColor") currentConfig.ai.popupAppearance.cardShadowColor = val;
      else if (ak2 === "CardShadowOpacity") currentConfig.ai.popupAppearance.cardShadowOpacity = clampOpacity(val);
      else if (ak2 === "CardShadowBlur") currentConfig.ai.popupAppearance.cardShadowBlur = Number(val);
      else if (ak2 === "CardShadowSpread") currentConfig.ai.popupAppearance.cardShadowSpread = Number(val);
      else if (ak2 === "CardShadowOffsetX") currentConfig.ai.popupAppearance.cardShadowOffsetX = Number(val);
      else if (ak2 === "CardShadowOffsetY") currentConfig.ai.popupAppearance.cardShadowOffsetY = Number(val);
      else if (ak2 === "TextShadowColor") currentConfig.ai.popupAppearance.textShadowColor = val;
      else if (ak2 === "TextShadowOpacity") currentConfig.ai.popupAppearance.textShadowOpacity = clampOpacity(val);
      else if (ak2 === "TextShadowBlur") currentConfig.ai.popupAppearance.textShadowBlur = Number(val);
      else if (ak2 === "TextShadowSpread") currentConfig.ai.popupAppearance.textShadowSpread = Number(val);
      else if (ak2 === "TextShadowOffsetX") currentConfig.ai.popupAppearance.textShadowOffsetX = Number(val);
      else if (ak2 === "TextShadowOffsetY") currentConfig.ai.popupAppearance.textShadowOffsetY = Number(val);
      else if (ak2 === "CloseButtonFontSize") currentConfig.ai.popupAppearance.closeButtonFontSize = Number(val);
      else if (ak2 === "CloseButtonBorderRadius") currentConfig.ai.popupAppearance.closeButtonBorderRadius = Number(val);
      else if (ak2 === "CloseButtonPaddingX") currentConfig.ai.popupAppearance.closeButtonPaddingX = Number(val);
      else if (ak2 === "CloseButtonPaddingY") currentConfig.ai.popupAppearance.closeButtonPaddingY = Number(val);
      else if (ak2 === "CloseButtonOffsetX") currentConfig.ai.popupAppearance.closeButtonOffsetX = Number(val);
      else if (ak2 === "CloseButtonOffsetY") currentConfig.ai.popupAppearance.closeButtonOffsetY = Number(val);
      else if (ak2 === "CloseButtonBackgroundColor") currentConfig.ai.popupAppearance.closeButtonBackgroundColor = val;
      else if (ak2 === "CloseButtonBackgroundOpacity") currentConfig.ai.popupAppearance.closeButtonBackgroundOpacity = clampOpacity(val);
      else if (ak2 === "CloseButtonTextColor") currentConfig.ai.popupAppearance.closeButtonTextColor = val;
      else if (ak2 === "CloseButtonTextOpacity") currentConfig.ai.popupAppearance.closeButtonTextOpacity = clampOpacity(val);
      else if (ak2 === "CloseButtonBorderColor") currentConfig.ai.popupAppearance.closeButtonBorderColor = val;
      else if (ak2 === "CloseButtonBorderOpacity") currentConfig.ai.popupAppearance.closeButtonBorderOpacity = clampOpacity(val);
      else if (ak2 === "CloseButtonHoverBackgroundColor") currentConfig.ai.popupAppearance.closeButtonHoverBackgroundColor = val;
      else if (ak2 === "CloseButtonHoverBackgroundOpacity") currentConfig.ai.popupAppearance.closeButtonHoverBackgroundOpacity = clampOpacity(val);
      else if (ak2 === "CloseButtonHoverTextColor") currentConfig.ai.popupAppearance.closeButtonHoverTextColor = val;
      else if (ak2 === "CloseButtonHoverTextOpacity") currentConfig.ai.popupAppearance.closeButtonHoverTextOpacity = clampOpacity(val);
      return;
    }
    // 直接存储
    currentConfig[id] = val;
  }

  // ═════════════════════════════════════════════════
  // 进程选择器
  // ═════════════════════════════════════════════════

  function bindProcessPickerEvents() {
    document.getElementById("processPickerCloseButton").addEventListener("click", closeProcessPicker);
    document.getElementById("processPickerOverlay").addEventListener("click", function (e) {
      if (e.target === this) closeProcessPicker();
    });
    document.getElementById("processPickerRefreshButton").addEventListener("click", loadProcessPickerList);
    document.getElementById("processPickerAddButton").addEventListener("click", addSelectedProcessesToRuleList);
    document.getElementById("processPickerSearch").addEventListener("input", renderProcessPickerList);

    document.addEventListener("click", function (e) {
      var btn = e.target;
      if (btn.id === "chooseBlacklistProcessButton") openProcessPicker("blacklist");
      else if (btn.id === "chooseWhitelistProcessButton") openProcessPicker("whitelist");
      else if (btn.id === "chooseAutoProfileProcessButton") openProcessPicker("autoProfile");
    });
  }

  function closeProcessPicker() {
    processPickerTarget = null;
    processPickerItems = [];
    document.getElementById("processPickerOverlay").hidden = true;
  }

  async function loadProcessPickerList() {
    var mp = getMediaPopup();
    if (!mp || !mp.listProcesses) return;
    document.getElementById("processPickerStatus").textContent = "加载中...";
    var result = await mp.listProcesses();
    if (!result || !result.ok) {
      processPickerItems = [];
      document.getElementById("processPickerStatus").textContent = "加载失败";
      renderProcessPickerList();
      return;
    }
    processPickerItems = (result.processes || []).map(function (r) {
      var item = typeof r === "string" ? { name: r, path: "", icon: "" } : r;
      return { name: String(item.name || "").trim(), path: String(item.path || "").trim(), icon: String(item.icon || "").trim() };
    }).filter(function (i) { return i.name; });
    renderProcessPickerList();
  }

  function renderProcessPickerList() {
    var list = document.getElementById("processPickerList");
    var kw = (document.getElementById("processPickerSearch").value || "").trim().toLowerCase();
    var matched = processPickerItems.filter(function (i) {
      return !kw || i.name.toLowerCase().indexOf(kw) !== -1;
    });
    list.innerHTML = "";
    if (!matched.length) {
      list.innerHTML = '<div class="empty">没有匹配的进程</div>';
      return;
    }
    for (var i = 0; i < matched.length; i++) {
      var item = matched[i];
      var row = document.createElement("label");
      row.className = "process-picker-row";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = item.name;
      row.appendChild(cb);
      row.appendChild(document.createTextNode(" " + item.name + (item.path ? " — " + item.path : "")));
      list.appendChild(row);
    }
    document.getElementById("processPickerStatus").textContent = matched.length + " 个进程";
  }

  async function addSelectedProcessesToRuleList() {
    var selected = [];
    var cbs = document.querySelectorAll("#processPickerList input:checked");
    for (var i = 0; i < cbs.length; i++) { selected.push(cbs[i].value); }
    if (!selected.length) return;
    var targetId = processPickerTarget === "whitelist" ? "processRulesWhitelist" : "processRulesBlacklist";
    var ta = document.getElementById(targetId);
    if (!ta) return;
    var existing = ta.value.split("\n").filter(Boolean);
    for (var j = 0; j < selected.length; j++) {
      if (existing.indexOf(selected[j]) === -1) existing.push(selected[j]);
    }
    ta.value = existing.join("\n");
    // 同步到 config
    if (currentConfig && currentConfig.processRules) {
      currentConfig.processRules[processPickerTarget || "blacklist"] = existing;
    }
    await scheduleAutoSave({ immediate: true });
    closeProcessPicker();
  }

  async function openProcessPicker(target) {
    processPickerTarget = target;
    document.getElementById("processPickerSearch").value = "";
    document.getElementById("processPickerOverlay").hidden = false;
    await loadProcessPickerList();
    document.getElementById("processPickerSearch").focus();
  }

  // ═════════════════════════════════════════════════
  // 强控模式
  // ═════════════════════════════════════════════════

  function bindHardcoreEvents() {
    // 事件委托：hardcore 控件在详情页中动态渲染
    document.addEventListener("change", function (e) {
      if (e.target && e.target.id === "hardcoreModeToggle") {
        if (e.target.checked) {
          var ht = document.getElementById("hardcoreTargetText");
          if (ht) ht.textContent = "CONFIRM";
          var mo = document.getElementById("hardcoreModalOverlay");
          if (mo) mo.hidden = false;
        } else {
          if (currentConfig) currentConfig.hardcoreMode = false;
          scheduleAutoSave({ immediate: true });
        }
      }
    });
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t.id === "hardcoreCancelBtn") {
        var mo = document.getElementById("hardcoreModalOverlay");
        if (mo) mo.hidden = true;
        var hmt = document.getElementById("hardcoreModeToggle");
        if (hmt) hmt.checked = false;
      }
      if (t.id === "hardcoreConfirmBtn") {
        var input = document.getElementById("hardcoreInput");
        var target = document.getElementById("hardcoreTargetText");
        if (input && target && input.value.trim() === target.textContent) {
          if (currentConfig) currentConfig.hardcoreMode = true;
          var mo2 = document.getElementById("hardcoreModalOverlay");
          if (mo2) mo2.hidden = true;
          scheduleAutoSave({ immediate: true });
        } else {
          var err = document.getElementById("hardcoreErrorText");
          if (err) { err.hidden = false; err.textContent = "输入不匹配，请重新输入。"; }
        }
      }
    });
    // 硬编码模态关闭按钮
    var hcClose = document.getElementById("hardcoreCancelBtn");
    var hcOverlay = document.getElementById("hardcoreModalOverlay");
    if (hcOverlay) {
      hcOverlay.addEventListener("click", function (ev) {
        if (ev.target === hcOverlay) { hcOverlay.hidden = true; }
      });
    }
  }

  // ═════════════════════════════════════════════════
  // 配置档案 (复用旧逻辑)
  // ═════════════════════════════════════════════════

  async function loadProfiles(activePath) {
    var grid = document.getElementById("profileGrid");
    var mp = getMediaPopup();
    if (!mp || !mp.listProfiles) return;
    try {
      cachedProfiles = await mp.listProfiles();
      // 总是更新 Bar 下拉
      updateBarProfileSelect(activePath);
      if (!grid) return;
      grid.innerHTML = "";
      for (var i = 0; i < cachedProfiles.length; i++) {
        var p = cachedProfiles[i];
        var card = document.createElement("div");
        card.className = "profile-card";
        if (activePath && p.path === activePath) card.classList.add("active");
        card.innerHTML = '<span class="profile-card-name">' + p.name + '</span><button class="profile-card-edit" data-pid="' + p.id + '">✏</button>';
        card.addEventListener("click", async function (ev) {
          if (ev.target.classList.contains("profile-card-edit")) {
            renameTargetProfileId = ev.target.dataset.pid;
            document.getElementById("renameInput").value = p.name;
            document.getElementById("renameDialog").hidden = false;
            return;
          }
          if (card.classList.contains("active")) return;
          var res = await mp.switchProfile(p.path);
          if (res.ok) {
            updateState(res.state);
            loadProfiles(res.state.configPath);
            renderAllCards();
          }
        });
        grid.appendChild(card);
      }
      updateBarProfileSelect(activePath);
    } catch (e) { console.error("loadProfiles", e); }
  }

  // ── Bar 快速配置档案切换 ──
  function updateBarProfileSelect(activePath) {
    var sel = document.getElementById("barProfileSelect");
    if (!sel) return;
    sel.innerHTML = "";
    for (var i = 0; i < cachedProfiles.length; i++) {
      var p = cachedProfiles[i];
      var opt = document.createElement("option");
      opt.value = p.path;
      opt.textContent = p.name;
      if (activePath && p.path === activePath) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function bindBarProfileSwitcher() {
    var sel = document.getElementById("barProfileSelect");
    if (!sel) return;
    sel.addEventListener("change", async function () {
      var mp = getMediaPopup();
      if (!mp || !mp.switchProfile) return;
      var path = sel.value;
      if (!path) return;
      await saveConfig();
      var result = await mp.switchProfile(path);
      if (result && result.ok) {
        updateState(result.state);
        log("已切换配置档案");
      }
    });

    var saveAsBtn = document.getElementById("barSaveConfigAsBtn");
    if (saveAsBtn) saveAsBtn.addEventListener("click", async function () {
      var mp = getMediaPopup();
      if (!mp || !mp.saveConfigAs) return;
      await saveConfig();
      var result = await mp.saveConfigAs();
      if (result && result.config) {
        currentConfig = result.config;
        updateState(result);
        log("已另存配置档案");
      }
    });
  }

  function bindProfileEvents() {
    // 事件委托：所有档案操作按钮都是动态生成的
    document.addEventListener("click", async function (e) {
      var t = e.target;
      if (t.id === "btnNewProfile") {
        var mp = getMediaPopup();
        if (!mp || !mp.createProfile) return;
        var name = prompt("请输入新配置档案名称:");
        if (!name) return;
        await mp.createProfile({ name: name, templateId: "default" });
        await loadProfiles();
      }
      if (t.id === "renameBtnConfirm") {
        var mp2 = getMediaPopup();
        if (!mp2 || !mp2.renameProfile) return;
        var newName = document.getElementById("renameInput");
        if (!newName || !renameTargetProfileId) return;
        await mp2.renameProfile({ profileId: renameTargetProfileId, newName: newName.value.trim() });
        document.getElementById("renameDialog").hidden = true;
        await loadProfiles();
      }
      if (t.id === "renameBtnCancel" || t.id === "renameDialogClose") {
        var dlg = document.getElementById("renameDialog");
        if (dlg) dlg.hidden = true;
      }
    });
  }

  // ═════════════════════════════════════════════════
  // 快捷键录制
  // ═════════════════════════════════════════════════

  var shortcutFieldIds = ["startShortcut", "pauseShortcut", "stopShortcut", "closeAllShortcut"];

  function bindShortcutRecorders() {
    // 事件委托：快捷键输入框在详情页中动态渲染
    document.addEventListener("focus", function (e) {
      var t = e.target;
      if (t && shortcutFieldIds.indexOf(t.id) !== -1) {
        t.classList.add("is-recording");
      }
    }, true);
    document.addEventListener("blur", async function (e) {
      var t = e.target;
      if (t && shortcutFieldIds.indexOf(t.id) !== -1) {
        t.classList.remove("is-recording");
        if (currentConfig && t.value !== (currentConfig[t.id] || "")) {
          currentConfig[t.id] = t.value;
          await saveConfig();
        }
      }
    }, true);
    document.addEventListener("keydown", function (e) {
      var t = e.target;
      if (t && shortcutFieldIds.indexOf(t.id) === -1) return;
      if (e.key === "Tab") return;
      e.preventDefault();
      if (e.repeat) return;
      if (e.key === "Backspace" || e.key === "Delete") { t.value = ""; return; }
      if (e.key === "Escape") { t.blur(); return; }
      var parts = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      if (e.metaKey) parts.push("Super");
      var k = e.key;
      if (k.length === 1) parts.push(k.toUpperCase());
      else if (k === " ") parts.push("Space");
      else if (k === "ArrowUp") parts.push("Up");
      else if (k === "ArrowDown") parts.push("Down");
      else if (k === "ArrowLeft") parts.push("Left");
      else if (k === "ArrowRight") parts.push("Right");
      else if (k.length > 1 && k.indexOf("F") === 0) parts.push(k.toUpperCase());
      else parts.push(k);
      t.value = parts.join("+");
    });
  }

  // ═════════════════════════════════════════════════
  // 统计
  // ═════════════════════════════════════════════════

  async function loadStats() {
    var mp = getMediaPopup();
    if (!mp || !mp.getStats) return;
    var stats = await mp.getStats();
    if (!stats) return;
    var fmt = function (sec) {
      if (!sec) return "0秒";
      var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
      return (h ? h + "时" : "") + (m ? m + "分" : "") + s + "秒";
    };
    var setVal = function (id, v) { var els = document.querySelectorAll("#" + id); for (var i = 0; i < els.length; i++) els[i].textContent = v; };
    setVal("statPlayTime", fmt(stats.totalPlayTime));
    setVal("statUptime", fmt(stats.totalUptime));
    setVal("statLongestSession", fmt(stats.longestSession));
    setVal("statDailyAverage", fmt(stats.dailyAverage));

    // 弹窗记录
    if (stats.popupCounts) {
      setVal("statPopupImage", stats.popupCounts.image || 0);
      setVal("statPopupVideo", stats.popupCounts.video || 0);
      setVal("statPopupWebsite", stats.popupCounts.website || 0);
      setVal("statPopupAi", stats.popupCounts.ai || 0);
    }
    // 操作习惯
    if (stats.closeCounts) {
      setVal("statCloseManual", stats.closeCounts.manual || 0);
      setVal("statCloseAuto", stats.closeCounts.auto || 0);
    }

    // 今日印章进度
    var now = new Date();
    var todayStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    var todayPlayTime = (stats.dailyUsage && stats.dailyUsage[todayStr]) ? (stats.dailyUsage[todayStr].playTimeSeconds || 0) : 0;
    var currentTarget = 3600;
    var stampTextKey = "";
    if (todayPlayTime >= 24 * 3600) { currentTarget = 24 * 3600; stampTextKey = "stamp.text.ultimate"; }
    else if (todayPlayTime >= 4 * 3600) { currentTarget = 24 * 3600; stampTextKey = "stamp.text.gold"; }
    else if (todayPlayTime >= 3600) { currentTarget = 4 * 3600; stampTextKey = "stamp.text.silver"; }
    else if (todayPlayTime > 0) { currentTarget = 3600; stampTextKey = "stamp.text.bronze"; }
    var dailyProgress = Math.min(100, (todayPlayTime / currentTarget) * 100);
    var fillEls = document.querySelectorAll("#dailyProgressFill");
    for (var fi = 0; fi < fillEls.length; fi++) fillEls[fi].style.width = dailyProgress + "%";
    var fmtTarget = function (s) { return s >= 3600 ? (s / 3600) + "h" : (s / 60) + "m"; };
    var todayH = Math.floor(todayPlayTime / 3600);
    var todayM = Math.floor((todayPlayTime % 3600) / 60);
    setVal("dailyProgressText", todayH + "h " + todayM + "m / " + fmtTarget(currentTarget));
    var stampDisplay = "";
    if (stampTextKey) {
      var rawText = t(stampTextKey) || "...";
      var options = rawText.split("|");
      var seededRandom = Math.sin(now.getFullYear() * 1000 + now.getMonth() * 100 + now.getDate()) * 10000;
      var optionIndex = Math.floor((seededRandom - Math.floor(seededRandom)) * options.length);
      stampDisplay = options[optionIndex] || options[0];
    }
    var stampEls = document.querySelectorAll("#dailyStampText");
    for (var si = 0; si < stampEls.length; si++) stampEls[si].textContent = stampDisplay ? "(" + stampDisplay + ")" : "";

    // 本月大满贯进度
    var y = now.getFullYear(), mo = now.getMonth();
    var daysInMonth = new Date(y, mo + 1, 0).getDate();
    var validDaysCount = 0;
    for (var dd = 1; dd <= daysInMonth; dd++) {
      var ds = y + "-" + String(mo + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
      if (stats.dailyUsage && stats.dailyUsage[ds] && stats.dailyUsage[ds].playTimeSeconds > 0) validDaysCount++;
    }
    var monthlyProgress = (validDaysCount / daysInMonth) * 100;
    var mFillEls = document.querySelectorAll("#monthlyProgressFill");
    for (var mi2 = 0; mi2 < mFillEls.length; mi2++) mFillEls[mi2].style.width = monthlyProgress + "%";
    setVal("monthlyProgressText", validDaysCount + " / " + daysInMonth + " " + t("dashboard.days"));
  }

  // ═════════════════════════════════════════════════
  // 详情页按钮动作
  // ═════════════════════════════════════════════════

  function bindDetailActions() {
    document.addEventListener("click", async function (e) {
      var t = e.target;
      var mp = getMediaPopup();
      if (!mp) return;

      if (t.id === "testWallpaperButton") { await scheduleAutoSave({ immediate: true }); mp.testWallpaper(); }
      if (t.id === "testOnlineMediaButton") { await scheduleAutoSave({ immediate: true }); mp.testOnlineMedia(); }
      if (t.id === "addFoldersButton") {
        var result = await mp.chooseFolders();
        if (Array.isArray(result)) {
          currentConfig.folders = result;
          renderAllCards();
          showDetail("folders");
        }
      }
      if (t.id === "scanButton") { await saveConfig(); await mp.scanMedia(); }
      // 文件夹删除按钮
      if (t.dataset && t.dataset.action === "folderRemove") {
        var idx = Number(t.dataset.index);
        if (currentConfig && Array.isArray(currentConfig.folders) && idx >= 0 && idx < currentConfig.folders.length) {
          currentConfig.folders.splice(idx, 1);
          await scheduleAutoSave({ immediate: true });
          showDetail("folders");
        }
      }
      if (t.id === "chooseDesktopCharacterFolderButton") {
        var path = await mp.chooseDesktopCharacterFolder();
        if (path && currentConfig) {
          if (!currentConfig.wallpaper) currentConfig.wallpaper = {};
          currentConfig.wallpaper.characterFolderPath = path;
          var field = document.getElementById("desktopCharacterFolderPath");
          if (field) field.value = path;
          await scheduleAutoSave({ immediate: true });
        }
      }
      if (t.id === "refreshDesktopCharacterButton") { await saveConfig(); mp.refreshDesktopCharacter(); }
      if (t.id === "aiShowPopupButton") {
        await saveConfig();
        var aiConf = currentConfig.ai || {};
        var genResult = await mp.generatePopupText({ aiConfig: aiConf, locale: currentLocale });
        if (genResult && genResult.text) {
          await mp.showAiTextPopup({ text: genResult.text, locale: currentLocale });
        }
      }
      if (t.id === "aiTestInteractionButton") { await saveConfig(); mp.testAiInteraction(); }
      if (t.id === "pollutionChooseCorpusBtn") {
        var folders = await mp.chooseFolders();
        if (folders && folders.folders && folders.folders.length) {
          var fpath = folders.folders[0].path || folders.folders[0];
          if (currentConfig && currentConfig.pollution) currentConfig.pollution.corpusPath = fpath;
          var cf = document.getElementById("pollutionCorpusPath");
          if (cf) cf.value = fpath;
          await scheduleAutoSave({ immediate: true });
        }
      }
      if (t.id === "websiteShowPopupButton") {
        var wlib = currentConfig && currentConfig.websiteLibrary;
        var entries = (wlib && wlib.entries) ? wlib.entries : [];
        if (entries.length && mp.showWebsitePopup) {
          var idx = Math.floor(Math.random() * entries.length);
          mp.showWebsitePopup(entries[idx]);
        }
      }
      if (t.id === "websiteSaveButton") {
        var textEl = document.getElementById("websiteLibraryText");
        if (textEl && currentConfig) {
          if (!currentConfig.websiteLibrary) currentConfig.websiteLibrary = {};
          currentConfig.websiteLibrary.text = textEl.value;
          currentConfig.websiteLibrary.entries = parseWebsiteLines(textEl.value);
        }
        await scheduleAutoSave({ immediate: true });
      }
    });
  }

  // ═════════════════════════════════════════════════
  // 状态同步 (IPC)
  // ═════════════════════════════════════════════════

  function updateMediaPathWarning() {
    var el = document.getElementById("mediaPathWarning");
    if (!el) return;

    var hasFolders = currentConfig && currentConfig.folders && currentConfig.folders.length > 0;
    var hasOnline = currentConfig && currentConfig.onlineMedia && currentConfig.onlineMedia.enabled && currentConfig.onlineMedia.sourceUrl;

    if (hasFolders && hasOnline) {
      el.hidden = true;
      return;
    }

    if (!hasFolders && !hasOnline) {
      el.className = "media-path-warning media-path-warning--critical";
      el.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> 未设置任何媒体来源 — 请添加本地文件夹或网络媒体地址';
      el.hidden = false;
    } else if (!hasFolders) {
      el.className = "media-path-warning media-path-warning--hint";
      el.innerHTML = '未设置本地媒体路径';
      el.hidden = false;
    } else {
      el.className = "media-path-warning media-path-warning--hint";
      el.innerHTML = '未设置网络媒体地址';
      el.hidden = false;
    }
  }

  async function updateState(state) {
    currentState = state;
    if (state && state.config) {
      currentConfig = state.config;
      if (currentConfig.popupsEnabled == null) currentConfig.popupsEnabled = true;
      applyTheme(currentConfig.uiTheme);
      applyLayoutOrder();
    }
    updateStatusBar(state);
    renderAllCards();
    loadProfiles(state && state.configPath);
    loadStats();
    updateMediaPathWarning();
  }

  async function initApp() {
    // 应用全局语言偏好
    setGlobalLanguage(getGlobalLanguage());

    var mp = getMediaPopup();
    if (!mp) {
      // 预览模式
      currentConfig = {};
      renderAllCards();
      document.getElementById("statusIndicator").textContent = "预览模式（未连接后端）";
      return;
    }

    // 监听状态更新
    if (mp.onStateUpdate) {
      mp.onStateUpdate(function (state) { updateState(state); });
    }

    // 硬核模式紧急解锁回调
    if (mp.onHardcoreUnlock) {
      mp.onHardcoreUnlock(function () {
        document.getElementById("hardcoreTargetText").textContent = "CONFIRM";
        document.getElementById("hardcoreInput").value = "";
        document.getElementById("hardcoreErrorText").hidden = true;
        document.getElementById("hardcoreModalOverlay").hidden = false;
        setTimeout(function () { var inp = document.getElementById("hardcoreInput"); if (inp) inp.focus(); }, 50);
      });
    }

    // 获取初始状态
    var state = await mp.getState();
    if (state) updateState(state);

    // 若配置里联机共享已经是开启状态（比如上次退出前开着），启动时自动测试联通性并加入房间，
    // 不需要用户每次重新点开关。
    if (currentConfig && currentConfig.peerShare && currentConfig.peerShare.enabled) {
      void autoJoinPeerShareRoom();
    }

    // 绑定控制按钮
    bindControlButtons();
    bindWindowControls();
    bindThemeEvents();
    autoBindDetailControls();
    bindProcessPickerEvents();
    bindHardcoreEvents();
    bindProfileEvents();
    bindShortcutRecorders();
    bindDetailActions();

    // 新增子系统
    bindAiPreviewEvents();
    bindWebsitePreviewEvents();
    bindCalendarEvents();
    initNumericScrubbers();
    loadCalendarData();

    // 尺寸面板切换
    document.addEventListener("change", function(e) {
      if (e.target && e.target.id === "separateMediaSizeSettings") {
        var shared = document.getElementById("sharedSizePanel");
        var separate = document.getElementById("separateSizePanels");
        if (shared && separate) {
          shared.hidden = e.target.checked;
          separate.hidden = !e.target.checked;
        }
      }
    });

    // 返回按钮
    document.getElementById("detailBackBtn").addEventListener("click", showDashboard);

    // 全局设置按钮
    var settingsBtn = document.getElementById("btnSettings");
    if (settingsBtn) settingsBtn.addEventListener("click", function () { showDetail("global-settings"); });

    // Hero 文件夹快捷按钮
    var heroFoldersBtn = document.getElementById("heroFoldersButton");
    if (heroFoldersBtn) heroFoldersBtn.addEventListener("click", function () { showDetail("folders"); });

    // hero 进度条点击展开生涯详情
    var heroProgress = document.getElementById("heroProgress");
    var statsPanel = document.getElementById("statsInlinePanel");
    var statsCloseBtn = document.getElementById("statsInlineCloseBtn");
    if (heroProgress && statsPanel) {
      heroProgress.addEventListener("click", function () {
        var isOpen = !statsPanel.hidden;
        statsPanel.hidden = isOpen;
        if (!isOpen) { loadCalendarData(); loadStats(); }
      });
    }
    if (statsCloseBtn && statsPanel) {
      statsCloseBtn.addEventListener("click", function () { statsPanel.hidden = true; });
    }
  }

  // ── 启动 ──
  document.addEventListener("DOMContentLoaded", initApp);

})();
