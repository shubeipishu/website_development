# ============================================================
# VPS 部署打包脚本
# 作用: 将项目文件压缩为 zip，方便上传到 1Panel
# 自动排除: .venv, .git, __pycache__ 等无关文件
# ============================================================

$ErrorActionPreference = "Stop"
$outputZip = "deploy_package.zip"

Write-Host "正在准备打包..." -ForegroundColor Cyan

# 1. 清理旧的压缩包
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
    Write-Host "清理旧的 $outputZip" -ForegroundColor Gray
}

# 2. 定义排除列表 (不做复制和压缩的目录/文件)
$excludePatterns = @(
    ".git",
    ".idea",
    ".venv",
    "venv",
    "__pycache__",
    "*.pyc",
    "node_modules",
    "*.log",
    ".DS_Store",
    $outputZip
)

# 3. 获取当前目录下所有文件
$files = Get-ChildItem -Path . -Recurse

# 4. 过滤文件
$filesToZip = $files | Where-Object {
    $relativePath = $_.FullName.Substring($PWD.Path.Length + 1)
    $shouldExclude = $false
    
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like "*$pattern*" -or $relativePath -match "\\$pattern\\") {
            $shouldExclude = $true
            break
        }
    }
    
    # 只有当它不是被排除的，且不是文件夹本身（Compress-Archive 会自动处理结构）时才保留
    # 但 Compress-Archive 接受目录作为输入会更好，这里我们改用更简单的方法：
    # 直接排除根目录下的特定文件夹，然后压缩剩余的
    return $false # 这种逐个筛选对 Compress-Archive 并不友好
}

# 重新策略：使用 Compress-Archive 并指定排除并不容易。
# 更简单的方法：临时创建一个 build 目录，复制需要的文件，压缩，然后删除目录。

$tempDir = "temp_build_folder"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "正在筛选文件..." -ForegroundColor Cyan

# 手动复制需要的文件/文件夹
$items = Get-ChildItem -Path . -Directory
foreach ($item in $items) {
    if ($excludePatterns -notcontains $item.Name) {
        Write-Host "  包含目录: $($item.Name)" -ForegroundColor Green
        Copy-Item -Path $item.FullName -Destination "$tempDir\$($item.Name)" -Recurse
    } else {
        Write-Host "  跳过目录: $($item.Name)" -ForegroundColor Yellow
    }
}

$files = Get-ChildItem -Path . -File
foreach ($file in $files) {
    if ($excludePatterns -notcontains $file.Name) {
        Copy-Item -Path $file.FullName -Destination "$tempDir\$($file.Name)"
    }
}

# 5. 压缩
Write-Host "正在压缩..." -ForegroundColor Cyan
Compress-Archive -Path "$tempDir\*" -DestinationPath $outputZip

# 6. 清理
Remove-Item $tempDir -Recurse -Force

Write-Host "------------------------------------------------------------" -ForegroundColor Green
Write-Host "打包完成! 请将 [$outputZip] 上传到您的 VPS 并解压。" -ForegroundColor Green
Write-Host "------------------------------------------------------------" -ForegroundColor Green
