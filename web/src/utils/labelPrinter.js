import qz from "qz-tray";
import JsBarcode from "jsbarcode";

function createInvoiceCanvas(name, barcodeValue, priority) {
  const scale = 4; // يكفي
  const widthPx = 500; // مقاس اللصاقة الحقيقي بالبيكسل
  const heightPx = 300;

  const canvas = document.createElement("canvas");
  canvas.width = widthPx * scale;
  canvas.height = heightPx * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, heightPx);

  if (priority === 1) {
    ctx.fillStyle = "#000000";
    ctx.font = `bold 36px Arial`; // كبر الخط حسب التكبير
    ctx.textAlign = "center";
    ctx.fillText("*** مُستعجل ***", widthPx / 2, 80);
    ctx.fillStyle = "#000000";
    ctx.font = `36px Arial`; // كبر الخط حسب التكبير
    ctx.textAlign = "center";
    ctx.fillText(name, widthPx / 2, 125);

    // ✅ توليد الباركود
    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, barcodeValue, {
      format: "CODE128",
      width: 7, // سماكة الخطوط
      height: 50, // ارتفاع الباركود
      displayValue: true, // إظهار الرقم أسفل الباركود
      fontSize: (28 * scale) / 2,
      margin: 0,
      textAlign: "center",
    });

    const barcodeWidth = barcodeCanvas.width / 2;
    const barcodeHeight = barcodeCanvas.height;
    const barcodeX = (widthPx - barcodeWidth) / 2;
    const barcodeY = 170; // موقعه بالأسفل

    ctx.drawImage(
      barcodeCanvas,
      barcodeX,
      barcodeY,
      barcodeWidth,
      barcodeHeight
    );
  } else {
    ctx.fillStyle = "#000000";
    ctx.font = `36px Arial`; // كبر الخط حسب التكبير
    ctx.textAlign = "center";
    ctx.fillText(name, widthPx / 2, 100);

    // ✅ توليد الباركود
    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, barcodeValue, {
      format: "CODE128",
      width: 7, // سماكة الخطوط
      height: 50, // ارتفاع الباركود
      displayValue: true, // إظهار الرقم أسفل الباركود
      fontSize: (28 * scale) / 2,
      margin: 0,
      textAlign: "center",
    });

    const barcodeWidth = barcodeCanvas.width / 2;
    const barcodeHeight = barcodeCanvas.height;
    const barcodeX = (widthPx - barcodeWidth) / 2;
    const barcodeY = 150; // موقعه بالأسفل

    ctx.drawImage(
      barcodeCanvas,
      barcodeX,
      barcodeY,
      barcodeWidth,
      barcodeHeight
    );
  }

  return canvas;
}

