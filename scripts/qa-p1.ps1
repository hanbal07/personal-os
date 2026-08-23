# P1 full regression suite.
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
$ErrorActionPreference = "Continue"
$base  = "https://app-production-4569.up.railway.app"
$email = "user@personalos.dev"
$pass  = "password"
$jar   = Join-Path $env:TEMP "qa-p1.txt"
$curl  = "C:\Windows\System32\curl.exe"
if (Test-Path $jar) { Remove-Item $jar -Force }

$t = (& $curl -s -c $jar "$base/api/auth/csrf" | ConvertFrom-Json).csrfToken
& $curl -s -o NUL -b $jar -c $jar -X POST "$base/api/auth/callback/credentials" `
    -H "Content-Type: application/x-www-form-urlencoded" `
    --data-urlencode "email=$email" --data-urlencode "password=$pass" `
    --data-urlencode "csrfToken=$t" --data-urlencode "callbackUrl=$base/dashboard"
if (-not (Select-String -LiteralPath $jar -Pattern "next-auth.session-token" -Quiet)) { throw "login failed" }
$anonJar = Join-Path $env:TEMP "qa-p1-anon.txt"

$results = @()
function Check($name, $ok, $detail = "") {
    if ($ok) { $script:results += "PASS $name" } else { $script:results += "FAIL $name :: $detail" }
}
function Page($path) {
    [int](& $curl -s -o NUL -w "%{http_code}" -b $jar "$base$path")
}
function Api($path, $anon = $false) {
    $j = if ($anon) { $anonJar } else { $jar }
    & $curl -s -b $j "$base$path"
}

# ── pages ────────────────────────────────────────────────────────────
foreach ($p in @("/dashboard","/routine","/health","/quran","/learning","/projects","/analytics","/review","/settings","/history")) {
    $code = Page $p
    Check "page $p -> 200" ($code -eq 200) "got $code"
}

# ── APIs return success shape ────────────────────────────────────────
$d = Api "/api/dashboard" | ConvertFrom-Json
Check "dashboard summary+habits" ($null -ne $d.summary -and $d.habits.total -gt 0) ($d | ConvertTo-Json -Compress)
Check "dashboard date is PK today" ($d.date -eq [TimeZoneInfo]::ConvertTime([DateTime]::UtcNow,[TimeZoneInfo]::FindSystemTimeZoneById("Pakistan Standard Time")).ToString("yyyy-MM-dd")) "got $($d.date)"

$r = Api "/api/routine" | ConvertFrom-Json
Check "routine tasks (habits) non-empty" ($r.tasks.Count -gt 0) "tasks=$($r.tasks.Count)"

$h = Api "/api/health" | ConvertFrom-Json
Check "health returns object" ($null -ne $h.water -or $null -ne $h.meals -or $null -ne $h.sleep) ($h | ConvertTo-Json -Compress)

$q = Api "/api/quran" | ConvertFrom-Json
Check "quran record present" ($null -ne $q.record) ""

$dr = Api "/api/darood" | ConvertFrom-Json
Check "darood record.count present" ($null -ne $dr.record.count) ($dr | ConvertTo-Json -Compress)

$pr = Api "/api/prayers" | ConvertFrom-Json
Check "prayers list >=5" ($pr.prayers.Count -ge 5) "count=$($pr.prayers.Count)"

$l = Api "/api/learning" | ConvertFrom-Json
Check "learning sessions array" ($null -ne $l.sessions -or $null -ne $l.todaySessions) ($l.PSObject.Properties.Name -join ",")

$pj = Api "/api/projects" | ConvertFrom-Json
Check "projects list" ($null -ne $pj.projects) ""

$sk = Api "/api/skills" | ConvertFrom-Json
Check "skills list non-empty" ($sk.skills.Count -gt 0) ""
$firstId = ($sk.skills | Where-Object { $_.name -like "*Python*" } | Select-Object -First 1).id
if (-not $firstId) { $firstId = $sk.skills[0].id }
$st = Api "/api/skills/$firstId/topics" | ConvertFrom-Json
Check "skill topics endpoint" ($null -ne $st.topics -and $st.topics.Count -gt 0) "topics=$($st.topics.Count) skillId=$firstId"

$a7 = Api "/api/analytics?days=7" | ConvertFrom-Json
$a30 = Api "/api/analytics?days=30" | ConvertFrom-Json
Check "analytics 7d+30d shapes" (($a7.weeklyHours.Count -ge 0) -and ($null -ne $a30.summary.avgDiscipline)) "summary=$($a30.summary | ConvertTo-Json -Compress)"

$rv = Api "/api/review" | ConvertFrom-Json
Check "review payload" ($null -ne $rv) ($rv | ConvertTo-Json -Compress)

$hi = Api "/api/history?days=30" | ConvertFrom-Json
Check "history has entries" ($hi.history.Count -gt 0) "count=$($hi.history.Count)"
$aug22 = $hi.history | Where-Object { ([string]$_.date).StartsWith("2026-08-22") }
$aug23 = $hi.history | Where-Object { ([string]$_.date).StartsWith("2026-08-23") }
Check "history retains Aug 22 data" ($null -ne $aug22) ""
Check "history retains Aug 23 data" ($null -ne $aug23 -and $aug23.dayScore -eq 8) "score=$($aug23.dayScore)"

$s = Api "/api/settings" | ConvertFrom-Json
Check "settings timezone default restored" ($s.settings.timezone -eq "Asia/Karachi") "got $($s.settings.timezone)"

# ── validation & auth guards ────────────────────────────────────────
$bad = & $curl -s -o NUL -w "%{http_code}" -b $jar "$base/api/quran?date=not-a-date"
Check "invalid ?date rejected 400" ($bad -eq "400") "got $bad"
$unauth = & $curl -s -o NUL -w "%{http_code}" -b $anonJar "$base/api/dashboard"
Check "unauthenticated dashboard 401" ($unauth -eq "401") "got $unauth"
$cpUnauth = & $curl -s -o NUL -w "%{http_code}" -b $anonJar -X POST -H "Content-Type: application/json" -d "{}" "$base/api/auth/change-password"
Check "change-password guarded 401" ($cpUnauth -eq "401") "got $cpUnauth"
$badRange = & $curl -s -o NUL -w "%{http_code}" -b $jar "$base/api/history?days=99999"
Check "history clamps huge range (200)" ($badRange -eq "200") "got $badRange"

# ── write-path smoke (roundtrip, net zero change) ────────────────────
$cur = Api "/api/darood"
$before = $cur.record.count
$esc = (@{ increment = -1 } | ConvertTo-Json -Compress) -replace '"', '\"'
$inc = (& $curl -s -b $jar -X POST "$base/api/darood") | ConvertFrom-Json
$dec = (& $curl -s -b $jar -X POST -H "Content-Type: application/json" -d $esc "$base/api/darood") | ConvertFrom-Json
Check "darood inc/dec roundtrip preserves count" (($inc.record.count -eq $before + 1) -and ($dec.record.count -eq $before)) "before=$before inc=$($inc.record.count) dec=$($dec.record.count)"

$results
$failCount = ($results | Where-Object { $_ -like "FAIL*" }).Count
""
"TOTAL: $($results.Count) checks, $failCount failures"