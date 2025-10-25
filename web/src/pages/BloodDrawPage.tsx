import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";
import { printLabels } from "../utils/labelPrinter";
import { API_BASE_URL } from "../services/api";

const API_URL = API_BASE_URL;
const STATION_DISPLAY_NUMBER = 4;

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

interface TubeNumbers {
  maleBloodTube1?: string;
  maleBloodTube2?: string;
  femaleBloodTube1?: string;
  femaleBloodTube2?: string;
}

interface ArchiveRecord {
  id: number;
  queueId: number;
  patientId: number;
  maleBloodTube1: string | null;
  maleBloodTube2: string | null;
  femaleBloodTube1: string | null;
  femaleBloodTube2: string | null;
  notes: string | null;
  createdAt: string;
  queue: {
    queueNumber: number;
    priority: number;
    ReceptionData: {
      maleName: string | null;
      maleLastName: string | null;
      femaleName: string | null;
      femaleLastName: string | null;
      maleStatus: string;
      femaleStatus: string;
    } | null;
  };
}

const BloodDrawPage = () => {
  const [currentPatient, setCurrentPatient] = useState<CurrentPatient | null>(
    null
  );
  const [formData, setFormData] = useState({
    notes: "",
  });
  const [tubeNumbers, setTubeNumbers] = useState<TubeNumbers | null>(null);
  const [loading, setLoading] = useState(false);
  const [stationId, setStationId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [recallCount, setRecallCount] = useState(0);
  const [isFromSidebar, setIsFromSidebar] = useState(false);
  const [hasBeenCalled, setHasBeenCalled] = useState(false);
  const [recallCooldown, setRecallCooldown] = useState(0);

  // Archive states
  const [showArchive, setShowArchive] = useState(false);
  const [archiveData, setArchiveData] = useState<ArchiveRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
      setErrorMessage("");

      const response = await axios.post(
        `${API_URL}/stations/${stationId}/call-next`,
        { calledBy: "فني سحب الدم" }
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
            priority: queue.priority || 0, // إضافة الأولوية
            ReceptionData: reception,
          });

          setFormData({
            notes: "",
          });

          // توليد أرقام أنابيب الدم
          try {
            const tubesResponse = await axios.post(
              `${API_URL}/blood-draw/generate-tubes/${queue.id}`
            );
            if (tubesResponse.data.success) {
              setTubeNumbers(tubesResponse.data.tubes);
            }
          } catch (error) {
            console.error("خطأ في توليد أرقام الأنابيب:", error);
          }

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

      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "حدث خطأ";
      setErrorMessage(errorMsg);

      console.error("خطأ في استدعاء المراجع:", error);
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
      const response = await axios.post(`${API_URL}/blood-draw`, {
        queueId: currentPatient.queueId,
        patientId: currentPatient.patientId,
        ...formData,
        ...(tubeNumbers && {
          maleBloodTube1: tubeNumbers.maleBloodTube1,
          maleBloodTube2: tubeNumbers.maleBloodTube2,
          femaleBloodTube1: tubeNumbers.femaleBloodTube1,
          femaleBloodTube2: tubeNumbers.femaleBloodTube2,
        }),
      });

      if (response.data.success) {
        alert("✅ تم تسجيل سحب الدم بنجاح!");
        printLabels(
          "♂ الخاطب : " +
            currentPatient.ReceptionData?.maleName +
            " " +
            currentPatient.ReceptionData?.maleLastName || "",
          "M" + tubeNumbers?.maleBloodTube1 || "",
          "M" + tubeNumbers?.maleBloodTube2 || "",
          "♀ الخطيبة : " +
            currentPatient.ReceptionData?.femaleName +
            " " +
            currentPatient.ReceptionData?.femaleLastName || "",
          "F" + tubeNumbers?.femaleBloodTube1 || "",
          "F" + tubeNumbers?.femaleBloodTube2 || "",
          currentPatient.priority,
          currentPatient.ReceptionData?.maleStatus || "",
          currentPatient.ReceptionData?.femaleStatus || ""
        );
        await axios.post(`${API_URL}/stations/${stationId}/complete-service`, {
          queueId: currentPatient.queueId,
          notes: "تم سحب الدم",
        });
        setCurrentPatient(null);
        setTubeNumbers(null);
        setRecallCount(0);
        setIsFromSidebar(false);
        setFormData({
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
          priority: fullQueue.priority || 0, // إضافة الأولوية
        });

        // توليد أرقام أنابيب الدم
        try {
          const tubesResponse = await axios.post(
            `${API_URL}/blood-draw/generate-tubes/${fullQueue.id}`
          );
          if (tubesResponse.data.success) {
            setTubeNumbers(tubesResponse.data.tubes);
          }
        } catch (error) {
          console.error("خطأ في توليد أرقام الأنابيب:", error);
        }

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
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات الدور:", error);
      setErrorMessage("❌ حدث خطأ في جلب بيانات الدور");
    } finally {
      setLoading(false);
    }
  };

  const handleRecall = async () => {
    if (!currentPatient || !stationId) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/stations/${stationId}/call-specific`,
        {
          queueNumber: currentPatient.queueNumber,
          calledBy: "فني سحب الدم (إعادة نداء)",
        }
      );

      if (response.data.success) {
        setRecallCount((prev) => prev + 1);
        setRecallCooldown(10);
        setHasBeenCalled(true);
        alert(`✅ تم إعادة النداء (المحاولة ${recallCount + 1}/3)`);
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
        setTubeNumbers(null);
        setRecallCount(0);
        setIsFromSidebar(false);
        setFormData({
          notes: "",
        });

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

  // جلب بيانات الأرشيف
  const fetchArchiveData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/blood-draw/all`);
      if (response.data.success) {
        setArchiveData(response.data.data);
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات الأرشيف:", error);
      alert("❌ حدث خطأ في جلب بيانات الأرشيف");
    } finally {
      setLoading(false);
    }
  };

  // فتح الأرشيف
  const handleOpenArchive = () => {
    setShowArchive(true);
    fetchArchiveData();
  };

  // تصفية الأرشيف
  const filteredArchive = archiveData.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    const queueNumber = record.queue.queueNumber.toString();
    const patientId = record.patientId.toString();
    const maleName = record.queue.ReceptionData?.maleName?.toLowerCase() || "";
    const femaleName =
      record.queue.ReceptionData?.femaleName?.toLowerCase() || "";

    return (
      queueNumber.includes(searchLower) ||
      patientId.includes(searchLower) ||
      maleName.includes(searchLower) ||
      femaleName.includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredArchive.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredArchive.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div
      className='h-screen flex flex-col'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='محطة سحب الدم' icon='💉' />

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
                  <div className='text-6xl mb-4'>💉</div>
                  <h2
                    className='text-2xl font-bold mb-2'
                    style={{ color: "var(--primary)" }}>
                    محطة سحب الدم
                  </h2>
                  <p className='text-sm' style={{ color: "var(--dark)" }}>
                    اضغط على الزر لاستدعاء المراجع التالي
                  </p>
                </div>
                <div className='flex gap-4 justify-center'>
                  <button
                    onClick={callNextPatient}
                    disabled={loading}
                    className='btn-primary px-12 py-4 text-xl disabled:opacity-50'>
                    {loading
                      ? "⏳ جاري الاستدعاء..."
                      : "📢 استدعاء المراجع التالي"}
                  </button>
                  <button
                    onClick={handleOpenArchive}
                    disabled={loading}
                    className='bg-[#054239] text-white hover:bg-[#054239]/80 cursor-pointer rounded-lg px-8 py-4 text-xl disabled:opacity-50'>
                    📁 الأرشيف
                  </button>
                </div>

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
              <div className=' text-right flex flex-row items-start justify-start py-4'>
                <div className=''>
                  {/* عرض الأولوية */}
                  {currentPatient.priority === 1 && (
                    <span className='text-lg font-bold text-white bg-orange-500 rounded-lg px-2 py-1 animate-pulse'>
                      مُستعجل
                    </span>
                  )}
                </div>
                <div className=''>
                  {currentPatient.ReceptionData?.maleStatus ===
                    "LEGAL_INVITATION" ||
                  currentPatient.ReceptionData?.femaleStatus ===
                    "LEGAL_INVITATION" ? (
                    <span className='text-lg font-bold text-white bg-red-500 rounded-lg px-2 mx-2 py-1'>
                      دعوة شرعية
                    </span>
                  ) : null}
                </div>
              </div>
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
                        👨 الزوج
                      </div>
                      <div className='text-lg font-bold'>
                        {currentPatient.ReceptionData &&
                        currentPatient.ReceptionData.maleName != null ? (
                          `${currentPatient.ReceptionData.maleName} ${currentPatient.ReceptionData.maleLastName}`
                        ) : currentPatient.ReceptionData?.maleStatus ===
                          "NOT_EXIST" ? (
                          <span className='text-red-500'>لا يوجد زوج</span>
                        ) : currentPatient.ReceptionData?.maleStatus ===
                          "OUT_OF_COUNTRY" ? (
                          <span className='text-red-500'>خارج القطر</span>
                        ) : currentPatient.ReceptionData?.maleStatus ===
                          "OUT_OF_PROVINCE" ? (
                          <span className='text-red-500'>خارج المحافظة</span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='text-center p-4 rounded-lg bg-white'>
                    <div
                      className='text-xs mb-1'
                      style={{ color: "var(--dark)" }}>
                      👩 الزوجة
                    </div>
                    <div className='text-lg font-bold'>
                      {currentPatient.ReceptionData &&
                      currentPatient.ReceptionData.femaleName != null ? (
                        `${currentPatient.ReceptionData.femaleName} ${currentPatient.ReceptionData.femaleLastName}`
                      ) : currentPatient.ReceptionData?.femaleStatus ===
                        "NOT_EXIST" ? (
                        <span className='text-red-500'>لا يوجد زوجة</span>
                      ) : currentPatient.ReceptionData?.femaleStatus ===
                        "OUT_OF_COUNTRY" ? (
                        <span className='text-red-500'>خارج القطر</span>
                      ) : currentPatient.ReceptionData?.femaleStatus ===
                        "OUT_OF_PROVINCE" ? (
                        <span className='text-red-500'>خارج المحافظة</span>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Blood Tube Numbers */}
              {tubeNumbers && (
                <div
                  className='rounded-lg p-6 mb-6'
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    border: "2px solid #3b82f6",
                  }}>
                  <h3
                    className='text-xl font-bold mb-4 text-center'
                    style={{ color: "var(--primary)" }}>
                    🧪 أرقام أنابيب الدم
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    {tubeNumbers.maleBloodTube1 && (
                      <div className='text-center p-4 bg-white rounded-lg shadow'>
                        <div
                          className='text-sm mb-2'
                          style={{ color: "var(--dark)" }}>
                          👨 الزوج - أنبوبة 1
                        </div>
                        <div
                          className='text-3xl font-bold'
                          style={{ color: "#3b82f6" }}>
                          {tubeNumbers.maleBloodTube1}
                        </div>
                      </div>
                    )}
                    {tubeNumbers.maleBloodTube2 && (
                      <div className='text-center p-4 bg-white rounded-lg shadow'>
                        <div
                          className='text-sm mb-2'
                          style={{ color: "var(--dark)" }}>
                          👨 الزوج - أنبوبة 2
                        </div>
                        <div
                          className='text-3xl font-bold'
                          style={{ color: "#3b82f6" }}>
                          {tubeNumbers.maleBloodTube2}
                        </div>
                      </div>
                    )}
                    {tubeNumbers.femaleBloodTube1 && (
                      <div className='text-center p-4 bg-white rounded-lg shadow'>
                        <div
                          className='text-sm mb-2'
                          style={{ color: "var(--dark)" }}>
                          👩 الزوجة - أنبوبة 1
                        </div>
                        <div
                          className='text-3xl font-bold'
                          style={{ color: "#ec4899" }}>
                          {tubeNumbers.femaleBloodTube1}
                        </div>
                      </div>
                    )}
                    {tubeNumbers.femaleBloodTube2 && (
                      <div className='text-center p-4 bg-white rounded-lg shadow'>
                        <div
                          className='text-sm mb-2'
                          style={{ color: "var(--dark)" }}>
                          👩 الزوجة - أنبوبة 2
                        </div>
                        <div
                          className='text-3xl font-bold'
                          style={{ color: "#ec4899" }}>
                          {tubeNumbers.femaleBloodTube2}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form */}
              <div className='space-y-4'>
                {/* Notes */}
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className='input-field'
                  rows={3}
                  placeholder='ملاحظات (اختياري)'
                />

                {/* Buttons */}
                <div className='pt-4 flex flex-row items-center justify-evenly gap-4'>
                  <div className='flex flex-row gap-3 w-full items-center justify-center'>
                    <button
                      onClick={handleSave}
                      disabled={loading || !hasBeenCalled}
                      className='btn-success py-3 text-lg disabled:opacity-50'>
                      {loading ? "⏳ جاري الحفظ..." : "✅ حفظ"}
                    </button>

                    <div className='flex gap-3'>
                      {hasBeenCalled && (
                        <button
                          onClick={handleRecall}
                          disabled={loading || recallCooldown > 0}
                          className='btn-success py-3 text-lg disabled:opacity-50'>
                          {loading
                            ? "⏳ جاري النداء..."
                            : recallCooldown > 0
                            ? `⏳ انتظر ${recallCooldown}ث`
                            : `📢 إعادة النداء (${recallCount}/3)`}
                        </button>
                      )}

                      {isFromSidebar && !hasBeenCalled && (
                        <button
                          onClick={handleRecall}
                          disabled={loading}
                          className='btn-success py-3 text-lg disabled:opacity-50'
                          style={{ backgroundColor: "var(--primary)" }}>
                          {loading ? "⏳ جاري الاستدعاء..." : "📢 استدعاء الآن"}
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
                        {loading ? "⏳ جاري الإلغاء..." : "❌ لم يحضر"}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPatient(null);
                        setTubeNumbers(null);
                        setRecallCount(0);
                        setIsFromSidebar(false);
                        setFormData({
                          notes: "",
                        });
                      }}
                      className='bg-gray-500 text-white hover:opacity-80 cursor-pointer rounded-lg py-3 px-6 text-lg'>
                      🚪 خروج
                    </button>
                  </div>
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
            stationName='سحب الدم'
            currentQueueId={currentPatient?.queueId}
            stationId={stationId}
            onSelectQueue={handleSelectQueueFromSidebar}
          />
        </div>
      </div>

      {/* Archive Modal */}
      {showArchive && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={() => setShowArchive(false)}>
          <div
            className='bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col'
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className='flex justify-between items-center mb-6'>
              <h2
                className='text-3xl font-bold'
                style={{ color: "var(--primary)" }}>
                📁 أرشيف سحب الدم
              </h2>
              <button
                onClick={() => setShowArchive(false)}
                className='text-gray-500 hover:text-gray-700 text-3xl'>
                ×
              </button>
            </div>

            {/* Search Bar */}
            <div className='mb-4'>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='بحث برقم الدور أو ID أو اسم المريض...'
                className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
              />
            </div>

            {/* Records Count */}
            <div className='mb-4 flex justify-between items-center'>
              <div className='text-sm text-gray-600'>
                عدد السجلات: {filteredArchive.length} | الصفحة {currentPage} من{" "}
                {totalPages || 1}
              </div>
              <div className='text-sm text-gray-600'>
                عرض {indexOfFirstItem + 1} -{" "}
                {Math.min(indexOfLastItem, filteredArchive.length)} من{" "}
                {filteredArchive.length}
              </div>
            </div>

            {/* Table */}
            <div className='flex-1 overflow-y-auto'>
              <table className='w-full border-collapse'>
                <thead className='bg-gray-100 sticky top-0'>
                  <tr>
                    <th className='border border-gray-300 px-4 py-3 text-center'>
                      رقم الدور
                    </th>
                    <th className='border border-gray-300 px-4 py-3 text-center'>
                      ID
                    </th>
                    <th className='border border-gray-300 px-4 py-3 text-center'>
                      الخطيب
                    </th>
                    <th className='border border-gray-300 px-4 py-3 text-center'>
                      الخطيبة
                    </th>
                    <th className='border border-gray-300 px-4 py-3 text-center'>
                      أنابيب الدم
                    </th>
                    <th className='border border-gray-300 px-4 py-3 text-center'>
                      التاريخ
                    </th>
                    <th className='border border-gray-300 px-4 py-3 text-center'>
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((record) => (
                    <tr key={record.id} className='hover:bg-gray-50'>
                      <td className='border border-gray-300 px-4 py-3 text-center font-bold'>
                        #{record.queue.queueNumber}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        {record.patientId}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        {record.queue.ReceptionData?.maleName || "-"}{" "}
                        {record.queue.ReceptionData?.maleLastName || ""}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        {record.queue.ReceptionData?.femaleName || "-"}{" "}
                        {record.queue.ReceptionData?.femaleLastName || ""}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center text-sm'>
                        <div className='flex flex-col gap-1'>
                          {record.maleBloodTube1 && (
                            <span className='text-blue-600'>
                              👨 {record.maleBloodTube1} /{" "}
                              {record.maleBloodTube2}
                            </span>
                          )}
                          {record.femaleBloodTube1 && (
                            <span className='text-pink-600'>
                              👩 {record.femaleBloodTube1} /{" "}
                              {record.femaleBloodTube2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center text-sm'>
                        {new Date(record.createdAt).toLocaleDateString("ar-US")}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        <button
                          onClick={async () => {
                            setShowArchive(false);
                            console.log(`تم إرسال أمر إعادة الطباعة بنجاح`);
                            // طباعة الملصقات
                            if (
                              record.maleBloodTube1 ||
                              record.femaleBloodTube1
                            ) {
                              const { printLabels } = await import(
                                "../utils/labelPrinter"
                              );
                              printLabels(
                                "♂ الخاطب : " +
                                  (record.queue.ReceptionData?.maleName || "") +
                                  " " +
                                  (record.queue.ReceptionData?.maleLastName ||
                                    ""),
                                "M" + (record.maleBloodTube1 || ""),
                                "M" + (record.maleBloodTube2 || ""),
                                "♀ الخطيبة : " +
                                  (record.queue.ReceptionData?.femaleName ||
                                    "") +
                                  " " +
                                  (record.queue.ReceptionData?.femaleLastName ||
                                    ""),
                                "F" + (record.femaleBloodTube1 || ""),
                                "F" + (record.femaleBloodTube2 || ""),
                                record.queue.priority,
                                record.queue.ReceptionData?.maleStatus || "",
                                record.queue.ReceptionData?.femaleStatus || ""
                              );
                            }
                          }}
                          className='bg-[#054239] text-white hover:bg-[#054239]/80 cursor-pointer rounded-lg px-4 py-2 text-sm'>
                          🖨️ إعادة طباعة
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredArchive.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className='border border-gray-300 px-4 py-8 text-center text-gray-500'>
                        لا توجد سجلات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className='mt-4 flex justify-center items-center gap-2'>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className='px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'>
                  الأولى
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className='px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'>
                  السابقة
                </button>

                <div className='flex gap-1'>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === 2 ||
                      pageNum === totalPages ||
                      pageNum === totalPages - 1 ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}>
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === 3 || pageNum === totalPages - 2) {
                      return (
                        <span key={pageNum} className='px-2'>
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className='px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'>
                  التالية
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className='px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'>
                  الأخيرة
                </button>
              </div>
            )}

            {/* Close Button */}
            <div className='mt-6 flex justify-center'>
              <button
                onClick={() => setShowArchive(false)}
                className='bg-gray-500 text-white hover:bg-gray-600 cursor-pointer rounded-lg px-8 py-3 text-lg'>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodDrawPage;
