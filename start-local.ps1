$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$fitflowNode = Get-Command node -ErrorAction SilentlyContinue
if (-not $fitflowNode) { throw '需要先安装 Node.js 22 或更新版本。' }
& $fitflowNode.Source '--env-file-if-exists=.env' 'server.mjs'
