$ErrorActionPreference = 'Continue'
$log = "E:\New folder (2)\browser\ask-run.log"
"=== start $(Get-Date -Format 'HH:mm:ss') ===" | Out-File $log -Encoding utf8
Set-Location "E:\New folder (2)\browser"
"cwd=$PWD" | Out-File $log -Append -Encoding utf8
node aistudio.mjs ask "Salam! Yek jomle farsi begu amade hasti va yek idea kutah baraye landing-page yek sherkat logistic bede" 2>&1 | Out-File $log -Append -Encoding utf8
"=== exit code: $LASTEXITCODE at $(Get-Date -Format 'HH:mm:ss') ===" | Out-File $log -Append -Encoding utf8
