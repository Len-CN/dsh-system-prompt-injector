<#
.SYNOPSIS
  从指定 DSH profile 移除 dsh-system-prompt-injector。
#>
param(
  [string]$Profile = 'desktop'
)

$ErrorActionPreference = 'Stop'

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
$profileDir = Join-Path $dshHome "profiles\$Profile"
$packagePath = Join-Path $profileDir 'package.json'

if (-not (Test-Path $packagePath)) {
  throw "找不到 profile：$profileDir"
}

$package = Get-Content $packagePath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($null -ne $package.dependencies -and ($package.dependencies.PSObject.Properties.Name -contains 'dsh-system-prompt-injector')) {
  $package.dependencies.PSObject.Properties.Remove('dsh-system-prompt-injector')
}
if ($null -ne $package.dsh -and $null -ne $package.dsh.profile -and $null -ne $package.dsh.profile.bundles) {
  $package.dsh.profile.bundles = @($package.dsh.profile.bundles | Where-Object { $_ -ne 'dsh-system-prompt-injector' })
}
$package | ConvertTo-Json -Depth 30 | Set-Content -Path $packagePath -Encoding UTF8
Write-Host "已从 $packagePath 移除 dsh-system-prompt-injector"
Write-Host '重启 DeepSeek Harness 后生效。规则文件保留在 ~/.dsh/dsh-system-prompt-injector.json，可手动删除。'
