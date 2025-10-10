-- ═══════════════════════════════════════════════════════════════
-- 📊 أمثلة استعلامات SQL لنظام إدارة الأدوار
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1️⃣ استعلامات القوائم (Listing Queries)
-- ═══════════════════════════════════════════════════════════════

-- 1.1 قائمة المرضى المنتظرين لمحطة معينة
SELECT 
    q.queueNumber,
    p.name AS patientName,
    p.phoneNumber,
    q.priority,
    s.name AS stationName,
    TIMESTAMPDIFF(MINUTE, qh.createdAt, NOW()) AS waitingMinutes,
    qh.status
FROM queues q
INNER JOIN patients p ON q.patientId = p.id
INNER JOIN stations s ON q.currentStationId = s.id
INNER JOIN queue_history qh ON q.id = qh.queueId AND qh.stationId = s.id
WHERE 
    q.currentStationId = 1  -- رقم المحطة
    AND q.status = 'ACTIVE'
    AND qh.status = 'WAITING'
ORDER BY 
    q.priority DESC,
    q.queueNumber ASC;

-- 1.2 المريض الحالي في محطة معينة
SELECT 
    q.queueNumber,
    p.name AS patientName,
    qh.status,
    qh.calledAt,
    qh.startedAt,
    TIMESTAMPDIFF(MINUTE, qh.startedAt, NOW()) AS serviceMinutes
FROM queues q
INNER JOIN patients p ON q.patientId = p.id
INNER JOIN queue_history qh ON q.id = qh.queueId
WHERE 
    qh.stationId = 1  -- رقم المحطة
    AND qh.status IN ('CALLED', 'IN_PROGRESS')
LIMIT 1;

-- 1.3 جميع الأدوار النشطة
SELECT 
    q.id,
    q.queueNumber,
    p.name AS patientName,
    s.name AS currentStation,
    s.displayNumber,
    q.status,
    q.priority,
    q.createdAt
FROM queues q
INNER JOIN patients p ON q.patientId = p.id
INNER JOIN stations s ON q.currentStationId = s.id
WHERE q.status = 'ACTIVE'
ORDER BY q.queueNumber ASC;

-- 1.4 آخر رقم دور
SELECT value 
FROM system_settings 
WHERE `key` = 'LAST_QUEUE_NUMBER';

-- ═══════════════════════════════════════════════════════════════
-- 2️⃣ استعلامات الشاشة العامة (Display Queries)
-- ═══════════════════════════════════════════════════════════════

-- 2.1 آخر الاستدعاءات (للشاشة العامة)
SELECT 
    q.queueNumber,
    s.displayNumber,
    s.name AS stationName,
    qh.calledAt,
    qh.status
FROM queue_history qh
INNER JOIN queues q ON qh.queueId = q.id
INNER JOIN stations s ON qh.stationId = s.id
WHERE 
    qh.status IN ('CALLED', 'IN_PROGRESS')
    AND qh.calledAt IS NOT NULL
ORDER BY qh.calledAt DESC
LIMIT 10;

-- 2.2 الاستدعاءات في آخر 5 دقائق
SELECT 
    q.queueNumber,
    s.displayNumber,
    s.name AS stationName,
    qh.calledAt,
    p.name AS patientName
FROM queue_history qh
INNER JOIN queues q ON qh.queueId = q.id
INNER JOIN stations s ON qh.stationId = s.id
INNER JOIN patients p ON q.patientId = p.id
WHERE 
    qh.status = 'CALLED'
    AND qh.calledAt >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY qh.calledAt DESC;

