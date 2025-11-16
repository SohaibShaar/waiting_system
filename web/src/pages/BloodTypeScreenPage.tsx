import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";
import { API_BASE_URL } from "../services/api";

const API_URL = API_BASE_URL;
const STATION_DISPLAY_NUMBER = 6;

interface CurrentPatient {
  queueId: number;
  queueNumber: number;
  patientId: number;
  maleName: string;
  femaleName: string;
  priority: number;
  ReceptionData?: {
    maleName: string;
    maleLastName: string;
    femaleName: string;
    femaleLastName: string;
    phoneNumber?: string;
    maleStatus: string;
    femaleStatus: string;
  };
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BloodTypeScreenPage = () => {
  const [currentPatient, setCurrentPatient] = useState<CurrentPatient | null>(
    null
  );
  const [maleBloodType, setMaleBloodType] = useState("");
  const [femaleBloodType, setFemaleBloodType] = useState("");
  const [loading, setLoading] = useState(false);
  const [stationId, setStationId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const mainContentRef = useRef<HTMLDivElement>(null);

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
      maleStatus: string;
      femaleStatus: string;
    };
  }) => {
    try {
      setLoading(true);
      setErrorMessage("");

      // جلب بيانات الدور الكاملة
      const queueResponse = await axios.get(`${API_URL}/queue/${queue.id}`);

      if (queueResponse.data.success) {
        const fullQueue = queueResponse.data.queue;

        setCurrentPatient({
          queueId: fullQueue.id,
          queueNumber: fullQueue.queueNumber,
          patientId: fullQueue.patientId,
          maleName: fullQueue.ReceptionData?.maleName || "غير محدد",
          femaleName: fullQueue.ReceptionData?.femaleName || "غير محدد",
          priority: fullQueue.priority || 0,
          ReceptionData: fullQueue.ReceptionData,
        });

        // محاولة جلب فصيلة الدم إذا كانت موجودة
        try {
          const bloodTypeResponse = await axios.get(
            `${API_URL}/blood-type/${fullQueue.id}`
          );
          if (bloodTypeResponse.data.success) {
            setMaleBloodType(bloodTypeResponse.data.data.maleBloodType || "");
            setFemaleBloodType(
              bloodTypeResponse.data.data.femaleBloodType || ""
            );
          }
        } catch {
          // لا توجد بيانات سابقة - هذا طبيعي
          setMaleBloodType("");
          setFemaleBloodType("");
        }

        setErrorMessage("");
      }
    } catch (error: unknown) {
      console.error("خطأ في اختيار المراجع:", error);
      const err = error as { response?: { data?: { error?: string } } };
      setErrorMessage(
        err.response?.data?.error || "حدث خطأ أثناء اختيار المراجع"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPatient) {
      alert("⚠️ لا يوجد مراجع حالي");
      return;
    }

    if (!stationId) {
      alert("⚠️ خطأ: لم يتم تحديد المحطة");
      return;
    }

    // التحقق من إدخال فصيلة دم واحدة على الأقل
    const shouldShowMale =
      currentPatient.ReceptionData?.femaleStatus !== "LEGAL_INVITATION" &&
      currentPatient.ReceptionData?.maleStatus !== "OUT_OF_COUNTRY" &&
      currentPatient.ReceptionData?.maleStatus !== "OUT_OF_PROVINCE" &&
      currentPatient.ReceptionData?.maleStatus !== "NOT_EXIST";

    const shouldShowFemale =
      currentPatient.ReceptionData?.maleStatus !== "LEGAL_INVITATION" &&
      currentPatient.ReceptionData?.femaleStatus !== "OUT_OF_COUNTRY" &&
      currentPatient.ReceptionData?.femaleStatus !== "OUT_OF_PROVINCE" &&
      currentPatient.ReceptionData?.femaleStatus !== "NOT_EXIST";

    if (shouldShowMale && !maleBloodType) {
      alert("⚠️ يرجى اختيار فصيلة دم الزوج");
      return;
    }

    if (shouldShowFemale && !femaleBloodType) {
      alert("⚠️ يرجى اختيار فصيلة دم الزوجة");
      return;
    }

    try {
      setLoading(true);

      // استدعاء المراجع بدون عرض على الشاشة (silent call)
      try {
        await axios.post(`${API_URL}/stations/${stationId}/call-specific`, {
          queueNumber: currentPatient.queueNumber,
          calledBy: "محطة فصيلة الدم",
          silent: true, // إشارة لعدم العرض على الشاشة
        });
        console.log("تم استدعاء المراجع (بدون عرض)");
      } catch {
        console.log("المراجع قد تم استدعاؤه مسبقاً");
      }

      // بدء الخدمة في المحطة
      try {
        await axios.post(`${API_URL}/stations/${stationId}/start-service`, {
          queueId: currentPatient.queueId,
        });
        console.log("تم بدء الخدمة");
      } catch (error) {
        console.log("الخدمة قد بدأت بالفعل أو حدث خطأ:", error);
      }

      // حفظ فصيلة الدم
      await axios.post(`${API_URL}/blood-type`, {
        queueId: currentPatient.queueId,
        patientId: currentPatient.patientId,
        ...(shouldShowMale && { maleBloodType }),
        ...(shouldShowFemale && { femaleBloodType }),
      });

      // إنهاء الخدمة ونقل المراجع للمحطة التالية
      await axios.post(`${API_URL}/stations/${stationId}/complete-service`, {
        queueId: currentPatient.queueId,
      });

      // إعادة تعيين النموذج
      setCurrentPatient(null);
      setMaleBloodType("");
      setFemaleBloodType("");
      setErrorMessage("");
    } catch (error: unknown) {
      console.error("خطأ في حفظ البيانات:", error);
      const err = error as { response?: { data?: { error?: string } } };
      alert(`❌ خطأ: ${err.response?.data?.error || "فشل حفظ فصيلة الدم"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "هل أنت متأكد من إلغاء العملية؟ سيتم فقدان البيانات غير المحفوظة."
      )
    ) {
      setCurrentPatient(null);
      setMaleBloodType("");
      setFemaleBloodType("");
      setErrorMessage("");
    }
  };

  const shouldShowMaleSection = () => {
    if (!currentPatient?.ReceptionData) return true;
    return (
      currentPatient.ReceptionData.femaleStatus !== "LEGAL_INVITATION" &&
      currentPatient.ReceptionData.maleStatus !== "OUT_OF_COUNTRY" &&
      currentPatient.ReceptionData.maleStatus !== "OUT_OF_PROVINCE" &&
      currentPatient.ReceptionData.maleStatus !== "NOT_EXIST"
    );
  };

  const shouldShowFemaleSection = () => {
    if (!currentPatient?.ReceptionData) return true;
    return (
      currentPatient.ReceptionData.maleStatus !== "LEGAL_INVITATION" &&
      currentPatient.ReceptionData.femaleStatus !== "OUT_OF_COUNTRY" &&
      currentPatient.ReceptionData.femaleStatus !== "OUT_OF_PROVINCE" &&
      currentPatient.ReceptionData.femaleStatus !== "NOT_EXIST"
    );
  };

  return (
    <div
      className='h-screen flex flex-col'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='محطة تحديد فصيلة الدم' icon='🩸' />

      <div className='flex-1 flex overflow-hidden'>
        {/* Main Area */}
        <div
          ref={mainContentRef}
          className='flex-1 p-6 overflow-y-auto'
          style={{ marginLeft: "384px" }}>
          {!currentPatient ? (
            <div className='h-full flex items-center justify-center'>
              <div className='card max-w-2xl w-full text-center p-12 my-3'>
                <div className='mb-8'>
                  <div className='text-6xl mb-4'>🩸</div>
                  <h2
                    className='text-2xl font-bold mb-2'
                    style={{ color: "var(--primary)" }}>
                    محطة تحديد فصيلة الدم
                  </h2>
                  <p className='text-sm' style={{ color: "var(--dark)" }}>
                    اختر مراجعاً من القائمة الجانبية لتحديد فصيلة الدم
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              {/* معلومات المراجع */}
              <div className='card px-6 py-1'>
                <div className='flex items-center justify-between my-1'>
                  {currentPatient.priority === 1 && (
                    <span className='px-4 py-1 rounded-lg bg-orange-400 text-white font-bold'>
                      ⚠️ مستعجل
                    </span>
                  )}
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm' style={{ color: "var(--dark)" }}>
                      رقم الدور
                    </p>
                    <p className='text-4xl font-bold'>
                      #{currentPatient.queueNumber}
                    </p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div
                  className='p-4 rounded-lg'
                  style={{ backgroundColor: "#fee", color: "#c33" }}>
                  {errorMessage}
                </div>
              )}

              {/* قسم الزوج */}
              {shouldShowMaleSection() && (
                <div className='card p-6'>
                  <h3
                    className='text-xl font-bold mb-4'
                    style={{ color: "var(--primary)" }}>
                    🔵 فصيلة دم الزوج {" | "}
                    <span className='bold text-black text-sm'>
                      {currentPatient.ReceptionData?.maleName}{" "}
                      {currentPatient.ReceptionData?.maleLastName}
                    </span>
                  </h3>
                  <div className='mb-2'>
                    <p className='text-lg font-semibold mb-4'></p>
                  </div>

                  <div className='grid grid-cols-8 gap-3'>
                    {BLOOD_TYPES.map((type) => (
                      <button
                        key={`male-${type}`}
                        onClick={() => setMaleBloodType(type)}
                        className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                          maleBloodType === type
                            ? "bg-blue-600 text-white transform scale-105"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                        style={{
                          border:
                            maleBloodType === type
                              ? "3px solid #1e40af"
                              : "2px solid #d1d5db",
                        }}>
                        {type}
                      </button>
                    ))}
                  </div>

                  {/*maleBloodType && (
                    <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
                      <p className='text-center text-lg font-bold text-blue-800'>
                        ✓ تم اختيار: {maleBloodType}
                      </p>
                    </div>
                  )*/}
                </div>
              )}

              {/* قسم الزوجة */}
              {shouldShowFemaleSection() && (
                <div className='card p-6'>
                  <h3
                    className='text-xl font-bold mb-4'
                    style={{ color: "var(--secondary)" }}>
                    🔴 فصيلة دم الزوجة {" | "}
                    <span className='bold text-black text-sm'>
                      {currentPatient.ReceptionData?.femaleName}{" "}
                      {currentPatient.ReceptionData?.femaleLastName}
                    </span>
                  </h3>
                  <div className='mb-2'>
                    <p className='text-lg font-semibold mb-4'></p>
                  </div>

                  <div className='grid grid-cols-8 gap-3'>
                    {BLOOD_TYPES.map((type) => (
                      <button
                        key={`female-${type}`}
                        onClick={() => setFemaleBloodType(type)}
                        className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                          femaleBloodType === type
                            ? "bg-pink-600 text-white transform scale-105"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                        style={{
                          border:
                            femaleBloodType === type
                              ? "3px solid #be185d"
                              : "2px solid #d1d5db",
                        }}>
                        {type}
                      </button>
                    ))}
                  </div>

                  {/*femaleBloodType && (
                    <div className='mt-4 p-4 bg-pink-50 rounded-lg'>
                      <p className='text-center text-lg font-bold text-pink-800'>
                        ✓ تم اختيار: {femaleBloodType}
                      </p>
                    </div>
                  )*/}
                </div>
              )}

              {/* أزرار الحفظ والإلغاء */}
              <div className='flex gap-4'>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className='btn-success flex-1 px-8 py-4 text-xl disabled:opacity-50'>
                  {loading ? "⏳ جاري الحفظ..." : "💾 حفظ ونقل للمحطة التالية"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className='bg-gray-500 text-white hover:opacity-80 cursor-pointer rounded-lg px-8 py-4 text-xl disabled:opacity-50'>
                  ❌ إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Fixed */}
        <div
          className='w-96 border-r fixed left-0 h-screen flex flex-col'
          style={{
            borderColor: "var(--light)",
            top: 0,
          }}>
          <QueueSidebar
            stationName='تحديد فصيلة الدم'
            currentQueueId={currentPatient?.queueId}
            stationId={stationId}
            onSelectQueue={handleSelectQueueFromSidebar}
          />
        </div>
      </div>
    </div>
  );
};

export default BloodTypeScreenPage;
