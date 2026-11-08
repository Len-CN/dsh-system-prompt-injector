<#
.SYNOPSIS
  将 dsh-system-prompt-injector 安装到指定 DSH profile。

.DESCRIPTION
  把插件目录以 link: 依赖写入 profile 的 package.json，并把包名加入
  dsh.profile.bundles，然后调用 profile 自带的 pnpm 安装依赖。安装完成后重启
  DeepSeek Harness；仅刷新 Web GUI 不会加载宿主插件。

.PARAMETER Profile
  profile 名称，默认 desktop。

.PARAMETER NoInstall
  只修改 package.json，不执行 pnpm install。
#>
param(
  [string]$Profile = 'desktop',
  [switch]$NoInstall
)

$ErrorActionPreference = 'Stop'

$pluginDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
$profileDir = Join-Path $dshHome "profiles\$Profile"
$packagePath = Join-Path $profileDir 'package.json'

if (-not (Test-Path $packagePath)) {
  throw "找不到 profile：$profileDir（请确认 -Profile 名称）"
}

$package = Get-Content $packagePath -Raw -Encoding UTF8 | ConvertFrom-Json
$linkTarget = 'link:' + ($pluginDir -replace '\\', '/')
$originalPackage = Get-Content $packagePath -Raw -Encoding UTF8
if (-not $NoInstall) {
  $node = Join-Path $dshHome 'dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe'
  $pnpm = Join-Path $dshHome 'dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.cjs'
  if (-not (Test-Path $node)) { $node = (Get-Command node -ErrorAction Stop).Source }
  if (-not (Test-Path $pnpm)) { throw "找不到内置 pnpm：$pnpm" }
}

if ($null -eq $package.dependencies) {
  $package | Add-Member -NotePropertyName dependencies -NotePropertyValue ([pscustomobject]@{})
}
$package.dependencies | Add-Member -NotePropertyName 'dsh-system-prompt-injector' -NotePropertyValue $linkTarget -Force

$bundles = [System.Collections.Generic.List[string]]::new()
foreach ($bundle in $package.dsh.profile.bundles) { $bundles.Add([string]$bundle) }
if (-not $bundles.Contains('dsh-system-prompt-injector')) {
  $bundles.Add('dsh-system-prompt-injector')
}
$package.dsh.profile.bundles = @($bundles)

$package | ConvertTo-Json -Depth 30 | Set-Content -Path $packagePath -Encoding UTF8
Write-Host "已写入依赖与 bundles：$packagePath"

if (-not $NoInstall) {
  Push-Location $profileDir
  try {
    & $node $pnpm install
    if ($LASTEXITCODE -ne 0) { throw "pnpm install 失败（exit $LASTEXITCODE）" }
  } catch {
    Set-Content -Path $packagePath -Value $originalPackage -Encoding UTF8 -NoNewline
    Write-Warning '安装失败，已恢复 profile/package.json；请检查 pnpm 报错并重新同步依赖。'
    throw
  } finally {
    Pop-Location
  }
  Write-Host ''
  Write-Host '安装完成。请完整重启 DeepSeek Harness，然后到：'
  Write-Host '  设置 → 系统提示词'
  Write-Host '添加你的第一条规则。'
} else {
  Write-Host ''
  Write-Host '已写入 package.json；按 -NoInstall 跳过了 pnpm install。请手动安装依赖后重启 DeepSeek Harness。'
}
