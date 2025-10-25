import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";
import { API_BASE_URL } from "../services/api";

const API_URL = API_BASE_URL;
const STATION_DISPLAY_NUMBER = 3;

interface CurrentPatient {
  queueId: number;
  queueNumber: number;
  patientId: number;
  maleName: string;
  femaleName: string;
  priority: number;
  ReceptionData?: {
    maleAge: number;
    femaleAge: number;
    maleName: string;
    maleLastName: string;
    femaleName: string;
    femaleLastName: string;
    phoneNumber?: string;
    femaleStatus: string;
    maleStatus: string;
  };
}

interface ArchiveRecord {
  id: number;
  queueId: number;
  patientId: number;
  isMaleHealthy: string;
  isFemaleHealthy: string;
  maleNotes: string | null;
  femaleNotes: string | null;
  notes: string | null;
  createdAt: string;
  queue: {
    queueNumber: number;
    ReceptionData: {
      maleName: string | null;
      maleLastName: string | null;
      femaleName: string | null;
      femaleLastName: string | null;
    } | null;
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
  const [recallCount, setRecallCount] = useState(0); // عداد إعادة النداء
  const [isFromSidebar, setIsFromSidebar] = useState(false); // هل جاء من القائمة؟
  const [hasBeenCalled, setHasBeenCalled] = useState(false); // هل تم استدعاءه؟
  const [recallCooldown, setRecallCooldown] = useState(0); // عداد الانتظار (10 ثواني)

  // Archive states
  const [showArchive, setShowArchive] = useState(false);
  const [archiveData, setArchiveData] = useState<ArchiveRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
            priority: queue.priority || 0, // إضافة الأولوية

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

      // إذا كان في وضع التعديل، استخدم PUT بدلاً من POST
      if (isEditMode) {
        const response = await axios.put(
          `${API_URL}/lab/${currentPatient.queueId}`,
          {
            ...formData,
          }
        );

        if (response.data.success) {
          alert("✅ تم تحديث بيانات المختبر بنجاح!");
          setIsEditMode(false);
          clearFormData();
          // إعادة تحميل الأرشيف
          if (showArchive) {
            fetchArchiveData();
          }
        }
      } else {
        const response = await axios.post(`${API_URL}/lab`, {
          queueId: currentPatient.queueId,
          patientId: currentPatient.patientId,
          ...formData,
        });

        if (response.data.success) {
          alert("✅ تم حفظ بيانات الفحص بنجاح!");
          await axios.post(
            `${API_URL}/stations/${stationId}/complete-service`,
            {
              queueId: currentPatient.queueId,
              notes: "تم الفحص",
            }
          );
          clearFormData();
        }
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

  const clearFormData = () => {
    setCurrentPatient(null);
    setRecallCount(0);
    setIsFromSidebar(false);
    setFormData({
      doctorName: "",
      isMaleHealthy: "HEALTHY",
      isFemaleHealthy: "HEALTHY",
      maleNotes: "",
      femaleNotes: "",
      notes: "",
    });
    setIsEditMode(false);
  };

  // جلب بيانات الأرشيف
  const fetchArchiveData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/lab/all`);
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

  // تحميل سجل من الأرشيف للتعديل
  const handleLoadFromArchive = async (record: ArchiveRecord) => {
    try {
      setLoading(true);
      // جلب بيانات الدور الكاملة
      const queueResponse = await axios.get(
        `${API_URL}/queue/${record.queueId}`
      );

      if (queueResponse.data.success) {
        const fullQueue = queueResponse.data.queue;
        const reception = fullQueue.ReceptionData;

        setCurrentPatient({
          queueId: fullQueue.id,
          queueNumber: fullQueue.queueNumber,
          patientId: fullQueue.patientId,
          maleName: reception?.maleName || "",
          femaleName: reception?.femaleName || "",
          priority: fullQueue.priority || 0,

          ReceptionData: reception,
        });

        // تحميل بيانات المختبر
        setFormData({
          doctorName: "",
          isMaleHealthy: record.isMaleHealthy,
          isFemaleHealthy: record.isFemaleHealthy,
          maleNotes: record.maleNotes || "",
          femaleNotes: record.femaleNotes || "",
          notes: record.notes || "",
        });
        setIsEditMode(true);
        setHasBeenCalled(true);
        setShowArchive(false);

        // التمرير إلى أعلى
        if (mainContentRef.current) {
          mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }

        console.log(`✅ تم تحميل السجل #${fullQueue.queueNumber} للتعديل`);
      }
    } catch (error) {
      console.error("خطأ في تحميل السجل:", error);
      alert("❌ حدث خطأ في تحميل السجل");
    } finally {
      setLoading(false);
    }
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
          priority: fullQueue.priority || 0, // إضافة الأولوية
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
          calledBy: "فني المختبر (إعادة نداء)",
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
          doctorName: "",
          isMaleHealthy: "HEALTHY",
          isFemaleHealthy: "HEALTHY",
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

