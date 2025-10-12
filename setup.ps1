# 🚀 سكريبت الإعداد السريع - Quick Setup Script
# نظام إدارة الأدوار - Queue Management System

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🏥 نظام إدارة الأدوار - تثبيت تلقائي" -ForegroundColor Green
Write-Host "   Queue Management System - Auto Setup" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. التحقق من ملف .env
Write-Host "⚙️  الخطوة 1: التحقق من إعدادات البيئة..." -ForegroundColor Yellow

if (-Not (Test-Path ".env")) {
    Write-Host "   📝 إنشاء ملف .env..." -ForegroundColor White
    
    # سؤال المستخدم عن نوع قاعدة البيانات
    Write-Host ""
    Write-Host "   اختر نوع قاعدة البيانات:" -ForegroundColor Cyan
    Write-Host "   1. SQLite (سهل - لا يحتاج MySQL) [موصى به]" -ForegroundColor Green
    Write-Host "   2. MySQL (يحتاج XAMPP أو MySQL مثبت)" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host "   اختيارك (1 أو 2)"
    
    if ($choice -eq "2") {
        Write-Host "   📝 إنشاء .env لـ MySQL..." -ForegroundColor White
        $dbUrl = Read-Host "   أدخل DATABASE_URL (أو اضغط Enter للافتراضي)"
        if ([string]::IsNullOrWhiteSpace($dbUrl)) {
            $dbUrl = "mysql://root:@localhost:3306/waiting_system"
        }
        
        @"
DATABASE_URL="$dbUrl"
PORT=3003
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding utf8
        
        Write-Host "   ✅ تم إنشاء .env لـ MySQL" -ForegroundColor Green
        Write-Host "   ⚠️  تأكد من تشغيل MySQL قبل المتابعة!" -ForegroundColor Yellow
        Write-Host "   اضغط Enter للمتابعة..." -ForegroundColor Yellow
        Read-Host
        
    } else {
        Write-Host "   📝 إنشاء .env لـ SQLite..." -ForegroundColor White
        @"
DATABASE_URL="file:./dev.db"
PORT=3003
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding utf8
        
        Write-Host "   ✅ تم إنشاء .env لـ SQLite" -ForegroundColor Green
        
        # تعديل schema.prisma
        Write-Host "   📝 تعديل Prisma Schema لـ SQLite..." -ForegroundColor White
        $schemaPath = "prisma\schema.prisma"
        $schemaContent = Get-Content $schemaPath -Raw
        $schemaContent = $schemaContent -replace 'provider\s*=\s*"mysql"', 'provider = "sqlite"'
        $schemaContent | Out-File -FilePath $schemaPath -Encoding utf8 -NoNewline
        Write-Host "   ✅ تم تحديث Prisma Schema" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ ملف .env موجود" -ForegroundColor Green
}

Write-Host ""

# 2. تثبيت المكتبات
Write-Host "⚙️  الخطوة 2: التحقق من المكتبات..." -ForegroundColor Yellow

if (-Not (Test-Path "node_modules")) {
    Write-Host "   📦 تثبيت مكتبات Backend..." -ForegroundColor White
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ فشل تثبيت مكتبات Backend" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ تم تثبيت مكتبات Backend" -ForegroundColor Green
} else {
    Write-Host "   ✅ مكتبات Backend موجودة" -ForegroundColor Green
}

Write-Host ""

# 3. إعداد قاعدة البيانات
Write-Host "⚙️  الخطوة 3: إعداد قاعدة البيانات..." -ForegroundColor Yellow

Write-Host "   📊 تطبيق المايجريشن..." -ForegroundColor White
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ فشل تطبيق المايجريشن" -ForegroundColor Red
    Write-Host "   💡 تأكد من أن قاعدة البيانات تعمل" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✅ تم تطبيق المايجريشن" -ForegroundColor Green

Write-Host "   📝 ملء البيانات الأولية..." -ForegroundColor White
npx ts-node prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ فشل ملء البيانات الأولية" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ تم ملء البيانات الأولية" -ForegroundColor Green

Write-Host ""

# 4. إعداد Frontend
Write-Host "⚙️  الخطوة 4: إعداد Frontend..." -ForegroundColor Yellow

if (-Not (Test-Path "web\node_modules")) {
    Write-Host "   📦 تثبيت مكتبات Frontend..." -ForegroundColor White
    Set-Location web
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ فشل تثبيت مكتبات Frontend" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
    Write-Host "   ✅ تم تثبيت مكتبات Frontend" -ForegroundColor Green
} else {
    Write-Host "   ✅ مكتبات Frontend موجودة" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ اكتمل الإعداد بنجاح!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 لتشغيل النظام:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "   Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "   cd web" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📋 أو استخدم السكريبتات الجاهزة:" -ForegroundColor Yellow
Write-Host "   .\start-backend.ps1   - لتشغيل Backend" -ForegroundColor White
Write-Host "   .\start-frontend.ps1  - لتشغيل Frontend" -ForegroundColor White
Write-Host "   .\start-all.ps1       - لتشغيل الاثنين معاً" -ForegroundColor White
Write-Host ""
Write-Host "🌐 الروابط:" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:3003" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "بالتوفيق! 🎉" -ForegroundColor Green
Write-Host ""

