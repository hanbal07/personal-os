# E2E: password change flow on live API.
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
$ErrorActionPreference = "Stop"
$base  = "https://app-production-4569.up.railway.app"
$email = "user@personalos.dev"
$orig  = "password"
$tempPw = "TmpQA#2026x"
$jar   = Join-Path $env:TEMP "pw-e2e.txt"
$curl  = "C:\Windows\System32\curl.exe"
if (Test-Path $jar) { Remove-Item $jar -Force }

function Login($pw) {
    Remove-Item $jar -Force -ErrorAction SilentlyContinue
    $t = (& $curl -s -c $jar "$base/api/auth/csrf" | ConvertFrom-Json).csrfToken
    & $curl -s -o NUL -b $jar -c $jar -X POST "$base/api/auth/callback/credentials" `
        -H "Content-Type: application/x-www-form-urlencoded" `
        --data-urlencode "email=$email" --data-urlencode "password=$pw" `
        --data-urlencode "csrfToken=$t" --data-urlencode "callbackUrl=$base/dashboard"
    return (Select-String -LiteralPath $jar -Pattern "next-auth.session-token" -Quiet)
}
function Api-Post($path, $body) {
    $esc = ($body | ConvertTo-Json -Compress) -replace '"', '\"'
    $r = & $curl -s -w "`n%{http_code}" -b $jar -X POST -H "Content-Type: application/json" -d $esc "$base$path"
    $parts = $r -split "`n"
    [pscustomobject]@{ code = [int]$parts[-1]; body = ($parts[0..($parts.Count-2)] -join "") | ConvertFrom-Json }
}

$results = @()
if (-not (Login $orig)) { throw "initial login failed" }
"LOGIN OK"

# 1. wrong current password -> 401
$r = Api-Post "/api/auth/change-password" @{ currentPassword = "WrongPass123"; newPassword = $tempPw; confirmPassword = $tempPw }
if ($r.code -eq 401) { $results += "PASS wrong current rejected (401)" } else { $results += "FAIL wrong current: $($r.code) $($r.body)" }

# 2. short new password -> 400
$r = Api-Post "/api/auth/change-password" @{ currentPassword = $orig; newPassword = "short"; confirmPassword = "short" }
if ($r.code -eq 400) { $results += "PASS short password rejected (400)" } else { $results += "FAIL short: $($r.code)" }

# 3. mismatched confirm -> 400
$r = Api-Post "/api/auth/change-password" @{ currentPassword = $orig; newPassword = $tempPw; confirmPassword = "Different999" }
if ($r.code -eq 400) { $results += "PASS mismatched confirm rejected (400)" } else { $results += "FAIL mismatch: $($r.code)" }

# 4. same as current -> 400
$r = Api-Post "/api/auth/change-password" @{ currentPassword = $orig; newPassword = $orig; confirmPassword = $orig }
if ($r.code -eq 400) { $results += "PASS same-as-current rejected (400)" } else { $results += "FAIL same-as-current: $($r.code)" }

# 5. valid change -> 200
$r = Api-Post "/api/auth/change-password" @{ currentPassword = $orig; newPassword = $tempPw; confirmPassword = $tempPw }
if ($r.code -eq 200 -and $r.body.success) { $results += "PASS valid change accepted (200)" } else { $results += "FAIL valid change: $($r.code) $($r.body | ConvertTo-Json -Compress)" }

# 6. old password no longer logs in / new one does
if (-not (Login $orig)) { $results += "PASS old password now rejected at login" } else { $results += "FAIL old password still works!" }
if (Login $tempPw)      { $results += "PASS new password logs in" } else { $results += "FAIL new password does not log in"; $results; throw "locked out - restoring manually" }

# 7. restore original
$r = Api-Post "/api/auth/change-password" @{ currentPassword = $tempPw; newPassword = $orig; confirmPassword = $orig }
if ($r.code -eq 200) { $results += "PASS original password restored" } else { $results += "FAIL restore: $($r.code)" }

if (Login $orig) { $results += "PASS final check: original credential active again" } else { $results += "FAIL final login with original" }

$results