/**
 * Archive PDF Printer - طباعة أرشيف المحاسبة
 * تصميم A4 أفقي قابل للطباعة
 */

/**
 * إنشاء جدول الأرشيف على Canvas
 */
function createArchivePdfCanvas(archiveData) {
  // إعدادات الصفحة A4 عمودي (Portrait)
  const scale = 3; // جودة عالية للطباعة
  const widthPx = 794; // عرض A4 عمودي @96 DPI (210mm)
  const heightPx = 1122; // ارتفاع A4 عمودي @96 DPI (297mm)

  // عكس ترتيب البيانات (من الأحدث إلى الأقدم)
  const reversedData = [...archiveData].reverse();

  // حساب عدد الصفحات المطلوبة
  const rowsPerPage = 35; // عدد الصفوف لكل صفحة
  const totalPages = Math.ceil(reversedData.length / rowsPerPage);

  const canvases = [];

  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(widthPx * scale);
    canvas.height = Math.round(heightPx * scale);
    canvas.style.width = widthPx + "px";
    canvas.style.height = heightPx + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.direction = "rtl";

    // خلفية بيضاء
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, widthPx, heightPx);

    // ========== العنوان ==========
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#111111";
    ctx.textAlign = "right";
    ctx.fillText(
      "المحاسبة | التقرير اليومي لـ مخبر ما قبل الزواج - حماة",
      760,
      50
    );
    // التاريخ في أعلى اليسار
    const now = new Date();
    const dateString = now.toLocaleDateString("ar-US", {
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#111111";
    ctx.textAlign = "left";
    ctx.fillText("التاريخ : " + dateString + " م ", 50, 50);

    // ========== رسم الجدول ==========
    const tableStartY = 70;
    const tableStartX = 30;
    const tableWidth = widthPx - 60;
    const rowHeight = 26;
    const headerHeight = 38;

    // عرض الأعمدة (من اليمين لليسار: الرقم - اسم الخاطب - اسم الخطيبة - المبلغ المدفوع)
    const colWidths = {
      amount: 110, // المبلغ المدفوع (أقصى اليسار)
      wife: 245, // اسم الخطيبة
      husband: 245, // اسم الخاطب
      number: 134, // الرقم (أقصى اليمين)
    };

    // رسم رأس الجدول بخلفية رمادية
    ctx.fillStyle = "#AAAAAA";
    ctx.fillRect(tableStartX, tableStartY, tableWidth, headerHeight);

    // حدود رأس الجدول
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tableStartX, tableStartY, tableWidth, headerHeight);

    // نصوص رأس الجدول
    ctx.fillStyle = "#000000";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";

    let currentX = tableStartX; // نبدأ من اليسار

    // عمود المبلغ المدفوع (أقصى اليسار)
    ctx.fillText(
      "المبلغ المدفوع",
      currentX + colWidths.amount / 2,
      tableStartY + 25
    );
    currentX += colWidths.amount;

    // عمود اسم الخطيبة
    ctx.fillText(
      "اسم الخطيبة",
      currentX + colWidths.wife / 2,
      tableStartY + 25
    );
    currentX += colWidths.wife;

    // عمود اسم الخاطب
    ctx.fillText(
      "اسم الخاطب",
      currentX + colWidths.husband / 2,
      tableStartY + 25
    );
    currentX += colWidths.husband;

    // عمود الرقم (أقصى اليمين)
    ctx.fillText("الرقم", currentX + colWidths.number / 2, tableStartY + 25);

    // رسم خطوط الجدول العمودية للرأس
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    currentX = tableStartX;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(currentX, tableStartY);
      ctx.lineTo(currentX, tableStartY + headerHeight);
      ctx.stroke();

      if (i === 0) currentX += 0;
      else if (i === 1) currentX += colWidths.amount;
      else if (i === 2) currentX += colWidths.wife;
      else if (i === 3) currentX += colWidths.husband;
      else if (i === 4) currentX += colWidths.number;
    }

    // رسم صفوف البيانات
    const startIdx = pageNum * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, reversedData.length);
    const pageData = reversedData.slice(startIdx, endIdx);

    ctx.font = "13px Arial";
    ctx.textAlign = "center";

    pageData.forEach((record, idx) => {
      const rowY = tableStartY + headerHeight + idx * rowHeight;
      // الترقيم من 1 إلى النهاية (بدون عكس)
      const actualRowNumber = startIdx + idx + 1;

      // خلفية الصف - رمادية للمستعجل، بيضاء للعادي
      const isUrgent = record.queue.priority === 1;
      ctx.fillStyle = isUrgent ? "#e5e7eb" : "#ffffff";
      ctx.fillRect(tableStartX, rowY, tableWidth, rowHeight);

      // حدود الصف
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(tableStartX, rowY, tableWidth, rowHeight);

      // النصوص
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px Arial";

      currentX = tableStartX; // نبدأ من اليسار

      // المبلغ المدفوع (أقصى اليسار)
      ctx.fillText(
        record.totalAmount.toLocaleString(),
        currentX + colWidths.amount / 2,
        rowY + 18
      );
      currentX += colWidths.amount;

      // اسم الخطيبة الثلاثي
      const femaleName = record.queue.ReceptionData?.femaleName || "";
      const femaleFatherName =
        record.queue.ReceptionData?.femaleFatherName || "";
      const femaleLastName = record.queue.ReceptionData?.femaleLastName || "";
      const femaleFullName =
        `${femaleName} ${femaleFatherName} ${femaleLastName}`.trim() || "";

      ctx.fillText(
        femaleFullName.length > 60
          ? femaleFullName.substring(0, 25) + "..."
          : femaleFullName,
        currentX + colWidths.wife / 2,
        rowY + 18
      );
      currentX += colWidths.wife;

      // اسم الخاطب الثلاثي
      const maleName = record.queue.ReceptionData?.maleName || "";
      const maleFatherName = record.queue.ReceptionData?.maleFatherName || "";
      const maleLastName = record.queue.ReceptionData?.maleLastName || "";
      const maleFullName =
        `${maleName} ${maleFatherName} ${maleLastName}`.trim() || "";

      ctx.fillText(
        maleFullName.length > 60
          ? maleFullName.substring(0, 25) + "..."
          : maleFullName,
        currentX + colWidths.husband / 2,
        rowY + 18
      );
      currentX += colWidths.husband;

      // رقم متسلسل (أقصى اليمين)
      ctx.fillText(
        actualRowNumber.toString(),
        currentX + colWidths.number / 2,
        rowY + 18
      );

      // رسم الخطوط العمودية للصف
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      let lineX = tableStartX;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(lineX, rowY);
        ctx.lineTo(lineX, rowY + rowHeight);
        ctx.stroke();

        if (i === 0) lineX += 0;
        else if (i === 1) lineX += colWidths.amount;
        else if (i === 2) lineX += colWidths.wife;
        else if (i === 3) lineX += colWidths.husband;
        else if (i === 4) lineX += colWidths.number;
      }
    });

    // رسم الحدود الخارجية للجدول
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    const tableHeight = headerHeight + pageData.length * rowHeight;
    ctx.strokeRect(tableStartX, tableStartY, tableWidth, tableHeight);

    // إضافة الإحصائيات في الصفحة الأخيرة
    if (pageNum === totalPages - 1) {
      // حساب الإحصائيات
      const totalAmount = archiveData.reduce(
        (sum, record) => sum + record.totalAmount,
        0
      );

      const urgentCases = archiveData.filter(
        (record) => record.queue.priority === 1
      );
      const normalCases = archiveData.filter(
        (record) => record.queue.priority !== 1
      );

      const urgentCount = urgentCases.length;
      const normalCount = normalCases.length;

      const urgentTotal = urgentCases.reduce(
        (sum, record) => sum + record.totalAmount,
        0
      );
      const normalTotal = normalCases.reduce(
        (sum, record) => sum + record.totalAmount,
        0
      );

      // رسم الإحصائيات بجانب بعض
      const statsStartY = tableStartY + tableHeight + 40;
      ctx.textAlign = "center";

      // تقسيم العرض إلى 5 أعمدة
      const colWidth = tableWidth / 5;

      // الصف الأول: العناوين
      let currentStatX = tableStartX + colWidth / 2;
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#000000";

      // المبلغ الكلي
      ctx.fillText("المبلغ الكلي", currentStatX, statsStartY);
      currentStatX += colWidth;
      ctx.font = " 13px Arial";

      // عدد الحالات المستعجلة
      ctx.fillText("عدد الحالات", currentStatX, statsStartY);
      ctx.fillText("المستعجلة", currentStatX, statsStartY + 15);
      currentStatX += colWidth;

      // عدد الحالات العادية
      ctx.fillText("عدد الحالات", currentStatX, statsStartY);
      ctx.fillText("العادية", currentStatX, statsStartY + 15);
      currentStatX += colWidth;

      // المبلغ الكلي للحالات العادية
      ctx.fillText("المبلغ الكلي", currentStatX, statsStartY);
      ctx.fillText("للحالات العادية", currentStatX, statsStartY + 15);
      currentStatX += colWidth;

      // المبلغ الكلي للحالات المستعجلة
      ctx.fillText("المبلغ الكلي", currentStatX, statsStartY);
      ctx.fillText("للحالات المستعجلة", currentStatX, statsStartY + 15);

      // الصف الثاني: القيم مع خلفية رمادية
      const valuesY = statsStartY + 50;
      currentStatX = tableStartX + colWidth / 2;

      // المبلغ الكلي
      const totalText = `${totalAmount.toLocaleString()} ل.س`;
      ctx.font = "bold 22px Arial";
      const totalTextWidth = ctx.measureText(totalText).width;
      ctx.fillStyle = "#EEEEEE";
      ctx.fillRect(
        currentStatX - totalTextWidth / 2 - 10,
        valuesY - 22,
        totalTextWidth + 20,
        30
      );
      ctx.fillStyle = "#000000";
      ctx.fillText(totalText, currentStatX, valuesY);
      currentStatX += colWidth;

      // عدد الحالات المستعجلة
      const urgentCountText = `${urgentCount}`;
      ctx.font = "bold 18px Arial";
      const urgentCountWidth = ctx.measureText(urgentCountText).width;
      ctx.fillStyle = "#000000";

      ctx.fillText(urgentCountText, currentStatX, valuesY);
      currentStatX += colWidth;

      // عدد الحالات العادية
      const normalCountText = `${normalCount}`;
      ctx.font = "bold 18px Arial";
      const normalCountWidth = ctx.measureText(normalCountText).width;
      ctx.fillStyle = "#000000";

      ctx.fillText(normalCountText, currentStatX, valuesY);
      currentStatX += colWidth;

      // المبلغ الكلي للحالات العادية
      const normalTotalText = `${normalTotal.toLocaleString()} ل.س`;
      ctx.font = "bold 14px Arial";
      const normalTotalWidth = ctx.measureText(normalTotalText).width;

      ctx.fillStyle = "#000000";
      ctx.fillText(normalTotalText, currentStatX, valuesY);
      currentStatX += colWidth;

      // المبلغ الكلي للحالات المستعجلة
      const urgentTotalText = `${urgentTotal.toLocaleString()} ل.س`;
      ctx.font = "bold 14px Arial";
      const urgentTotalWidth = ctx.measureText(urgentTotalText).width;

      ctx.fillStyle = "#000000";
      ctx.fillText(urgentTotalText, currentStatX, valuesY);
    }

    ctx.direction = "ltr";
    canvases.push(canvas);
  }

  return canvases;
}