-- ═══════════════════════════════════════════════════════════════
-- 3️⃣ إحصائيات اليوم (Today's Statistics)
-- ═══════════════════════════════════════════════════════════════

-- 3.1 إحصائيات اليوم الشاملة
SELECT 
    COUNT(*) AS completedToday,
    AVG(totalDuration) AS avgTotalDuration,
    AVG(waitingTime) AS avgWaitingTime,
    AVG(serviceTime) AS avgServiceTime,
    MIN(totalDuration) AS minDuration,
    MAX(totalDuration) AS maxDuration
FROM completed_visits
WHERE DATE(completedAt) = CURDATE();

-- 3.2 عدد الأدوار النشطة حالياً
SELECT COUNT(*) AS activeNow
FROM queues
WHERE 
    status = 'ACTIVE'
    AND DATE(createdAt) = CURDATE();

-- 3.3 عدد المرضى لكل محطة اليوم
SELECT 
    s.name AS stationName,
    s.displayNumber,
    COUNT(DISTINCT qh.queueId) AS patientsServed,
    AVG(TIMESTAMPDIFF(MINUTE, qh.startedAt, qh.completedAt)) AS avgServiceTime
FROM queue_history qh
INNER JOIN stations s ON qh.stationId = s.id
WHERE 
    DATE(qh.createdAt) = CURDATE()
    AND qh.status = 'COMPLETED'
GROUP BY s.id, s.name, s.displayNumber
ORDER BY s.order;

-- 3.4 الأدوار الملغاة اليوم
SELECT COUNT(*) AS cancelledToday
FROM queues
WHERE 
    status = 'CANCELLED'
    AND DATE(createdAt) = CURDATE();

-- ═══════════════════════════════════════════════════════════════
-- 4️⃣ تقارير المرضى (Patient Reports)
-- ═══════════════════════════════════════════════════════════════

-- 4.1 تاريخ زيارات مريض معين
SELECT 
    cv.queueNumber,
    cv.completedAt,
    cv.totalDuration,
    cv.waitingTime,
    cv.serviceTime,
    cv.stationsCount
FROM completed_visits cv
WHERE cv.patientId = 1  -- ID المريض
ORDER BY cv.completedAt DESC
LIMIT 10;

-- 4.2 البحث عن مريض برقم الهاتف
SELECT 
    p.id,
    p.name,
    p.phoneNumber,
    p.nationalId,
    COUNT(cv.id) AS totalVisits,
    MAX(cv.completedAt) AS lastVisit
FROM patients p
LEFT JOIN completed_visits cv ON p.id = cv.patientId
WHERE p.phoneNumber = '0501234567'
GROUP BY p.id, p.name, p.phoneNumber, p.nationalId;

-- 4.3 المرضى الأكثر زيارة
SELECT 
    p.name,
    p.phoneNumber,
    COUNT(cv.id) AS totalVisits,
    AVG(cv.totalDuration) AS avgDuration,
    MAX(cv.completedAt) AS lastVisit
FROM patients p
INNER JOIN completed_visits cv ON p.id = cv.patientId
GROUP BY p.id, p.name, p.phoneNumber
ORDER BY totalVisits DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- 5️⃣ تحليلات متقدمة (Advanced Analytics)
-- ═══════════════════════════════════════════════════════════════

-- 5.1 أوقات الذروة (حسب الساعة)
SELECT 
    HOUR(createdAt) AS hour,
    COUNT(*) AS queueCount,
    AVG(waitingTime) AS avgWaitTime
FROM completed_visits
WHERE DATE(completedAt) = CURDATE()
GROUP BY HOUR(createdAt)
ORDER BY hour;

-- 5.2 أداء المحطات (مقارنة)
SELECT 
    s.name AS stationName,
    COUNT(qh.id) AS totalProcessed,
    AVG(TIMESTAMPDIFF(MINUTE, qh.calledAt, qh.startedAt)) AS avgWaitToStart,
    AVG(TIMESTAMPDIFF(MINUTE, qh.startedAt, qh.completedAt)) AS avgServiceTime,
    SUM(CASE WHEN qh.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedCount,
    SUM(CASE WHEN qh.status = 'SKIPPED' THEN 1 ELSE 0 END) AS skippedCount
FROM stations s
LEFT JOIN queue_history qh ON s.id = qh.stationId
WHERE DATE(qh.createdAt) = CURDATE()
GROUP BY s.id, s.name
ORDER BY s.order;

-- 5.3 الإحصائيات الأسبوعية
SELECT 
    DATE(completedAt) AS date,
    COUNT(*) AS completedCount,
    AVG(totalDuration) AS avgDuration,
    AVG(waitingTime) AS avgWaitTime,
    AVG(serviceTime) AS avgServiceTime
FROM completed_visits
WHERE completedAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(completedAt)
ORDER BY date DESC;

-- 5.4 نسب الإكمال مقابل الإلغاء
SELECT 
    status,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM queues WHERE DATE(createdAt) = CURDATE()), 2) AS percentage
