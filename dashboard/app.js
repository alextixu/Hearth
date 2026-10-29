(function () {
  'use strict';

  // ---------- Icons ----------
  const ICONS = {
    purifier: '<rect x="6" y="3" width="12" height="18" rx="3"/><path d="M9 7h6M9 10h6M9 13h6"/><circle cx="12" cy="17" r="1"/>',
    vacuum: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3"/>',
    aquarium: '<path d="M3 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3z"/><circle cx="8" cy="11" r="1"/>',
    speaker: '<path d="M7 5c0-1.1 2.2-2 5-2s5 .9 5 2v14c0 1.1-2.2 2-5 2s-5-.9-5-2z"/><path d="M7 7c0 1.1 2.2 2 5 2s5-.9 5-2"/>',
    router: '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 16.5h.01M11 16.5h.01"/><path d="M8.5 9.5a5 5 0 0 1 7 0M6 7a9 9 0 0 1 12 0"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    computer: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    iot: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    unknown: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    leave: '<path d="M14 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5"/><path d="M10 17l5-5-5-5M15 12H3"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    dock: '<path d="M4 20h16M7 20v-8a5 5 0 0 1 10 0v8"/>',
    alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    feed: '<path d="M12 3v4M8 5l2 3M16 5l-2 3"/><path d="M5 12h14l-2 8H7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
  };
  const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
  const GRIP = '<svg class="grip" viewBox="0 0 16 6" aria-hidden="true">'
    + [3, 8, 13].map((x) => `<circle cx="${x}" cy="1.2" r="1.1"/><circle cx="${x}" cy="4.8" r="1.1"/>`).join('') + '</svg>';

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);

  const UNASSIGNED = '未分類';
  const NEW_ROOM = '__new__'; // 房間下拉選單裡「新增房間」的值
  const ROOM_NAME_MAX = 12;

  // ---------- Mock hub ----------
  // 之後換成 Home Assistant adapter 時，只要提供相同的介面。
  function createMockHub(seed) {
    const state = JSON.parse(JSON.stringify(seed));
    const gw = state.network.gateway;
    const history = { down: [], up: [] };
    for (let i = 0; i < 60; i++) {
      history.down.push(gw.downMbps * rand(0.6, 1.4));
      history.up.push(gw.upMbps * rand(0.6, 1.4));
    }
    const listeners = new Set();
    const emit = () => listeners.forEach((fn) => fn());
    const device = (id) => state.devices.find((d) => d.id === id);

    // 每個指令回傳字串代表失敗原因，回傳 undefined 代表成功。
    const commands = {
      purifier: {
        power(d, on) { d.state.on = on; },
        speed(d, v) { Object.assign(d.state, { on: true, auto: false, speed: v }); },
        auto(d, v) { Object.assign(d.state, { on: true, auto: v }); },
        oscillate(d, v) { d.state.oscillating = v; },
        mode(d, m) { Object.assign(d.state, { on: true, mode: m }); },
      },
      vacuum: {
        start(d) {
          if (d.state.battery < 20) return '電量不足，請先充電';
          if (d.state.status === 'docked') d.state.area = 0;
          d.state.status = 'cleaning';
        },
        pause(d) { if (d.state.status === 'cleaning') d.state.status = 'paused'; },
        dock(d) {
          if (d.state.status === 'docked') return;
          d.state.status = 'returning';
          d.state.returnTicks = 3;
        },
        mode(d, m) { d.state.mode = m; },
      },
      aquarium: {
        light(d, on) { d.state.light = on; },
        brightness(d, v) { Object.assign(d.state, { brightness: v, light: v > 0 }); },
        pump(d, on) { d.state.pump = on; },
        feed(d) { d.state.lastFed = Date.now(); },
      },
      speaker: {
        play(d, on) { d.state.playing = on; },
        volume(d, v) { d.state.volume = v; },
      },
    };

    function send(id, cmd, arg) {
      const d = device(id);
      const fn = d && commands[d.type][cmd];
      if (!fn) return '不支援的指令';
      const err = fn(d, arg);
      emit();
      return err;
    }

    // 房間設定先存在瀏覽器；串接後改為讀寫 HA 的 Area。
    const ROOM_KEY = 'hub-rooms-v1';
    try {
      const saved = JSON.parse(localStorage.getItem(ROOM_KEY));
      if (saved && Array.isArray(saved.rooms)) {
        state.rooms = saved.rooms;
        for (const d of state.devices) if (typeof saved.assign[d.id] === 'string') d.room = saved.assign[d.id];
      }
    } catch (_) { /* 沒有存檔或無法存取時用預設房間 */ }
    for (const d of state.devices) if (!state.rooms.includes(d.room)) d.room = UNASSIGNED;

    // 設備顯示順序（拖曳排序）；存檔裡沒有的設備接在最後。
    const ORDER_KEY = 'hub-order-v1';
    const ids = state.devices.map((d) => d.id);
    state.order = [];
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_KEY));
      if (Array.isArray(saved)) state.order = saved.filter((id) => ids.includes(id));
    } catch (_) { /* 沒有存檔時用預設順序 */ }
    for (const id of ids) if (!state.order.includes(id)) state.order.push(id);

    function persistRooms() {
      try {
        const assign = Object.fromEntries(state.devices.map((d) => [d.id, d.room]));
        localStorage.setItem(ROOM_KEY, JSON.stringify({ rooms: state.rooms, assign }));
        localStorage.setItem(ORDER_KEY, JSON.stringify(state.order));
      } catch (_) { /* 忽略 */ }
    }

    // 把設備放到 beforeId 前面或 afterId 後面（都沒有就放最後），可同時換房間。
    // 回傳是否真的有改變。
    function moveTile(id, { beforeId, afterId, room } = {}) {
      const d = device(id);
      if (!d) return false;
      const prevOrder = state.order.join();
      const prevRoom = d.room;
      const order = state.order.filter((x) => x !== id);
      let idx = order.length;
      if (beforeId && order.includes(beforeId)) idx = order.indexOf(beforeId);
      else if (afterId && order.includes(afterId)) idx = order.indexOf(afterId) + 1;
      order.splice(idx, 0, id);
      state.order = order;
      if (room !== undefined && (state.rooms.includes(room) || room === UNASSIGNED)) d.room = room;
      const changed = order.join() !== prevOrder || d.room !== prevRoom;
      if (changed) { persistRooms(); emit(); }
      return changed;
    }

    // 新增（oldName 為 null）或修改房間；回傳字串代表驗證失敗。
    function saveRoom(oldName, rawName, deviceIds) {
      const name = rawName.trim();
      if (!name) return '請輸入房間名稱';
      if (name.length > ROOM_NAME_MAX) return `名稱最多 ${ROOM_NAME_MAX} 個字`;
      if (name === '全部' || name === UNASSIGNED || name === NEW_ROOM) return `「${name}」是保留名稱`;
      if (name !== oldName && state.rooms.includes(name)) return '已經有同名的房間';

      if (oldName) state.rooms[state.rooms.indexOf(oldName)] = name;
      else state.rooms.push(name);
      for (const d of state.devices) {
        if (deviceIds.includes(d.id)) d.room = name;
        else if (oldName && d.room === oldName) d.room = UNASSIGNED;
      }
      persistRooms();
      emit();
    }

    function deleteRoom(name) {
      state.rooms = state.rooms.filter((r) => r !== name);
      for (const d of state.devices) if (d.room === name) d.room = UNASSIGNED;
      persistRooms();
      emit();
    }

    function moveDevice(id, room) {
      const d = device(id);
      if (!d || !(state.rooms.includes(room) || room === UNASSIGNED)) return '找不到這個房間';
      d.room = room;
      persistRooms();
      emit();
    }

    function setClient(id, patch) {
      const c = state.network.clients.find((x) => x.id === id);
      if (!c) return;
      Object.assign(c, patch);
      emit();
    }

    function tick() {
      gw.downMbps = clamp(gw.downMbps + rand(-14, 14), 3, 900);
      gw.upMbps = clamp(gw.upMbps + rand(-3, 3), 1, 300);
      gw.uptimeSec += 2;
      history.down.push(gw.downMbps); history.down.shift();
      history.up.push(gw.upMbps); history.up.shift();

      for (const d of state.devices) {
        const s = d.state;
        if (d.type === 'purifier') {
          const strength = !s.on ? 0 : s.auto ? 6 : s.speed !== undefined ? s.speed : { sleep: 3, auto: 6, turbo: 10 }[s.mode];
          const target = 26 - strength * 2;
          s.pm25 = clamp(s.pm25 + (target - s.pm25) * 0.06 + rand(-0.5, 0.5), 1, 150);
        } else if (d.type === 'vacuum') {
          if (s.status === 'cleaning') {
            s.battery = Math.max(0, s.battery - 0.4);
            s.area += 0.3;
            if (s.battery < 15) { s.status = 'returning'; s.returnTicks = 3; }
          } else if (s.status === 'returning') {
            if (--s.returnTicks <= 0) s.status = 'docked';
          } else if (s.status === 'docked') {
            s.battery = Math.min(100, s.battery + 0.8);
          }
        }
      }
      emit();
    }
    setInterval(tick, 2000);

    return {
      state, history, device,
      send, setClient, saveRoom, deleteRoom, moveDevice, moveTile,
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    };
  }

  const hub = createMockHub(window.HUB_MOCK);
  const $ = (id) => document.getElementById(id);

  // ---------- Helpers ----------
  function pmLevel(v) {
    if (v <= 12) return { cls: 'aq-good', label: '良好' };
    if (v <= 30) return { cls: 'aq-fair', label: '普通' };
    if (v <= 50) return { cls: 'aq-poor', label: '偏高' };
    return { cls: 'aq-bad', label: '不良' };
  }

  function isActive(d) {
    const s = d.state;
    switch (d.type) {
      case 'purifier': return s.on;
      case 'vacuum': return s.status === 'cleaning' || s.status === 'returning';
      case 'aquarium': return s.light || s.pump;
      case 'speaker': return s.playing;
      default: return false;
    }
  }

  const VACUUM_STATUS = {
    docked: ['在充電座', ''],
    cleaning: ['清掃中', 'ok'],
    paused: ['已暫停', 'warn'],
    returning: ['返回充電座', 'info'],
  };

  // 回傳 [狀態文字, 圓點顏色]
  function deviceStatus(d) {
    const s = d.state;
    switch (d.type) {
      case 'purifier': return s.on ? ['運作中', 'ok'] : ['待機', ''];
      case 'vacuum': return VACUUM_STATUS[s.status];
      case 'aquarium': return s.light || s.pump ? ['運作中', 'ok'] : ['關閉', ''];
      case 'speaker': return s.playing ? ['播放中', 'ok'] : ['已暫停', ''];
      default: return ['', ''];
    }
  }

  const label = (d) => `${d.name}（${d.room}）`;

  function timeAgo(ts) {
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return '剛剛';
    if (min < 60) return `${min} 分鐘前`;
    return `${Math.floor(min / 60)} 小時前`;
  }

  function uptime(sec) {
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    return days > 0 ? `${days} 天 ${hours} 小時` : `${hours} 小時`;
  }

  const usage = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`);
  const mbps = (v) => (v >= 100 ? Math.round(v) : v.toFixed(1));

  // ---------- Controls ----------
  const sw = (id, cmd, checked, aria) =>
    `<button type="button" class="switch" role="switch" aria-checked="${checked}" aria-label="${esc(aria)}"
      data-key="${id}:${cmd}" data-dev="${id}" data-cmd="${cmd}" data-switch></button>`;

  const seg = (id, cmd, options, current, aria) =>
    `<div class="seg" role="group" aria-label="${esc(aria)}">${options.map(([v, text]) =>
      `<button type="button" aria-pressed="${v === current}" data-key="${id}:${cmd}:${v}" data-dev="${id}" data-cmd="${cmd}" data-val="${v}">${esc(text)}</button>`
    ).join('')}</div>`;

  const range = (id, cmd, text, value, min, max, disabled) =>
    `<label class="range-row"><span class="prop-label">${text}</span>
      <input type="range" min="${min}" max="${max}" value="${value}" ${disabled ? 'disabled' : ''}
        data-key="${id}:${cmd}" data-dev="${id}" data-cmd="${cmd}">
      <output>${value}</output></label>`;

  const btn = (id, cmd, content, opts = {}) =>
    `<button type="button" class="btn ${opts.primary ? 'primary' : ''}" ${opts.disabled ? 'disabled' : ''}
      data-key="${id}:${cmd}" data-dev="${id}" data-cmd="${cmd}" ${opts.val !== undefined ? `data-val="${opts.val}"` : ''}>${content}</button>`;

  const prop = (text, control) => `<div class="prop"><span class="prop-label">${text}</span>${control}</div>`;

  // ---------- Device tiles ----------
  function purifierBody(d) {
    const s = d.state;
    const pm = Math.round(s.pm25);
    const lvl = pmLevel(pm);
    let html = `<div class="metric">
        <span class="metric-value num">${pm}</span><span class="metric-unit">μg/m³ PM2.5</span>
        <span class="metric-level ${lvl.cls}">${lvl.label}</span>
      </div><div class="props">`;
    if (d.speeds) {
      html += prop('自動模式', sw(d.id, 'auto', s.on && s.auto, `${label(d)}自動模式`));
      html += range(d.id, 'speed', '風速', s.speed, 1, d.speeds, !s.on || s.auto);
      if (d.oscillate) html += prop('擺頭', sw(d.id, 'oscillate', s.oscillating, `${label(d)}擺頭`));
    }
    if (d.modes) html += prop('模式', seg(d.id, 'mode', d.modes, s.on ? s.mode : null, `${label(d)}模式`));
    return html + '</div>';
  }

  function vacuumBody(d) {
    const s = d.state;
    const bat = Math.round(s.battery);
    let html = `<div class="props">
      <div class="battery"><span class="prop-label">電量</span>
        <span class="battery-bar"><span class="${bat < 25 ? 'low' : ''}" style="width:${bat}%"></span></span>
        <span class="num">${bat}%</span></div>
      ${prop('本次清掃', `<span class="num">${s.area.toFixed(1)} m²</span>`)}`;
    if (d.cleanModes) html += prop('清掃模式', seg(d.id, 'mode', d.cleanModes, s.mode, `${d.name}清掃模式`));
    html += `</div><div class="controls">
        ${btn(d.id, 'start', `${icon('play')}${s.status === 'paused' ? '繼續' : '開始'}`, { primary: true, disabled: s.status === 'cleaning' })}
        ${btn(d.id, 'pause', `${icon('pause')}暫停`, { disabled: s.status !== 'cleaning' })}
        ${btn(d.id, 'dock', `${icon('dock')}回充`, { disabled: s.status === 'docked' || s.status === 'returning' })}
      </div>`;
    if (d.note) html += `<p class="note">${esc(d.note)}</p>`;
    return html;
  }

  function aquariumBody(d) {
    const s = d.state;
    return `<div class="props">
      ${prop('燈光', sw(d.id, 'light', s.light, `${d.name}燈光`))}
      ${range(d.id, 'brightness', '亮度', s.brightness, 0, 100, !s.light)}
      ${prop('水泵', sw(d.id, 'pump', s.pump, `${d.name}水泵`))}
      ${prop(`餵食：${timeAgo(s.lastFed)}`, btn(d.id, 'feed', `${icon('feed')}餵食`))}
    </div>`;
  }

  function speakerBody(d) {
    const s = d.state;
    return `<div class="now-playing"><strong>${esc(s.title)}</strong><span>${esc(s.artist)}</span></div>
      <div class="controls">${btn(d.id, 'play', s.playing ? `${icon('pause')}暫停` : `${icon('play')}播放`, { primary: !s.playing, val: !s.playing })}</div>
      ${range(d.id, 'volume', '音量', s.volume, 0, 100, false)}`;
  }

  const BODY = { purifier: purifierBody, vacuum: vacuumBody, aquarium: aquariumBody, speaker: speakerBody };

  function tileMain(d) {
    const [text, tone] = deviceStatus(d);
    const power = d.type === 'purifier' ? sw(d.id, 'power', d.state.on, `${label(d)}電源`) : '';
    return `<div class="tile-head">
        <span class="tile-icon">${icon(d.type)}</span>
        <div class="tile-title"><h3>${esc(d.name)}</h3><p class="status"><i class="dot ${tone}"></i>${text}</p></div>
        ${power}
      </div>${BODY[d.type](d)}`;
  }

  // 底部房間選單獨立 patch，數值每兩秒更新時不會把打開的下拉選單關掉。
  function tileFoot(d) {
    const rooms = d.room === UNASSIGNED ? [...hub.state.rooms, UNASSIGNED] : hub.state.rooms;
    return `<span>${esc(d.brand)}</span>
      <span class="select">
        <select aria-label="${esc(d.name)}所在房間" data-key="${d.id}:room" data-room-select="${d.id}">
          ${rooms.map((r) => `<option value="${esc(r)}" ${r === d.room ? 'selected' : ''}>${esc(r)}</option>`).join('')}
          <option value="${NEW_ROOM}">＋ 新增房間…</option>
        </select>${icon('chevron')}
      </span>`;
  }

  const TYPE_GROUPS = [
    { title: '空氣清淨', types: ['purifier'] },
    { title: '清潔', types: ['vacuum'] },
    { title: '魚缸與音響', types: ['aquarium', 'speaker'] },
  ];

  // ---------- Scenes ----------
  const SCENES = [
    {
      id: 'home', name: '回家', desc: '清淨機自動、開魚缸燈、播音樂', icon: 'home',
      actions: [['dyson_purifier_living', 'auto', true], ['dyson_purifier_bedroom', 'auto', true], ['lg_purifier', 'mode', 'auto'],
        ['xiaomi_aquarium', 'light', true], ['homepod', 'play', true], ['xiaomi_vacuum', 'dock'], ['dyson_spot_scrub', 'dock']],
    },
    {
      id: 'away', name: '離家', desc: '兩台掃地機開始清掃', icon: 'leave',
      actions: [['xiaomi_vacuum', 'start'], ['dyson_spot_scrub', 'start'], ['homepod', 'play', false], ['dyson_purifier_bedroom', 'power', false]],
    },
    {
      id: 'sleep', name: '睡眠', desc: '清淨機低速、關燈、停音樂', icon: 'moon',
      actions: [['dyson_purifier_living', 'power', false], ['dyson_purifier_bedroom', 'speed', 1], ['lg_purifier', 'mode', 'sleep'],
        ['xiaomi_aquarium', 'light', false], ['homepod', 'play', false]],
    },
    {
      id: 'purify', name: '全屋淨化', desc: '所有清淨機開到最強', icon: 'wind',
      actions: [['dyson_purifier_living', 'speed', 10], ['dyson_purifier_bedroom', 'speed', 10], ['lg_purifier', 'mode', 'turbo']],
    },
  ];

  // ---------- Device view (依房間 / 依類型) ----------
  const VIEWS = [['room', '依房間'], ['type', '依類型']];
  let deviceView = 'room';
  let roomFilter = ''; // '' 代表全部房間（房間名稱不可能是空字串）
  try {
    deviceView = localStorage.getItem('hub-device-view') || 'room';
    roomFilter = localStorage.getItem('hub-room-filter') || '';
  } catch (_) { /* 無法存取 storage 時用預設值 */ }

  function saveView() {
    try {
      localStorage.setItem('hub-device-view', deviceView);
      localStorage.setItem('hub-room-filter', roomFilter);
    } catch (_) { /* 忽略 */ }
  }

  // 使用者建立的房間，加上有設備時才出現的「未分類」。
  function roomList() {
    const { rooms, devices } = hub.state;
    return devices.some((d) => d.room === UNASSIGNED) ? [...rooms, UNASSIGNED] : rooms;
  }

  function deviceGroups() {
    const { order } = hub.state;
    const devices = [...hub.state.devices].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    if (deviceView === 'type') {
      return TYPE_GROUPS.map((g) => ({ key: g.title, title: g.title, devices: devices.filter((d) => g.types.includes(d.type)) }));
    }
    if (roomFilter && !roomList().includes(roomFilter)) roomFilter = '';
    return roomList()
      .filter((r) => !roomFilter || r === roomFilter)
      .map((r) => ({ key: r, title: r, room: r, devices: devices.filter((d) => d.room === r) }));
  }

  function roomMeta(devices) {
    if (!devices.length) return '';
    const active = devices.filter(isActive).length;
    const parts = [`${devices.length} 台設備`, active ? `${active} 台運作中` : '全部待機'];
    const purifiers = devices.filter((d) => d.type === 'purifier');
    if (!purifiers.length) return esc(parts.join(' · '));
    const pm = Math.round(purifiers.reduce((a, d) => a + d.state.pm25, 0) / purifiers.length);
    const lvl = pmLevel(pm);
    return `${esc(parts.join(' · '))} <span class="pill ${lvl.cls}">PM2.5 ${pm} ${lvl.label}</span>`;
  }

  // ---------- Rendering ----------
  // 只有內容變動才替換 DOM，並把鍵盤焦點還原到同一個控制項。
  let draggingRange = null;
  function patch(el, html) {
    if (el._html === html) return;
    if (draggingRange && el.contains(draggingRange)) return;
    const active = document.activeElement;
    const key = el.contains(active) ? active.dataset.key : null;
    el.innerHTML = html;
    el._html = html;
    if (key) refocus(key, el);
  }

  function refocus(key, root = document) {
    const again = root.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (again) again.focus();
  }

  // 卡片骨架（分組、房間分頁）；只有檢視、房間或設備分配改變時才會真的重建。
  function buildDeviceLayout(groups) {
    patch($('device-view'), `<div class="seg" role="group" aria-label="設備分組方式">${VIEWS.map(([v, t]) =>
      `<button type="button" aria-pressed="${v === deviceView}" data-key="view:${v}" data-view="${v}">${t}</button>`).join('')}</div>`);

    const { devices } = hub.state;
    const tabs = [['', '全部', devices.length], ...roomList().map((r) => [r, r, devices.filter((d) => d.room === r).length])];
    patch($('room-tabs'), deviceView !== 'room' ? '' : tabs.map(([v, t, n]) => `
      <button type="button" class="tab" aria-pressed="${v === roomFilter}" data-key="room:${esc(v)}" data-room-filter="${esc(v)}">
        ${esc(t)}<span class="count num">${n}</span></button>`).join('') + `
      <button type="button" class="tab add" data-key="add-room" data-add-room>${icon('plus')}新增房間</button>`);

    patch($('devices'), groups.map((g, i) => {
      const editable = g.room && g.room !== UNASSIGNED;
      const editBtn = editable ? `<button type="button" class="icon-btn sm" data-key="edit-room:${esc(g.room)}" data-edit-room="${esc(g.room)}"
        aria-label="編輯房間「${esc(g.room)}」" title="編輯房間">${icon('pencil')}</button>` : '';
      const body = g.devices.length
        ? `<div class="tiles">${g.devices.map((d) => `
            <article class="tile" id="tile-${d.id}" data-id="${d.id}" aria-label="${esc(label(d))}">
              <button type="button" class="drag-handle" data-key="drag:${d.id}" data-drag="${d.id}"
                aria-label="排序 ${esc(label(d))}：拖曳，或用方向鍵移動" title="拖曳排序">${GRIP}</button>
              <div class="tile-main" id="tile-main-${d.id}"></div>
              <div class="tile-foot" id="tile-foot-${d.id}"></div>
            </article>`).join('')}</div>`
        : `<div class="empty-room"><span>這個房間還沒有設備</span>
            <button type="button" class="btn" data-key="fill-room:${esc(g.room)}" data-edit-room="${esc(g.room)}">${icon('plus')}加入設備</button></div>`;
      return `<div class="group" data-group="${esc(g.key)}" ${g.room ? `data-group-room="${esc(g.room)}"` : ''}>
        <div class="group-head"><h3 class="group-title">${esc(g.title)}</h3><span class="group-meta" id="group-meta-${i}"></span>${editBtn}</div>
        ${body}
      </div>`;
    }).join(''));
  }

  function buildShell() {
    $('scenes').innerHTML = SCENES.map((s) => `
      <button type="button" class="scene" data-scene="${s.id}">
        <span class="scene-icon">${icon(s.icon)}</span>
        <span><strong>${s.name}</strong><span class="muted">${s.desc}</span></span>
      </button>`).join('');

    $('network-section').innerHTML = `
      <div class="panel-head" id="net-head"></div>
      <div class="panel-body net-grid">
        <div class="net-traffic">
          <div id="net-rates"></div>
          <svg class="spark" id="net-spark" viewBox="0 0 300 64" preserveAspectRatio="none" role="img" aria-label="最近兩分鐘網路流量"></svg>
        </div>
        <div id="net-kv"></div>
        <div class="net-alerts" id="net-alert"></div>
      </div>`;
  }

  function renderSummary() {
    const { devices, network } = hub.state;
    const purifiers = devices.filter((d) => d.type === 'purifier');
    const avg = Math.round(purifiers.reduce((a, d) => a + d.state.pm25, 0) / purifiers.length);
    const lvl = pmLevel(avg);
    const online = network.clients.filter((c) => !c.blocked);
    const iot = online.filter((c) => c.kind === 'iot').length;
    const newCount = network.clients.filter((c) => c.isNew && !c.blocked).length;
    const active = devices.filter(isActive).length;
    const gw = network.gateway;

    patch($('summary'), `
      <div class="panel stat"><div class="stat-label">室內 PM2.5（平均）</div>
        <div class="stat-value num">${avg}<small>μg/m³</small></div>
        <div class="stat-sub"><span class="pill ${lvl.cls}">${lvl.label}</span>${purifiers.length} 台清淨機量測</div></div>
      <div class="panel stat"><div class="stat-label">網路流量</div>
        <div class="stat-value num">${mbps(gw.downMbps)}<small>Mbps ↓</small></div>
        <div class="stat-sub num">上傳 ${mbps(gw.upMbps)} Mbps</div></div>
      <div class="panel stat"><div class="stat-label">用戶端</div>
        <div class="stat-value num">${online.length}<small>台在線</small></div>
        <div class="stat-sub">${newCount ? `<span class="pill pill-warn">${newCount} 台新裝置</span>` : `智慧家電 ${iot} 台`}</div></div>
      <div class="panel stat"><div class="stat-label">運作中設備</div>
        <div class="stat-value num">${active}<small>/ ${devices.length}</small></div>
        <div class="stat-sub"><i class="dot ok"></i>全部在 UDM SE 內網</div></div>`);
  }

  function renderDevices() {
    const active = document.activeElement;
    const focusKey = active && active !== document.body ? active.dataset.key : null;

    const groups = deviceGroups();
    buildDeviceLayout(groups);
    groups.forEach((g, i) => {
      patch($(`group-meta-${i}`), deviceView === 'room' ? roomMeta(g.devices) : `${g.devices.length} 台`);
      for (const d of g.devices) {
        $(`tile-${d.id}`).classList.toggle('is-active', isActive(d));
        patch($(`tile-main-${d.id}`), tileMain(d));
        patch($(`tile-foot-${d.id}`), tileFoot(d));
      }
    });

    // 卡片換到別的房間時，骨架重建會讓焦點掉到 body，找回同一個控制項。
    if (focusKey && (!document.activeElement || document.activeElement === document.body)) refocus(focusKey);
  }

  function sparkPath(values, max) {
    const step = 300 / (values.length - 1);
    return values.map((v, i) => `${(i * step).toFixed(1)},${(62 - (v / max) * 56).toFixed(1)}`).join(' ');
  }

  function renderNetwork() {
    const { gateway: gw, clients } = hub.state.network;

    patch($('net-head'), `
      <h2 id="network-title">${icon('router')}網路</h2>
      <span class="status"><i class="dot ok"></i>${esc(gw.name)} 線上</span>`);

    patch($('net-rates'), `
      <div class="net-rates">
        <div class="rate"><div class="label"><i style="background:var(--accent)"></i>下載</div>
          <div class="value num">${mbps(gw.downMbps)}<small>Mbps</small></div></div>
        <div class="rate"><div class="label"><i style="background:var(--up)"></i>上傳</div>
          <div class="value num">${mbps(gw.upMbps)}<small>Mbps</small></div></div>
      </div>`);

    const max = Math.max(...hub.history.down, ...hub.history.up) * 1.15;
    const down = sparkPath(hub.history.down, max);
    $('net-spark').innerHTML = `
      <polygon class="down-area" points="0,64 ${down} 300,64"/>
      <polyline class="down-line" points="${down}" fill="none" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <polyline class="up-line" points="${sparkPath(hub.history.up, max)}" fill="none" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;

    const online = clients.filter((c) => !c.blocked).length;
    patch($('net-kv'), `<dl class="kv">
      <div><dt>閘道</dt><dd class="num">${esc(gw.ip)}</dd></div>
      <div><dt>運作時間</dt><dd>${uptime(gw.uptimeSec)}</dd></div>
      <div><dt>在線用戶端</dt><dd class="num">${online} / ${clients.length}</dd></div>
      <div><dt>流量區間</dt><dd>最近 2 分鐘</dd></div>
    </dl>`);

    const fresh = clients.filter((c) => c.isNew && !c.blocked);
    patch($('net-alert'), fresh.map((c) => `
      <div class="alert">
        <div class="alert-head">${icon('alert')}<div><strong>偵測到新裝置：${esc(c.name)}</strong>
          <div class="alert-sub num">${esc(c.ip)} · ${esc(c.conn)} · 不在已知設備清單中</div></div></div>
        <div class="alert-actions">
          <button type="button" class="btn" data-key="trust:${c.id}" data-client-trust="${c.id}">標記為信任</button>
          <button type="button" class="btn danger" data-key="block:${c.id}" data-client-block="${c.id}">封鎖</button>
        </div>
      </div>`).join(''));
  }

  let clientFilter = 'all';
  const CLIENT_FILTERS = [['all', '全部'], ['iot', '智慧家電'], ['blocked', '已封鎖']];

  function renderClients() {
    const { clients } = hub.state.network;
    const shown = clients.filter((c) =>
      clientFilter === 'all' ? true : clientFilter === 'blocked' ? c.blocked : c.kind === 'iot');
    const online = clients.filter((c) => !c.blocked).length;

    patch($('clients-section'), `
      <div class="panel-head">
        <h2 id="clients-title">用戶端 <span class="count num">${online}</span></h2>
        <div class="seg" role="group" aria-label="篩選用戶端">${CLIENT_FILTERS.map(([v, t]) =>
          `<button type="button" aria-pressed="${v === clientFilter}" data-key="filter:${v}" data-filter="${v}">${t}</button>`).join('')}</div>
      </div>
      <div class="table-wrap">
        ${shown.length ? `<table class="table">
          <thead><tr>
            <th scope="col">名稱</th><th scope="col" class="hide-sm">IP 位址</th><th scope="col" class="hide-sm">連線方式</th>
            <th scope="col" class="right">今日用量</th><th scope="col" class="right">允許上網</th>
          </tr></thead>
          <tbody>${shown.map((c) => `
            <tr class="${c.blocked ? 'is-blocked' : ''}">
              <td><div class="client-cell">
                <span class="client-icon">${icon(c.kind)}</span>
                <div>
                  <div class="client-name">${esc(c.name)}${c.isNew && !c.blocked ? '<span class="pill pill-warn">新</span>' : ''}${c.blocked ? '<span class="pill pill-bad">已封鎖</span>' : ''}</div>
                  <div class="client-sub num">${esc(c.ip)} · ${esc(c.conn)}</div>
                </div>
              </div></td>
              <td class="hide-sm num">${esc(c.ip)}</td>
              <td class="hide-sm">${esc(c.conn)}</td>
              <td class="right num">${usage(c.usageMB)}</td>
              <td class="right"><button type="button" class="switch" role="switch" aria-checked="${!c.blocked}" aria-label="允許 ${esc(c.name)} 上網"
                data-key="allow:${c.id}" data-client-allow="${c.id}"></button></td>
            </tr>`).join('')}
          </tbody></table>` : '<p class="empty">沒有符合的用戶端</p>'}
      </div>`);
  }

  function render() {
    renderSummary();
    if (!drag) renderDevices(); // 拖曳中先不動卡片，放開後再更新
    renderNetwork();
    renderClients();
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function describe(d, cmd, v) {
    switch (cmd) {
      case 'power': return v ? '已開啟' : '已關閉';
      case 'speed': return `風速 ${v}`;
      case 'auto': return v ? '自動模式開啟' : '自動模式關閉';
      case 'oscillate': return v ? '擺頭開啟' : '擺頭關閉';
      case 'mode': return ((d.modes || d.cleanModes || []).find(([k]) => k === v) || [, v])[1];
      case 'start': return '開始清掃';
      case 'pause': return '已暫停';
      case 'dock': return '返回充電座';
      case 'light': return v ? '燈光開啟' : '燈光關閉';
      case 'brightness': return `亮度 ${v}%`;
      case 'pump': return v ? '水泵開啟' : '水泵關閉';
      case 'feed': return '已餵食';
      case 'play': return v ? '開始播放' : '已暫停';
      case 'volume': return `音量 ${v}`;
      default: return cmd;
    }
  }

  function run(id, cmd, value) {
    const d = hub.device(id);
    const err = hub.send(id, cmd, value);
    toast(err ? `${label(d)}：${err}` : `${label(d)}：${describe(d, cmd, value)}`);
  }

  const parse = (v) => (v === 'true' ? true : v === 'false' ? false : v !== '' && !isNaN(v) ? Number(v) : v);

  // ---------- Events ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t || t.disabled) return;

    if (t.dataset.cmd) {
      const value = t.hasAttribute('data-switch') ? t.getAttribute('aria-checked') !== 'true'
        : t.dataset.val !== undefined ? parse(t.dataset.val) : undefined;
      run(t.dataset.dev, t.dataset.cmd, value);
    } else if (t.dataset.scene) {
      const scene = SCENES.find((s) => s.id === t.dataset.scene);
      const errors = scene.actions.map(([id, cmd, v]) => hub.send(id, cmd, v)).filter(Boolean);
      toast(errors.length ? `「${scene.name}」部分失敗：${errors[0]}` : `已執行情境「${scene.name}」`);
    } else if (t.dataset.view || 'roomFilter' in t.dataset) {
      if (t.dataset.view) deviceView = t.dataset.view;
      else roomFilter = t.dataset.roomFilter;
      saveView();
      renderDevices();
    } else if ('addRoom' in t.dataset) {
      openRoomDialog(null, t);
    } else if (t.dataset.editRoom) {
      openRoomDialog(t.dataset.editRoom, t);
    } else if (t.dataset.filter) {
      clientFilter = t.dataset.filter;
      renderClients();
    } else if (t.dataset.clientAllow) {
      const c = hub.state.network.clients.find((x) => x.id === t.dataset.clientAllow);
      hub.setClient(c.id, { blocked: !c.blocked, isNew: c.blocked ? c.isNew : false });
      toast(c.blocked ? `已封鎖 ${c.name}` : `已允許 ${c.name} 上網`);
    } else if (t.dataset.clientBlock) {
      const c = hub.state.network.clients.find((x) => x.id === t.dataset.clientBlock);
      hub.setClient(c.id, { blocked: true, isNew: false });
      toast(`已封鎖 ${c.name}`);
    } else if (t.dataset.clientTrust) {
      const c = hub.state.network.clients.find((x) => x.id === t.dataset.clientTrust);
      hub.setClient(c.id, { isNew: false });
      toast(`已將 ${c.name} 標記為信任`);
    }
  });

  document.addEventListener('pointerdown', (e) => {
    if (e.target.matches('input[type="range"]')) draggingRange = e.target;
  });
  document.addEventListener('pointerup', () => { draggingRange = null; });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('input[type="range"]')) t.parentElement.querySelector('output').textContent = t.value;
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('select[data-room-select]')) {
      const d = hub.device(t.dataset.roomSelect);
      if (t.value === NEW_ROOM) {
        t.value = d.room; // 先還原，新增成功後才真的移動
        openRoomDialog(null, t, d.id);
        return;
      }
      const err = hub.moveDevice(d.id, t.value);
      toast(err ? `${d.name}：${err}` : `${d.name} 已移到「${t.value}」`);
      return;
    }
    if (!t.matches('input[type="range"][data-cmd]')) return;
    draggingRange = null;
    run(t.dataset.dev, t.dataset.cmd, Number(t.value));
  });

  // ---------- 拖曳排序 ----------
  // 用 pointer events，滑鼠與觸控都能用。拖曳中卡片改成 fixed 跟著指標，
  // 原位置放一個 placeholder 標示放下的位置；放開時才寫回順序。
  let drag = null;
  const DRAG_THRESHOLD = 4;

  const isTile = (el) => el && el.classList.contains('tile') && !el.classList.contains('dragging');
  function siblingTile(el, dir) {
    let n = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    while (n && !isTile(n)) n = dir < 0 ? n.previousElementSibling : n.nextElementSibling;
    return n;
  }

  function startDrag() {
    const { tile } = drag;
    const r = tile.getBoundingClientRect();
    const ph = document.createElement('div');
    ph.className = 'tile-placeholder';
    ph.style.height = `${r.height}px`;
    tile.parentNode.insertBefore(ph, tile);
    Object.assign(tile.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    tile.classList.add('dragging');
    document.body.classList.add('is-dragging');
    drag.ph = ph;
    drag.started = true;
    drag.raf = requestAnimationFrame(autoScroll);
  }

  // 依指標位置移動 placeholder
  function updateTarget() {
    const { x, y } = drag;
    const el = document.elementFromPoint(x, y);
    const group = el && el.closest('#devices .group');
    if (!group || el.closest('.tile-placeholder')) return;
    // 依類型分組時，跨組沒有意義，只能在同一組內排序
    if (deviceView === 'type' && group !== drag.originGroup) return;

    const over = el.closest('.tile');
    const box = group.querySelector('.tiles');
    if (over && isTile(over)) {
      const r = over.getBoundingClientRect();
      const singleColumn = r.width > over.parentNode.clientWidth * 0.6;
      const before = singleColumn ? y < r.top + r.height / 2 : x < r.left + r.width / 2;
      const ref = before ? over : over.nextSibling;
      if (drag.ph.nextSibling !== ref) over.parentNode.insertBefore(drag.ph, ref);
    } else if (box) {
      if (drag.ph.parentNode !== box) box.appendChild(drag.ph);
    } else {
      // 空房間：placeholder 放在標題下方
      const empty = group.querySelector('.empty-room');
      if (drag.ph.parentNode !== group) group.insertBefore(drag.ph, empty);
    }
    document.querySelectorAll('#devices .group').forEach((g) => g.classList.toggle('drop-target', g.contains(drag.ph)));
  }

  // 拖到畫面上下緣時自動捲動
  function autoScroll() {
    if (!drag || !drag.started) return;
    const top = 52 + 48; // topbar 高度 + 緩衝
    const bottom = window.innerHeight - 48;
    const dy = drag.y < top ? -Math.ceil((top - drag.y) / 4) : drag.y > bottom ? Math.ceil((drag.y - bottom) / 4) : 0;
    if (dy) { window.scrollBy(0, dy); updateTarget(); }
    drag.raf = requestAnimationFrame(autoScroll);
  }

  function endDrag(commit) {
    if (!drag) return;
    const d = drag;
    drag = null;
    cancelAnimationFrame(d.raf);
    document.body.classList.remove('is-dragging');
    if (!d.started) return;

    let result = null;
    if (commit && d.ph.isConnected) {
      const next = siblingTile(d.ph, 1);
      const prev = siblingTile(d.ph, -1);
      const group = d.ph.closest('.group');
      result = {
        beforeId: next ? next.dataset.id : undefined,
        afterId: !next && prev ? prev.dataset.id : undefined,
        room: deviceView === 'room' && group ? group.dataset.groupRoom : undefined,
      };
    }
    d.ph.remove();
    d.tile.classList.remove('dragging');
    d.tile.removeAttribute('style');
    document.querySelectorAll('#devices .group.drop-target').forEach((g) => g.classList.remove('drop-target'));

    const dev = hub.device(d.id);
    const fromRoom = dev.room;
    if (result && hub.moveTile(d.id, result)) {
      toast(dev.room !== fromRoom ? `${dev.name} 已移到「${dev.room}」` : `已調整 ${dev.name} 的位置`);
    } else {
      renderDevices(); // 沒有變動也要補上拖曳期間暫停的更新
    }
    refocus(`drag:${d.id}`);
  }

  document.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('[data-drag]');
    if (!handle || e.button !== 0) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const tile = handle.closest('.tile');
    drag = {
      id: handle.dataset.drag, tile, handle, pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY,
      originGroup: tile.closest('.group'), started: false,
    };
  });

  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
      startDrag();
    }
    drag.tile.style.transform = `translate(${e.clientX - drag.startX}px, ${e.clientY - drag.startY}px)`;
    updateTarget();
  });

  document.addEventListener('pointerup', (e) => { if (drag && e.pointerId === drag.pointerId) endDrag(true); });
  document.addEventListener('pointercancel', (e) => { if (drag && e.pointerId === drag.pointerId) endDrag(false); });

  document.addEventListener('keydown', (e) => {
    if (drag && e.key === 'Escape') { endDrag(false); return; }

    // 鍵盤排序：把手聚焦時用方向鍵與同一組的前後設備交換位置
    const handle = e.target.closest && e.target.closest('[data-drag]');
    if (!handle || drag) return;
    const dir = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const tile = handle.closest('.tile');
    const neighbor = siblingTile(tile, dir);
    if (!neighbor) return;
    const id = handle.dataset.drag;
    hub.moveTile(id, dir < 0 ? { beforeId: neighbor.dataset.id } : { afterId: neighbor.dataset.id });
    const tiles = [...tile.parentNode.querySelectorAll('.tile')];
    const pos = tiles.indexOf(neighbor) + 1;
    toast(`${hub.device(id).name} 移到第 ${pos} 個`);
  });

  // ---------- Room dialog（新增 / 編輯房間） ----------
  const dialog = $('room-dialog');
  const nameInput = $('room-name');
  const errorEl = $('room-error');
  const deleteBtn = $('room-delete');
  let editingRoom = null;
  let dialogOpener = null;

  function showRoomError(msg) {
    errorEl.textContent = msg || '';
    nameInput.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  // preselectId：從卡片的房間選單開啟時，預先勾選那台設備。
  function openRoomDialog(room, opener, preselectId) {
    editingRoom = room;
    dialogOpener = opener;
    $('room-dialog-title').textContent = room ? '編輯房間' : '新增房間';
    $('room-save').textContent = room ? '儲存' : '新增';
    nameInput.value = room || '';
    showRoomError('');
    deleteBtn.hidden = !room;
    deleteBtn.textContent = '刪除房間';
    deleteBtn.classList.remove('confirm');

    $('room-devices').innerHTML = hub.state.devices.map((d) => `
      <label class="pick">
        <input type="checkbox" value="${d.id}" ${(room && d.room === room) || d.id === preselectId ? 'checked' : ''}>
        <span class="pick-icon">${icon(d.type)}</span>
        <span class="pick-name">${esc(d.name)}</span>
        <span class="pick-from">${d.room === room ? '' : `目前：${esc(d.room)}`}</span>
      </label>`).join('');

    dialog.showModal();
    nameInput.focus();
    if (room) nameInput.select();
  }

  function closeRoomDialog() {
    dialog.close();
    if (dialogOpener && dialogOpener.isConnected) dialogOpener.focus();
  }

  $('room-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const ids = [...$('room-devices').querySelectorAll('input:checked')].map((x) => x.value);
    const name = nameInput.value.trim();
    const err = hub.saveRoom(editingRoom, name, ids);
    if (err) { showRoomError(err); nameInput.focus(); return; }

    if (deviceView === 'room' && roomFilter === editingRoom) roomFilter = name;
    saveView();
    renderDevices();
    dialog.close();
    toast(editingRoom ? `已更新房間「${name}」` : `已新增房間「${name}」${ids.length ? `，放入 ${ids.length} 台設備` : ''}`);
    refocus(`room:${name}`);
  });

  nameInput.addEventListener('input', () => showRoomError(''));
  $('room-cancel').addEventListener('click', closeRoomDialog);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeRoomDialog(); }); // 點背景關閉

  // 刪除需要按兩次確認
  deleteBtn.addEventListener('click', () => {
    if (!deleteBtn.classList.contains('confirm')) {
      const n = hub.state.devices.filter((d) => d.room === editingRoom).length;
      deleteBtn.classList.add('confirm');
      deleteBtn.textContent = n ? `確定刪除？${n} 台設備會移到「${UNASSIGNED}」` : '確定刪除？';
      return;
    }
    const name = editingRoom;
    hub.deleteRoom(name);
    if (roomFilter === name) roomFilter = '';
    saveView();
    renderDevices();
    dialog.close();
    toast(`已刪除房間「${name}」`);
    refocus('add-room');
  });

  // ---------- Top nav：捲動時標示目前區塊 ----------
  const navLinks = [...document.querySelectorAll('.topnav-link')];
  function setCurrentNav(id) {
    navLinks.forEach((l) => {
      if (l.getAttribute('href') === `#${id}`) l.setAttribute('aria-current', 'true');
      else l.removeAttribute('aria-current');
    });
  }
  // 網路面板在寬螢幕會和設備並排（sticky），位置不準，所以並排時跟著「設備」那一列判斷。
  let lastNavClick = null;
  function updateNav() {
    const sideBySide = getComputedStyle($('network-section')).position === 'sticky';
    const ids = sideBySide ? ['overview', 'devices-section', 'clients-section'] : ['overview', 'devices-section', 'network-section', 'clients-section'];
    let current = 'overview';
    for (const id of ids) if ($(id).getBoundingClientRect().top <= 140) current = id;
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = 'clients-section';
    if (current !== 'devices-section') lastNavClick = null;
    else if (sideBySide && lastNavClick === 'network-section') current = 'network-section';
    setCurrentNav(current);
  }
  navLinks.forEach((l) => l.addEventListener('click', () => { lastNavClick = l.getAttribute('href').slice(1); }));
  window.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav);
  updateNav();

  // ---------- Theme ----------
  const THEMES = [['auto', 'contrast', '跟隨系統'], ['light', 'sun', '淺色'], ['dark', 'moon', '深色']];
  let theme = 'auto';
  try { theme = localStorage.getItem('hub-theme') || 'auto'; } catch (_) { /* 無法存取 storage 時用預設值 */ }

  function applyTheme() {
    const [, ic, name] = THEMES.find(([k]) => k === theme) || THEMES[0];
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    const b = $('theme-toggle');
    b.innerHTML = icon(ic);
    b.setAttribute('aria-label', `色彩：${name}（點擊切換）`);
    b.title = `色彩：${name}`;
  }

  $('theme-toggle').addEventListener('click', () => {
    const i = THEMES.findIndex(([k]) => k === theme);
    theme = THEMES[(i + 1) % THEMES.length][0];
    try { localStorage.setItem('hub-theme', theme); } catch (_) { /* 忽略 */ }
    applyTheme();
  });

  // ---------- Clock ----------
  const clockFmt = new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const updateClock = () => { $('clock').textContent = clockFmt.format(new Date()); };

  // ---------- Boot ----------
  applyTheme();
  updateClock();
  setInterval(updateClock, 15000);
  buildShell();
  render();
  hub.subscribe(render);
})();
