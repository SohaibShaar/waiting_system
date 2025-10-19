import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";
import { API_BASE_URL } from "../services/api";

const API_URL = API_BASE_URL;
const STATION_DISPLAY_NUMBER = 5;

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
  const [recallCount, setRecallCount] = useState(0); // عداد إعادة النداء
  const [isFromSidebar, setIsFromSidebar] = useState(false); // هل جاء من القائمة؟
  const [hasBeenCalled, setHasBeenCalled] = useState(false); // هل تم استدعاءه؟
  const [recallCooldown, setRecallCooldown] = useState(0); // عداد الانتظار (10 ثواني)

  // مرجع للتمرير إلى أعلى المحتوى
  const mainContentRef = useRef<HTMLDivElement>(null);

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
        { calledBy: "الطبيبة" }
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

          // تحديث الحالات بعد الاستدعاء الناجح
          setHasBeenCalled(true);
          setIsFromSidebar(false);
          setRecallCount(0);
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
        setRecallCount(0);
        setIsFromSidebar(false);
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
    // التمرير إلى أعلى المحتوى
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

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
          calledBy: "الطبيبة (إعادة نداء)",
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

        setCurrentPatient(null);
        setRecallCount(0);
        setIsFromSidebar(false);
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

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div
      className='h-screen flex flex-col'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='محطة الطبيبة - الفحص النهائي' icon='👩‍⚕️' />

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
                    : "📢 استدعاء المراجع التالي"}
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
            <div className='card w-full p-8 my-3'>
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
                    <div>
                      <div
                        className='text-xs mb-1'
                        style={{ color: "var(--dark)" }}>
                        👨 الزوج{" "}
                      </div>
                      <div className='text-lg font-bold'>
                        {currentPatient.ReceptionData
                          ? `${currentPatient.ReceptionData.maleName} ${currentPatient.ReceptionData.maleLastName}`
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className='text-center p-4 rounded-lg bg-white'>
                    <div
                      className='text-xs mb-1'
                      style={{ color: "var(--dark)" }}>
                      👩 الزوجة{" "}
                    </div>
                    <div className='text-lg font-bold'>
                      {currentPatient.ReceptionData
                        ? `${currentPatient.ReceptionData.femaleName} ${currentPatient.ReceptionData.femaleLastName}`
                        : "-"}
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
                      <span className='text-lg font-bold w-16'>HIV:</span>
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
                      <span className='text-lg font-bold w-16'>HBS:</span>
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
                      <span className='text-lg font-bold w-16'>HBC:</span>
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
                    style={{ color: "var(--primary)" }}>
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
                      <span className='text-lg font-bold w-16'>HIV:</span>
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
                      <span className='text-lg font-bold w-16'>HBS:</span>
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
                      <span className='text-lg font-bold w-16'>HBC:</span>
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
              <div className='pt-4 flex flex-row items-center justify-evenly gap-4'>
                <div className='flex flex-row gap-3 w-full items-center justify-center'>
                  <button
                    onClick={handleSave}
                    disabled={loading || !hasBeenCalled}
                    className='btn-success py-3 text-lg disabled:opacity-50'>
                    {loading ? " جاري الحفظ..." : " حفظ النهائي وإنهاء الدور"}
                  </button>

                  {/* أزرار إعادة النداء والإلغاء */}
                  <div className='flex gap-3'>
                    {/* زر إعادة النداء */}
                    {hasBeenCalled && (
                      <button
                        onClick={handleRecall}
                        disabled={loading || recallCooldown > 0}
                        className='btn-success py-3 text-lg disabled:opacity-50'
                        style={{
                          backgroundColor:
                            recallCooldown > 0 ? "#9ca3af" : "var(--accent)",
                        }}>
                        {loading
                          ? " جاري النداء..."
                          : recallCooldown > 0
                          ? ` انتظر ${recallCooldown}ث`
                          : ` إعادة النداء (${recallCount}/3)`}
                      </button>
                    )}

                    {/* زر استدعاء الآن (فقط من القائمة) */}
                    {isFromSidebar && !hasBeenCalled && (
                      <button
                        onClick={handleRecall}
                        disabled={loading}
                        className='btn-success py-3 text-lg disabled:opacity-50'
                        style={{ backgroundColor: "var(--primary)" }}>
                        {loading ? " جاري الاستدعاء..." : " استدعاء الآن"}
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
                      {loading ? " جاري الإلغاء..." : "لم يحضر"}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPatient(null);
                      setRecallCount(0);
                      setIsFromSidebar(false);
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
                    }}
                    className='bg-gray-500 text-white hover:opacity-80 cursor-pointer rounded-lg py-3 px-6 text-lg'>
                    خروج
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Developed By Footer */}
          <div className='p-4 flex flex-row justify-center items-center text-center text-sm text-gray-500 gap-1'>
            Version 1.0.0 (Beta) -
            <a
              href='https://wa.me/963930294306'
              target='_blank'
              rel='noopener noreferrer'>
              <span className='text-gray-500'>2025 © Sohaib Shaar</span>
            </a>
            <span className='text-gray-500'> : Developed By </span>
          </div>
        </div>

        {/* Sidebar - Fixed */}
        <div
          className='w-96 border-r fixed left-0 h-screen flex flex-col'
          style={{
            borderColor: "var(--light)",
            top: 0,
          }}>
          <QueueSidebar
            stationName='الطبيبة'
            currentQueueId={currentPatient?.queueId}
            stationId={stationId}
            onSelectQueue={handleSelectQueueFromSidebar}
          />
        </div>
      </div>
    </div>
  );
};

export default DoctorPage;
