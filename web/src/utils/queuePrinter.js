import qz from "qz-tray";

function createInvoiceCanvas(queueNumber, idNumber) {
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = 576 * scale; // عرض الطابعة الحرارية بالـ pixels
  canvas.height = 800 * scale; // ارتفاع مؤقت
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  let y = 50;
  ctx.fillText("نقابة أطباء حماة", canvas.width / (2 * scale), 30);
  ctx.fillText("مخبر ما قبل الزواج", canvas.width / (2 * scale), 70);
  ctx.font = "bold 24px Arial"; // خط عريض وكبير
  ctx.fillText(`ID : ${idNumber}`, canvas.width / (2 * scale), 105);
  ctx.font = "36px Arial";
  ctx.fillText("----------------", canvas.width / (2 * scale), 140);
  ctx.fillText("رقم دورك هو", canvas.width / (2 * scale), 190);
  ctx.font = "bold 120px Arial"; // خط عريض وكبير
  ctx.fillText(`#${queueNumber}`, canvas.width / (2 * scale), 310);
  ctx.font = "36px Arial";
  ctx.fillText("----------------", canvas.width / (2 * scale), 360);
  ctx.fillText("* شكراً لزيارتكم *", canvas.width / (2 * scale), 410);
  ctx.font = "20px Arial";
  ctx.fillText(".", canvas.width / (2 * scale), 530);

  return canvas;
}

export default async function printQueueNumber(queueNumber, idNumber) {
  try {
    qz.security.setCertificatePromise(function (resolve, reject) {
      resolve(); // قبول كل الشهادات مؤقتًا
    });

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect().then(() => {
        console.log("✅ متصل بـ QZ Tray");
      });
    }

    const printers = await qz.printers.find();
    console.log(printers);
    const printer = printers[3];
    console.log("الطابعة المستخدمة:", printer);

    const config = qz.configs.create(printer, { encoding: "CP864" });
    const canvas = createInvoiceCanvas(queueNumber, idNumber);

    const data = [
      {
        type: "pixel",
        format: "image",
        flavor: "file",
        data: canvas.toDataURL("image/png"),
      },
    ];

    await qz.print(config, data);
    console.log("🖨️ تمت الطباعة بنجاح");
  } catch (err) {
    console.error("❌ خطأ في الاتصال أو الطباعة:", err);
  }
}
