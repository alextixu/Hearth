# 把控制面板部署到家裡的 Linux 伺服器（Docker + nginx）
#
# 前置條件：
#   1. 這台電腦能用 SSH 金鑰登入伺服器（不需輸入密碼）
#   2. 伺服器已安裝 Docker 與 docker compose，且登入的使用者能執行 docker
#
# 用法：
#   .\scripts\deploy.ps1 -Server <使用者>@192.168.1.52

param(
  [Parameter(Mandatory)] [string] $Server,
  [string] $RemoteDir = '~/hearth'
)

# 不用 'Stop'：Windows PowerShell 5.1 會把外部程式寫到 stderr 的進度訊息
# （例如 docker 下載映像檔）當成錯誤而中斷。成敗一律看 $LASTEXITCODE。
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$archive = Join-Path $env:TEMP 'hearth-deploy.tgz'

function Invoke-Native([string] $what) {
  if ($LASTEXITCODE -ne 0) { throw "$what 失敗（exit $LASTEXITCODE）" }
}

Write-Host '打包 dashboard 與 deploy ...'
tar -czf $archive -C $root dashboard deploy
Invoke-Native '打包'

Write-Host "上傳到 $Server ..."
scp -q $archive "${Server}:/tmp/hearth-deploy.tgz"
Invoke-Native '上傳'

# 舊的 dashboard 整個換掉，再重建面板容器讓 bind mount 指到新目錄。
# Home Assistant 的資料在 data/，不會被刪；它只在第一次部署時建立，之後不會因為部署而重啟。
$remote = @"
set -e
command -v docker >/dev/null || { echo 'docker is not installed on the server' >&2; exit 1; }
mkdir -p $RemoteDir/data/homeassistant
rm -rf $RemoteDir/dashboard $RemoteDir/deploy
tar -xzf /tmp/hearth-deploy.tgz -C $RemoteDir
rm -f /tmp/hearth-deploy.tgz
cd $RemoteDir/deploy
docker compose pull --quiet
docker compose up -d
docker compose up -d --force-recreate --no-deps hearth-web
docker compose ps
"@ -replace "`r", ''

Write-Host '在伺服器上啟動 ...'
ssh $Server $remote
Invoke-Native '遠端部署'

Remove-Item $archive -ErrorAction SilentlyContinue
$hostOnly = ($Server -split '@')[-1]
Write-Host ''
Write-Host "控制面板：      http://${hostOnly}:8770"
Write-Host "Home Assistant：http://${hostOnly}:8123（第一次啟動約需 1–3 分鐘）"
