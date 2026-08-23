$base="https://app-production-4569.up.railway.app"
$jar="$env:TEMP\tz-dbg2.txt"
$curl="C:\Windows\System32\curl.exe"
Remove-Item $jar -Force -ErrorAction SilentlyContinue
$csrf = (& $curl -s -c $jar "$base/api/auth/csrf" | ConvertFrom-Json).csrfToken
& $curl -s -o NUL -b $jar -c $jar -X POST "$base/api/auth/callback/credentials" -H "Content-Type: application/x-www-form-urlencoded" --data-urlencode "email=user@personalos.dev" --data-urlencode "password=password" --data-urlencode "csrfToken=$csrf" --data-urlencode "callbackUrl=$base/dashboard"

function Api-Patch($path, $body) {
    Write-Host "RAW BODY ARG: [$body]"
    $raw = & $curl -s -b $jar -X PATCH -H "Content-Type: application/json" -d $body "$base$path"
    Write-Host "RAW RESP: [$raw]"
    return ($raw | ConvertFrom-Json)
}
$r = Api-Patch "/api/settings" '{"timezone":"Asia/Karachi"}'
Write-Host "PARSED TZ: $($r.settings.timezone)"