function createNameCanvas(
  nameMale,
  nameFemale,
  priority,
  barcodeValueMale,
  barcodeValueFemale,
  maleStatus,
  femaleStatus
) {
  const scale = 4; // يكفي
  const widthPx = 500; // مقاس اللصاقة الحقيقي بالبيكسل
  const heightPx = 300;

  const canvas = document.createElement("canvas");
  canvas.width = widthPx * scale;
  canvas.height = heightPx * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, heightPx);

  if (priority === 1) {
    if (maleStatus === "LEGAL_INVITATION" || femaleStatus === "NOT_EXIST") {
      ctx.fillStyle = "#000000";
      ctx.font = `48px bold Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText("*** مُستعجل ***", widthPx / 2, 100);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText("( دعوة شرعية )", widthPx / 2, 150);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(nameMale, widthPx / 2, 200);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(barcodeValueMale, widthPx / 2, 250);
    } else if (
      femaleStatus === "LEGAL_INVITATION" ||
      maleStatus === "NOT_EXIST"
    ) {
      ctx.fillStyle = "#000000";
      ctx.font = `48px bold Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText("*** مُستعجل ***", widthPx / 2, 100);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText("( دعوة شرعية )", widthPx / 2, 150);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(nameFemale, widthPx / 2, 200);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(barcodeValueFemale, widthPx / 2, 250);
    } else {
      ctx.fillStyle = "#000000";
      ctx.font = `48px bold Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText("*** مُستعجل ***", widthPx / 2, 100);
      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";

      ctx.fillText(nameMale, widthPx / 2, 150);
      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(nameFemale, widthPx / 2, 200);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(barcodeValueFemale, 300, 250);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(barcodeValueMale, 200, 250);
    }
  } else {
    if (maleStatus === "LEGAL_INVITATION" || femaleStatus === "NOT_EXIST") {
      ctx.fillStyle = "#000000";
      ctx.font = `48px bold Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText("( دعوة شرعية )", widthPx / 2, 100);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(nameMale, widthPx / 2, 180);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(barcodeValueMale, widthPx / 2, 260);
    } else if (
      femaleStatus === "LEGAL_INVITATION" ||
      maleStatus === "NOT_EXIST"
    ) {
      ctx.fillStyle = "#000000";
      ctx.font = `48px bold Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText("( دعوة شرعية )", widthPx / 2, 100);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(nameFemale, widthPx / 2, 180);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(barcodeValueFemale, widthPx / 2, 260);
    } else {
      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(nameMale, widthPx / 2, 75);
      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(nameFemale, widthPx / 2, 150);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(barcodeValueFemale, 300, 225);

      ctx.fillStyle = "#000000";
      ctx.font = `36px Arial`; // كبر الخط حسب التكبير
      ctx.textAlign = "center";
      ctx.fillText(barcodeValueMale, 200, 225);
    }
  }

  return canvas;
}

export async function printLabels(
  nameMale,
  barcodeValueMale,
  barcodeValueMale2,
  nameFemale,
  barcodeValueFemale,
  barcodeValueFemale2,
  priority,
  maleStatus,
  femaleStatus
) {
  try {
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
      console.log("✅ تم الاتصال بـ QZ Tray");
    }

    const printers = await qz.printers.find();
    await console.log(qz.printers.find());
    const printerName = printers[0];
    const config = qz.configs.create(printerName, { encoding: "CP864" });

    // 👇 إنشاء 5 لصاقات (2 من كل نوع واسمية)
    if (maleStatus === "LEGAL_INVITATION" || femaleStatus === "NOT_EXIST") {
      const labels = [
        createNameCanvas(
          nameMale,
          nameFemale,
          priority,
          barcodeValueMale,
          barcodeValueFemale,
          maleStatus,
          femaleStatus
        ),
        createInvoiceCanvas(nameMale, barcodeValueMale, priority),
        createInvoiceCanvas(nameMale, barcodeValueMale2, priority),
      ];

      // 👇 أمر طباعة واحد يحتوي جميع الصور
      const data = labels.map((canvas) => ({
        type: "pixel",
        format: "image",
        flavor: "file",
        data: canvas.toDataURL("image/png"),
      }));

      await qz.print(config, data);
      console.log("✅ تمت طباعة 3 لصاقات (2 + 1) بنجاح");
    } else if (
      femaleStatus === "LEGAL_INVITATION" ||
      maleStatus === "NOT_EXIST"
    ) {
      const labels = [
        createNameCanvas(
          nameMale,
          nameFemale,
          priority,
          barcodeValueMale,
          barcodeValueFemale,
          maleStatus,
          femaleStatus
        ),
        createInvoiceCanvas(nameFemale, barcodeValueFemale, priority),
        createInvoiceCanvas(nameFemale, barcodeValueFemale2, priority),
      ];

      // 👇 أمر طباعة واحد يحتوي جميع الصور
      const data = labels.map((canvas) => ({
        type: "pixel",
        format: "image",
        flavor: "file",
        data: canvas.toDataURL("image/png"),
      }));

      await qz.print(config, data);
      console.log("✅ تمت طباعة 3 لصاقات (2 + 1) بنجاح");
    } else {
      const labels = [
        createNameCanvas(
          nameMale,
          nameFemale,
          priority,
          barcodeValueMale,
          barcodeValueFemale,
          maleStatus,
          femaleStatus
        ),
        createInvoiceCanvas(nameMale, barcodeValueMale, priority),
        createInvoiceCanvas(nameMale, barcodeValueMale2, priority),
        createInvoiceCanvas(nameFemale, barcodeValueFemale, priority),
        createInvoiceCanvas(nameFemale, barcodeValueFemale2, priority),
      ];
      // 👇 أمر طباعة واحد يحتوي جميع الصور
      const data = labels.map((canvas) => ({
        type: "pixel",
        format: "image",
        flavor: "file",
        data: canvas.toDataURL("image/png"),
      }));

      await qz.print(config, data);
      console.log("✅ تمت طباعة 5 لصاقات (4 + 1) بنجاح");
    }
  } catch (err) {
    console.error("❌ حدث خطأ:", err);
  }
}
