// 模擬資料：尚未連接 Home Assistant。
// 之後串接時，這份資料會改由 HA 的 WebSocket API 提供，欄位盡量對齊 HA 的 entity 狀態。
window.HUB_MOCK = {
  // 房間順序；之後對應 HA 的 Area。
  rooms: ['客廳', '主臥', '書房', '全屋'],

  devices: [
    {
      id: 'dyson_purifier_living', type: 'purifier', brand: 'Dyson', name: 'Dyson 清淨機', room: '客廳',
      speeds: 10, oscillate: true,
      state: { on: true, pm25: 11, speed: 4, auto: true, oscillating: true },
    },
    {
      id: 'dyson_purifier_bedroom', type: 'purifier', brand: 'Dyson', name: 'Dyson 清淨機', room: '主臥',
      speeds: 10, oscillate: true,
      state: { on: false, pm25: 23, speed: 3, auto: false, oscillating: false },
    },
    {
      id: 'lg_purifier', type: 'purifier', brand: 'LG', name: 'LG 清淨機', room: '書房',
      modes: [['auto', '自動'], ['sleep', '睡眠'], ['turbo', '強力']],
      state: { on: true, pm25: 8, mode: 'auto' },
    },
    {
      id: 'xiaomi_vacuum', type: 'vacuum', brand: '小米', name: '小米掃地機器人', room: '全屋',
      state: { status: 'docked', battery: 100, area: 0 },
    },
    {
      id: 'dyson_spot_scrub', type: 'vacuum', brand: 'Dyson', name: 'Spot+Scrub Ai', room: '全屋',
      cleanModes: [['vacuum', '吸塵'], ['vacuum_mop', '吸塵＋拖地']],
      note: '社群整合目前從 HA 啟動只會吸塵，拖地需由 MyDyson App 啟動',
      state: { status: 'docked', battery: 82, area: 0, mode: 'vacuum' },
    },
    {
      id: 'xiaomi_aquarium', type: 'aquarium', brand: '小米', name: '智慧魚缸', room: '客廳',
      state: { light: true, brightness: 70, pump: true, lastFed: Date.now() - 1000 * 60 * 260 },
    },
    {
      id: 'homepod', type: 'speaker', brand: 'Apple', name: 'HomePod', room: '客廳',
      state: { playing: true, volume: 35, title: '晚餐輕爵士', artist: '播放清單' },
    },
  ],

  network: {
    gateway: { name: 'UDM SE', ip: '192.168.1.1', online: true, uptimeSec: 60 * 60 * 24 * 12 + 60 * 60 * 5, downMbps: 42, upMbps: 9 },
    clients: [
      { id: 'c_pc', name: '工作電腦（這台）', ip: '192.168.1.50', kind: 'computer', conn: '有線', usageMB: 3820 },
      { id: 'c_iphone1', name: 'iPhone', ip: '192.168.1.21', kind: 'phone', conn: 'Wi-Fi 5 GHz', usageMB: 1240 },
      { id: 'c_iphone2', name: 'iPhone (2)', ip: '192.168.1.22', kind: 'phone', conn: 'Wi-Fi 5 GHz', usageMB: 860 },
      { id: 'c_ipad', name: 'iPad', ip: '192.168.1.23', kind: 'phone', conn: 'Wi-Fi 5 GHz', usageMB: 2310 },
      { id: 'c_homepod', name: 'HomePod', ip: '192.168.1.30', kind: 'iot', conn: 'Wi-Fi 5 GHz', usageMB: 410, deviceId: 'homepod' },
      { id: 'c_dyson1', name: 'Dyson 清淨機（客廳）', ip: '192.168.1.41', kind: 'iot', conn: 'Wi-Fi 2.4 GHz', usageMB: 6, deviceId: 'dyson_purifier_living' },
      { id: 'c_dyson2', name: 'Dyson 清淨機（主臥）', ip: '192.168.1.42', kind: 'iot', conn: 'Wi-Fi 2.4 GHz', usageMB: 4, deviceId: 'dyson_purifier_bedroom' },
      { id: 'c_dyson3', name: 'Dyson Spot+Scrub Ai', ip: '192.168.1.43', kind: 'iot', conn: 'Wi-Fi 2.4 GHz', usageMB: 18, deviceId: 'dyson_spot_scrub' },
      { id: 'c_lg', name: 'LG 清淨機', ip: '192.168.1.44', kind: 'iot', conn: 'Wi-Fi 2.4 GHz', usageMB: 3, deviceId: 'lg_purifier' },
      { id: 'c_mivac', name: '小米掃地機器人', ip: '192.168.1.45', kind: 'iot', conn: 'Wi-Fi 2.4 GHz', usageMB: 12, deviceId: 'xiaomi_vacuum' },
      { id: 'c_mitank', name: '小米智慧魚缸', ip: '192.168.1.46', kind: 'iot', conn: 'Wi-Fi 2.4 GHz', usageMB: 2, deviceId: 'xiaomi_aquarium' },
      { id: 'c_unknown', name: 'ESP_3A9F1C', ip: '192.168.1.87', kind: 'unknown', conn: 'Wi-Fi 2.4 GHz', usageMB: 1, isNew: true },
    ],
  },
};
