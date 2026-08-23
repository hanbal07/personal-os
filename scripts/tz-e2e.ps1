# E2E: per-user timezone independence on live API (pure curl, PS5.1-safe quoting).
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
$ErrorActionPreference = "Stop"
$base  = "https://app-production-4569.up.railway.app"
$email = "user@personalos.dev"
$pass  = "password"
$jar   = Join-Path $env:TEMP "tz-e2e.txt"
$curl  = "C:\Windows\System32\curl.exe"
$node  = "C:\Users\tahir\AppData\Local\Temp\node\node-v22.23.2-win-x64\node.exe"
if (Test-Path $jar) { Remove-Item $jar -Force }

# ── login ────────────────────────────────────────────────────────────
$csrf = (& $curl -s -c $jar "$base/api/auth/csrf" | ConvertFrom-Json).csrfToken
$null = & $curl -s -o NUL -b $jar -c $jar -X POST "$base/api/auth/callback/credentials" `
    -H "Content-Type: application/x-www-form-urlencoded" `
    --data-urlencode "email=$email" --data-urlencode "password=$pass" `
    --data-urlencode "csrfToken=$csrf" --data-urlencode "callbackUrl=$base/dashboard"
if (-not (Select-String -LiteralPath $jar -Pattern "next-auth.session-token" -Quiet)) { throw "login failed" }
"LOGIN OK"

function Api-Get($path) { & $curl -s -b $jar "$base$path" | ConvertFrom-Json }
# PS 5.1 strips inner quotes from native args -> escape them for curl.
function Json-Esc($obj) { ($obj | ConvertTo-Json -Compress) -replace '"', '\"' }
function Api-Method($verb, $path, $body) {
    & $curl -s -b $jar -X $verb -H "Content-Type: application/json" -d (Json-Esc $body) "$base$path" | ConvertFrom-Json
}

$nzToday = [TimeZoneInfo]::ConvertTime([DateTime]::UtcNow, [TimeZoneInfo]::FindSystemTimeZoneById("New Zealand Standard Time")).ToString("yyyy-MM-dd")
$utcToday = [DateTime]::UtcNow.ToString("yyyy-MM-dd")
"NZ today: $nzToday | Server-UTC today: $utcToday"
if ($nzToday -eq $utcToday) { throw "precondition failed: NZ and UTC share a date right now; rerun between 04:00Z and 12:00Z" }
"DIVERGENCE CONFIRMED: NZ is one day ahead of server UTC"

# ── snapshot pre-state ───────────────────────────────────────────────
$snapNZ = (Api-Get "/api/quran?date=$nzToday").record
$snapUTC = (Api-Get "/api/quran?date=$utcToday").record
"HAD NZ RECORD ($nzToday): $($null -ne $snapNZ)"
"HAD UTC RECORD ($utcToday): $($null -ne $snapUTC)"

# ── flip tz to Pacific/Auckland ──────────────────────────────────────
$r1 = Api-Method PATCH "/api/settings" @{ timezone = "Pacific/Auckland" }
"TZ SET TO: $($r1.settings.timezone)"
if ($r1.settings.timezone -ne "Pacific/Auckland") { throw "tz patch failed" }

# ── POST with NO date -> must land on AUCKLAND's day, not UTC's ──────
$posted = Api-Method POST "/api/quran" @{ status = "COMPLETED"; pagesRead = 5 }
$postedDate = ([string]$posted.record.date).Substring(0,10)
"POSTED date=$postedDate status=$($posted.record.status) pages=$($posted.record.pagesRead)"

$results = @()
if ($postedDate -eq $nzToday) { $results += "PASS no-date POST landed on user-local day $nzToday (server UTC says $utcToday)" }
else { $results += "FAIL expected $nzToday got $postedDate" }

$defaultView = (Api-Get "/api/quran").record
if ($null -ne $defaultView -and ([string]$defaultView.date).Substring(0,10) -eq $nzToday -and $defaultView.pagesRead -eq 5) {
    $results += "PASS GET(no date) resolves via user tz and finds the record"
} else {
    $results += "FAIL GET(no date): $($defaultView | ConvertTo-Json -Compress)"
}

if ($null -ne $snapUTC) {
    $utcView = (Api-Get "/api/quran?date=$utcToday").record
    if ($utcView.status -eq $snapUTC.status -and $utcView.pagesRead -eq $snapUTC.pagesRead) {
        $results += "PASS existing $utcToday record untouched by the NZ-day POST"
    } else {
        $results += "FAIL $utcToday record changed! was $($snapUTC.status)/$($snapUTC.pagesRead) now $($utcView.status)/$($utcView.pagesRead)"
    }
} else {
    $utcView2 = (Api-Get "/api/quran?date=$utcToday").record
    if ($null -eq $utcView2) { $results += "PASS no bleed into $utcToday" }
    else { $results += "FAIL bleed into $utcToday" }
}
$results

# ── cleanup ──────────────────────────────────────────────────────────
if ($null -eq $snapNZ) {
    "CLEANUP: deleting test row for $nzToday"
    & $node --experimental-strip-types scripts/delete-quran-record.ts $nzToday
} else {
    "RESTORE: writing back snapshot"
    $null = Api-Method POST "/api/quran" @{ status = $snapNZ.status; pagesRead = $snapNZ.pagesRead }
}

# ── restore default tz + verify real data intact ─────────────────────
$r2 = Api-Method PATCH "/api/settings" @{ timezone = "Asia/Karachi" }
"FINAL TZ: $($r2.settings.timezone)"
$finalUTC = (Api-Get "/api/quran?date=$utcToday").record
if ($null -eq $snapUTC) {
    if ($null -eq $finalUTC) { "PASS $utcToday back to empty" } else { "FAIL leftover row on $utcToday" }
} elseif ($finalUTC.status -eq $snapUTC.status -and $finalUTC.pagesRead -eq $snapUTC.pagesRead) {
    "PASS real $utcToday data intact ($($finalUTC.status)/$($finalUTC.pagesRead))"
} else {
    "FAIL DATA CHANGED on $utcToday"
}
$leftover = (Api-Get "/api/quran?date=$nzToday").record
if ($null -eq $leftover) { "PASS no test residue on $nzToday" } else { "FAIL residue on ${nzToday}: $($leftover | ConvertTo-Json -Compress)" }