import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import { API_BASE_URL } from "../services/api";
import printReceipt from "../utils/doctorFormPrinter";

const API_URL = API_BASE_URL;

// Function to format date to dd/mm/yyyy
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface ArchiveQueue {
  id: number;
  queueNumber: number;
  patientId: number;
  currentStationId: number;
  currentStationName: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  priority: number;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
  archivedAt: string;
  patient: {
    id: number;
    name: string;
    phoneNumber: string | null;
    nationalId: string | null;
  };
  ArchiveReceptionData: {
    maleName: string | null;
    maleLastName: string | null;
    maleFatherName: string | null;
    maleMotherName: string | null;
    maleBirthDate: string | null;
    maleNationalId: string | null;
    maleAge: number | null;
    maleBirthPlace: string | null;
    maleRegistration: string | null;
    maleCountry: string | null;
    maleStatus: string;
    femaleName: string | null;
    femaleLastName: string | null;
    femaleFatherName: string | null;
    femaleMotherName: string | null;
    femaleBirthDate: string | null;
    femaleNationalId: string | null;
    femaleAge: number | null;
    femaleBirthPlace: string | null;
    femaleRegistration: string | null;
    femaleCountry: string | null;
    femaleStatus: string;
    phoneNumber: string | null;
  } | null;
  ArchiveAccountingData: {
    totalAmount: number | null;
    isPaid: boolean;
  } | null;
  ArchiveBloodDrawData: {
    maleBloodTube1: string | null;
    maleBloodTube2: string | null;
    femaleBloodTube1: string | null;
    femaleBloodTube2: string | null;
  } | null;
  ArchiveLabData: {
    doctorName: string | null;
    isMaleHealthy: string;
    isFemaleHealthy: string;
    maleNotes: string | null;
    femaleNotes: string | null;
    notes: string | null;
  } | null;
  ArchiveDoctorData: {
    maleBloodType: string | null;
    femaleBloodType: string | null;
    maleHIVstatus: string;
    femaleHIVstatus: string;
    maleHBSstatus: string;
    femaleHBSstatus: string;
    maleHBCstatus: string;
    femaleHBCstatus: string;
    maleHIVvalue: string | null;
    femaleHIVvalue: string | null;
    maleHBSvalue: string | null;
    femaleHBSvalue: string | null;
    maleHBCvalue: string | null;
    femaleHBCvalue: string | null;
    maleHemoglobinEnabled: boolean;
    maleHbS: string | null;
    maleHbF: string | null;
    maleHbA1c: string | null;
    maleHbA2: string | null;
    maleHbSc: string | null;
    maleHbD: string | null;
    maleHbE: string | null;
    maleHbC: string | null;
    femaleHemoglobinEnabled: boolean;
    femaleHbS: string | null;
    femaleHbF: string | null;
    femaleHbA1c: string | null;
    femaleHbA2: string | null;
    femaleHbSc: string | null;
    femaleHbD: string | null;
    femaleHbE: string | null;
    femaleHbC: string | null;
    maleNotes: string | null;
    femaleNotes: string | null;
    notes: string | null;
  } | null;
  ArchiveQueueHistory: Array<{
    id: number;
    stationId: number;
    stationName: string | null;
    status: string;
    createdAt: string;
    completedAt: string | null;
  }>;
}

interface ArchiveStats {
  totalArchived: number;
  completedCount: number;
  cancelledCount: number;
  lastArchiveDate: string | null;
}

