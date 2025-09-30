@echo off
echo 🚀 Starting Spirit of Santa Image Migration...
echo.

cd /d "E:\spiritof"

echo 📊 Current statistics:
node migrate-images.js stats
echo.

echo 🔄 Running migration...
node migrate-images.js migrate

echo.
echo 📊 Final statistics:
node migrate-images.js stats

echo.
echo ✅ Migration completed!
pause