FROM queues
WHERE DATE(createdAt) = CURDATE()
GROUP BY status;

-- ═══════════════════════════════════════════════════════════════
-- 6️⃣ تتبع رحلة المريض (Patient Journey Tracking)
-- ═══════════════════════════════════════════════════════════════

-- 6.1 تتبع رحلة دور معين
SELECT 
    s.name AS stationName,
    s.displayNumber,
    qh.status,
    qh.createdAt AS arrivedAt,
    qh.calledAt,
    qh.startedAt,
    qh.completedAt,
    TIMESTAMPDIFF(MINUTE, qh.createdAt, qh.calledAt) AS waitMinutes,
    TIMESTAMPDIFF(MINUTE, qh.startedAt, qh.completedAt) AS serviceMinutes,
    qh.notes
FROM queue_history qh
INNER JOIN stations s ON qh.stationId = s.id
WHERE qh.queueId = 5  -- ID الدور
ORDER BY qh.createdAt ASC;

-- 6.2 المرضى الذين ينتظرون منذ أكثر من 30 دقيقة
SELECT 
    q.queueNumber,
    p.name AS patientName,
    s.name AS stationName,
    TIMESTAMPDIFF(MINUTE, qh.createdAt, NOW()) AS waitingMinutes,
    q.priority
FROM queues q
INNER JOIN patients p ON q.patientId = p.id
INNER JOIN stations s ON q.currentStationId = s.id
INNER JOIN queue_history qh ON q.id = qh.queueId AND qh.stationId = s.id
WHERE 
    q.status = 'ACTIVE'
    AND qh.status = 'WAITING'
    AND TIMESTAMPDIFF(MINUTE, qh.createdAt, NOW()) > 30
ORDER BY waitingMinutes DESC;

-- 6.3 الأدوار التي مرت بجميع المحطات
SELECT 
    q.queueNumber,
    p.name AS patientName,
    COUNT(DISTINCT qh.stationId) AS stationsPassed,
    MIN(qh.createdAt) AS startTime,
    MAX(qh.completedAt) AS endTime,
    TIMESTAMPDIFF(MINUTE, MIN(qh.createdAt), MAX(qh.completedAt)) AS totalMinutes
FROM queues q
INNER JOIN patients p ON q.patientId = p.id
INNER JOIN queue_history qh ON q.id = qh.queueId
WHERE DATE(q.createdAt) = CURDATE()
GROUP BY q.id, q.queueNumber, p.name
HAVING COUNT(DISTINCT qh.stationId) = (SELECT COUNT(*) FROM stations WHERE isActive = TRUE);

-- ═══════════════════════════════════════════════════════════════
-- 7️⃣ استعلامات الإدارة (Management Queries)
-- ═══════════════════════════════════════════════════════════════

-- 7.1 حالة النظام الحالية
SELECT 
    (SELECT COUNT(*) FROM queues WHERE status = 'ACTIVE') AS activeQueues,
    (SELECT COUNT(*) FROM completed_visits WHERE DATE(completedAt) = CURDATE()) AS completedToday,
    (SELECT COUNT(*) FROM queues WHERE status = 'CANCELLED' AND DATE(createdAt) = CURDATE()) AS cancelledToday,
    (SELECT value FROM system_settings WHERE `key` = 'LAST_QUEUE_NUMBER') AS lastQueueNumber,
    (SELECT COUNT(*) FROM stations WHERE isActive = TRUE) AS activeStations;

-- 7.2 عدد المرضى المنتظرين في كل محطة
SELECT 
    s.id,
    s.name AS stationName,
    s.displayNumber,
    COUNT(q.id) AS waitingCount,
    (
        SELECT qq.queueNumber 
        FROM queues qq
        INNER JOIN queue_history qqh ON qq.id = qqh.queueId
        WHERE qqh.stationId = s.id 
            AND qqh.status IN ('CALLED', 'IN_PROGRESS')
        LIMIT 1
    ) AS currentQueueNumber
