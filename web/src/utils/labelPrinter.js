import qz from "qz-tray";
import JsBarcode from "jsbarcode";

function createInvoiceCanvas(name, barcodeValue) {
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

  ctx.drawImage(barcodeCanvas, barcodeX, barcodeY, barcodeWidth, barcodeHeight);

  return canvas;
}

export async function printLabels(
  nameMale,
  barcodeValueMale,
  barcodeValueMale2,
  nameFemale,
  barcodeValueFemale,
  barcodeValueFemale2
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

    // 👇 إنشاء ٤ لصاقات (٢ من كل نوع)
    const labels = [
      createInvoiceCanvas(nameMale, barcodeValueMale),
      createInvoiceCanvas(nameMale, barcodeValueMale2),
      createInvoiceCanvas(nameFemale, barcodeValueFemale),
      createInvoiceCanvas(nameFemale, barcodeValueFemale2),
    ];

    // 👇 أمر طباعة واحد يحتوي جميع الصور
    const data = labels.map((canvas) => ({
      type: "pixel",
      format: "image",
      flavor: "file",
      data: canvas.toDataURL("image/png"),
    }));

    await qz.print(config, data);
    console.log("✅ تمت طباعة ٤ لصاقات (٢ + ٢) بنجاح");
  } catch (err) {
    console.error("❌ حدث خطأ:", err);
  }
}