/**
 * طباعة أرشيف المحاسبة
 */
export async function printArchivePdf(archiveData) {
  try {
    console.log("🖨️ بدء إعداد ملف PDF للأرشيف...");

    if (!archiveData || archiveData.length === 0) {
      alert("⚠️ لا توجد بيانات للطباعة");
      return false;
    }

    // إنشاء Canvas لكل صفحة
    const canvases = createArchivePdfCanvas(archiveData);

    // تحويل كل Canvas إلى صورة
    const dataUrls = canvases.map((canvas) => canvas.toDataURL("image/png"));

    // إنشاء iframe مخفي للطباعة
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    // كتابة محتوى HTML للطباعة في الـ iframe
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();

    const imagesHtml = dataUrls
      .map(
        (dataUrl, index) => `
        <div class="page" ${
          index < dataUrls.length - 1 ? 'style="page-break-after: always;"' : ""
        }>
          <img src="${dataUrl}" />
        </div>
      `
      )
      .join("");

    iframeDoc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>أرشيف المحاسبة</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            background: white;
          }
          .page {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
          }
          .page:last-child {
            page-break-after: avoid;
          }
          img {
            width: 210mm;
            height: 297mm;
            object-fit: contain;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .page {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${imagesHtml}
      </body>
      </html>
    `);
    iframeDoc.close();

    // انتظار تحميل الصور ثم فتح نافذة الطباعة
    iframe.onload = function () {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          console.log("✅ تم فتح نافذة الطباعة");

          // إزالة الـ iframe بعد الطباعة
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } catch (e) {
          console.error("❌ خطأ في الطباعة:", e);
          document.body.removeChild(iframe);
        }
      }, 500);
    };

    return true;
  } catch (error) {
    console.error("❌ خطأ في إعداد ملف PDF:", error);
    alert(`❌ حدث خطأ في إعداد الملف: ${error.message}`);
    return false;
  }
}

export default printArchivePdf;