FROM stations s
LEFT JOIN queues q ON s.id = q.currentStationId AND q.status = 'ACTIVE'
WHERE s.isActive = TRUE
GROUP BY s.id, s.name, s.displayNumber, s.order
ORDER BY s.order;

-- 7.3 المحطات الأكثر ازدحاماً
SELECT 
    s.name AS stationName,
    COUNT(q.id) AS queueCount,
    AVG(TIMESTAMPDIFF(MINUTE, qh.createdAt, NOW())) AS avgWaitTime
FROM stations s
INNER JOIN queues q ON s.id = q.currentStationId
INNER JOIN queue_history qh ON q.id = qh.queueId AND qh.stationId = s.id
WHERE 
    q.status = 'ACTIVE'
    AND qh.status = 'WAITING'
GROUP BY s.id, s.name
ORDER BY queueCount DESC;

-- ═══════════════════════════════════════════════════════════════
-- 8️⃣ تقارير الأداء (Performance Reports)
-- ═══════════════════════════════════════════════════════════════

-- 8.1 معدل الخدمة (العملاء في الساعة)
SELECT 
    s.name AS stationName,
    COUNT(*) AS totalServed,
    ROUND(COUNT(*) / (TIMESTAMPDIFF(HOUR, MIN(qh.startedAt), MAX(qh.completedAt)) + 1), 2) AS patientsPerHour
FROM queue_history qh
INNER JOIN stations s ON qh.stationId = s.id
WHERE 
    DATE(qh.completedAt) = CURDATE()
    AND qh.status = 'COMPLETED'
GROUP BY s.id, s.name;

-- 8.2 أسرع وأبطأ محطة
SELECT 
    s.name AS stationName,
    AVG(TIMESTAMPDIFF(MINUTE, qh.startedAt, qh.completedAt)) AS avgServiceMinutes,
    MIN(TIMESTAMPDIFF(MINUTE, qh.startedAt, qh.completedAt)) AS minServiceMinutes,
    MAX(TIMESTAMPDIFF(MINUTE, qh.startedAt, qh.completedAt)) AS maxServiceMinutes
FROM queue_history qh
INNER JOIN stations s ON qh.stationId = s.id
WHERE 
    DATE(qh.completedAt) = CURDATE()
    AND qh.status = 'COMPLETED'
    AND qh.startedAt IS NOT NULL
    AND qh.completedAt IS NOT NULL
GROUP BY s.id, s.name
ORDER BY avgServiceMinutes DESC;

-- 8.3 وقت الخمول (Idle Time) لكل محطة
-- المدة بين انتهاء مريض وبدء التالي
SELECT 
    s.name AS stationName,
    AVG(
        TIMESTAMPDIFF(MINUTE, 
            prev.completedAt, 
            qh.startedAt
        )
    ) AS avgIdleMinutes
FROM queue_history qh
INNER JOIN stations s ON qh.stationId = s.id
INNER JOIN queue_history prev ON prev.stationId = qh.stationId 
    AND prev.completedAt < qh.startedAt
WHERE 
    DATE(qh.startedAt) = CURDATE()
    AND qh.status = 'COMPLETED'
GROUP BY s.id, s.name;

-- ═══════════════════════════════════════════════════════════════
-- 9️⃣ صيانة وتنظيف البيانات (Maintenance Queries)
-- ═══════════════════════════════════════════════════════════════

-- 9.1 حذف الأدوار المكتملة الأقدم من 30 يوماً
-- تحذير: تأكد من أرشفة البيانات قبل الحذف!
DELETE FROM queues
WHERE 
    status = 'COMPLETED'
    AND completedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 9.2 إعادة تعيين أرقام الأدوار
UPDATE system_settings
SET value = '0'
WHERE `key` = 'LAST_QUEUE_NUMBER';

-- 9.3 إلغاء الأدوار القديمة المتعثرة (أكثر من 24 ساعة)
UPDATE queues
SET 
    status = 'CANCELLED',
    notes = CONCAT('تم الإلغاء تلقائياً - ', notes)
