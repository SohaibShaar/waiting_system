import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";

const API_URL = "http://localhost:3003/api";
const STATION_DISPLAY_NUMBER = 3;

interface CurrentPatient {
  queueId: number;
  queueNumber: number;
  patientId: number;
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

const LabPage = () => {
  const [currentPatient, setCurrentPatient] = useState<CurrentPatient | null>(
    null
  );
  const [formData, setFormData] = useState({
    doctorName: "",
    isMaleHealthy: "HEALTHY",
    isFemaleHealthy: "HEALTHY",
    maleNotes: "",
    femaleNotes: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [stationId, setStationId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // WebSocket updates - handled by sidebar

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
        { calledBy: "فني المختبر" }
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
            patientId: queue.patientId,
            maleName: reception?.maleName || "",
            femaleName: reception?.femaleName || "",
            ReceptionData: reception,
          });

          setFormData({
            doctorName: "",
            isMaleHealthy: "HEALTHY",
            isFemaleHealthy: "HEALTHY",
            maleNotes: "",
            femaleNotes: "",
            notes: "",
          });
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

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/lab`, {
        queueId: currentPatient.queueId,
        patientId: currentPatient.patientId,
        ...formData,
      });

      if (response.data.success) {
        alert("✅ تم حفظ بيانات الفحص بنجاح!");
        await axios.post(`${API_URL}/stations/${stationId}/complete-service`, {
          queueId: currentPatient.queueId,
          notes: "تم الفحص",
        });
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
      <Header title='محطة المختبر' icon='🔬' />

      <div className='flex-1 flex overflow-hidden'>
        {/* Main Area */}
        <div className='flex-1 overflow-y-auto p-6'>
          {!currentPatient ? (
            <div className='h-full flex items-center justify-center'>
              <div className='card max-w-2xl w-full text-center p-12'>
                <div className='mb-8'>
                  <div className='text-6xl mb-4'>🔬</div>
                  <h2
                    className='text-2xl font-bold mb-2'
                    style={{ color: "var(--primary)" }}>
                    محطة المختبر
                  </h2>
                  <p className='text-sm' style={{ color: "var(--dark)" }}>
                    اضغط على الزر لاستدعاء المريض التالي
                  </p>
                </div>
                <button
                  onClick={callNextPatient}
                  disabled={loading}
                  className='btn-primary px-12 py-4 text-xl disabled:opacity-50'>
                  {loading
                    ? "⏳ جاري الاستدعاء..."
                    : "📢 استدعاء المريض التالي"}
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
            </div>
          ) : (
            <div className='card h-full'>
              {/* Patient Info */}
              <div
                className='rounded-lg p-4 mb-4'
                style={{ backgroundColor: "var(--light)" }}>
                <div className='flex items-center justify-between'>
                  <div
                    className='text-4xl font-bold'
                    style={{ color: "var(--primary)" }}>
                    #{currentPatient.queueNumber}
                  </div>
                  <div className='flex gap-4 text-sm'>
                    <div>
                      <span style={{ color: "var(--dark)" }}>👨 </span>
                      <span className='font-semibold'>
                        {currentPatient.ReceptionData
                          ? `${currentPatient.ReceptionData.maleName} ${currentPatient.ReceptionData.maleLastName}`
                          : currentPatient.maleName}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "var(--dark)" }}>👩 </span>
                      <span className='font-semibold'>
                        {currentPatient.ReceptionData
                          ? `${currentPatient.ReceptionData.femaleName} ${currentPatient.ReceptionData.femaleLastName}`
                          : currentPatient.femaleName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className='space-y-4'>
                {/* Doctor Name */}
                <input
                  type='text'
                  value={formData.doctorName}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorName: e.target.value })
                  }
                  className='input-field'
                  placeholder='اسم الطبيب/الفني'
                />

                {/* Male Status */}
                <div
                  className='p-4 rounded-lg'
                  style={{ backgroundColor: "var(--light)" }}>
                  <h3
                    className='text-sm font-semibold mb-3'
                    style={{ color: "var(--primary)" }}>
                    👨 حالة الزوج
                  </h3>
                  <div className='flex gap-3 mb-3'>
                    <button
                      type='button'
                      onClick={() =>
                        setFormData({ ...formData, isMaleHealthy: "HEALTHY" })
                      }
                      className='flex-1 py-3 rounded-lg font-bold transition shadow-md hover:shadow-lg'
                      style={{
                        backgroundColor:
                          formData.isMaleHealthy === "HEALTHY"
                            ? "var(--primary)"
                            : "var(--white)",
                        color:
                          formData.isMaleHealthy === "HEALTHY"
                            ? "var(--white)"
                            : "var(--dark)",
                      }}>
                      ✅ سليم
                    </button>
                    <button
                      type='button'
                      onClick={() =>
                        setFormData({ ...formData, isMaleHealthy: "UNHEALTHY" })
                      }
                      className='flex-1 py-3 rounded-lg font-bold transition shadow-md hover:shadow-lg'
                      style={{
                        backgroundColor:
                          formData.isMaleHealthy === "UNHEALTHY"
                            ? "#dc2626"
                            : "var(--white)",
                        color:
                          formData.isMaleHealthy === "UNHEALTHY"
                            ? "var(--white)"
                            : "var(--dark)",
                      }}>
                      ❌ غير سليم
                    </button>
                  </div>
                  <textarea
                    value={formData.maleNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, maleNotes: e.target.value })
                    }
                    className='input-field'
                    rows={2}
                    placeholder='ملاحظات على الزوج'
                  />
                </div>

                {/* Female Status */}
                <div
                  className='p-4 rounded-lg'
                  style={{ backgroundColor: "var(--light)" }}>
                  <h3
                    className='text-sm font-semibold mb-3'
                    style={{ color: "var(--secondary)" }}>
                    👩 حالة الزوجة
                  </h3>
                  <div className='flex gap-3 mb-3'>
                    <button
                      type='button'
                      onClick={() =>
                        setFormData({ ...formData, isFemaleHealthy: "HEALTHY" })
                      }
                      className='flex-1 py-3 rounded-lg font-bold transition shadow-md hover:shadow-lg'
                      style={{
                        backgroundColor:
                          formData.isFemaleHealthy === "HEALTHY"
                            ? "var(--primary)"
                            : "var(--white)",
                        color:
                          formData.isFemaleHealthy === "HEALTHY"
                            ? "var(--white)"
                            : "var(--dark)",
                      }}>
                      ✅ سليمة
                    </button>
                    <button
                      type='button'
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isFemaleHealthy: "UNHEALTHY",
                        })
                      }
                      className='flex-1 py-3 rounded-lg font-bold transition shadow-md hover:shadow-lg'
                      style={{
                        backgroundColor:
                          formData.isFemaleHealthy === "UNHEALTHY"
                            ? "#dc2626"
                            : "var(--white)",
                        color:
                          formData.isFemaleHealthy === "UNHEALTHY"
                            ? "var(--white)"
                            : "var(--dark)",
                      }}>
                      ❌ غير سليمة
                    </button>
                  </div>
                  <textarea
                    value={formData.femaleNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        femaleNotes: e.target.value,
                      })
                    }
                    className='input-field'
                    rows={2}
                    placeholder='ملاحظات على الزوجة'
                  />
                </div>

                {/* General Notes */}
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className='input-field'
                  rows={2}
                  placeholder='ملاحظات عامة على الفحص'
                />

                {/* Buttons */}
                <div className='flex gap-3'>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className='btn-success flex-1 py-3 text-lg disabled:opacity-50'>
                    {loading ? "⏳ جاري الحفظ..." : "💾 حفظ"}
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
            stationName='المختبر'
            currentQueueId={currentPatient?.queueId}
          />
        </div>
      </div>
    </div>
  );
};

export default LabPage;
