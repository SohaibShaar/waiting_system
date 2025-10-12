import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";

const API_URL = "http://localhost:3003/api";
const STATION_DISPLAY_NUMBER = 4;

interface CurrentPatient {
  queueId: number;
  queueNumber: number;
  patientId: number;
  ReceptionData?: {
    maleName: string;
    maleLastName: string;
    femaleName: string;
    femaleLastName: string;
    phoneNumber?: string;
  };
}

const DoctorPage = () => {
  const [currentPatient, setCurrentPatient] = useState<CurrentPatient | null>(
    null
  );
  const [formData, setFormData] = useState({
    maleBloodType: "",
    femaleBloodType: "",
    maleHIVstatus: "NEGATIVE",
    femaleHIVstatus: "NEGATIVE",
    maleHBSstatus: "NEGATIVE",
    femaleHBSstatus: "NEGATIVE",
    maleHBCstatus: "NEGATIVE",
    femaleHBCstatus: "NEGATIVE",
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
        { calledBy: "الطبيبة" }
      );

      if (response.data.success) {
        const queueResponse = await axios.get(
          `${API_URL}/queue/${response.data.queue.id}`
        );

        if (queueResponse.data.success) {
          const queue = queueResponse.data.queue;
          setCurrentPatient({
            queueId: queue.id,
            queueNumber: queue.queueNumber,
            patientId: queue.patientId,
            ReceptionData: queue.ReceptionData,
          });

          setFormData({
            maleBloodType: "",
            femaleBloodType: "",
            maleHIVstatus: "NEGATIVE",
            femaleHIVstatus: "NEGATIVE",
            maleHBSstatus: "NEGATIVE",
            femaleHBSstatus: "NEGATIVE",
            maleHBCstatus: "NEGATIVE",
            femaleHBCstatus: "NEGATIVE",
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
      const response = await axios.post(`${API_URL}/doctor`, {
        queueId: currentPatient.queueId,
        patientId: currentPatient.patientId,
        ...formData,
      });

      if (response.data.success) {
        alert("✅ تم حفظ البيانات الطبية النهائية بنجاح!");
        await axios.post(`${API_URL}/stations/${stationId}/complete-service`, {
          queueId: currentPatient.queueId,
          notes: "تم الفحص النهائي",
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

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div
      className='h-screen flex flex-col overflow-hidden'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='محطة الطبيبة - الفحص النهائي' icon='👩‍⚕️' />

      <div className='flex-1 flex overflow-hidden'>
        {/* Main Area */}
        <div className='flex-1 overflow-y-auto p-6'>
          {!currentPatient ? (
            <div className='h-full flex items-center justify-center'>
              <div className='card max-w-2xl w-full text-center p-12'>
                <div className='mb-8'>
                  <div className='text-6xl mb-4'>👩‍⚕️</div>
                  <h2
                    className='text-2xl font-bold mb-2'
                    style={{ color: "var(--primary)" }}>
                    محطة الطبيبة
                  </h2>
                  <p className='text-sm' style={{ color: "var(--dark)" }}>
                    الفحص الطبي النهائي
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
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "var(--dark)" }}>👩 </span>
                      <span className='font-semibold'>
                        {currentPatient.ReceptionData
                          ? `${currentPatient.ReceptionData.femaleName} ${currentPatient.ReceptionData.femaleLastName}`
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form - Compact */}
              <div className='grid grid-cols-2 gap-4'>
                {/* Male Section */}
                <div
                  className='p-4 rounded-lg space-y-3'
                  style={{ backgroundColor: "var(--light)" }}>
                  <h3
                    className='text-sm font-semibold mb-2'
                    style={{ color: "var(--primary)" }}>
                    👨 بيانات الزوج
                  </h3>
                  <select
                    value={formData.maleBloodType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maleBloodType: e.target.value,
                      })
                    }
                    className='input-field text-sm py-2'>
                    <option value=''>فصيلة الدم</option>
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-16'>HIV:</span>
                      <select
                        value={formData.maleHIVstatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maleHIVstatus: e.target.value,
                          })
                        }
                        className='input-field text-sm py-1 flex-1'>
                        <option value='NEGATIVE'>سلبي</option>
                        <option value='POSITIVE'>إيجابي</option>
                      </select>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-16'>HBS:</span>
                      <select
                        value={formData.maleHBSstatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maleHBSstatus: e.target.value,
                          })
                        }
                        className='input-field text-sm py-1 flex-1'>
                        <option value='NEGATIVE'>سلبي</option>
                        <option value='POSITIVE'>إيجابي</option>
                      </select>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-16'>HBC:</span>
                      <select
                        value={formData.maleHBCstatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maleHBCstatus: e.target.value,
                          })
                        }
                        className='input-field text-sm py-1 flex-1'>
                        <option value='NEGATIVE'>سلبي</option>
                        <option value='POSITIVE'>إيجابي</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={formData.maleNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, maleNotes: e.target.value })
                    }
                    className='input-field text-sm'
                    rows={2}
                    placeholder='ملاحظات'
                  />
                </div>

                {/* Female Section */}
                <div
                  className='p-4 rounded-lg space-y-3'
                  style={{ backgroundColor: "var(--light)" }}>
                  <h3
                    className='text-sm font-semibold mb-2'
                    style={{ color: "var(--secondary)" }}>
                    👩 بيانات الزوجة
                  </h3>
                  <select
                    value={formData.femaleBloodType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        femaleBloodType: e.target.value,
                      })
                    }
                    className='input-field text-sm py-2'>
                    <option value=''>فصيلة الدم</option>
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-16'>HIV:</span>
                      <select
                        value={formData.femaleHIVstatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            femaleHIVstatus: e.target.value,
                          })
                        }
                        className='input-field text-sm py-1 flex-1'>
                        <option value='NEGATIVE'>سلبي</option>
                        <option value='POSITIVE'>إيجابي</option>
                      </select>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-16'>HBS:</span>
                      <select
                        value={formData.femaleHBSstatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            femaleHBSstatus: e.target.value,
                          })
                        }
                        className='input-field text-sm py-1 flex-1'>
                        <option value='NEGATIVE'>سلبي</option>
                        <option value='POSITIVE'>إيجابي</option>
                      </select>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-16'>HBC:</span>
                      <select
                        value={formData.femaleHBCstatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            femaleHBCstatus: e.target.value,
                          })
                        }
                        className='input-field text-sm py-1 flex-1'>
                        <option value='NEGATIVE'>سلبي</option>
                        <option value='POSITIVE'>إيجابي</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={formData.femaleNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        femaleNotes: e.target.value,
                      })
                    }
                    className='input-field text-sm'
                    rows={2}
                    placeholder='ملاحظات'
                  />
                </div>
              </div>

              {/* General Notes */}
              <div className='mt-4'>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className='input-field'
                  rows={3}
                  placeholder='التقرير النهائي والتوصيات...'
                />
              </div>

              {/* Buttons */}
              <div className='flex gap-3 mt-4'>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className='btn-success flex-1 py-3 text-lg disabled:opacity-50'>
                  {loading ? "⏳ جاري الحفظ..." : "💾 حفظ النهائي وإنهاء الدور"}
                </button>
                <button
                  onClick={() => setCurrentPatient(null)}
                  className='btn-secondary py-3 px-6 text-lg'>
                  ❌ إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='w-80 border-r' style={{ borderColor: "var(--light)" }}>
          <QueueSidebar
            stationName='الطبيبة'
            currentQueueId={currentPatient?.queueId}
          />
        </div>
      </div>
    </div>
  );
};

export default DoctorPage;
