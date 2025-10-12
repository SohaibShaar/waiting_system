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

      console.error("خطأ في استدعاء المريض:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPatient) {
      alert("⚠️ لا يوجد مريض حالي");
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

  return (
    <div
      className='h-screen flex flex-col overflow-hidden'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='محطة المحاسبة' icon='💰' />

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
                  محطة المحاسبة
                </h2>
                <p className='text-sm' style={{ color: "var(--dark)" }}>
                  اضغط على الزر لاستدعاء المريض التالي
                </p>
              </div>
              <button
                onClick={callNextPatient}
                disabled={loading}
                className='btn-primary px-12 py-4 text-xl disabled:opacity-50'>
                {loading ? "⏳ جاري الاستدعاء..." : "📢 استدعاء المريض التالي"}
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
            <div className='card max-w-3xl w-full p-8'>
              {/* Patient Info */}
              <div
                className='rounded-lg p-6 mb-6'
                style={{ backgroundColor: "var(--light)" }}>
                <div className='text-center mb-4'>
                  <span className='text-sm' style={{ color: "var(--dark)" }}>
                    رقم الدور
                  </span>
                  <div
                    className='text-6xl font-bold my-2'
                    style={{ color: "var(--primary)" }}>
                    {currentPatient.queueNumber}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 mt-4'>
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
                      style={{ color: "var(--secondary)" }}>
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
              <div className='space-y-4'>
                <div>
                  <label
                    className='block text-sm font-medium mb-2'
                    style={{ color: "var(--dark)" }}>
                    المبلغ المدفوع (ريال) *
                  </label>
                  <input
                    type='number'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className='input-field text-2xl font-bold text-center'
                    placeholder='0.00'
                    step='0.01'
                    required
                  />
                </div>

                <div
                  className='flex items-center justify-center gap-4 p-4 rounded-lg'
                  style={{ backgroundColor: "var(--light)" }}>
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
                    ✅ تأكيد استلام المبلغ
                  </label>
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
                <div className='flex gap-4 pt-4'>
                  <button
                    onClick={handleSave}
                    disabled={loading || !isPaid || !amount}
                    className='btn-success flex-1 py-3 text-lg disabled:opacity-50'>
                    {loading ? "⏳ جاري الحفظ..." : "💾 تأكيد الدفع"}
                  </button>

                  <button
                    onClick={() => setCurrentPatient(null)}
                    className='btn-secondary py-3 px-6 text-lg'>
                    ❌ إلغاء
                  </button>
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
          />
        </div>
      </div>
    </div>
  );
};

export default AccountingPage;
