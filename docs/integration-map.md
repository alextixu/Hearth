# 設備整合對照表

架構：**Home Assistant（HA）為核心**，所有設備先接進 HA，再由我們的儀表板 / 自動化 / Siri 統一控制。

網段：`192.168.1.0/24`，閘道 `192.168.1.1`（UDM SE）。

| 設備 | 接入方式 | 本地 / 雲端 | 需要準備 | 風險 / 待確認 |
|------|---------|------------|---------|-------------|
| **UDM SE**（網路） | HA 內建 `UniFi Network` 整合 | 本地 | 在 UDM SE 建一個 HA 專用的**本地**帳號（不要用 Ubiquiti 雲端帳號、不要開 MFA 給它） | — |
| **小米掃地機器人** | `Xiaomi Home`（小米官方，HACS 安裝） | 雲端登入，LAN 控制可本地 | 小米帳號（米家地區：台灣） | 官方伺服器選項沒有 tw，台灣帳號要試 `sg`；不行就改用 `hass-xiaomi-miot`（有 tw 選項）或內建 `Xiaomi Miio` + 本地 token |
| **小米魚缸** | `Xiaomi Home`（同上） | 同上 | 同上 | 需確認型號有 MIoT spec 支援 |
| **Dyson 空氣清淨機 ×2** | `ha-dyson`（libdyson-wg，HACS） | 本地 MQTT | MyDyson 帳號（新機型沒有 Wi-Fi 貼紙，要靠帳號取得憑證）；**型號** | TP07 / TP09 / HP07 / HP09 有已知韌體 bug，連線可能被佔滿 |
| **Dyson Spot+Scrub Ai**（RB05） | `cmgrayb/hass-dyson`（HACS），或專用的 `ha-dyson-spot-scrub` | 本地 MQTT | 機器已在 MyDyson App 註冊 | 從 HA 啟動只會吸塵、不會拖地（issue #491）；HA 看不到目前房間與清掃進度 |
| **LG 空氣清淨機** | HA 內建 `LG ThinQ` 整合 | 雲端 | 到 LG ThinQ 開發者網站申請 Personal Access Token | 斷網時無法控制 |
| **HomePod** | HA 內建 `Apple TV` 整合（播放/音量）＋ `HomeKit Bridge`（反向把所有設備給 Siri） | 本地 | Apple Home App | — |

## HomePod 的角色

HomeKit Bridge 會把 HA 裡的設備（Dyson、LG、小米）全部發布到 Apple 家庭 App，
之後可以直接對 HomePod 說「嘿 Siri，打開客廳空氣清淨機」，也能在 iPhone 家庭 App 控制。

## 參考

- [libdyson-wg/ha-dyson](https://github.com/libdyson-wg/ha-dyson)
- [cmgrayb/hass-dyson](https://github.com/cmgrayb/hass-dyson)（另一個 Dyson 整合，有掃地機分區清掃）
- [Xiaomi Home / Xiaomi Miio](https://www.home-assistant.io/integrations/xiaomi_miio/)