  return (
    <div
      className='h-screen flex flex-col'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='غرفة الفحص الطبي' icon='🩺' />

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
                  <div className='text-6xl mb-4'>🔬</div>
                  <h2
                    className='text-2xl font-bold mb-2'
                    style={{ color: "var(--primary)" }}>
                    محطة المختبر
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
                          <div className='flex flex-col gap-1'>
                            <span>{`${currentPatient.ReceptionData.maleName} ${currentPatient.ReceptionData.maleLastName}`}</span>
                            <span className='text-[14px] text-gray-500'>{`العمر : ${currentPatient.ReceptionData.maleAge} سنة`}</span>
                          </div>
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
                        <div className='flex flex-col gap-1'>
                          <span>{`${currentPatient.ReceptionData.femaleName} ${currentPatient.ReceptionData.femaleLastName}`}</span>
                          <span className='text-[14px] text-gray-500'>{`العمر : ${currentPatient.ReceptionData.femaleAge} سنة`}</span>
                        </div>
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

              {/* Form */}
              <div className='space-y-4'>
                {/* Doctor Name */}
                <input
                  type='text'
                  value={formData.doctorName}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorName: e.target.value })
                  }
                  className='input-field hidden'
                  placeholder='اسم الطبيب/الفني'
                />

                {currentPatient.ReceptionData?.femaleStatus !==
                  "LEGAL_INVITATION" &&
                  currentPatient.ReceptionData?.maleStatus !== "NOT_EXIST" && (
                    <div
                      className='p-4 rounded-lg '
                      style={{ backgroundColor: "var(--light)" }}>
                      <h3
                        className='text-sm font-semibold mb-3'
                        style={{ color: "var(--primary)" }}>
                        👨 حالة الزوج
                      </h3>
                      <div className='flex flex-row items-center justify-center gap-3 mb-3'>
                        <div className='flex flex-row items-center justify-center gap-3 w-[50%]'>
                          <button
                            type='button'
                            onClick={() =>
                              setFormData({
                                ...formData,
                                isMaleHealthy: "HEALTHY",
                              })
                            }
                            className='btn-success w-full py-3 rounded-lg font-bold transition shadow-md hover:shadow-lg'
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
                            سليم
                          </button>
                          <button
                            type='button'
                            onClick={() =>
                              setFormData({
                                ...formData,
                                isMaleHealthy: "UNHEALTHY",
                              })
                            }
                            className='btn-danger w-full py-3 rounded-lg font-bold transition shadow-md hover:shadow-lg'
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
                            غير سليم
                          </button>
                        </div>
                        <textarea
                          value={formData.maleNotes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maleNotes: e.target.value,
                            })
                          }
                          className='input-field w-full'
                          rows={2}
                          placeholder='ملاحظات على الزوج'
                        />
                      </div>
                    </div>
                  )}
                {currentPatient.ReceptionData?.maleStatus !==
                  "LEGAL_INVITATION" &&
                  currentPatient.ReceptionData?.femaleStatus !==
                    "NOT_EXIST" && (
                    <div
                      className='p-4 rounded-lg'
                      style={{ backgroundColor: "var(--light)" }}>
                      <h3
                        className='text-sm font-semibold mb-3'
                        style={{ color: "var(--primary)" }}>
                        👩 حالة الزوجة
                      </h3>
                      <div className='flex flex-row items-center justify-center gap-3 mb-3'>
                        <div className='flex flex-row items-center justify-center gap-3 w-[50%]'>
                          <button
                            type='button'
                            onClick={() =>
                              setFormData({
                                ...formData,
                                isFemaleHealthy: "HEALTHY",
                              })
                            }
                            className='btn-success w-full py-3 rounded-lg font-bold transition shadow-md hover:shadow-lg'
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
                            سليمة
                          </button>
                          <button
                            type='button'
                            onClick={() =>
                              setFormData({
                                ...formData,
                                isFemaleHealthy: "UNHEALTHY",
                              })
                            }
                            className='btn-danger w-full py-3 rounded-lg font-bold transition shadow-md hover:shadow-lg'
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
                            غير سليمة
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
                          className='input-field w-full'
                          rows={2}
                          placeholder='ملاحظات على الزوجة'
                        />
                      </div>
                    </div>
                  )}
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
                <div className='pt-4 flex flex-row items-center justify-evenly gap-4 '>
                  <div className='flex flex-row gap-3 w-full items-center justify-center '>
                    <button
                      onClick={handleSave}
                      disabled={loading || !hasBeenCalled}
                      className='btn-success py-3 text-lg disabled:opacity-50'>
                      {loading
                        ? " جاري الحفظ..."
                        : isEditMode === false
                        ? "حفظ النتيجة"
                        : " حفظ التعديل"}
                    </button>

                    {isEditMode === false ? (
                      /* أزرار إعادة النداء والإلغاء */
                      <div className='flex gap-3'>
                        {/* زر إعادة النداء */}
                        {hasBeenCalled && (
                          <button
                            onClick={handleRecall}
                            disabled={loading || recallCooldown > 0}
                            className='btn-success py-3 text-lg disabled:opacity-50'>
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
                          {loading ? "⏳ جاري الإلغاء..." : "لم يحضر"}
                        </button>
                      </div>
                    ) : null}
                    <button
                      onClick={() => {
                        setCurrentPatient(null);
                        setRecallCount(0);
                        setIsFromSidebar(false);
                        setFormData({
                          doctorName: "",
                          isMaleHealthy: "HEALTHY",
                          isFemaleHealthy: "HEALTHY",
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
            stationName='المختبر'
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
                📁 أرشيف المختبر
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
                      حالة الزوج
                    </th>
                    <th className='border border-gray-300 px-4 py-3 text-center'>
                      حالة الزوجة
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
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            record.isMaleHealthy === "HEALTHY"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                          {record.isMaleHealthy === "HEALTHY"
                            ? "سليم"
                            : "غير سليم"}
                        </span>
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            record.isFemaleHealthy === "HEALTHY"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                          {record.isFemaleHealthy === "HEALTHY"
                            ? "سليمة"
                            : "غير سليمة"}
                        </span>
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center text-sm'>
                        {new Date(record.createdAt).toLocaleDateString("ar-US")}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        <button
                          onClick={() => handleLoadFromArchive(record)}
                          className='bg-blue-600 text-white hover:bg-blue-700 cursor-pointer rounded-lg px-4 py-2 text-sm'>
                          📝 تعديل
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredArchive.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
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

export default LabPage;
