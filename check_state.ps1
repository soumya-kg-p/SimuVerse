# Check git state
Set-Location d:\Major_Project\simuverse\simuverse

echo "=== TRACKED FILES ==="
git ls-files

echo "=== STATUS ==="
git status --porcelain

echo "=== FULL ORIGIN LOG ==="
git log --oneline origin/main

echo "=== MERGE BASE ==="
git merge-base HEAD origin/main 2>$null
if ($LASTEXITCODE -ne 0) { echo "No common base" }