WHERE 
    status = 'ACTIVE'
    AND createdAt < DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- 9.4 البحث عن بيانات تالفة (Corrupted Data)
-- الأدوار بدون تاريخ في QueueHistory
SELECT q.id, q.queueNumber
FROM queues q
LEFT JOIN queue_history qh ON q.id = qh.queueId
WHERE qh.id IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 🔟 استعلامات للتطوير والاختبار (Development Queries)
-- ═══════════════════════════════════════════════════════════════

-- 10.1 إنشاء بيانات تجريبية - مرضى
INSERT INTO patients (name, phoneNumber, nationalId, createdAt, updatedAt)
VALUES 
    ('أحمد محمد', '0501234567', '1234567890', NOW(), NOW()),
    ('فاطمة علي', '0509876543', '0987654321', NOW(), NOW()),
    ('خالد حسن', '0505555555', '5555555555', NOW(), NOW());

-- 10.2 إنشاء محطات تجريبية
INSERT INTO stations (name, displayNumber, `order`, isActive, createdAt, updatedAt)
VALUES 
    ('الاستقبال', 1, 1, TRUE, NOW(), NOW()),
    ('الفحص الأولي', 2, 2, TRUE, NOW(), NOW()),
    ('الطبيب', 3, 3, TRUE, NOW(), NOW());

-- 10.3 مسح جميع البيانات (استخدم بحذر!)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE queue_history;
TRUNCATE TABLE queues;
TRUNCATE TABLE completed_visits;
TRUNCATE TABLE patients;
SET FOREIGN_KEY_CHECKS = 1;

-- 10.4 عرض حجم الجداول
SELECT 
    table_name AS tableName,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS sizeMB,
    table_rows AS rowCount
FROM information_schema.TABLES
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC;

-- ═══════════════════════════════════════════════════════════════
-- 1️⃣1️⃣ Views مفيدة (Useful Views)
-- ═══════════════════════════════════════════════════════════════

-- 11.1 View لقائمة الانتظار الشاملة
CREATE OR REPLACE VIEW v_waiting_queues AS
SELECT 
    q.id AS queueId,
    q.queueNumber,
    p.name AS patientName,
    p.phoneNumber,
    s.id AS stationId,
    s.name AS stationName,
    s.displayNumber,
    q.priority,
    qh.createdAt AS waitingSince,
    TIMESTAMPDIFF(MINUTE, qh.createdAt, NOW()) AS waitingMinutes,
    qh.status
FROM queues q
INNER JOIN patients p ON q.patientId = p.id
INNER JOIN stations s ON q.currentStationId = s.id
INNER JOIN queue_history qh ON q.id = qh.queueId AND qh.stationId = s.id
WHERE 
    q.status = 'ACTIVE'
    AND qh.status = 'WAITING';

-- 11.2 View للإحصائيات اليومية
CREATE OR REPLACE VIEW v_daily_stats AS
SELECT 
    DATE(completedAt) AS date,
    COUNT(*) AS totalCompleted,
    AVG(totalDuration) AS avgTotalMinutes,
    AVG(waitingTime) AS avgWaitMinutes,
    AVG(serviceTime) AS avgServiceMinutes,
    MIN(totalDuration) AS minDuration,
    MAX(totalDuration) AS maxDuration
FROM completed_visits
GROUP BY DATE(completedAt);

-- استخدام الـ Views
-- SELECT * FROM v_waiting_queues WHERE stationId = 1;
-- SELECT * FROM v_daily_stats WHERE date = CURDATE();

-- ═══════════════════════════════════════════════════════════════
-- 📌 ملاحظات مهمة
-- ═══════════════════════════════════════════════════════════════
-- 
-- 1. استخدم Indexes للأداء الأفضل (موجودة في schema.prisma)
-- 2. استخدم EXPLAIN قبل الاستعلامات المعقدة
-- 3. تجنب SELECT * في الإنتاج
-- 4. استخدم LIMIT للاستعلامات الكبيرة
-- 5. أرشف البيانات القديمة بانتظام
-- 6. راقب حجم الجداول
-- 7. خذ نسخ احتياطية دورية
--
-- ═══════════════════════════════════════════════════════════════

-- نهاية الملف