const ArchivePage = () => {
  const [archivedQueues, setArchivedQueues] = useState<ArchiveQueue[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "COMPLETED" | "CANCELLED"
  >("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const itemsPerPage = 20;

  // جلب البيانات المؤرشفة
  useEffect(() => {
    fetchArchivedQueues();
    fetchStats();
  }, [currentPage, statusFilter, startDate, endDate]);

  const fetchArchivedQueues = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/archive/queues?${queryString}`);

      if (response.data.success) {
        setArchivedQueues(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (error) {
      console.error("❌ خطأ في جلب البيانات المؤرشفة:", error);
      alert("❌ حدث خطأ في جلب البيانات المؤرشفة");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/archive/stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("❌ خطأ في جلب الإحصائيات:", error);
    }
  };

  // تصفية البيانات حسب البحث (يتم تطبيقه على البيانات المستلمة من API)
  const filteredQueues = archivedQueues.filter((queue) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      queue.queueNumber.toString().includes(searchLower) ||
      queue.patient.name.toLowerCase().includes(searchLower) ||
      queue.patient.phoneNumber?.toLowerCase().includes(searchLower) ||
      queue.patient.nationalId?.toLowerCase().includes(searchLower) ||
      queue.ArchiveReceptionData?.maleName?.toLowerCase().includes(searchLower) ||
      queue.ArchiveReceptionData?.femaleName?.toLowerCase().includes(searchLower)
    );
  });

  // دالة طباعة الفورم
  const handlePrintForm = (queue: ArchiveQueue) => {
    if (!queue.ArchiveReceptionData || !queue.ArchiveDoctorData) {
      alert("⚠️ لا توجد بيانات كاملة للطباعة");
      return;
    }

    const reception = queue.ArchiveReceptionData;
    const doctor = queue.ArchiveDoctorData;

    const printParams: any = {};

    // بيانات الزوج
    if (reception.maleName) {
      printParams.maleName = reception.maleName || "";
      printParams.maleLastName = reception.maleLastName || "";
      printParams.maleFatherName = reception.maleFatherName || "";
      printParams.maleAge = reception.maleAge || 0;
      printParams.maleNationalId = reception.maleNationalId || "";
      printParams.maleBirthDate = formatDate(reception.maleBirthDate);
      printParams.maleBirthPlace = reception.maleBirthPlace || "";
      printParams.maleBloodType = doctor.maleBloodType || "";
      printParams.HIVstatus = doctor.maleHIVstatus || "NEGATIVE";
      printParams.HBSstatus = doctor.maleHBSstatus || "NEGATIVE";
      printParams.HBCstatus = doctor.maleHBCstatus || "NEGATIVE";
      printParams.maleHIVvalue = doctor.maleHIVvalue || "";
      printParams.maleHBSvalue = doctor.maleHBSvalue || "";
      printParams.maleHBCvalue = doctor.maleHBCvalue || "";
      printParams.maleHemoglobinEnabled = doctor.maleHemoglobinEnabled || false;
      printParams.maleHbS = doctor.maleHbS || "";
      printParams.maleHbF = doctor.maleHbF || "";
      printParams.maleHbA1c = doctor.maleHbA1c || "";
      printParams.maleHbA2 = doctor.maleHbA2 || "";
      printParams.maleHbSc = doctor.maleHbSc || "";
      printParams.maleHbD = doctor.maleHbD || "";
      printParams.maleHbE = doctor.maleHbE || "";
      printParams.maleHbC = doctor.maleHbC || "";
      printParams.maleNotes = doctor.maleNotes || "";
    }

    // بيانات الزوجة
    if (reception.femaleName) {
      printParams.femaleName = reception.femaleName || "";
      printParams.femaleLastName = reception.femaleLastName || "";
      printParams.femaleFatherName = reception.femaleFatherName || "";
      printParams.femaleAge = reception.femaleAge || 0;
      printParams.femaleNationalId = reception.femaleNationalId || "";
      printParams.femaleBirthDate = formatDate(reception.femaleBirthDate);
      printParams.femaleBirthPlace = reception.femaleBirthPlace || "";
      printParams.femaleBloodType = doctor.femaleBloodType || "";
      printParams.femaleHIVstatus = doctor.femaleHIVstatus || "NEGATIVE";
      printParams.femaleHBSstatus = doctor.femaleHBSstatus || "NEGATIVE";
      printParams.femaleHBCstatus = doctor.femaleHBCstatus || "NEGATIVE";
      printParams.femaleHIVvalue = doctor.femaleHIVvalue || "";
      printParams.femaleHBSvalue = doctor.femaleHBSvalue || "";
      printParams.femaleHBCvalue = doctor.femaleHBCvalue || "";
      printParams.femaleHemoglobinEnabled = doctor.femaleHemoglobinEnabled || false;
      printParams.femaleHbS = doctor.femaleHbS || "";
      printParams.femaleHbF = doctor.femaleHbF || "";
      printParams.femaleHbA1c = doctor.femaleHbA1c || "";
      printParams.femaleHbA2 = doctor.femaleHbA2 || "";
      printParams.femaleHbSc = doctor.femaleHbSc || "";
      printParams.femaleHbD = doctor.femaleHbD || "";
      printParams.femaleHbE = doctor.femaleHbE || "";
      printParams.femaleHbC = doctor.femaleHbC || "";
      printParams.femaleNotes = doctor.femaleNotes || "";
    }

    printParams.maleStatus = reception.maleStatus || "NORMAL";
    printParams.femaleStatus = reception.femaleStatus || "NORMAL";
    printParams.idnumber = queue.queueNumber;
    printParams.priority = queue.priority;

    printReceipt(printParams);
  };

  return (
    <div className='min-h-screen' style={{ background: "#f3f4f6" }}>
      <Header />
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1
            className='text-4xl font-bold mb-4'
            style={{ color: "var(--primary)" }}>
            📁 الأرشيف
          </h1>
          <p className='text-gray-600'>
            عرض جميع الأدوار المؤرشفة والبحث فيها
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='text-sm text-gray-600 mb-2'>إجمالي المؤرشف</div>
              <div className='text-3xl font-bold' style={{ color: "var(--primary)" }}>
                {stats.totalArchived}
              </div>
            </div>
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='text-sm text-gray-600 mb-2'>المكتملة</div>
              <div className='text-3xl font-bold text-green-600'>
                {stats.completedCount}
              </div>
            </div>
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='text-sm text-gray-600 mb-2'>الملغاة</div>
              <div className='text-3xl font-bold text-red-600'>
                {stats.cancelledCount}
              </div>
            </div>
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='text-sm text-gray-600 mb-2'>آخر أرشفة</div>
              <div className='text-lg font-semibold text-gray-800'>
                {stats.lastArchiveDate
                  ? new Date(stats.lastArchiveDate).toLocaleDateString("ar-US")
                  : "-"}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Search */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                بحث
              </label>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='بحث برقم الدور، الاسم، الهاتف...'
                className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                الحالة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "ALL" | "COMPLETED" | "CANCELLED");
                  setCurrentPage(1);
                }}
                className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'>
                <option value='ALL'>الكل</option>
                <option value='COMPLETED'>مكتملة</option>
                <option value='CANCELLED'>ملغاة</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                من تاريخ
              </label>
              <input
                type='date'
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
              />
            </div>

            {/* End Date */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                إلى تاريخ
              </label>
              <input
                type='date'
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== "ALL" || startDate || endDate) && (
            <div className='mt-4'>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
                className='text-blue-600 hover:text-blue-800 text-sm'>
                🗑️ مسح الفلاتر
              </button>
            </div>
          )}
        </div>

        {/* Records Count */}
        <div className='mb-4 flex justify-between items-center'>
          <div className='text-sm text-gray-600'>
            إجمالي السجلات: {total} | الصفحة {currentPage} من {totalPages}
          </div>
          {loading && (
            <div className='text-sm text-gray-600'>⏳ جاري التحميل...</div>
          )}
        </div>

        {/* Table */}
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='border border-gray-300 px-4 py-3 text-center'>
                    رقم الدور
                  </th>
                  <th className='border border-gray-300 px-4 py-3 text-center'>
                    الخطيب
                  </th>
                  <th className='border border-gray-300 px-4 py-3 text-center'>
                    الخطيبة
                  </th>
                  <th className='border border-gray-300 px-4 py-3 text-center'>
                    الأولوية
                  </th>
                  <th className='border border-gray-300 px-4 py-3 text-center'>
                    الحالة
                  </th>
                  <th className='border border-gray-300 px-4 py-3 text-center'>
                    تاريخ الأرشفة
                  </th>
                  <th className='border border-gray-300 px-4 py-3 text-center'>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQueues.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className='border border-gray-300 px-4 py-8 text-center text-gray-500'>
                      لا توجد بيانات مؤرشفة
                    </td>
                  </tr>
                )}
                {filteredQueues.map((queue) => (
                  <>
                    <tr key={queue.id} className='hover:bg-gray-50'>
                      <td className='border border-gray-300 px-4 py-3 text-center font-bold'>
                        #{queue.queueNumber}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        {queue.ArchiveReceptionData?.maleName || "-"}{" "}
                        {queue.ArchiveReceptionData?.maleLastName || ""}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        {queue.ArchiveReceptionData?.femaleName || "-"}{" "}
                        {queue.ArchiveReceptionData?.femaleLastName || ""}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        {queue.priority === 1 ? (
                          <span className='px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800'>
                            مُستعجل
                          </span>
                        ) : (
                          <span className='px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600'>
                            عادي
                          </span>
                        )}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        {queue.status === "COMPLETED" ? (
                          <span className='px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800'>
                            مكتملة
                          </span>
                        ) : (
                          <span className='px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800'>
                            ملغاة
                          </span>
                        )}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center text-sm'>
                        {new Date(queue.archivedAt).toLocaleDateString("ar-US", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className='border border-gray-300 px-4 py-3 text-center'>
                        <div className='flex gap-2 justify-center'>
                          <button
                            onClick={() =>
                              setShowDetails(showDetails === queue.id ? null : queue.id)
                            }
                            className='bg-blue-600 text-white hover:bg-blue-700 cursor-pointer rounded-lg px-4 py-2 text-sm'>
                            {showDetails === queue.id ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                          </button>
                          {queue.ArchiveReceptionData && queue.ArchiveDoctorData && (
                            <button
                              onClick={() => handlePrintForm(queue)}
                              className='bg-green-600 text-white hover:bg-green-700 cursor-pointer rounded-lg px-4 py-2 text-sm'>
                              🖨️ طباعة
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {showDetails === queue.id && (
                      <tr>
                        <td colSpan={7} className='border border-gray-300 px-4 py-4 bg-gray-50'>
                          <div className='space-y-6'>
                            {/* Header with Print Button */}
                            <div className='flex justify-between items-center mb-4'>
                              <h3 className='text-xl font-bold' style={{ color: "var(--primary)" }}>
                                تفاصيل الدور #{queue.queueNumber}
                              </h3>
                              {queue.ArchiveReceptionData && queue.ArchiveDoctorData && (
                                <button
                                  onClick={() => handlePrintForm(queue)}
                                  className='bg-green-600 text-white hover:bg-green-700 cursor-pointer rounded-lg px-6 py-2 flex items-center gap-2'>
                                  🖨️ طباعة الفورم
                                </button>
                              )}
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                              {/* Patient Info */}
                              <div className='bg-white p-4 rounded-lg shadow'>
                                <h3 className='font-bold mb-3 text-lg border-b pb-2'>معلومات المريض</h3>
                                <p className='text-sm mb-1'>
                                  <strong>الاسم:</strong> {queue.patient.name}
                                </p>
                                {queue.patient.phoneNumber && (
                                  <p className='text-sm mb-1'>
                                    <strong>الهاتف:</strong> {queue.patient.phoneNumber}
                                  </p>
                                )}
                                {queue.patient.nationalId && (
                                  <p className='text-sm mb-1'>
                                    <strong>الرقم الوطني:</strong> {queue.patient.nationalId}
                                  </p>
                                )}
                                <p className='text-sm mb-1'>
                                  <strong>الأولوية:</strong>{" "}
                                  {queue.priority === 1 ? (
                                    <span className='px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800'>
                                      مُستعجل
                                    </span>
                                  ) : (
                                    <span className='px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600'>
                                      عادي
                                    </span>
                                  )}
                                </p>
                              </div>

                              {/* Male Details */}
                              {queue.ArchiveReceptionData?.maleName && (
                                <div className='bg-white p-4 rounded-lg shadow'>
                                  <h3 className='font-bold mb-3 text-lg border-b pb-2'>تفاصيل الخطيب</h3>
                                  <p className='text-sm mb-1'>
                                    <strong>الاسم:</strong> {queue.ArchiveReceptionData.maleName}{" "}
                                    {queue.ArchiveReceptionData.maleLastName || ""}
                                  </p>
                                  {queue.ArchiveReceptionData.maleFatherName && (
                                    <p className='text-sm mb-1'>
                                      <strong>اسم الأب:</strong>{" "}
                                      {queue.ArchiveReceptionData.maleFatherName}
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.maleMotherName && (
                                    <p className='text-sm mb-1'>
                                      <strong>اسم الأم:</strong>{" "}
                                      {queue.ArchiveReceptionData.maleMotherName}
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.maleAge && (
                                    <p className='text-sm mb-1'>
                                      <strong>العمر:</strong> {queue.ArchiveReceptionData.maleAge} سنة
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.maleNationalId && (
                                    <p className='text-sm mb-1'>
                                      <strong>الرقم الوطني:</strong>{" "}
                                      {queue.ArchiveReceptionData.maleNationalId}
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.maleBirthDate && (
                                    <p className='text-sm mb-1'>
                                      <strong>تاريخ الولادة:</strong>{" "}
                                      {formatDate(queue.ArchiveReceptionData.maleBirthDate)}
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.maleBirthPlace && (
                                    <p className='text-sm mb-1'>
                                      <strong>مكان الولادة:</strong>{" "}
                                      {queue.ArchiveReceptionData.maleBirthPlace}
                                    </p>
                                  )}
                                  <p className='text-sm mb-1'>
                                    <strong>الحالة:</strong>{" "}
                                    {queue.ArchiveReceptionData.maleStatus === "NORMAL"
                                      ? "عادي"
                                      : queue.ArchiveReceptionData.maleStatus === "LEGAL_INVITATION"
                                      ? "دعوة قانونية"
                                      : queue.ArchiveReceptionData.maleStatus === "NOT_EXIST"
                                      ? "غير موجود"
                                      : queue.ArchiveReceptionData.maleStatus === "OUT_OF_COUNTRY"
                                      ? "خارج البلاد"
                                      : "خارج المحافظة"}
                                  </p>
                                </div>
                              )}

                              {/* Female Details */}
                              {queue.ArchiveReceptionData?.femaleName && (
                                <div className='bg-white p-4 rounded-lg shadow'>
                                  <h3 className='font-bold mb-3 text-lg border-b pb-2'>تفاصيل الخطيبة</h3>
                                  <p className='text-sm mb-1'>
                                    <strong>الاسم:</strong> {queue.ArchiveReceptionData.femaleName}{" "}
                                    {queue.ArchiveReceptionData.femaleLastName || ""}
                                  </p>
                                  {queue.ArchiveReceptionData.femaleFatherName && (
                                    <p className='text-sm mb-1'>
                                      <strong>اسم الأب:</strong>{" "}
                                      {queue.ArchiveReceptionData.femaleFatherName}
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.femaleMotherName && (
                                    <p className='text-sm mb-1'>
                                      <strong>اسم الأم:</strong>{" "}
                                      {queue.ArchiveReceptionData.femaleMotherName}
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.femaleAge && (
                                    <p className='text-sm mb-1'>
                                      <strong>العمر:</strong> {queue.ArchiveReceptionData.femaleAge} سنة
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.femaleNationalId && (
                                    <p className='text-sm mb-1'>
                                      <strong>الرقم الوطني:</strong>{" "}
                                      {queue.ArchiveReceptionData.femaleNationalId}
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.femaleBirthDate && (
                                    <p className='text-sm mb-1'>
                                      <strong>تاريخ الولادة:</strong>{" "}
                                      {formatDate(queue.ArchiveReceptionData.femaleBirthDate)}
                                    </p>
                                  )}
                                  {queue.ArchiveReceptionData.femaleBirthPlace && (
                                    <p className='text-sm mb-1'>
                                      <strong>مكان الولادة:</strong>{" "}
                                      {queue.ArchiveReceptionData.femaleBirthPlace}
                                    </p>
                                  )}
                                  <p className='text-sm mb-1'>
                                    <strong>الحالة:</strong>{" "}
                                    {queue.ArchiveReceptionData.femaleStatus === "NORMAL"
                                      ? "عادي"
                                      : queue.ArchiveReceptionData.femaleStatus === "LEGAL_INVITATION"
                                      ? "دعوة قانونية"
                                      : queue.ArchiveReceptionData.femaleStatus === "NOT_EXIST"
                                      ? "غير موجود"
                                      : queue.ArchiveReceptionData.femaleStatus === "OUT_OF_COUNTRY"
                                      ? "خارج البلاد"
                                      : "خارج المحافظة"}
                                  </p>
                                </div>
                              )}

                            {/* Medical Exam Notes */}
                            {queue.ArchiveLabData && (
                              <div className='bg-white p-4 rounded-lg shadow'>
                                <h3 className='font-bold mb-3 text-lg border-b pb-2'>ملاحظات الفحص الطبي</h3>
                                {queue.ArchiveLabData.doctorName && (
                                  <p className='text-sm mb-2'>
                                    <strong>اسم الطبيب:</strong> {queue.ArchiveLabData.doctorName}
                                  </p>
                                )}
                                <p className='text-sm mb-2'>
                                  <strong>حالة الزوج:</strong>{" "}
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      queue.ArchiveLabData.isMaleHealthy === "HEALTHY"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}>
                                    {queue.ArchiveLabData.isMaleHealthy === "HEALTHY"
                                      ? "صحي"
                                      : "غير صحي"}
                                  </span>
                                </p>
                                {queue.ArchiveLabData.maleNotes && (
                                  <div className='mb-2'>
                                    <strong className='text-sm'>ملاحظات الزوج:</strong>
                                    <p className='text-sm bg-gray-50 p-2 rounded mt-1'>
                                      {queue.ArchiveLabData.maleNotes}
                                    </p>
                                  </div>
                                )}
                                <p className='text-sm mb-2'>
                                  <strong>حالة الزوجة:</strong>{" "}
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      queue.ArchiveLabData.isFemaleHealthy === "HEALTHY"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}>
                                    {queue.ArchiveLabData.isFemaleHealthy === "HEALTHY"
                                      ? "صحي"
                                      : "غير صحي"}
                                  </span>
                                </p>
                                {queue.ArchiveLabData.femaleNotes && (
                                  <div className='mb-2'>
                                    <strong className='text-sm'>ملاحظات الزوجة:</strong>
                                    <p className='text-sm bg-gray-50 p-2 rounded mt-1'>
                                      {queue.ArchiveLabData.femaleNotes}
                                    </p>
                                  </div>
                                )}
                                {queue.ArchiveLabData.notes && (
                                  <div>
                                    <strong className='text-sm'>ملاحظات عامة:</strong>
                                    <p className='text-sm bg-gray-50 p-2 rounded mt-1'>
                                      {queue.ArchiveLabData.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Test Results */}
                            {queue.ArchiveDoctorData && (
                              <div className='bg-white p-4 rounded-lg shadow'>
                                <h3 className='font-bold mb-3 text-lg border-b pb-2'>نتائج التحاليل</h3>
                                {queue.ArchiveReceptionData?.maleName && (
                                  <div className='mb-4'>
                                    <h4 className='font-semibold mb-2 text-sm'>الزوج:</h4>
                                    <div className='grid grid-cols-3 gap-2 text-xs'>
                                      <div>
                                        <strong>HIV:</strong>{" "}
                                        <span
                                          className={
                                            queue.ArchiveDoctorData.maleHIVstatus === "POSITIVE"
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }>
                                          {queue.ArchiveDoctorData.maleHIVstatus === "POSITIVE"
                                            ? "إيجابي"
                                            : "سلبي"}
                                        </span>
                                        {queue.ArchiveDoctorData.maleHIVvalue && (
                                          <span className='text-gray-600'>
                                            {" "}
                                            ({queue.ArchiveDoctorData.maleHIVvalue})
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <strong>HBS:</strong>{" "}
                                        <span
                                          className={
                                            queue.ArchiveDoctorData.maleHBSstatus === "POSITIVE"
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }>
                                          {queue.ArchiveDoctorData.maleHBSstatus === "POSITIVE"
                                            ? "إيجابي"
                                            : "سلبي"}
                                        </span>
                                        {queue.ArchiveDoctorData.maleHBSvalue && (
                                          <span className='text-gray-600'>
                                            {" "}
                                            ({queue.ArchiveDoctorData.maleHBSvalue})
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <strong>HBC:</strong>{" "}
                                        <span
                                          className={
                                            queue.ArchiveDoctorData.maleHBCstatus === "POSITIVE"
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }>
                                          {queue.ArchiveDoctorData.maleHBCstatus === "POSITIVE"
                                            ? "إيجابي"
                                            : "سلبي"}
                                        </span>
                                        {queue.ArchiveDoctorData.maleHBCvalue && (
                                          <span className='text-gray-600'>
                                            {" "}
                                            ({queue.ArchiveDoctorData.maleHBCvalue})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {queue.ArchiveReceptionData?.femaleName && (
                                  <div>
                                    <h4 className='font-semibold mb-2 text-sm'>الزوجة:</h4>
                                    <div className='grid grid-cols-3 gap-2 text-xs'>
                                      <div>
                                        <strong>HIV:</strong>{" "}
                                        <span
                                          className={
                                            queue.ArchiveDoctorData.femaleHIVstatus === "POSITIVE"
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }>
                                          {queue.ArchiveDoctorData.femaleHIVstatus === "POSITIVE"
                                            ? "إيجابي"
                                            : "سلبي"}
                                        </span>
                                        {queue.ArchiveDoctorData.femaleHIVvalue && (
                                          <span className='text-gray-600'>
                                            {" "}
                                            ({queue.ArchiveDoctorData.femaleHIVvalue})
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <strong>HBS:</strong>{" "}
                                        <span
                                          className={
                                            queue.ArchiveDoctorData.femaleHBSstatus === "POSITIVE"
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }>
                                          {queue.ArchiveDoctorData.femaleHBSstatus === "POSITIVE"
                                            ? "إيجابي"
                                            : "سلبي"}
                                        </span>
                                        {queue.ArchiveDoctorData.femaleHBSvalue && (
                                          <span className='text-gray-600'>
                                            {" "}
                                            ({queue.ArchiveDoctorData.femaleHBSvalue})
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <strong>HBC:</strong>{" "}
                                        <span
                                          className={
                                            queue.ArchiveDoctorData.femaleHBCstatus === "POSITIVE"
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }>
                                          {queue.ArchiveDoctorData.femaleHBCstatus === "POSITIVE"
                                            ? "إيجابي"
                                            : "سلبي"}
                                        </span>
                                        {queue.ArchiveDoctorData.femaleHBCvalue && (
                                          <span className='text-gray-600'>
                                            {" "}
                                            ({queue.ArchiveDoctorData.femaleHBCvalue})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Abnormal Hemoglobins */}
                            {queue.ArchiveDoctorData &&
                              (queue.ArchiveDoctorData.maleHemoglobinEnabled ||
                                queue.ArchiveDoctorData.femaleHemoglobinEnabled) && (
                                <div className='bg-white p-4 rounded-lg shadow'>
                                  <h3 className='font-bold mb-3 text-lg border-b pb-2'>
                                    الخضابات الشاذة
                                  </h3>
                                  {queue.ArchiveReceptionData?.maleName &&
                                    queue.ArchiveDoctorData.maleHemoglobinEnabled && (
                                      <div className='mb-4'>
                                        <h4 className='font-semibold mb-2 text-sm'>الزوج:</h4>
                                        <div className='grid grid-cols-2 gap-2 text-xs'>
                                          {queue.ArchiveDoctorData.maleHbS && (
                                            <div>
                                              <strong>HbS:</strong> {queue.ArchiveDoctorData.maleHbS}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.maleHbF && (
                                            <div>
                                              <strong>HbF:</strong> {queue.ArchiveDoctorData.maleHbF}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.maleHbA1c && (
                                            <div>
                                              <strong>HbA1c:</strong>{" "}
                                              {queue.ArchiveDoctorData.maleHbA1c}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.maleHbA2 && (
                                            <div>
                                              <strong>HbA2:</strong>{" "}
                                              {queue.ArchiveDoctorData.maleHbA2}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.maleHbSc && (
                                            <div>
                                              <strong>HbSc:</strong>{" "}
                                              {queue.ArchiveDoctorData.maleHbSc}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.maleHbD && (
                                            <div>
                                              <strong>HbD:</strong> {queue.ArchiveDoctorData.maleHbD}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.maleHbE && (
                                            <div>
                                              <strong>HbE:</strong> {queue.ArchiveDoctorData.maleHbE}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.maleHbC && (
                                            <div>
                                              <strong>HbC:</strong> {queue.ArchiveDoctorData.maleHbC}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  {queue.ArchiveReceptionData?.femaleName &&
                                    queue.ArchiveDoctorData.femaleHemoglobinEnabled && (
                                      <div>
                                        <h4 className='font-semibold mb-2 text-sm'>الزوجة:</h4>
                                        <div className='grid grid-cols-2 gap-2 text-xs'>
                                          {queue.ArchiveDoctorData.femaleHbS && (
                                            <div>
                                              <strong>HbS:</strong>{" "}
                                              {queue.ArchiveDoctorData.femaleHbS}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.femaleHbF && (
                                            <div>
                                              <strong>HbF:</strong>{" "}
                                              {queue.ArchiveDoctorData.femaleHbF}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.femaleHbA1c && (
                                            <div>
                                              <strong>HbA1c:</strong>{" "}
                                              {queue.ArchiveDoctorData.femaleHbA1c}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.femaleHbA2 && (
                                            <div>
                                              <strong>HbA2:</strong>{" "}
                                              {queue.ArchiveDoctorData.femaleHbA2}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.femaleHbSc && (
                                            <div>
                                              <strong>HbSc:</strong>{" "}
                                              {queue.ArchiveDoctorData.femaleHbSc}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.femaleHbD && (
                                            <div>
                                              <strong>HbD:</strong>{" "}
                                              {queue.ArchiveDoctorData.femaleHbD}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.femaleHbE && (
                                            <div>
                                              <strong>HbE:</strong>{" "}
                                              {queue.ArchiveDoctorData.femaleHbE}
                                            </div>
                                          )}
                                          {queue.ArchiveDoctorData.femaleHbC && (
                                            <div>
                                              <strong>HbC:</strong>{" "}
                                              {queue.ArchiveDoctorData.femaleHbC}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}

                            {/* Doctor Notes */}
                            {queue.ArchiveDoctorData &&
                              (queue.ArchiveDoctorData.maleNotes ||
                                queue.ArchiveDoctorData.femaleNotes ||
                                queue.ArchiveDoctorData.notes) && (
                                <div className='bg-white p-4 rounded-lg shadow'>
                                  <h3 className='font-bold mb-3 text-lg border-b pb-2'>
                                    ملاحظات الطبيبة
                                  </h3>
                                  {queue.ArchiveDoctorData.maleNotes && (
                                    <div className='mb-3'>
                                      <strong className='text-sm'>ملاحظات الزوج:</strong>
                                      <p className='text-sm bg-gray-50 p-2 rounded mt-1'>
                                        {queue.ArchiveDoctorData.maleNotes}
                                      </p>
                                    </div>
                                  )}
                                  {queue.ArchiveDoctorData.femaleNotes && (
                                    <div className='mb-3'>
                                      <strong className='text-sm'>ملاحظات الزوجة:</strong>
                                      <p className='text-sm bg-gray-50 p-2 rounded mt-1'>
                                        {queue.ArchiveDoctorData.femaleNotes}
                                      </p>
                                    </div>
                                  )}
                                  {queue.ArchiveDoctorData.notes && (
                                    <div>
                                      <strong className='text-sm'>ملاحظات عامة:</strong>
                                      <p className='text-sm bg-gray-50 p-2 rounded mt-1'>
                                        {queue.ArchiveDoctorData.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Blood Type */}
                            {queue.ArchiveDoctorData &&
                              (queue.ArchiveDoctorData.maleBloodType ||
                                queue.ArchiveDoctorData.femaleBloodType) && (
                                <div className='bg-white p-4 rounded-lg shadow'>
                                  <h3 className='font-bold mb-3 text-lg border-b pb-2'>فصيلة الدم</h3>
                                  {queue.ArchiveDoctorData.maleBloodType && (
                                    <p className='text-sm mb-2'>
                                      <strong>فصيلة الزوج:</strong>{" "}
                                      {queue.ArchiveDoctorData.maleBloodType}
                                    </p>
                                  )}
                                  {queue.ArchiveDoctorData.femaleBloodType && (
                                    <p className='text-sm'>
                                      <strong>فصيلة الزوجة:</strong>{" "}
                                      {queue.ArchiveDoctorData.femaleBloodType}
                                    </p>
                                  )}
                                </div>
                              )}

                            {/* Accounting Data */}
                            {queue.ArchiveAccountingData && (
                              <div className='bg-white p-4 rounded-lg shadow'>
                                <h3 className='font-bold mb-3 text-lg border-b pb-2'>المحاسبة</h3>
                                <p className='text-sm mb-1'>
                                  <strong>المبلغ:</strong>{" "}
                                  {queue.ArchiveAccountingData.totalAmount?.toLocaleString() ||
                                    "0"}{" "}
                                  ل.س
                                </p>
                                <p className='text-sm'>
                                  <strong>الحالة:</strong>{" "}
                                  {queue.ArchiveAccountingData.isPaid ? (
                                    <span className='text-green-600 font-semibold'>مدفوع</span>
                                  ) : (
                                    <span className='text-red-600 font-semibold'>غير مدفوع</span>
                                  )}
                                </p>
                              </div>
                            )}

                            {/* Blood Draw Data */}
                            {queue.ArchiveBloodDrawData &&
                              (queue.ArchiveBloodDrawData.maleBloodTube1 ||
                                queue.ArchiveBloodDrawData.maleBloodTube2 ||
                                queue.ArchiveBloodDrawData.femaleBloodTube1 ||
                                queue.ArchiveBloodDrawData.femaleBloodTube2) && (
                                <div className='bg-white p-4 rounded-lg shadow'>
                                  <h3 className='font-bold mb-3 text-lg border-b pb-2'>سحب الدم</h3>
                                  {queue.ArchiveBloodDrawData.maleBloodTube1 && (
                                    <p className='text-sm mb-1'>
                                      <strong>أنبوب الزوج 1:</strong>{" "}
                                      {queue.ArchiveBloodDrawData.maleBloodTube1}
                                    </p>
                                  )}
                                  {queue.ArchiveBloodDrawData.maleBloodTube2 && (
                                    <p className='text-sm mb-1'>
                                      <strong>أنبوب الزوج 2:</strong>{" "}
                                      {queue.ArchiveBloodDrawData.maleBloodTube2}
                                    </p>
                                  )}
                                  {queue.ArchiveBloodDrawData.femaleBloodTube1 && (
                                    <p className='text-sm mb-1'>
                                      <strong>أنبوب الزوجة 1:</strong>{" "}
                                      {queue.ArchiveBloodDrawData.femaleBloodTube1}
                                    </p>
                                  )}
                                  {queue.ArchiveBloodDrawData.femaleBloodTube2 && (
                                    <p className='text-sm'>
                                      <strong>أنبوب الزوجة 2:</strong>{" "}
                                      {queue.ArchiveBloodDrawData.femaleBloodTube2}
                                    </p>
                                  )}
                                </div>
                              )}

                            {/* Queue History */}
                            {queue.ArchiveQueueHistory.length > 0 && (
                              <div className='bg-white p-4 rounded-lg shadow'>
                                <h3 className='font-bold mb-3 text-lg border-b pb-2'>سجل المحطات</h3>
                                <div className='text-sm space-y-1'>
                                  {queue.ArchiveQueueHistory.map((history, idx) => (
                                    <div key={history.id}>
                                      {idx + 1}. {history.stationName || `المحطة ${history.stationId}`} -{" "}
                                      {history.status === "COMPLETED" ? "مكتملة" : history.status}
                                      {history.completedAt && (
                                        <span className='text-gray-500 text-xs'>
                                          {" "}
                                          ({new Date(history.completedAt).toLocaleTimeString("ar-US")})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dates */}
                            <div className='bg-white p-4 rounded-lg shadow'>
                              <h3 className='font-bold mb-3 text-lg border-b pb-2'>التواريخ</h3>
                              <p className='text-sm mb-1'>
                                <strong>تاريخ الإنشاء:</strong>{" "}
                                {new Date(queue.createdAt).toLocaleDateString("ar-US")}
                              </p>
                              {queue.completedAt && (
                                <p className='text-sm mb-1'>
                                  <strong>تاريخ الإكمال:</strong>{" "}
                                  {new Date(queue.completedAt).toLocaleDateString("ar-US")}
                                </p>
                              )}
                              <p className='text-sm'>
                                <strong>تاريخ الأرشفة:</strong>{" "}
                                {new Date(queue.archivedAt).toLocaleDateString("ar-US")}
                              </p>
                            </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-6 flex justify-center items-center gap-4'>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'>
              السابق
            </button>
            <span className='text-gray-700'>
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'>
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;

