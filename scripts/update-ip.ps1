# Updates EXPO_PUBLIC_API_URL in .env with the current LAN IP.
# Run from the mobile/ directory: .\scripts\update-ip.ps1

$ip = (Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } |
       Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Error "No LAN IP found. Are you connected to WiFi?"
    exit 1
}

$envFile = Join-Path $PSScriptRoot "..\\.env"
$newLine = "EXPO_PUBLIC_API_URL=http://${ip}:5000/api/v1"

if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $updated = $content -replace "^EXPO_PUBLIC_API_URL=.*", $newLine
    $updated | Set-Content $envFile -Encoding utf8
} else {
    $newLine | Set-Content $envFile -Encoding utf8
}

Write-Host "Updated EXPO_PUBLIC_API_URL to http://${ip}:5000/api/v1"
Write-Host "Restart Expo (npx expo start) to apply."
