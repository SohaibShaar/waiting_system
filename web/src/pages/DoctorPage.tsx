import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import QueueSidebar from "../components/QueueSidebar";

const API_URL = "http://192.168.1.100:3003/api";
const STATION_DISPLAY_NUMBER = 5;

interface CurrentPatient {
  queueId: number;
  queueNumber: number;
  patientId: number;
  maleName: string;
  femaleName: string;
  priority: number;
  ReceptionData?: {
    maleStatus: string;
    femaleStatus: string;
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
    maleHIVvalue: "",
    femaleHIVvalue: "",
    maleHBSvalue: "",
    femaleHBSvalue: "",
    maleHBCvalue: "",
    femaleHBCvalue: "",
    maleHemoglobinEnabled: false,
    maleHbS: "",
    maleHbF: "",
    maleHbA1c: "",
    maleHbA2: "",
    maleHbSc: "",
    maleHbD: "",
    maleHbE: "",
    maleHbC: "",
    femaleHemoglobinEnabled: false,
    femaleHbS: "",
    femaleHbF: "",
    femaleHbA1c: "",
    femaleHbA2: "",
    femaleHbSc: "",
    femaleHbD: "",
    femaleHbE: "",
    femaleHbC: "",
    maleNotes: "",
    femaleNotes: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [stationId, setStationId] = useState<number | null>(null);
  const [showCompletedList, setShowCompletedList] = useState(false); // عرض قائمة البيانات المكتملة
  const [completedData, setCompletedData] = useState<
    Array<{
      id: number;
      queueId: number;
      completedAt: string;
      patient?: { id: number; name: string };
      ReceptionData?: {
        maleName: string;
        maleLastName: string;
        femaleName: string;
        femaleLastName: string;
        phoneNumber?: string;
      };
      LabData?: {
        isMaleHealthy: string;
        isFemaleHealthy: string;
      };
    }>
  >([]); // البيانات المكتملة
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  const handleSave = async () => {
    if (!currentPatient) {
      alert("⚠️ لا يوجد مراجع حالي");
      return;
    }

    if (!stationId) {
      alert("⚠️ خطأ: لم يتم تحديد المحطة");
      return;
    }

    try {
      setLoading(true);

      // حفظ البيانات الطبية
      const response = await axios.post(`${API_URL}/doctor`, {
        queueId: currentPatient.queueId,
        patientId: currentPatient.patientId,
        ...formData,
      });

      if (response.data.success) {
        // إنهاء الخدمة في المحطة - هذا سيحذف الدور من قائمة الانتظار تلقائياً
        try {
          const completeResponse = await axios.post(
            `${API_URL}/stations/${stationId}/complete-service`,
            {
              queueId: currentPatient.queueId,
              notes: "تم الفحص النهائي",
            }
          );

          console.log("✅ تم إنهاء الخدمة:", completeResponse.data);
        } catch (stationError) {
          console.log("ملاحظة: الدور قد يكون منتهي بالفعل", stationError);
        }

        alert(
          "✅ تم حفظ البيانات الطبية النهائية بنجاح!\n\n📋 تم إزالة المراجع من قائمة الانتظار"
        );

        // مسح البيانات الحالية
        setCurrentPatient(null);
        setFormData({
          maleBloodType: "",
          femaleBloodType: "",
          maleHIVstatus: "NEGATIVE",
          femaleHIVstatus: "NEGATIVE",
          maleHBSstatus: "NEGATIVE",
          femaleHBSstatus: "NEGATIVE",
          maleHBCstatus: "NEGATIVE",
          femaleHBCstatus: "NEGATIVE",
          maleHIVvalue: "",
          femaleHIVvalue: "",
          maleHBSvalue: "",
          femaleHBSvalue: "",
          maleHBCvalue: "",
          femaleHBCvalue: "",
          maleHemoglobinEnabled: false,
          maleHbS: "",
          maleHbF: "",
          maleHbA1c: "",
          maleHbA2: "",
          maleHbSc: "",
          maleHbD: "",
          maleHbE: "",
          maleHbC: "",
          femaleHemoglobinEnabled: false,
          femaleHbS: "",
          femaleHbF: "",
          femaleHbA1c: "",
          femaleHbA2: "",
          femaleHbSc: "",
          femaleHbD: "",
          femaleHbE: "",
          femaleHbC: "",
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
          priority: fullQueue.priority || 0, // إضافة الأولوية
        });

        console.log(`✅ تم اختيار الدور #${fullQueue.queueNumber}`);
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات الدور:", error);
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // تحميل قائمة البيانات المكتملة
  const loadCompletedData = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
      });
      const response = await axios.get(`${API_URL}/doctor/completed?${params}`);
      if (response.data.success) {
        setCompletedData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.total);
        setCurrentPage(page);
        setShowCompletedList(true);
      }
    } catch (error) {
      console.error("خطأ في تحميل البيانات المكتملة:", error);
      alert("❌ حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    if (showCompletedList) {
      const timer = setTimeout(() => {
        loadCompletedData(1, searchTerm);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, showCompletedList]);

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
          {!currentPatient && !showCompletedList ? (
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
                  <p className='text-sm mt-4' style={{ color: "var(--dark)" }}>
                    اختر مريضاً من القائمة الجانبية للبدء
                  </p>
                </div>
                <button
                  onClick={() => loadCompletedData()}
                  disabled={loading}
                  className='bg-[#054239] rounded-2xl text-white hover:bg-[#054239]/80 transition-all duration-300 cursor-pointer px-8 py-3 text-lg disabled:opacity-50'>
                  {loading
                    ? "⏳ جاري التحميل..."
                    : "📋 عرض قائمة الحالات المكتملة"}
                </button>
              </div>
            </div>
          ) : showCompletedList ? (
            <div className='card w-full p-8 my-3'>
              <div className='flex justify-between items-center mb-6'>
                <h2
                  className='text-2xl font-bold'
                  style={{ color: "var(--primary)" }}>
                  📋 قائمة الحالات المكتملة ({totalCount})
                </h2>
                <button
                  onClick={() => {
                    setShowCompletedList(false);
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className='bg-gray-500 text-white hover:opacity-80 cursor-pointer rounded-lg py-2 px-6'>
                  ❌ إغلاق
                </button>
              </div>

              {/* Filters */}
              <div className='mb-6'>
                <input
                  type='text'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder='🔍 بحث بالاسم، الرقم الوطني، ID المريض، أو رقم الدور...'
                  className='input-field w-full'
                  style={{ fontSize: "16px" }}
                />
              </div>

              {completedData.length === 0 ? (
                <div className='text-center py-12'>
                  <p className='text-lg' style={{ color: "var(--dark)" }}>
                    {searchTerm
                      ? "لا توجد نتائج للبحث"
                      : "لا توجد حالات مكتملة بعد"}
                  </p>
                </div>
              ) : (
                <>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead>
                        <tr style={{ backgroundColor: "var(--light)" }}>
                          <th className='p-3 text-right'>رقم الدور</th>
                          <th className='p-3 text-right'>رقم الـ ID</th>
                          <th className='p-3 text-right'>اسم الخطيب</th>
                          <th className='p-3 text-right'>حالة الخطيب</th>
                          <th className='p-3 text-right'>اسم الخطيبة</th>
                          <th className='p-3 text-right'>حالة الخطيبة</th>
                          <th className='p-3 text-right'>تاريخ الإكمال</th>
                          <th className='p-3 text-center'>إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedData.map((item) => (
                          <tr
                            key={item.id}
                            className='border-b hover:bg-gray-50'>
                            <td className='p-3'>#{item.queueId}</td>
                            <td className='p-3'>
                              {item.patient?.id.toString() || "غير متوفر"}
                            </td>
                            <td className='p-3'>
                              {item.ReceptionData?.maleName || "غير متوفر"}{" "}
                              {item.ReceptionData?.maleLastName || ""}
                            </td>
                            <td className='p-3'>
                              {item.LabData?.isMaleHealthy === "HEALTHY" ? (
                                <span className='px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800'>
                                  ✓ سليم
                                </span>
                              ) : item.LabData?.isMaleHealthy ===
                                "UNHEALTHY" ? (
                                <span className='px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800'>
                                  ✗ غير سليم
                                </span>
                              ) : (
                                <span className='text-gray-400 text-xs'>
                                  غير محدد
                                </span>
                              )}
                            </td>
                            <td className='p-3'>
                              {item.ReceptionData?.femaleName || "غير متوفر"}{" "}
                              {item.ReceptionData?.femaleLastName || ""}
                            </td>
                            <td className='p-3'>
                              {item.LabData?.isFemaleHealthy === "HEALTHY" ? (
                                <span className='px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800'>
                                  ✓ سليم
                                </span>
                              ) : item.LabData?.isFemaleHealthy ===
                                "UNHEALTHY" ? (
                                <span className='px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800'>
                                  ✗ غير سليم
                                </span>
                              ) : (
                                <span className='text-gray-400 text-xs'>
                                  غير محدد
                                </span>
                              )}
                            </td>
                            <td className='p-3'>
                              {new Date(item.completedAt).toLocaleDateString(
                                "ar-SY"
                              )}
                            </td>
                            <td className='p-3 text-center'>
                              <div className='flex gap-2 justify-center'>
                                <button
                                  onClick={() => {
                                    window.location.href = `/doctor/patient/${item.id}`;
                                  }}
                                  className='btn-primary px-4 py-2 text-sm'>
                                  👁️ عرض
                                </button>
                                <button
                                  onClick={() => {
                                    alert("سيتم تخصيص وظيفة الطباعة لاحقاً");
                                  }}
                                  className='bg-gray-500 text-white hover:opacity-80 cursor-pointer rounded-lg px-4 py-2 text-sm'>
                                  🖨️ طباعة
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className='flex justify-between items-center mt-6'>
                      <div className='text-sm' style={{ color: "var(--dark)" }}>
                        صفحة {currentPage} من {totalPages}
                      </div>
                      <div className='flex gap-2'>
                        <button
                          onClick={() =>
                            loadCompletedData(currentPage - 1, searchTerm)
                          }
                          disabled={currentPage === 1 || loading}
                          className='btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed'>
                          السابق
                        </button>
                        <button
                          onClick={() =>
                            loadCompletedData(currentPage + 1, searchTerm)
                          }
                          disabled={currentPage === totalPages || loading}
                          className='btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed'>
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : currentPatient ? (
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
                        👨 الزوج{" "}
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
                      👩 الزوجة{" "}
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
                    <div className='space-y-1'>
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
                      {formData.maleHIVstatus === "POSITIVE" && (
                        <input
                          type='text'
                          value={formData.maleHIVvalue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maleHIVvalue: e.target.value,
                            })
                          }
                          className='input-field text-sm py-1 w-full'
                          placeholder='القيمة الرقمية'
                        />
                      )}
                    </div>
                    <div className='space-y-1'>
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
                      {formData.maleHBSstatus === "POSITIVE" && (
                        <input
                          type='text'
                          value={formData.maleHBSvalue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maleHBSvalue: e.target.value,
                            })
                          }
                          className='input-field text-sm py-1 w-full'
                          placeholder='القيمة الرقمية'
                        />
                      )}
                    </div>
                    <div className='space-y-1'>
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
                      {formData.maleHBCstatus === "POSITIVE" && (
                        <input
                          type='text'
                          value={formData.maleHBCvalue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maleHBCvalue: e.target.value,
                            })
                          }
                          className='input-field text-sm py-1 w-full'
                          placeholder='القيمة الرقمية'
                        />
                      )}
                    </div>
                  </div>

                  {/* Checkbox for Hemoglobin */}
                  <div className='flex items-center gap-2 mt-3'>
                    <input
                      type='checkbox'
                      id='maleHemoglobin'
                      checked={formData.maleHemoglobinEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maleHemoglobinEnabled: e.target.checked,
                        })
                      }
                      className='w-4 h-4'
                    />
                    <label
                      htmlFor='maleHemoglobin'
                      className='text-sm font-semibold'>
                      الخضاب الشاذة
                    </label>
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
                    <div className='space-y-1'>
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
                      {formData.femaleHIVstatus === "POSITIVE" && (
                        <input
                          type='text'
                          value={formData.femaleHIVvalue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              femaleHIVvalue: e.target.value,
                            })
                          }
                          className='input-field text-sm py-1 w-full'
                          placeholder='القيمة الرقمية'
                        />
                      )}
                    </div>
                    <div className='space-y-1'>
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
                      {formData.femaleHBSstatus === "POSITIVE" && (
                        <input
                          type='text'
                          value={formData.femaleHBSvalue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              femaleHBSvalue: e.target.value,
                            })
                          }
                          className='input-field text-sm py-1 w-full'
                          placeholder='القيمة الرقمية'
                        />
                      )}
                    </div>
                    <div className='space-y-1'>
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
                      {formData.femaleHBCstatus === "POSITIVE" && (
                        <input
                          type='text'
                          value={formData.femaleHBCvalue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              femaleHBCvalue: e.target.value,
                            })
                          }
                          className='input-field text-sm py-1 w-full'
                          placeholder='القيمة الرقمية'
                        />
                      )}
                    </div>
                  </div>

                  {/* Checkbox for Hemoglobin */}
                  <div className='flex items-center gap-2 mt-3'>
                    <input
                      type='checkbox'
                      id='femaleHemoglobin'
                      checked={formData.femaleHemoglobinEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          femaleHemoglobinEnabled: e.target.checked,
                        })
                      }
                      className='w-4 h-4'
                    />
                    <label
                      htmlFor='femaleHemoglobin'
                      className='text-sm font-semibold'>
                      الخضاب الشاذة
                    </label>
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

              {/* Hemoglobin Forms */}
              {(formData.maleHemoglobinEnabled ||
                formData.femaleHemoglobinEnabled) && (
                <div
                  className='mt-4 p-4 rounded-lg'
                  style={{ backgroundColor: "var(--light)" }}>
                  <h3
                    className='text-lg font-semibold mb-4'
                    style={{ color: "var(--primary)" }}>
                    فحص الخضاب الشاذة
                  </h3>

                  <div className='space-y-6'>
                    {/* Male Hemoglobin Form */}
                    {formData.maleHemoglobinEnabled && (
                      <div className='p-3 bg-white rounded-lg'>
                        <h4
                          className='text-sm font-semibold mb-3'
                          style={{ color: "var(--primary)" }}>
                          👨 الزوج
                        </h4>
                        <div className='grid grid-cols-4 gap-3'>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbS
                            </label>
                            <input
                              type='text'
                              value={formData.maleHbS}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maleHbS: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbF
                            </label>
                            <input
                              type='text'
                              value={formData.maleHbF}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maleHbF: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbA1c
                            </label>
                            <input
                              type='text'
                              value={formData.maleHbA1c}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maleHbA1c: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbA2
                            </label>
                            <input
                              type='text'
                              value={formData.maleHbA2}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maleHbA2: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbSc
                            </label>
                            <input
                              type='text'
                              value={formData.maleHbSc}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maleHbSc: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbD
                            </label>
                            <input
                              type='text'
                              value={formData.maleHbD}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maleHbD: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbE
                            </label>
                            <input
                              type='text'
                              value={formData.maleHbE}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maleHbE: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbC
                            </label>
                            <input
                              type='text'
                              value={formData.maleHbC}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maleHbC: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Female Hemoglobin Form */}
                    {formData.femaleHemoglobinEnabled && (
                      <div className='p-3 bg-white rounded-lg'>
                        <h4
                          className='text-sm font-semibold mb-3'
                          style={{ color: "var(--primary)" }}>
                          👩 الزوجة
                        </h4>
                        <div className='grid grid-cols-4 gap-3'>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbS
                            </label>
                            <input
                              type='text'
                              value={formData.femaleHbS}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  femaleHbS: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbF
                            </label>
                            <input
                              type='text'
                              value={formData.femaleHbF}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  femaleHbF: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbA1c
                            </label>
                            <input
                              type='text'
                              value={formData.femaleHbA1c}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  femaleHbA1c: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbA2
                            </label>
                            <input
                              type='text'
                              value={formData.femaleHbA2}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  femaleHbA2: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbSc
                            </label>
                            <input
                              type='text'
                              value={formData.femaleHbSc}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  femaleHbSc: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbD
                            </label>
                            <input
                              type='text'
                              value={formData.femaleHbD}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  femaleHbD: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbE
                            </label>
                            <input
                              type='text'
                              value={formData.femaleHbE}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  femaleHbE: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold mb-1 block'>
                              HbC
                            </label>
                            <input
                              type='text'
                              value={formData.femaleHbC}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  femaleHbC: e.target.value,
                                })
                              }
                              className='input-field text-sm py-1'
                              placeholder='القيمة'
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
              <div className='pt-4 flex flex-row items-center justify-between gap-4'>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className='btn-success py-3 px-8 text-lg disabled:opacity-50'>
                  {loading ? "💾 جاري الحفظ..." : "✅ حفظ نهائي"}
                </button>

                <button
                  onClick={() => {
                    setCurrentPatient(null);
                    setFormData({
                      maleBloodType: "",
                      femaleBloodType: "",
                      maleHIVstatus: "NEGATIVE",
                      femaleHIVstatus: "NEGATIVE",
                      maleHBSstatus: "NEGATIVE",
                      femaleHBSstatus: "NEGATIVE",
                      maleHBCstatus: "NEGATIVE",
                      femaleHBCstatus: "NEGATIVE",
                      maleHIVvalue: "",
                      femaleHIVvalue: "",
                      maleHBSvalue: "",
                      femaleHBSvalue: "",
                      maleHBCvalue: "",
                      femaleHBCvalue: "",
                      maleHemoglobinEnabled: false,
                      maleHbS: "",
                      maleHbF: "",
                      maleHbA1c: "",
                      maleHbA2: "",
                      maleHbSc: "",
                      maleHbD: "",
                      maleHbE: "",
                      maleHbC: "",
                      femaleHemoglobinEnabled: false,
                      femaleHbS: "",
                      femaleHbF: "",
                      femaleHbA1c: "",
                      femaleHbA2: "",
                      femaleHbSc: "",
                      femaleHbD: "",
                      femaleHbE: "",
                      femaleHbC: "",
                      maleNotes: "",
                      femaleNotes: "",
                      notes: "",
                    });
                  }}
                  className='bg-gray-500 text-white hover:opacity-80 cursor-pointer rounded-lg py-3 px-6 text-lg'>
                  ❌ خروج
                </button>
              </div>
            </div>
          ) : null}

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
