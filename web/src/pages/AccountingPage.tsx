import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";
import { io } from "socket.io-client";
import { printReceipt } from "../utils/receiptPrinter";
import { API_BASE_URL, API_URL_WITHOUT_ROUTE } from "../services/api";

const API_URL = API_BASE_URL;
const STATION_DISPLAY_NUMBER = 2;

interface CurrentPatient {
  queueId: number;
  queueNumber: number;
  patientId: number;
  patientName: string;
  maleName: string;
  femaleName: string;
  priority: number; // إضافة الأولوية
  ReceptionData?: {
    maleNationalId: string;
    maleName: string;
    maleLastName: string;
    maleFatherName: string;
    maleMotherName: string;
    maleBirthDate: string;
    maleRegistration: string;
    femaleNationalId: string;
    femaleName: string;
    femaleFatherName: string;
    femaleMotherName: string;
    femaleBirthDate: string;
    femaleRegistration: string;
    femaleLastName: string;
    phoneNumber?: string;
    maleStatus: string;
    femaleStatus: string;
  };
}

interface FavoritePrice {
  id: number;
  label: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

interface ArchiveRecord {
  id: number;
  queueId: number;
  patientId: number;
  totalAmount: number;
  isPaid: boolean;
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
  const [favoritePrices, setFavoritePrices] = useState<FavoritePrice[]>([]);

  const [fastAddValue, setFastAddValue] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false); // حالة الطباعة
  const [showPrintModal, setShowPrintModal] = useState(false); // عرض modal الطباعة

  // Archive states
  const [showArchive, setShowArchive] = useState(false);
  const [archiveData, setArchiveData] = useState<ArchiveRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // مرجع للتمرير إلى أعلى المحتوى
  const mainContentRef = useRef<HTMLDivElement>(null);

  // جلب قيمة السعر المضاف إلى السعر الأصلي بسبب المُستعجل
  useEffect(() => {
    const fetchFastAddValue = async () => {
      try {
        const response = await axios.get(`${API_URL}/fastPrice/fast-add-value`);
        if (response.data.success) {
          setFastAddValue(response.data.result.value);
        }
      } catch (error) {
        console.error("خطأ في جلب قيمة الإضافة السريعة:", error);
      }
    };
    fetchFastAddValue();
    // إضافة WebSocket listener للتحديثات الفورية
    const socket = io(API_URL_WITHOUT_ROUTE);

    socket.on("fast-price-updated", (data: { value: number }) => {
      console.log("✅ تم استلام تحديث FastPrice:", data.value);
      setFastAddValue(data.value);
    });

    // تنظيف الاتصال عند إلغاء المكون
    return () => {
      socket.off("fast-price-updated");
      socket.disconnect();
    };
  }, []);

