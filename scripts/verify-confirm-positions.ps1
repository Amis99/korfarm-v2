param(
  [Parameter(Mandatory=$true)][string]$File,
  [Parameter(Mandatory=$true)][string[]]$Words
)
$d = Get-Content $File -Raw -Encoding UTF8 | ConvertFrom-Json
$paras = @{}
foreach ($p in $d.payload.passage.paragraphs) { $paras[$p.id] = $p.text }
foreach ($w in $Words) {
  foreach ($k in $paras.Keys) {
    $t = $paras[$k]
    $idx = 0
    while (($pos = $t.IndexOf($w, $idx)) -ge 0) {
      Write-Output ("{0} | {1} | start={2} end={3}" -f $w, $k, $pos, ($pos + $w.Length))
      $idx = $pos + 1
    }
  }
}
