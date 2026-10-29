# 建立 Home Assistant OS 虛擬機（Hyper-V）
#
# 前置條件：
#   1. 已啟用 Hyper-V 並重開機
#   2. 已從 https://github.com/home-assistant/operating-system/releases 下載
#      haos_ova-<版本>.vhdx.zip 並解壓縮出 .vhdx
#
# 用法（以系統管理員身分開啟 PowerShell）：
#   .\create-ha-vm.ps1 -VhdxPath "E:\HyperV\haos_ova-xx.x.vhdx"

param(
  [Parameter(Mandatory)] [string] $VhdxPath,
  [string] $VmName = 'HomeAssistant',
  [string] $SwitchName = 'HA-External',
  [string] $NetAdapterName = '乙太網路',
  [int64]  $MemoryBytes = 4GB,
  [int]    $CpuCount = 2
)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw '請以系統管理員身分執行這個指令碼。' }
if (-not (Get-Command New-VM -ErrorAction SilentlyContinue)) { throw '找不到 Hyper-V 指令，請先啟用 Hyper-V 並重開機。' }
if (-not (Test-Path $VhdxPath)) { throw "找不到磁碟檔：$VhdxPath" }
if (Get-VM -Name $VmName -ErrorAction SilentlyContinue) { throw "已經有名為 $VmName 的虛擬機。" }

# 外部虛擬交換器：讓 HA 直接出現在家裡的網段，才能被 UDM SE 配發 IP、發現 HomePod 等設備。
# 建立時這台電腦的網路會斷線幾秒。
if (-not (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue)) {
  Write-Host "建立外部虛擬交換器 $SwitchName（綁定 $NetAdapterName，網路會短暫中斷）..."
  New-VMSwitch -Name $SwitchName -NetAdapterName $NetAdapterName -AllowManagementOS $true | Out-Null
}

Write-Host "建立虛擬機 $VmName ..."
New-VM -Name $VmName -Generation 2 -MemoryStartupBytes $MemoryBytes -VHDPath $VhdxPath -SwitchName $SwitchName | Out-Null
Set-VMProcessor -VMName $VmName -Count $CpuCount
Set-VMMemory -VMName $VmName -DynamicMemoryEnabled $false   # 固定記憶體，避免執行中被主機回收
Set-VMFirmware -VMName $VmName -EnableSecureBoot Off        # HA OS 無法在 Secure Boot 下開機
Set-VM -Name $VmName -AutomaticStartAction Start -AutomaticStopAction ShutDown -CheckpointType Disabled

Start-VM -Name $VmName
Write-Host ''
Write-Host '已啟動。約 3–5 分鐘後開啟 http://homeassistant.local:8123'
Write-Host '打不開的話，到 UDM SE 的用戶端清單找 homeassistant 的 IP，改開 http://<IP>:8123'