  // جلب قائمة الأسعار المفضلة
  useEffect(() => {
    const fetchFavoritePrices = async () => {
      try {
        const response = await axios.get(`${API_URL}/favPrices`);
        if (response.data.success) {
          setFavoritePrices(response.data.result);
        }
      } catch (error) {
        console.error("خطأ في جلب الأسعار المفضلة:", error);
      }
    };
    fetchFavoritePrices();
  }, []);

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
            priority: queue.priority || 0, // إضافة الأولوية
            ReceptionData: reception,
          });

          setAmount("");
          setIsPaid(false);
          setNotes("");

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

      // إذا كان في وضع التعديل، استخدم PUT بدلاً من POST
      if (isEditMode) {
        const response = await axios.put(
          `${API_URL}/accounting/${currentPatient.queueId}`,
          {
            totalAmount: parseFloat(amount),
            isPaid: true,
            notes,
          }
        );

        if (response.data.success) {
          alert("✅ تم تحديث بيانات المحاسبة بنجاح!");
          setIsEditMode(false);
          clearPatientData();
          // إعادة تحميل الأرشيف
          if (showArchive) {
            fetchArchiveData();
          }
        }
      } else {
        const response = await axios.post(`${API_URL}/accounting`, {
          queueId: currentPatient.queueId,
          patientId: currentPatient.patientId,
          totalAmount: parseFloat(amount),
          isPaid: true,
          notes,
        });

        if (response.data.success) {
          await axios.post(
            `${API_URL}/stations/${stationId}/complete-service`,
            {
              queueId: currentPatient.queueId,
              notes: "تم الدفع",
            }
          );

          // عرض modal السؤال عن الطباعة
          setShowPrintModal(true);
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

  // جلب بيانات الأرشيف
  const fetchArchiveData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/accounting/all`);
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
          patientName: fullQueue.patient?.name || "",
          maleName: reception?.maleName || "",
          femaleName: reception?.femaleName || "",
          priority: fullQueue.priority || 0,
          ReceptionData: reception,
        });

        // تحميل بيانات المحاسبة
        setAmount(record.totalAmount.toString());
        setIsPaid(record.isPaid);
        setNotes(record.notes || "");
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
          patientName: fullQueue.patient?.name || "",
          maleName: reception?.maleName || "",
          femaleName: reception?.femaleName || "",
          priority: fullQueue.priority || 0, // إضافة الأولوية

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

        // مسح حقول الدفع
        setAmount("");
        setIsPaid(false);
        setNotes("");

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

  // التعامل مع modal الطباعة
  const handlePrintConfirm = async () => {
    setShowPrintModal(false);
    await handlePrint();
    clearPatientData();
  };

  const handlePrintCancel = () => {
    setShowPrintModal(false);
    clearPatientData();
  };

  const clearPatientData = () => {
    setCurrentPatient(null);
    setRecallCount(0);
    setIsFromSidebar(false);
    setAmount("");
    setIsPaid(false);
    setNotes("");
    setIsEditMode(false);
  };

  // طباعة الإيصال
  const handlePrint = async () => {
    if (!currentPatient) {
      alert("⚠️ لا يوجد مراجع حالي");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert("⚠️ الرجاء إدخال المبلغ أولاً");
      return;
    }

    try {
      setIsPrinting(true);

      // تجهيز التاريخ والوقت
      const now = new Date();
      const dateString = now.toLocaleDateString("ar-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });

      // طباعة الإيصال
      await printReceipt(
        currentPatient.ReceptionData?.maleName || "-",
        currentPatient.ReceptionData?.maleLastName || "-",
        currentPatient.ReceptionData?.maleFatherName || "-",
        currentPatient.ReceptionData?.maleMotherName || "-",
        new Date(
          currentPatient.ReceptionData?.maleBirthDate || "-"
        ).toLocaleDateString("ar-US", {
          year: "numeric",
        }) || "-",
        currentPatient.ReceptionData?.maleRegistration || "-",
        currentPatient.ReceptionData?.femaleName || "-",
        currentPatient.ReceptionData?.femaleLastName || "-",
        currentPatient.ReceptionData?.femaleFatherName || "-",
        currentPatient.ReceptionData?.femaleMotherName || "-",
        new Date(
          currentPatient.ReceptionData?.femaleBirthDate || "-"
        ).toLocaleDateString("ar-US", {
          year: "numeric",
        }) || "-",
        currentPatient.ReceptionData?.femaleRegistration || "-",
        dateString,
        currentPatient.ReceptionData?.maleStatus,
        currentPatient.ReceptionData?.femaleStatus
      );
      console.log("✅ تم إرسال الإيصال للطباعة");
    } catch (error) {
      console.error("❌ خطأ في طباعة الإيصال:", error);
      alert("❌ حدث خطأ في طباعة الإيصال");
    } finally {
      setIsPrinting(false);
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
      className='h-screen flex flex-col'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='شباك رقم 1 | المحاسبة' icon='💰' />

      <div className='flex-1 flex overflow-hidden'>
        {/* Main Area */}
        <div
          ref={mainContentRef}
          className='flex-1 p-6 overflow-y-auto'
          style={{ marginLeft: "384px" }}>
          {!currentPatient ? (
            <div className='h-full flex items-center justify-center'>
              <div className='card max-w-2xl w-full text-center p-12 my-5'>
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
                <div className='text-center mb-4 w-[25%] h-full flex flex-col justify-evenly'>
                  <span className='text-sm' style={{ color: "var(--dark)" }}>
                    رقم الدور
                  </span>
                  <div
                    className='text-6xl font-bold my-2'
                    style={{ color: "var(--primary)" }}>
                    #{currentPatient.queueNumber}
                  </div>
                  <span className='text-sm' style={{ color: "var(--dark)" }}>
                    ID : {currentPatient.patientId}
                  </span>
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
                      {currentPatient.ReceptionData &&
                      currentPatient.ReceptionData.maleName != null ? (
                        <div className='flex flex-col gap-1'>
                          <span>{`${currentPatient.ReceptionData.maleName} ${currentPatient.ReceptionData.maleFatherName} ${currentPatient.ReceptionData.maleLastName}`}</span>
                          <span className='text-[10px] text-gray-500'>
                            {`والدته : ${currentPatient.ReceptionData.maleMotherName}`}
                          </span>
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

                  <div className='text-center p-4 rounded-lg bg-white'>
                    <div
                      className='text-xs mb-1'
                      style={{ color: "var(--dark)" }}>
                      👩 الزوجة
                    </div>
                    <div
                      className='text-lg font-bold'
                      style={{ color: "var(--primary)" }}>
                      {currentPatient.ReceptionData &&
                      currentPatient.ReceptionData.femaleName != null ? (
                        <div className='flex flex-col gap-1'>
                          <span>{`${currentPatient.ReceptionData.femaleName} ${currentPatient.ReceptionData.femaleFatherName} ${currentPatient.ReceptionData.femaleLastName}`}</span>
                          <span className='text-[10px] text-gray-500'>{`والدتها : ${currentPatient.ReceptionData.femaleMotherName}`}</span>
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
                <div className='flex flex-wrap gap-2'>
                  {favoritePrices.map((price) =>
                    currentPatient.priority === 1 ? (
                      <button
                        key={price.id}
                        onClick={() =>
                          setAmount((price.value + fastAddValue).toString())
                        }
                        className={`text-xs px-4 py-2 bg-gray-200 text-gray-800 cursor-pointer rounded-2xl hover:bg-gray-300
                        ${
                          currentPatient.ReceptionData?.maleStatus ===
                            "LEGAL_INVITATION" ||
                          currentPatient.ReceptionData?.femaleStatus ===
                            "LEGAL_INVITATION"
                            ? price.id === 1
                              ? "bg-red-200 hover:bg-red-300"
                              : "bg-gray-200 hover:bg-gray-300"
                            : price.id === 2
                            ? "bg-green-200 hover:bg-green-300"
                            : "bg-gray-200 hover:bg-gray-300"
                        }
                        `}>
                        {price.label} :{" "}
                        {(price.value + fastAddValue).toLocaleString()} ل.س
                      </button>
                    ) : (
                      <button
                        key={price.id}
                        onClick={() => setAmount(price.value.toString())}
                        className={`text-xs px-4 py-2 text-gray-800 cursor-pointer rounded-2xl ${
                          currentPatient.ReceptionData?.maleStatus ===
                            "LEGAL_INVITATION" ||
                          currentPatient.ReceptionData?.femaleStatus ===
                            "LEGAL_INVITATION"
                            ? price.id === 1
                              ? "bg-red-200 hover:bg-red-300"
                              : "bg-gray-200 hover:bg-gray-300"
                            : price.id === 2
                            ? "bg-green-200 hover:bg-green-300"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}>
                        {price.label} : {price.value.toLocaleString()} ل.س
                      </button>
                    )
                  )}
                  {currentPatient.priority === 1 ? (
                    <span>
                      تمت إضافة{" "}
                      <span className='text-orange-500 text-xl font-bold'>
                        {fastAddValue.toLocaleString()}
                      </span>{" "}
                      ل.س على السعر الأصلي بسبب{" "}
                      <span className='font-bold'> المُستعجل </span>
                    </span>
                  ) : null}
                </div>
                <div>
                  <label
                    className='block text-sm font-medium mb-2'
                    style={{ color: "var(--dark)" }}>
                    ملاحظات
                  </label>
                  <textarea
                    autoComplete='off'
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
                      disabled={loading || !isPaid || !amount || !hasBeenCalled}
                      className='btn-success py-3 text-lg disabled:opacity-50'>
                      {loading
                        ? "⏳ جاري الحفظ..."
                        : isEditMode === false
                        ? "تأكيد الدفع"
                        : "حفظ التعديل"}
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
                              ? ` انتظر ${recallCooldown} ث`
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
                          {loading ? "⏳ جاري الإلغاء..." : " لم يحضر"}
                        </button>
                      </div>
                    ) : null}

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

                  {/* زر الطباعة */}
                  <button
                    onClick={handlePrint}
                    disabled={
                      isPrinting ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      !isPaid
                    }
                    className=' text-[#054239] cursor-pointer rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed'
                    title={!isPaid ? "يجب تأكيد استلام المبلغ أولاً" : ""}>
                    {isPrinting ? "⏳ جاري الطباعة..." : "🖨️"}
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
            stationName='المحاسبة'
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
                📁 أرشيف المحاسبة
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
                      المبلغ
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
                      <td className='border border-gray-300 px-4 py-3 text-center font-semibold text-green-600'>
                        {record.totalAmount.toLocaleString()} ل.س
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center text-sm'>
                        {new Date(record.createdAt).toLocaleDateString("ar-US")}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        <div className='flex gap-2 justify-center'>
                          <button
                            onClick={() => handleLoadFromArchive(record)}
                            className='bg-blue-600 text-white hover:bg-blue-700 cursor-pointer rounded-lg px-4 py-2 text-sm'>
                            📝 تعديل
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                // تحميل البيانات أولاً
                                const queueResponse = await axios.get(
                                  `${API_URL}/queue/${record.queueId}`
                                );

                                if (queueResponse.data.success) {
                                  const fullQueue = queueResponse.data.queue;
                                  const reception = fullQueue.ReceptionData;

                                  // الطباعة مباشرة
                                  const now = new Date();
                                  const dateString = now.toLocaleDateString(
                                    "ar-US",
                                    {
                                      year: "numeric",
                                      month: "numeric",
                                      day: "numeric",
                                    }
                                  );

                                  await printReceipt(
                                    reception?.maleName || "-",
                                    reception?.maleLastName || "-",
                                    reception?.maleFatherName || "-",
                                    reception?.maleMotherName || "-",
                                    new Date(
                                      reception?.maleBirthDate || "-"
                                    ).toLocaleDateString("ar-US", {
                                      year: "numeric",
                                    }) || "-",
                                    reception?.maleRegistration || "-",
                                    reception?.femaleName || "-",
                                    reception?.femaleLastName || "-",
                                    reception?.femaleFatherName || "-",
                                    reception?.femaleMotherName || "-",
                                    new Date(
                                      reception?.femaleBirthDate || "-"
                                    ).toLocaleDateString("ar-US", {
                                      year: "numeric",
                                    }) || "-",
                                    reception?.femaleRegistration || "-",
                                    dateString,
                                    reception?.maleStatus,
                                    reception?.femaleStatus
                                  );
                                  console.log("✅ تم إرسال الإيصال للطباعة");
                                }
                              } catch (error) {
                                console.error(
                                  "❌ خطأ في طباعة الإيصال:",
                                  error
                                );
                                alert("❌ حدث خطأ في طباعة الإيصال");
                              }
                            }}
                            className='bg-green-600 text-white hover:bg-green-700 cursor-pointer rounded-lg px-4 py-2 text-sm'>
                            🖨️ طباعة
                          </button>
                        </div>
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
                    // Show first 2, last 2, and current +/- 1
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

      {/* Modal تأكيد الطباعة */}
      {showPrintModal && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={handlePrintCancel}>
          <div
            className='bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all'
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeIn 0.2s ease-out" }}>
            {/* أيقونة النجاح */}
            <div className='flex justify-center mb-6'>
              <div
                className='w-20 h-20 rounded-full flex items-center justify-center'
                style={{ backgroundColor: "#dcfce7" }}>
                <svg
                  className='w-12 h-12'
                  style={{ color: "#16a34a" }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
            </div>

            {/* العنوان */}
            <h2
              className='text-2xl font-bold text-center mb-2'
              style={{ color: "var(--primary)" }}>
              تم حفظ بيانات الدفع بنجاح!
            </h2>

            {/* السؤال */}
            <p
              className='text-center text-lg mb-8'
              style={{ color: "var(--dark)" }}>
              هل تريد طباعة الإيصال الآن؟
            </p>

            {/* الأزرار */}
            <div className='flex gap-4'>
              <button
                onClick={handlePrintConfirm}
                className='flex-1 bg-[#054239] text-white hover:bg-[#043329]/80 cursor-pointer rounded-lg py-4 px-6 text-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
                  />
                </svg>
                نعم
              </button>

              <button
                onClick={handlePrintCancel}
                className='flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer rounded-lg py-4 px-6 text-lg font-semibold transition-colors duration-200'>
                لا، شكراً
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AccountingPage;
