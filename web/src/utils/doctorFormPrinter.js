function createReceiptCanvas(
  maleName,
  maleLastName,
  maleFatherName,
  maleAge,
  maleNationalId,
  maleBirthDate,
  maleBirthPlace,
  maleBloodType,
  HIVstatus,
  HBSstatus,
  HBCstatus,
  maleHIVvalue,
  maleHBSvalue,
  maleHBCvalue,
  maleHemoglobinEnabled,
  maleHbS,
  maleHbF,
  maleHbA1c,
  maleHbA2,
  maleHbSc,
  maleHbD,
  maleHbE,
  maleHbC,
  maleNotes,
  femaleName,
  femaleLastName,
  femaleFatherName,
  femaleAge,
  femaleNationalId,
  femaleBirthDate,
  femaleBirthPlace,
  femaleBloodType,
  femaleHIVstatus,
  femaleHBSstatus,
  femaleHBCstatus,
  femaleHIVvalue,
  femaleHBSvalue,
  femaleHBCvalue,
  femaleHemoglobinEnabled,
  femaleHbS,
  femaleHbF,
  femaleHbA1c,
  femaleHbA2,
  femaleHbSc,
  femaleHbD,
  femaleHbE,
  femaleHbC,
  femaleNotes,
  maleStatus,
  femaleStatus,
  idnumber,
  priority
) {
  const date = new Date().toLocaleDateString("ar-AE", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  // إعدادات الصفحة
  const scale = 3; // جودة للطباعة
  const widthPx = 794; // عرض A4 @96 DPI
  const heightPx = 1123; // ارتفاع A4 @96 DPI

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(widthPx * scale);
  canvas.height = Math.round(heightPx * scale);
  canvas.style.width = widthPx + "px";
  canvas.style.height = heightPx + "px";

  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";
  ctx.scale(scale, scale);

  // متغيرات تنسيق عامة
  const centerX = widthPx / 2;

  let currentY = 300;

  // الهيدر
  const img = new Image();
  img.src = "/assets/logo.png"; // مسار الصورة (محلي أو رابط URL)
  const img2 = new Image();
  img2.src = "/assets/logo2.png"; // مسار الصورة (محلي أو رابط URL)

  return Promise.all([
    new Promise((res) => (img.onload = res)),
    new Promise((res) => (img2.onload = res)),
  ]).then(() => {
    // اللوغو
    ctx.drawImage(img, 620, 20, 120, 120); // x, y, width, height
    ctx.drawImage(img2, 50, 20, 120, 120); // x, y, width, height
    // النصوص
    ctx.fillStyle = "#000000";
    ctx.font = "22px Cairo";
    ctx.textAlign = "center";
    ctx.fillText("نقابة أطباء سوريا - فرع حماة", centerX, 60);
    ctx.fillText("مخبر ما قبل الزواج", centerX, 100);
    ctx.font = "bold 16px Cairo";
    ctx.fillText(`التاريخ : ${date} م`, centerX, 140);
    if (priority === 1) {
      ctx.strokeStyle = "black";
      ctx.fillStyle = "#EEEEEE";
      ctx.lineWidth = 1.5;
      ctx.fillRect(widthPx - 265, 135, 70, 23); // x, y, width, height
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px Cairo";
      ctx.fillText(`مُستعجل`, widthPx - 230, 150);
    }

    // الخط اسفل الهيدر
    ctx.beginPath();
    ctx.moveTo(75, 160); // x1, y1
    ctx.lineTo(widthPx - 75, 160); // x2, y2
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ------------------------------------- الخاطب ----------------------------------------------
    // عرض مربع بيانات الخطيب فقط إذا لم يكن دعوة شرعية أو لا توجد زوجة
    if (femaleStatus !== "LEGAL_INVITATION" || maleStatus !== "NOT_EXIST") {
      if (maleStatus === "OUT_OF_COUNTRY") {
        ctx.font = "bold 16px Cairo";
        ctx.fillText(`خارج القطر`, widthPx - 600, 150);
      } else if (maleStatus === "OUT_OF_PROVINCE") {
      }
      ctx.font = "bold 16px Cairo";
      ctx.fillText(`ID : M${idnumber} `, widthPx - 150, 150);
      // مستطيل الخطيب
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(75, 180, widthPx - 150, 400); // x, y, width, height
      // نص الخطيب
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "center";
      ctx.fillText("بيانات الخاطب", centerX, 212);
      // الخاطب0
      const maleFirstLineX = 250;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`الاسم :`, widthPx - 90, maleFirstLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(
        `${maleName} ${maleFatherName} ${maleLastName}`,
        widthPx - 150,
        maleFirstLineX
      );
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`العمر :`, widthPx - 355, maleFirstLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${maleAge} سنة`, widthPx - 410, maleFirstLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`الزمرة الدموية :`, widthPx - 490, maleFirstLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 28px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${maleBloodType}`, widthPx - 625, maleFirstLineX + 3);

      const maleSecondLineX = 290;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`الرقم الوطني :`, widthPx - 90, maleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${maleNationalId}`, widthPx - 207, maleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`الولادة :`, widthPx - 335, maleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${maleBirthDate}`, widthPx - 403, maleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "bold    18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`مكان الولادة :`, widthPx - 510, maleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${maleBirthPlace}`, widthPx - 628, maleSecondLineX);

      const maleThirdLineX = 330;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`HIV :`, widthPx - 90, maleThirdLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(
        `${
          HIVstatus === "POSITIVE"
            ? `إيجابي${maleHIVvalue ? ` (${maleHIVvalue})` : ""}`
            : "سلبي"
        }`,
        widthPx - 150,
        maleThirdLineX
      );
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`HBV :`, widthPx - 335, maleThirdLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(
        `${
          HBSstatus === "POSITIVE"
            ? `إيجابي${maleHBSvalue ? ` (${maleHBSvalue})` : ""}`
            : "سلبي"
        }`,
        widthPx - 400,
        maleThirdLineX
      );
      ctx.fillStyle = "#000000";
      ctx.font = "bold    18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`HCV :`, widthPx - 550, maleThirdLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(
        `${
          HBCstatus === "POSITIVE"
            ? `إيجابي${maleHBCvalue ? ` (${maleHBCvalue})` : ""}`
            : "سلبي"
        }`,
        widthPx - 628,
        maleThirdLineX
      );

      // عرض قسم الخضاب الشاذة فقط إذا كان مفعلاً لدى أي من الخطيب أو الخطيبة
      if (maleHemoglobinEnabled || femaleHemoglobinEnabled) {
        const maleFourthLineX = 370;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`الخضاب الشاذة :`, widthPx - 90, maleFourthLineX);

        const maleFifthLineX = 410;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbS :`, widthPx - 90, maleFifthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`${maleHbS || "0.00"}%`, widthPx - 160, maleFifthLineX); //HbS
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbF :`, widthPx - 240, maleFifthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`${maleHbF || "0.00"}%`, widthPx - 305, maleFifthLineX); // Hbf
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbA1c :`, widthPx - 380, maleFifthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`${maleHbA1c || "0.00"}%`, widthPx - 460, maleFifthLineX); // HbA1c
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbA2 :`, widthPx - 540, maleFifthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`${maleHbA2 || "0.00"}%`, widthPx - 610, maleFifthLineX); // HbA2

        const maleSixthLineX = 450;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbSc :`, widthPx - 90, maleSixthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`${maleHbSc || "0.00"}%`, widthPx - 160, maleSixthLineX); //HbSc
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbD :`, widthPx - 240, maleSixthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`${maleHbD || "0.00"}%`, widthPx - 305, maleSixthLineX); // HbD
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbE :`, widthPx - 380, maleSixthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`${maleHbE || "0.00"}%`, widthPx - 460, maleSixthLineX); // HbE
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbC :`, widthPx - 540, maleSixthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`${maleHbC || "0.00"}%`, widthPx - 610, maleSixthLineX); // HbC
      }

      ctx.strokeStyle = "black";
      ctx.lineWidth = 1.5;
      ctx.textAlign = "right";
      ctx.strokeRect(87, 469, 620, 100); // x, y, width, height

      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`ملاحظات الطبيبة :`, widthPx - 90, 490); // HbC

      // تحديد الرسالة المناسبة للزوج حسب نتائج الفحوصات
      let maleNoteText = maleNotes;
      if (!maleNoteText) {
        // فحص إذا كان أي من الفحوصات إيجابي
        const hasPositiveTest =
          HIVstatus === "POSITIVE" ||
          HBSstatus === "POSITIVE" ||
          HBCstatus === "POSITIVE";

        // فحص إذا كان الخضاب الشاذة مفعل
        if (
          hasPositiveTest ||
          maleHemoglobinEnabled ||
          femaleHemoglobinEnabled
        ) {
          maleNoteText = ""; // لا تظهر رسالة إيجابية إذا كان هناك فحص إيجابي أو خضاب شاذة مفعل
        } else {
          maleNoteText = `جميع الفحوصات والتحاليل المجراة في المخبر لدينا سليمة, لا مانع من زواجه`;
        }
      }

      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(maleNoteText, widthPx - 100, 515);
    } // نهاية شرط عرض مربع بيانات الخطيب
    else {
      // مستطيل الخطيب
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(75, 180, widthPx - 150, 400); // x, y, width, height
      // نص الخطيب
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "center";
      ctx.fillText(" ( دعوة شرعية ) ", centerX, 350);
    }
    // ------------------------------------- الخطيبة ----------------------------------------------
    // عرض مربع بيانات الخطيبة فقط إذا لم تكن دعوة شرعية أو لا يوجد زوج
    if (maleStatus !== "LEGAL_INVITATION" && femaleStatus !== "NOT_EXIST") {
      ctx.font = "bold 16px Cairo";
      ctx.fillText(`F${idnumber} |`, widthPx - 75, 150);
      // مستطيل الخطيبة
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(75, 600, widthPx - 150, 400); // x, y, width, height
      // نص الخطيبة
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "center";
      ctx.fillText("بيانات الخطيبة", centerX, 632);
      // الخطيبة
      const femaleFirstLineX = 670;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`الاسم :`, widthPx - 90, femaleFirstLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(
        `${femaleName} ${femaleFatherName} ${femaleLastName}`,
        widthPx - 150,
        femaleFirstLineX
      );
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`العمر :`, widthPx - 355, femaleFirstLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${femaleAge} سنة`, widthPx - 410, femaleFirstLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`الزمرة الدموية :`, widthPx - 490, femaleFirstLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 28px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${femaleBloodType}`, widthPx - 625, femaleFirstLineX + 3);

      const femaleSecondLineX = 710;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`الرقم الوطني :`, widthPx - 90, femaleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${femaleNationalId}`, widthPx - 207, femaleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`الولادة :`, widthPx - 335, femaleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${femaleBirthDate}`, widthPx - 403, femaleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "bold    18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`مكان الولادة :`, widthPx - 510, femaleSecondLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`${femaleBirthPlace}`, widthPx - 628, femaleSecondLineX);

      const femaleThirdLineX = 750;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`HIV :`, widthPx - 90, femaleThirdLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(
        `${
          femaleHIVstatus === "POSITIVE"
            ? `إيجابي${femaleHIVvalue ? ` (${femaleHIVvalue})` : ""}`
            : "سلبي"
        }`,
        widthPx - 150,
        femaleThirdLineX
      );
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`HBV :`, widthPx - 335, femaleThirdLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(
        `${
          femaleHBSstatus === "POSITIVE"
            ? `إيجابي${femaleHBSvalue ? ` (${femaleHBSvalue})` : ""}`
            : "سلبي"
        }`,
        widthPx - 400,
        femaleThirdLineX
      );
      ctx.fillStyle = "#000000";
      ctx.font = "bold    18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`HCV :`, widthPx - 550, femaleThirdLineX);
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(
        `${
          femaleHBCstatus === "POSITIVE"
            ? `إيجابي${femaleHBCvalue ? ` (${femaleHBCvalue})` : ""}`
            : "سلبي"
        }`,
        widthPx - 628,
        femaleThirdLineX
      );

      // عرض قسم الخضاب الشاذة للزوجة فقط إذا كان مفعلاً لدى أي من الخطيب أو الخطيبة
      if (maleHemoglobinEnabled || femaleHemoglobinEnabled) {
        const femaleFourthLineX = 790;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`الخضاب الشاذة :`, widthPx - 90, femaleFourthLineX);

        const femaleFifthLineX = 830;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbS :`, widthPx - 90, femaleFifthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(
          `${femaleHbS || "0.00"}%`,
          widthPx - 160,
          femaleFifthLineX
        ); //HbS
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbF :`, widthPx - 240, femaleFifthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(
          `${femaleHbF || "0.00"}%`,
          widthPx - 305,
          femaleFifthLineX
        ); // Hbf
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbA1c :`, widthPx - 380, femaleFifthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(
          `${femaleHbA1c || "0.00"}%`,
          widthPx - 460,
          femaleFifthLineX
        ); // HbA1c
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbA2 :`, widthPx - 540, femaleFifthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(
          `${femaleHbA2 || "0.00"}%`,
          widthPx - 610,
          femaleFifthLineX
        ); // HbA2

        const femaleSixthLineX = 870;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbSc :`, widthPx - 90, femaleSixthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(
          `${femaleHbSc || "0.00"}%`,
          widthPx - 160,
          femaleSixthLineX
        ); //HbSc
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbD :`, widthPx - 240, femaleSixthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(
          `${femaleHbD || "0.00"}%`,
          widthPx - 305,
          femaleSixthLineX
        ); // HbD
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbE :`, widthPx - 380, femaleSixthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(
          `${femaleHbE || "0.00"}%`,
          widthPx - 460,
          femaleSixthLineX
        ); // HbE
        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(`HbC :`, widthPx - 540, femaleSixthLineX);
        ctx.fillStyle = "#000000";
        ctx.font = "18px Cairo";
        ctx.textAlign = "right";
        ctx.fillText(
          `${femaleHbC || "0.00"}%`,
          widthPx - 610,
          femaleSixthLineX
        ); // HbC
      }

      ctx.strokeStyle = "black";
      ctx.lineWidth = 1.5;
      ctx.textAlign = "right";
      ctx.strokeRect(87, 890, 620, 100); // x, y, width, height

      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(`ملاحظات الطبيبة :`, widthPx - 90, 910); // HbC
      ctx.fillStyle = "#000000";
      ctx.font = "18px Cairo";
      ctx.textAlign = "right";

      // تحديد الرسالة المناسبة للزوجة حسب نتائج الفحوصات وفصيلة الدم
      let femaleNoteText = femaleNotes;
      if (!femaleNoteText || femaleNoteText === "") {
        // فحص إذا كان أي من فحوصات الزوجة إيجابي
        const hasFemalePositiveTest =
          femaleHIVstatus === "POSITIVE" ||
          femaleHBSstatus === "POSITIVE" ||
          femaleHBCstatus === "POSITIVE";

        // فحص إذا كان الخضاب الشاذة مفعل
        if (
          hasFemalePositiveTest ||
          maleHemoglobinEnabled ||
          femaleHemoglobinEnabled
        ) {
          // فحص إذا كانت فصيلة الخطيبة سالبة وفصيلة الخطيب موجبة
          const isFemaleNegative =
            femaleBloodType && femaleBloodType.includes("-");
          const isMalePositive = maleBloodType && maleBloodType.includes("+");

          if (isFemaleNegative && isMalePositive) {
            ctx.fillStyle = "#000000";
            ctx.font = "18px Cairo";
            ctx.textAlign = "right";
            femaleNoteText = `زمرة الخطيبة سلبي , يرجى الانتباه عند الولادة والإسقاط`;
            ctx.strokeStyle = "black";
            ctx.fillStyle = "#EEEEEE";
            ctx.lineWidth = 1.5;
            ctx.fillRect(137, 955, 560, 23); // x, y, width, height
          } else {
            femaleNoteText = ``;
          } // لا تظهر رسالة إيجابية إذا كان هناك فحص إيجابي أو خضاب شاذة مفعل
        } else {
          // فحص إذا كانت فصيلة الخطيبة سالبة وفصيلة الخطيب موجبة
          const isFemaleNegative =
            femaleBloodType && femaleBloodType.includes("-");
          const isMalePositive = maleBloodType && maleBloodType.includes("+");

          if (isFemaleNegative && isMalePositive) {
            ctx.strokeStyle = "black";
            ctx.fillStyle = "#EEEEEE";
            ctx.lineWidth = 1.5;
            ctx.fillRect(137, 955, 560, 23); // x, y, width, height
            ctx.fillStyle = "#000000";
            ctx.font = "18px Cairo";
            ctx.textAlign = "right";
            femaleNoteText = `زمرة الخطيبة سلبي , يرجى الانتباه عند الولادة والإسقاط`;
            ctx.fillText(femaleNoteText, widthPx - 100, 971);
          } else {
            ctx.fillStyle = "#000000";
            ctx.font = "18px Cairo";
            ctx.textAlign = "right";
            femaleNoteText = `جميع الفحوصات والتحاليل المجراة في المخبر لدينا سليمة, لا مانع من زواجها`;
            ctx.fillText(femaleNoteText, widthPx - 100, 936);
          }
        }
      }
    } // نهاية شرط عرض مربع بيانات الخطيبة
    else {
      // مستطيل الخطيبة
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(75, 600, widthPx - 150, 400); // x, y, width, height
      // نص الخطيبة
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Cairo";
      ctx.textAlign = "center";
      ctx.fillText(" ( دعوة شرعية ) ", centerX, 790);
    }

    // التوقيعات
    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px Cairo";
    ctx.textAlign = "right";
    ctx.fillText(`د. بتول مغمومة`, widthPx - 100, 1030); // HbC

    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px Cairo";
    ctx.textAlign = "right";
    ctx.fillText(`د. رملة الحامد`, widthPx - 550, 1030); // HbC
    ctx.direction = "ltr";
    return canvas;
  });
}

// دالة لتهيئة المعاملات حسب الأسماء
function initializeParameters(params) {
  const defaultValues = {
    // بيانات الزوج الأساسية
    maleName: "",
    maleLastName: "",
    maleFatherName: "",
    maleAge: 0,
    maleNationalId: "",
    maleBirthDate: "",
    maleBirthPlace: "",
    maleBloodType: "",

    // فحوصات الزوج
    HIVstatus: "NEGATIVE",
    HBSstatus: "NEGATIVE",
    HBCstatus: "NEGATIVE",
    maleHIVvalue: "",
    maleHBSvalue: "",
    maleHBCvalue: "",
    maleHemoglobinEnabled: false,
    maleHbS: "",
    maleHbF: "",
    maleHbA1c: "",
    maleHbA2: "",
    maleHbSc: "",
    maleHbD: "",
    maleHbE: "",
    maleHbC: "",
    maleNotes: "",

    // بيانات الزوجة الأساسية
    femaleName: "",
    femaleLastName: "",
    femaleFatherName: "",
    femaleAge: 0,
    femaleNationalId: "",
    femaleBirthDate: "",
    femaleBirthPlace: "",
    femaleBloodType: "",

    // فحوصات الزوجة
    femaleHIVstatus: "NEGATIVE",
    femaleHBSstatus: "NEGATIVE",
    femaleHBCstatus: "NEGATIVE",
    femaleHIVvalue: "",
    femaleHBSvalue: "",
    femaleHBCvalue: "",
    femaleHemoglobinEnabled: false,
    femaleHbS: "",
    femaleHbF: "",
    femaleHbA1c: "",
    femaleHbA2: "",
    femaleHbSc: "",
    femaleHbD: "",
    femaleHbE: "",
    femaleHbC: "",
    femaleNotes: "",
    maleStatus: "",
    femaleStatus: "",
    idnumber: "",
    priority: "",
  };

  // دمج المعاملات المرسلة مع القيم الافتراضية
  return { ...defaultValues, ...params };
}

async function printReceipt(params) {
  // تهيئة المعاملات
  const {
    maleName,
    maleLastName,
    maleFatherName,
    maleAge,
    maleNationalId,
    maleBirthDate,
    maleBirthPlace,
    maleBloodType,
    HIVstatus,
    HBSstatus,
    HBCstatus,
    maleHIVvalue,
    maleHBSvalue,
    maleHBCvalue,
    maleHemoglobinEnabled,
    maleHbS,
    maleHbF,
    maleHbA1c,
    maleHbA2,
    maleHbSc,
    maleHbD,
    maleHbE,
    maleHbC,
    maleNotes,
    femaleName,
    femaleLastName,
    femaleFatherName,
    femaleAge,
    femaleNationalId,
    femaleBirthDate,
    femaleBirthPlace,
    femaleBloodType,
    femaleHIVstatus,
    femaleHBSstatus,
    femaleHBCstatus,
    femaleHIVvalue,
    femaleHBSvalue,
    femaleHBCvalue,
    femaleHemoglobinEnabled,
    femaleHbS,
    femaleHbF,
    femaleHbA1c,
    femaleHbA2,
    femaleHbSc,
    femaleHbD,
    femaleHbE,
    femaleHbC,
    femaleNotes,
    maleStatus,
    femaleStatus,
    idnumber,
    priority,
  } = initializeParameters(params);
  try {
    console.log("🖨️ بدء طباعة الإيصال (A4)...");

    const canvas = await createReceiptCanvas(
      maleName,
      maleLastName,
      maleFatherName,
      maleAge,
      maleNationalId,
      maleBirthDate,
      maleBirthPlace,
      maleBloodType,
      HIVstatus,
      HBSstatus,
      HBCstatus,
      maleHIVvalue,
      maleHBSvalue,
      maleHBCvalue,
      maleHemoglobinEnabled,
      maleHbS,
      maleHbF,
      maleHbA1c,
      maleHbA2,
      maleHbSc,
      maleHbD,
      maleHbE,
      maleHbC,
      maleNotes,
      femaleName,
      femaleLastName,
      femaleFatherName,
      femaleAge,
      femaleNationalId,
      femaleBirthDate,
      femaleBirthPlace,
      femaleBloodType,
      femaleHIVstatus,
      femaleHBSstatus,
      femaleHBCstatus,
      femaleHIVvalue,
      femaleHBSvalue,
      femaleHBCvalue,
      femaleHemoglobinEnabled,
      femaleHbS,
      femaleHbF,
      femaleHbA1c,
      femaleHbA2,
      femaleHbSc,
      femaleHbD,
      femaleHbE,
      femaleHbC,
      femaleNotes,
      maleStatus,
      femaleStatus,
      idnumber,
      priority
    );

    const dataUrl = canvas.toDataURL("image/png");

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body {
                font-family: Arial, sans-serif;
                background: white;
                direction: rtl;
                margin: 0;
                padding: 0;
              }
              .print-container {
                width: 100%;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
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

    iframe.onload = function () {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          console.log("✅ تم فتح نافذة الطباعة");

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
