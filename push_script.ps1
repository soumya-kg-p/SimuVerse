# SimuVerse git initialization and push
Set-Location d:\Major_Project\simuverse\simuverse

echo "=== COMMIT ==="
git commit -m "Initial commit: SimuVerse gamified training platform with 3 VR-ready simulations (A320 cockpit, laparoscopic trainer, fire extinguisher trainer)"
git log --oneline -3

echo "=== REMOTE ==="
git remote remove origin 2>$null
git remote add origin https://github.com/soumya-kg-p/SimuVerse.git
git remote -v

echo "=== BRANCH ==="
git branch -M main

echo "=== PUSH ==="
git push -u origin main