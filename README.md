# 爐光 Hearth

家庭中樞：統一控制家中所有智慧設備與網路。

## 目標（草案）

- **設備控制**：清淨機、掃地機、魚缸、音響等，集中在一個介面操作
- **網路管理**：查看連線裝置、頻寬使用、封鎖/限制特定裝置、偵測陌生裝置
- **自動化**：依時間、感測器、有人在家與否觸發情境
- **介面**：家人都能用的網頁儀表板（手機、電腦皆可）
- **本地優先**：核心功能不依賴雲端，斷網時仍可運作

## 目前狀態

控制面板已完成，但使用的是**模擬資料**，尚未串接真實設備。後端預計以 Home Assistant 為核心。

- 需求：[docs/requirements.md](docs/requirements.md)
- 設備接法：[docs/integration-map.md](docs/integration-map.md)
- 控制面板：[dashboard/](dashboard/)

## 本機預覽

```bash
python -m http.server 8770 --directory dashboard
```

然後開 http://localhost:8770 。

## 部署到 Linux 伺服器

伺服器需要 Docker 與 docker compose，並且能用 SSH 金鑰登入。

```powershell
.\scripts\deploy.ps1 -Server <使用者>@<伺服器 IP>
```

指令碼會把 `dashboard/` 與 `deploy/` 上傳到伺服器的 `~/hearth`，以 nginx 容器提供服務，連接埠 8770。

## 目錄

| 路徑 | 內容 |
|------|------|
| `dashboard/` | 控制面板（純 HTML / CSS / JS，無需建置） |
| `deploy/` | Docker Compose 與 nginx 設定 |
| `scripts/deploy.ps1` | 部署到 Linux 伺服器 |
| `scripts/create-ha-vm.ps1` | 在 Windows Hyper-V 建立 Home Assistant 虛擬機 |
| `docs/` | 需求與設備整合規劃 |
