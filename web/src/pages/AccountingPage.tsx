import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";

const API_URL = "http://localhost:3003/api";
const STATION_DISPLAY_NUMBER = 2;

interface CurrentPatient {
  queueId: number;
  queueNumber: number;
  patientId: number;
  patientName: string;
  maleName: string;
  femaleName: string;
  ReceptionData?: {
    maleName: string;
    maleLastName: string;
    femaleName: string;
    femaleLastName: string;
    phoneNumber?: string;
  };
}

const AccountingPage = () => {
  const [currentPatient, setCurrentPatient] = useState<CurrentPatient | null>(
    null
  );
  const [amount, setAmount] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [stationId, setStationId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [recallCount, setRecallCount] = useState(0); // عداد إعادة النداء
  const [isFromSidebar, setIsFromSidebar] = useState(false); // هل جاء من القائمة؟
  const [hasBeenCalled, setHasBeenCalled] = useState(false); // هل تم استدعاءه؟
  const [recallCooldown, setRecallCooldown] = useState(0); // عداد الانتظار (10 ثواني)

  // WebSocket updates - not needed here since sidebar handles it

  useEffect(() => {
    const fetchStationId = async () => {
      try {
        const response = await axios.get(`${API_URL}/stations`);
        if (response.data.success) {
          const station = response.data.stations.find(
            (s: { displayNumber: number; id: number }) =>
              s.displayNumber === STATION_DISPLAY_NUMBER
          );
          if (station) {
            setStationId(station.id);
          }
        }
      } catch (error) {
        console.error("خطأ في جلب بيانات المحطة:", error);
      }
    };
    fetchStationId();
  }, []);

  // عداد تنازلي لـ 10 ثواني بعد إعادة النداء
  useEffect(() => {
    if (recallCooldown > 0) {
      const timer = setTimeout(() => {
        setRecallCooldown(recallCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [recallCooldown]);

  const callNextPatient = async () => {
    if (!stationId) {
      setErrorMessage("⚠️ جاري تحميل بيانات المحطة...");
      return;
    }
    try {
      setLoading(true);
      setErrorMessage(""); // مسح أي رسالة خطأ سابقة

      const response = await axios.post(
        `${API_URL}/stations/${stationId}/call-next`,
        { calledBy: "موظف المحاسبة" }
      );

      if (response.data.success) {
        const queueResponse = await axios.get(
          `${API_URL}/queue/${response.data.queue.id}`
        );

        if (queueResponse.data.success) {
          const queue = queueResponse.data.queue;
          const reception = queue.ReceptionData;

          setCurrentPatient({
            queueId: queue.id,
            queueNumber: queue.queueNumber,
            patientId: queue.patient.id,
            patientName: queue.patient.name,
            maleName: reception?.maleName || "",
            femaleName: reception?.femaleName || "",
            ReceptionData: reception,
          });

          setAmount("");
          setIsPaid(false);
          setNotes("");
        }
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };

      // عرض رسالة الخطأ أسفل الزر بدلاً من alert
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "حدث خطأ";
      setErrorMessage(errorMsg);

      console.error("خطأ في استدعاء المراجع :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPatient) {
      alert("⚠️ لا يوجد مراجع حالي");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert("⚠️ الرجاء إدخال المبلغ");
      return;
    }

    if (!isPaid) {
      alert("⚠️ الرجاء تأكيد الدفع");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/accounting`, {
        queueId: currentPatient.queueId,
        patientId: currentPatient.patientId,
        totalAmount: parseFloat(amount),
        isPaid: true,
        notes,
      });

      if (response.data.success) {
        await axios.post(`${API_URL}/stations/${stationId}/complete-service`, {
          queueId: currentPatient.queueId,
          notes: "تم الدفع",
        });

        alert("✅ تم حفظ بيانات الدفع بنجاح!");
        setCurrentPatient(null);
        setRecallCount(0);
        setIsFromSidebar(false);
        setAmount("");
        setIsPaid(false);
        setNotes("");
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      alert(
        "❌ خطأ: " + (err.response?.data?.error || err.message || "حدث خطأ")
      );
    } finally {
      setLoading(false);
    }
  };

  // عند اختيار دور من القائمة
  const handleSelectQueueFromSidebar = async (queue: {
    id: number;
    queueNumber: number;
    patient: { name: string };
    ReceptionData?: {
      maleName: string;
      maleLastName: string;
      femaleName: string;
      femaleLastName: string;
      phoneNumber?: string;
    };
  }) => {
    try {
      setLoading(true);
      const queueResponse = await axios.get(`${API_URL}/queue/${queue.id}`);

      if (queueResponse.data.success) {
        const fullQueue = queueResponse.data.queue;
        const reception = fullQueue.ReceptionData;

        setCurrentPatient({
          queueId: fullQueue.id,
          queueNumber: fullQueue.queueNumber,
          patientId: fullQueue.patientId,
          patientName: fullQueue.patient?.name || "",
          maleName: reception?.maleName || "",
          femaleName: reception?.femaleName || "",
          ReceptionData: reception,
        });

        // فحص إذا كان الدور قد تم استدعاءه (status = CALLED أو IN_PROGRESS)
        const hasCalled =
          fullQueue.QueueHistory?.some(
            (h: { stationId: number; status: string }) =>
              h.stationId === stationId &&
              (h.status === "CALLED" || h.status === "IN_PROGRESS")
          ) || false;

        setIsFromSidebar(true);
        setRecallCount(0);
        setRecallCooldown(0);
        setHasBeenCalled(hasCalled);
        setErrorMessage("");

        console.log(`✅ تم اختيار الدور #${fullQueue.queueNumber}`);
        console.log(
          `📞 حالة الاستدعاء: ${
            hasCalled ? "تم استدعاءه" : "لم يتم استدعاءه بعد"
          }`
        );
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات الدور:", error);
      setErrorMessage("❌ حدث خطأ في جلب بيانات الدور");
    } finally {
      setLoading(false);
    }
  };

  // إعادة النداء
  const handleRecall = async () => {
    if (!currentPatient || !stationId) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/stations/${stationId}/call-specific`,
        {
          queueNumber: currentPatient.queueNumber,
          calledBy: "موظف المحاسبة (إعادة نداء)",
        }
      );

      if (response.data.success) {
        setRecallCount((prev) => prev + 1);
        setRecallCooldown(10); // بدء العداد التنازلي 10 ثواني
        setHasBeenCalled(true); // الآن تم استدعاءه بالتأكيد
        alert(`✅ تم إعادة النداء (المحاولة ${recallCount + 1}/3)`);
        console.log("⏳ بدء العداد التنازلي 10 ثواني...");
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "حدث خطأ في إعادة النداء";
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // إلغاء الدور (لم يحضر)
  const handleCancelQueue = async () => {
    if (!currentPatient) return;

    if (recallCount < 3) {
      alert(
        `⚠️ يجب إعادة النداء 3 مرات قبل الإلغاء (حالياً: ${recallCount}/3)`
      );
      return;
    }

    if (
      !window.confirm(
        `هل أنت متأكد من إلغاء الدور #${currentPatient.queueNumber}؟\n(المراجع لم يحضر بعد 3 محاولات)`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_URL}/queue/${currentPatient.queueId}/cancel`
      );

      if (response.data.success) {
        alert(`✅ تم إلغاء الدور #${currentPatient.queueNumber}`);

        // مسح البيانات
        setCurrentPatient(null);
        setRecallCount(0);
        setIsFromSidebar(false);
        setAmount("");
        setIsPaid(false);
        setNotes("");

        // إعادة تحميل الصفحة لتحديث القائمة
        console.log("🔄 تحديث الصفحة بعد الإلغاء...");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "حدث خطأ في إلغاء الدور";
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className='h-screen flex flex-col overflow-hidden'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='غرفة المحاسبة' icon='💰' />

      <div className='flex-1 flex overflow-hidden'>
        {/* Main Area */}
        <div className='flex-1 flex items-center justify-center p-8'>
          {!currentPatient ? (
            <div className='card max-w-2xl w-full text-center p-12'>
              <div className='mb-8'>
                <div className='text-6xl mb-4'>💰</div>
                <h2
                  className='text-2xl font-bold mb-2'
                  style={{ color: "var(--primary)" }}>
                  غرفة المحاسبة
                </h2>
                <p className='text-sm' style={{ color: "var(--dark)" }}>
                  اضغط على الزر لاستدعاء المراجع التالي
                </p>
              </div>
              <button
                onClick={callNextPatient}
                disabled={loading}
                className='btn-primary px-12 py-4 text-xl disabled:opacity-50'>
                {loading ? "⏳ جاري الاستدعاء..." : "📢 استدعاء المراجع التالي"}
              </button>

              {/* رسالة الخطأ */}
              {errorMessage && (
                <div
                  className='mt-4 p-4 rounded-lg text-center'
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "2px solid #ef4444",
                    color: "#dc2626",
                  }}>
                  <p className='text-lg font-semibold'>{errorMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <div className='card w-full p-8'>
              {/* Patient Info */}
              <div
                className='flex flex-row items-stretch justify-evenly gap-4 rounded-lg p-6 mb-6'
                style={{ backgroundColor: "var(--light)" }}>
                <div className='text-center mb-4 w-[25%] h-full'>
                  <span className='text-sm' style={{ color: "var(--dark)" }}>
                    رقم الدور
                  </span>
                  <div
                    className='text-6xl font-bold my-2'
                    style={{ color: "var(--primary)" }}>
                    #{currentPatient.queueNumber}
                  </div>
                </div>

                <div className='grid w-full h-full grid-cols-2 gap-4 mt-4'>
                  <div className='text-center p-4 rounded-lg bg-white'>
                    <div
                      className='text-xs mb-1'
                      style={{ color: "var(--dark)" }}>
                      👨 الزوج
                    </div>
                    <div
                      className='text-lg font-bold'
                      style={{ color: "var(--primary)" }}>
                      {currentPatient.ReceptionData
                        ? `${currentPatient.ReceptionData.maleName} ${currentPatient.ReceptionData.maleLastName}`
                        : currentPatient.patientName}
                    </div>
                  </div>

                  <div className='text-center p-4 rounded-lg bg-white'>
                    <div
                      className='text-xs mb-1'
                      style={{ color: "var(--dark)" }}>
                      👩 الزوجة
                    </div>
                    <div
                      className='text-lg font-bold'
                      style={{ color: "var(--primary)" }}>
                      {currentPatient.ReceptionData
                        ? `${currentPatient.ReceptionData.femaleName} ${currentPatient.ReceptionData.femaleLastName}`
                        : "-"}
                    </div>
                  </div>
                </div>

                {currentPatient.ReceptionData?.phoneNumber && (
                  <div
                    className='text-center mt-3 text-sm'
                    style={{ color: "var(--dark)" }}>
                    📱 {currentPatient.ReceptionData.phoneNumber}
                  </div>
                )}
              </div>

              {/* Payment Form */}
              <div className=' space-y-4'>
                <div className='flex flex-row items-center justify-center gap-4'>
                  <div className='w-full'>
                    <label
                      className='block text-sm font-medium mb-2'
                      style={{ color: "var(--dark)" }}>
                      المبلغ المدفوع (ليرة سورية) *
                    </label>
                    <div
                      className='flex flex-row items-center justify-center gap-4'
                      style={{ color: "var(--dark)" }}>
                      <input
                        type='number'
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className='input-field w-full text-2xl font-bold text-center'
                        placeholder='0.00'
                        step='0.01'
                        required
                      />
                      <span
                        className='text-2xl'
                        style={{ color: "var(--dark)" }}>
                        ل.س
                      </span>
                    </div>
                  </div>
                  <div className='flex flex-col items-center w-full  justify-center gap-4 p-4 rounded-lg'>
                    <span className='block text-sm font-medium '></span>
                    <div className='flex flex-row items-center justify-center gap-4'>
                      <input
                        type='checkbox'
                        id='isPaid'
                        checked={isPaid}
                        onChange={(e) => setIsPaid(e.target.checked)}
                        className='w-6 h-6'
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <label
                        htmlFor='isPaid'
                        className='text-lg font-semibold'
                        style={{ color: "var(--primary)" }}>
                        تأكيد استلام المبلغ
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className='block text-sm font-medium mb-2'
                    style={{ color: "var(--dark)" }}>
                    ملاحظات
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className='input-field'
                    rows={2}
                    placeholder='ملاحظات إضافية (اختياري)'
                  />
                </div>

                {/* Action Buttons */}
                <div className='pt-4 flex flex-row items-center justify-evenly gap-4'>
                  <div className='flex flex-row gap-3 w-full items-center justify-center'>
                    <button
                      onClick={handleSave}
                      disabled={loading || !isPaid || !amount}
                      className='btn-success py-3 text-lg disabled:opacity-50'>
                      {loading ? "⏳ جاري الحفظ..." : "تأكيد الدفع"}
                    </button>

                    {/* أزرار إضافية عند الاختيار من القائمة */}
                    {isFromSidebar && (
                      <div className='flex gap-3'>
                        {/* زر استدعاء / إعادة نداء */}
                        {!hasBeenCalled ? (
                          // إذا لم يتم استدعاءه بعد → زر "استدعاء الآن"
                          <button
                            onClick={handleRecall}
                            disabled={loading}
                            className='btn-success py-3 text-lg disabled:opacity-50'
                            style={{ backgroundColor: "var(--primary)" }}>
                            {loading ? " جاري الاستدعاء..." : " استدعاء الآن"}
                          </button>
                        ) : (
                          // إذا تم استدعاءه → زر "إعادة النداء"
                          <button
                            onClick={handleRecall}
                            disabled={loading || recallCooldown > 0}
                            className='btn-success py-3 text-lg disabled:opacity-50'>
                            {loading
                              ? " جاري النداء..."
                              : recallCooldown > 0
                              ? ` انتظر ${recallCooldown} ث`
                              : ` إعادة النداء (${recallCount}/3)`}
                          </button>
                        )}

                        <button
                          onClick={handleCancelQueue}
                          disabled={loading || recallCount < 3}
                          className='btn-danger py-3 text-lg disabled:opacity-50'
                          style={{
                            backgroundColor:
                              recallCount >= 3 ? "#dc2626" : "#9ca3af",
                          }}>
                          {loading ? "⏳ جاري الإلغاء..." : " لم يحضر"}
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setCurrentPatient(null);
                        setRecallCount(0);
                        setIsFromSidebar(false);
                        setAmount("");
                        setIsPaid(false);
                        setNotes("");
                      }}
                      className='bg-gray-500 text-white hover:opacity-80 cursor-pointer rounded-lg py-3 px-6 text-lg'>
                      خروج
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='w-80 border-r' style={{ borderColor: "var(--light)" }}>
          <QueueSidebar
            stationName='المحاسبة'
            currentQueueId={currentPatient?.queueId}
            stationId={stationId}
            onSelectQueue={handleSelectQueueFromSidebar}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountingPage;
