/**
 * Receipt Printer - طباعة إيصال الدفع
 * تصميم A4 قابل للتخصيص
 */

/**
 * إنشاء تصميم الإيصال على Canvas
 */
function createReceiptCanvas(
  maleName,
  MaleLastName,
  MaleFatherName,
  MaleMotherName,
  MaleBirthDate,
  MaleRegistration,
  FemaleName,
  FemaleLastName,
  FemaleFatherName,
  FemaleMotherName,
  FemaleBirthDate,
  FemaleRegistration,
  date,
  maleStatus,
  femaleStatus
) {
  // إعدادات الصفحة
  const scale = 3; // جودة للطباعة
  const widthPx = 559; // عرض A5 @96 DPI
  const heightPx = 794; // ارتفاع A5 @96 DPI

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(widthPx * scale);
  canvas.height = Math.round(heightPx * scale);
  canvas.style.width = widthPx + "px";
  canvas.style.height = heightPx + "px";

  const ctx = canvas.getContext("2d");

  // نحافظ على الكتابة RTL حيثما يلزم
  ctx.direction = "rtl";

  // نعمل scale داخل السياق لعرض نظيف مع دقة الطباعة
  ctx.scale(scale, scale);

  // متغيرات تنسيق عامة
  const centerX = widthPx / 2;
  const rightMargin = 40; // المسافة من الحافة اليمنى
  const leftMargin = widthPx - rightMargin; // لسهولة الحسابات عندما يكون textAlign = "right"

  // ========== هيدر / أعلى الصفحة ==========
  // التاريخ أعلى اليمين (يشبه الموجود في الصورة)
  ctx.fillStyle = "#111111";
  ctx.font = " 14px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`${date}`, 120, 100); // تاريخ ثابت كما في الصورة

  // ========= محتوى الوثيقة (المحور المركزي) =========
  // عنوان رئيسي كبير بالوسط (في الصورة هناك عبارة ليست بالضخمة - سنجعلها واضحة)
  ctx.font = " 16px Arial";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText("إلى من يهمّه الأمر", centerX, 150);

  // عنوان العيادة (وسط أعلى الصفحة، مائل قليلًا لليسار)
  ctx.font = " 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "عيادة الفحص الطّبي ومخبر التحاليل الطبية لما قبل الزواج في محافظة حماه",
    centerX,
    200
  );

  let currentY = 250; // الموقع العمودي الحالي
  const showMale = maleStatus && maleStatus !== "NOT_EXIST";
  const showFemale = femaleStatus && femaleStatus !== "NOT_EXIST";

  // إظهار بيانات الرجل إذا كان موجوداً (NORMAL أو LEGAL_INVITATION)
  if (showMale) {
    // اسم + الاب + الام
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      `لدى معاينة السيد :  ${maleName || ""} ${MaleLastName || ""} بن ${
        MaleFatherName || ""
      } والدته ${MaleMotherName || ""}`,
      470,
      currentY
    );

    // مواليد + القيد ورقمه
    ctx.font = " 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      `مواليد :     ${MaleBirthDate || ""}     القيد ورقمه :     ${
        MaleRegistration || ""
      }`,
      470,
      currentY + 50
    );

    currentY += 100; // زيادة الموقع العمودي للنص التالي
  }

  // إظهار بيانات المرأة إذا كانت موجودة (NORMAL أو LEGAL_INVITATION)
  if (showFemale) {
    // اسم البنت + ابوها + امها
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      `لدى معاينة الآنسة :  ${FemaleName || ""} ${FemaleLastName || ""} بنت ${
        FemaleFatherName || ""
      } والدتها ${FemaleMotherName || ""}`,
      470,
      currentY
    );

    // مواليد البنت + القيد ورقمه
    ctx.font = " 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      `مواليد :     ${FemaleBirthDate || ""}     القيد ورقمه :     ${
        FemaleRegistration || ""
      }`,
      470,
      currentY + 50
    );
  }

  // النص الختامي (يعتمد على من موجود)
  if (showMale && showFemale) {
    // كلاهما موجود
    ctx.font = " 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "تبين أنهما خاليان من الأمراض السارية و المُعدية",
      centerX,
      450
    );
    ctx.font = " 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ولا يُوجد مانع صحي مِن زواجهما حالياً", centerX, 500);
    ctx.font = " 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("يُرجى الإطّلاع وشكراً", centerX, 550);
  } else if (showMale && !showFemale) {
    // الرجل فقط
    ctx.font = " 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("تبين أنه خالي من الأمراض السارية و المُعدية", centerX, 450);
    ctx.font = " 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("يُرجى الإطّلاع وشكراً", centerX, 500);
  } else if (!showMale && showFemale) {
    // المرأة فقط
    ctx.font = " 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("تبين أنها خالية من الأمراض السارية و المُعدية", centerX, 450);
    ctx.font = " 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("يُرجى الإطّلاع وشكراً", centerX, 500);
  }

  // توقيع الطبيب (دائماً في الأسفل)
  ctx.font = " 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("توقيع الطبيب الفاحص", 180, 600);

  // إعادة ضبط direction إن احتجت لاحقاً
  ctx.direction = "ltr";

  return canvas;
}

export async function printReceipt(
  maleName,
  MaleLastName,
  MaleFatherName,
  MaleMotherName,
  MaleBirthDate,
  MaleRegistration,
  FemaleName,
  FemaleLastName,
  FemaleFatherName,
  FemaleMotherName,
  FemaleBirthDate,
  FemaleRegistration,
  date,
  maleStatus,
  femaleStatus
) {
  try {
    console.log("🖨️ بدء طباعة الإيصال...");

    // إنشاء Canvas
    const canvas = createReceiptCanvas(
      maleName,
      MaleLastName,
      MaleFatherName,
      MaleMotherName,
      MaleBirthDate,
      MaleRegistration,
      FemaleName,
      FemaleLastName,
      FemaleFatherName,
      FemaleMotherName,
      FemaleBirthDate,
      FemaleRegistration,
      date,
      maleStatus,
      femaleStatus
    );

    // تحويل Canvas إلى صورة
    const dataUrl = canvas.toDataURL("image/png");

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
    iframeDoc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A5;
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
          .print-container {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          img {
            width: 148mm;
            height: 210mm;
            object-fit: contain;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .print-container {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <img src="${dataUrl}" />
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // انتظار تحميل الصورة ثم فتح نافذة الطباعة
    iframe.onload = function () {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          console.log("✅ تم فتح نافذة الطباعة");

          // إزالة الـ iframe بعد الطباعة (أو إلغائها)
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } catch (e) {
          console.error("❌ خطأ في الطباعة:", e);
          document.body.removeChild(iframe);
        }
      }, 250);
    };

    return true;
  } catch (error) {
    console.error("❌ خطأ في طباعة الإيصال:", error);
    alert(`❌ حدث خطأ في الطباعة: ${error.message}`);
    return false;
  }
}

export default printReceipt;
