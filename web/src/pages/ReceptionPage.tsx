/* eslint-disable no-useless-escape */
import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import { useQueueUpdates } from "../hooks/useQueueUpdates";
import printQueueNumber from "../utils/queuePrinter";
import { API_BASE_URL } from "../services/api";

const API_URL = API_BASE_URL;

interface ReceptionData {
  id: number;
  queueId: number;
  patientId: number;
  maleStatus: string;
  femaleStatus: string;
  maleName?: string;
  maleLastName?: string;
  maleFatherName?: string;
  maleBirthDate?: string;
  maleNationalId?: string;
  maleAge?: number;
  maleBirthPlace?: string;
  maleRegistration?: string;
  maleCountry?: string;
  femaleName?: string;
  femaleLastName?: string;
  femaleFatherName?: string;
  femaleBirthDate?: string;
  femaleNationalId?: string;
  femaleAge?: number;
  femaleBirthPlace?: string;
  femaleRegistration?: string;
  femaleCountry?: string;
  phoneNumber?: string;
  notes?: string;
  createdAt: string;
  queue: {
    queueNumber: number;
    priority: number;
    patient: {
      id: number;
      name: string;
    };
  };
}

interface CancelledQueue {
  id: number;
  queueNumber: number;
  patientId: number;
  currentStationId: number;
  status: string;
  priority: number;
  notes?: string;
  createdAt: string;
  patient: {
    id: number;
    name: string;
  };
  currentStation: {
    id: number;
    name: string;
    displayNumber: number;
  };
  ReceptionData?: ReceptionData;
}

const ReceptionPage = () => {
  // قائمة المدن السورية
  const syrianCities = [
    "دمشق",
    "حلب",
    "حمص",
    "حماة",
    "حماه",
    "اللاذقية",
    "طرطوس",
    "دير الزور",
    "ديرالزور",
    "الرقة",
    "إدلب",
    "ادلب",
    "السويداء",
    "درعا",
    "القنيطرة",
    "القنيطره",
    "الحسكة",
    "الحسكه",
    "القامشلي",
    "منبج",
    "جبلة",
    "جبله",
    "بانياس",
    "صافيتا",
    "تدمر",
    "سلمية",
    "سلميه",
    "السلمية",
    "السلميه",
    "الباب",
    "جرابلس",
    "عفرين",
    "معرة النعمان",
    "معره النعمان",
    "معرةالنعمان",
    "خان شيخون",
    "صلخد",
    "شهبا",
    "ازرع",
    "بصرى الشام",
    "نوى",
    "الصنمين",
    "جاسم",
    "الشيخ مسكين",
    "تل",
    "قطنا",
    "دوما",
    "داريا",
    "معضمية الشام",
    "جرمانا",
    "صيدنايا",
    "النبك",
    "يبرود",
    "القريتين",
    "الرستن",
    "تلبيسة",
    "تلبيسه",
    "القصير",
    "جبلة",
    "الحفة",
    "الحفه",
    "كسب",
    "مصياف",
    "السقيلبية",
    "محردة",
    "محرده",
    "سرمدا",
    "سراقب",
    "أريحا",
    "اريحا",
    "طفس",
    "الميادين",
    "البوكمال",
    "تل أبيض",
    "رأس العين",
    "المالكية",
    "عامودا",
    "الدرباسية",
    "الثورة",
    "الثوره",
    "كفرنبل",
    "كفر تخاريم",
    "الدانا",
  ];

  // دالة للتحقق من المدينة السورية
  const isSyrianCity = (cityName: string): boolean => {
    if (!cityName || cityName.trim() === "") return false;

    const normalizedInput = cityName.trim().toLowerCase();
    return syrianCities.some(
      (city) =>
        city.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(city.toLowerCase())
    );
  };

  const [formData, setFormData] = useState({
    maleStatus: "NORMAL",
    femaleStatus: "NORMAL",
    maleName: "",
    maleLastName: "",
    maleFatherName: "",
    maleBirthDate: "",
    maleNationalId: "",
    maleAge: "",
    maleBirthPlace: "",
    maleRegistration: "",
    maleCountry: "",
    femaleName: "",
    femaleLastName: "",
    femaleFatherName: "",
    femaleBirthDate: "",
    femaleNationalId: "",
    femaleAge: "",
    femaleBirthPlace: "",
    femaleRegistration: "",
    femaleCountry: "",
    phoneNumber: "",
    notes: "",
    priority: "0",
  });

  const [todayPatients, setTodayPatients] = useState<ReceptionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPatient, setEditingPatient] = useState<ReceptionData | null>(
    null
  );

  // Cancelled Queues Modal
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [cancelledQueues, setCancelledQueues] = useState<CancelledQueue[]>([]);
  const [loadingCancelled, setLoadingCancelled] = useState(false);

  // WebSocket for real-time updates
  const { updateTrigger } = useQueueUpdates();

  useEffect(() => {
    fetchTodayPatients();
  }, [updateTrigger]); // Refetch when WebSocket triggers update

  const fetchTodayPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/reception/today`);
      if (response.data.success) {
        setTodayPatients(response.data.receptionData);
      }
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error);
    }
  };

  const fetchCancelledQueues = async () => {
    setLoadingCancelled(true);
    try {
      const response = await axios.get(`${API_URL}/queue/cancelled/today`);
      if (response.data.success) {
        setCancelledQueues(response.data.queues);
      }
    } catch (error) {
      console.error("خطأ في جلب الأدوار الملغاة:", error);
      alert("❌ خطأ في جلب الأدوار الملغاة");
    } finally {
      setLoadingCancelled(false);
    }
  };

  const handleReinstateQueue = async (queueId: number, queueNumber: number) => {
    if (!confirm(`هل تريد إعادة طباعة الدور #${queueNumber}؟`)) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/queue/${queueId}/reinstate`
      );
      if (response.data.success) {
        alert(`✅ تم إنشاء الدور الجديد #${response.data.queueNumber}`);

        // طباعة الدور الجديد
        printQueueNumber(
          response.data.queueNumber,
          response.data.newQueue.patientId
        );

        // إزالة الدور من القائمة
        setCancelledQueues((prev) => prev.filter((q) => q.id !== queueId));

        // تحديث قائمة المرضى
        fetchTodayPatients();
      }
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data
          ? String(error.response.data.error)
          : "حدث خطأ غير متوقع";
      alert("❌ خطأ: " + errorMessage);
    }
  };

  const handleOpenCancelledModal = () => {
    setShowCancelledModal(true);
    fetchCancelledQueues();
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // دالة لتحويل dd/mm/yyyy إلى yyyy-mm-dd
  const parseDateFromPaste = (dateStr: string): string => {
    // إزالة المسافات والأحرف الزائدة
    const cleaned = dateStr.trim();

    // التحقق من تنسيق dd/mm/yyyy
    const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const match = cleaned.match(ddmmyyyyRegex);

    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      return `${year}-${month}-${day}`; // yyyy-mm-dd
    }

    return cleaned; // إرجاع القيمة كما هي إذا لم تطابق التنسيق
  };

  const handleDatePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const formattedDate = parseDateFromPaste(pastedText);

    // تحديث القيمة وحساب العمر
    const age = calculateAge(formattedDate);

    if (fieldName === "maleBirthDate") {
      setFormData((prev) => ({
        ...prev,
        maleBirthDate: formattedDate,
        maleAge: age.toString(),
      }));
    } else if (fieldName === "femaleBirthDate") {
      setFormData((prev) => ({
        ...prev,
        femaleBirthDate: formattedDate,
        femaleAge: age.toString(),
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // حساب العمر تلقائياً عند تغيير تاريخ الميلاد
    if (name === "maleBirthDate") {
      const age = calculateAge(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        maleAge: age.toString(),
      }));
    } else if (name === "femaleBirthDate") {
      const age = calculateAge(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        femaleAge: age.toString(),
      }));
    } else if (name === "maleStatus") {
      // عند اختيار دعوة شرعية للزوج، اجعل الزوجة "لا يوجد" تلقائياً
      if (value === "LEGAL_INVITATION") {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          femaleStatus: "NOT_EXIST",
          // مسح بيانات الزوجة
          femaleName: "",
          femaleLastName: "",
          femaleFatherName: "",
          femaleBirthDate: "",
          femaleNationalId: "",
          femaleAge: "",
          femaleBirthPlace: "",
          femaleRegistration: "",
          femaleCountry: "",
        }));
      } else if (
        value === "NOT_EXIST" ||
        value === "OUT_OF_COUNTRY" ||
        value === "OUT_OF_PROVINCE"
      ) {
        // مسح بيانات الزوج عند اختيار حالة لا يحتاج بيانات
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          maleName: "",
          maleLastName: "",
          maleFatherName: "",
          maleBirthDate: "",
          maleNationalId: "",
          maleAge: "",
          maleBirthPlace: "",
          maleRegistration: "",
          maleCountry: "",
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === "femaleStatus") {
      // عند اختيار دعوة شرعية للزوجة، اجعل الزوج "لا يوجد" تلقائياً
      if (value === "LEGAL_INVITATION") {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          maleStatus: "NOT_EXIST",
          // مسح بيانات الزوج
          maleName: "",
          maleLastName: "",
          maleFatherName: "",
          maleBirthDate: "",
          maleNationalId: "",
          maleAge: "",
          maleBirthPlace: "",
          maleRegistration: "",
          maleCountry: "",
        }));
      } else if (
        value === "NOT_EXIST" ||
        value === "OUT_OF_COUNTRY" ||
        value === "OUT_OF_PROVINCE"
      ) {
        // مسح بيانات الزوجة عند اختيار حالة لا يحتاج بيانات
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          femaleName: "",
          femaleLastName: "",
          femaleFatherName: "",
          femaleBirthDate: "",
          femaleNationalId: "",
          femaleAge: "",
          femaleBirthPlace: "",
          femaleRegistration: "",
          femaleCountry: "",
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // دالة للتحقق من مكان الولادة بعد الانتهاء من الكتابة
  const handleBirthPlaceBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    fieldName: "maleBirthPlace" | "femaleBirthPlace"
  ) => {
    const value = e.target.value;

    // التحقق من المدينة السورية بعد الانتهاء من الكتابة
    if (value && isSyrianCity(value)) {
      if (fieldName === "maleBirthPlace") {
        setFormData((prev) => ({
          ...prev,
          maleCountry: "سوريا",
        }));
      } else if (fieldName === "femaleBirthPlace") {
        setFormData((prev) => ({
          ...prev,
          femaleCountry: "سوريا",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        ...(formData.maleBirthDate && {
          maleBirthDate: new Date(formData.maleBirthDate).toISOString(),
        }),
        ...(formData.femaleBirthDate && {
          femaleBirthDate: new Date(formData.femaleBirthDate).toISOString(),
        }),
        ...(formData.maleAge && { maleAge: parseInt(formData.maleAge) }),
        ...(formData.femaleAge && { femaleAge: parseInt(formData.femaleAge) }),
        priority: parseInt(formData.priority),
      };

      if (editingId) {
        const response = await axios.put(
          `${API_URL}/reception/${editingId}`,
          dataToSend
        );
        if (response.data.success) {
          alert("✅ تم تحديث البيانات بنجاح!");
          setEditingId(null);
          setEditingPatient(null);
          resetForm();
          fetchTodayPatients();
        }
      } else {
        const response = await axios.post(`${API_URL}/reception`, dataToSend);
        if (response.data.success) {
          alert(`✅ تم إنشاء الدور #${response.data.queueNumber} بنجاح!`);

          printQueueNumber(
            response.data.queueNumber,
            response.data.receptionData.patientId
          );
          resetForm();
          fetchTodayPatients();
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data
          ? String(error.response.data.error)
          : "حدث خطأ غير متوقع";
      alert("❌ خطأ: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      maleStatus: "NORMAL",
      femaleStatus: "NORMAL",
      maleName: "",
      maleLastName: "",
      maleFatherName: "",
      maleBirthDate: "",
      maleNationalId: "",
      maleAge: "",
      maleBirthPlace: "",
      maleRegistration: "",
      maleCountry: "",
      femaleName: "",
      femaleLastName: "",
      femaleFatherName: "",
      femaleBirthDate: "",
      femaleNationalId: "",
      femaleAge: "",
      femaleBirthPlace: "",
      femaleRegistration: "",
      femaleCountry: "",
      phoneNumber: "",
      notes: "",
      priority: "0",
    });
  };

  const handleEdit = (patient: ReceptionData) => {
    setEditingId(patient.queueId);
    setEditingPatient(patient);
    setFormData({
      maleStatus: patient.maleStatus || "NORMAL",
      femaleStatus: patient.femaleStatus || "NORMAL",
      maleName: patient.maleName || "",
      maleLastName: patient.maleLastName || "",
      maleFatherName: patient.maleFatherName || "",
      maleBirthDate: patient.maleBirthDate
        ? new Date(patient.maleBirthDate).toISOString().split("T")[0]
        : "",
      maleNationalId: patient.maleNationalId || "",
      maleAge: patient.maleAge?.toString() || "",
      maleBirthPlace: patient.maleBirthPlace || "",
      maleRegistration: patient.maleRegistration || "",
      maleCountry: patient.maleCountry || "",
      femaleName: patient.femaleName || "",
      femaleLastName: patient.femaleLastName || "",
      femaleFatherName: patient.femaleFatherName || "",
      femaleBirthDate: patient.femaleBirthDate
        ? new Date(patient.femaleBirthDate).toISOString().split("T")[0]
        : "",
      femaleNationalId: patient.femaleNationalId || "",
      femaleAge: patient.femaleAge?.toString() || "",
      femaleBirthPlace: patient.femaleBirthPlace || "",
      femaleRegistration: patient.femaleRegistration || "",
      femaleCountry: patient.femaleCountry || "",
      phoneNumber: patient.phoneNumber || "",
      notes: patient.notes || "",
      priority: patient.queue.priority?.toString() || "0",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingPatient(null);
    resetForm();
  };

  const el = document.getElementById("stopHere");
  el?.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault(); // يمنع انتقال التركيز
    }
  });

  return (
    <div
      className='h-screen flex flex-col'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='الاستقبال' icon='📝' showHomeButton={true} />

      <div className='flex-1 flex overflow-y-auto'>
        {/* Main Form Area - 65% */}
        <div
          className='flex-1 p-6 flex flex-col '
          style={{ marginLeft: "384px" }}>
          <div className='card flex flex-col shadow-xl '>
            {/* Header ثابت */}
            <div className='card-header mb-4 flex items-center justify-between flex-shrink-0'>
              <div className=' items-center justify-between'>
                {editingId ? (
                  ""
                ) : (
                  <span className='bg-white text-2xl ml-2 cursor-default text-[#054239] rounded-full w-8 h-8 pb-1 inline-flex items-center justify-center'>
                    +
                  </span>
                )}
                <span className='text-2xl '>
                  {editingId ? "تعديل بيانات المراجع" : "إضافة مراجع جديد"}
                </span>
                {editingId && (
                  <button
                    type='button'
                    onClick={handleCancelEdit}
                    className='mr-4 px-3 py-1 rounded-lg text-sm font-semibold transition duration-200'
                    style={{
                      backgroundColor: "#dc2626",
                      color: "var(--white)",
                    }}>
                    ✖ إلغاء التعديل
                  </button>
                )}
              </div>

              {editingPatient && (
                <span className='text-lg mr-2 text-gray-300 '>
                  ( ID : {editingPatient?.patientId} )
                </span>
              )}
            </div>

            {/* Form بدون scroll */}
            <div className='px-2'>
              <form
                onSubmit={handleSubmit}
                className='flex flex-col gap-1 items-stretch space-y-5 pb-6'>
                {/* Male Data - Compact Grid */}
                <div
                  className='p-4 rounded-lg shadow-sm'
                  style={{ backgroundColor: "var(--light)" }}>
                  <h3
                    className='text-base font-bold mb-4'
                    style={{ color: "var(--primary)" }}>
                    👨 بيانات الزوج :
                  </h3>
                  <div className='grid grid-cols-3 gap-4 mb-4'>
                    <div className='col-span-3'>
                      <label className='block text-xs font-semibold mb-2 text-gray-700'>
                        حالة الزوج <span className='text-red-500'>*</span>
                      </label>
                      <select
                        name='maleStatus'
                        value={formData.maleStatus}
                        onChange={handleInputChange}
                        className='input-field text-sm py-3 w-full'
                        required>
                        <option value='NORMAL'>الزوج موجود</option>
                        <option value='LEGAL_INVITATION'>دعوة شرعية</option>
                        <option hidden value='NOT_EXIST'>
                          لا يوجد زوج
                        </option>
                        <option value='OUT_OF_COUNTRY'>خارج القطر</option>
                        <option value='OUT_OF_PROVINCE'>خارج المحافظة</option>
                      </select>
                    </div>
                  </div>
                  {/* إظهار الحقول فقط إذا كانت الحالة NORMAL أو LEGAL_INVITATION */}
                  {(formData.maleStatus === "NORMAL" ||
                    formData.maleStatus === "LEGAL_INVITATION") && (
                    <div className='grid grid-cols-3 gap-4'>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          الاسم الأول <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='maleName'
                          value={formData.maleName}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='الاسم الأول'
                          required
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          اسم الأب <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='maleFatherName'
                          value={formData.maleFatherName}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='اسم الأب'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          اسم العائلة <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='maleLastName'
                          value={formData.maleLastName}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='اسم العائلة'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          تاريخ الميلاد <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='date'
                          name='maleBirthDate'
                          value={formData.maleBirthDate}
                          onChange={handleInputChange}
                          onPaste={(e) => handleDatePaste(e, "maleBirthDate")}
                          className='input-field text-sm py-3'
                          placeholder='تاريخ الميلاد'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          الرقم الوطني <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='number'
                          name='maleNationalId'
                          value={formData.maleNationalId}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3 appearance-none'
                          placeholder='الرقم الوطني'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          مكان الولادة
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='maleBirthPlace'
                          value={formData.maleBirthPlace}
                          onChange={handleInputChange}
                          onBlur={(e) =>
                            handleBirthPlaceBlur(e, "maleBirthPlace")
                          }
                          className='input-field text-sm py-3'
                          placeholder='مكان الولادة'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          البلد
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='maleCountry'
                          value={formData.maleCountry}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='البلد'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          القيد
                        </label>
                        <input
                          autoComplete='off'
                          tabIndex={-1}
                          type='text'
                          name='maleRegistration'
                          value={formData.maleRegistration}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='القيد'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          العمر (تلقائي) <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          tabIndex={-1}
                          type='number'
                          name='maleAge'
                          value={formData.maleAge}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3 bg-gray-100'
                          placeholder='العمر'
                          readOnly
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Female Data - Compact Grid */}
                <div
                  className='p-4 rounded-lg shadow-sm'
                  style={{ backgroundColor: "var(--light)" }}>
                  <h3
                    className='text-base font-bold mb-4'
                    style={{ color: "var(--primary)" }}>
                    👩 بيانات الزوجة :
                  </h3>
                  <div className='grid grid-cols-3 gap-4 mb-4'>
                    <div className='col-span-3'>
                      <label className='block text-xs font-semibold mb-2 text-gray-700'>
                        حالة الزوجة <span className='text-red-500'>*</span>
                      </label>
                      <select
                        autoComplete='off'
                        tabIndex={-1}
                        name='femaleStatus'
                        value={formData.femaleStatus}
                        onChange={handleInputChange}
                        className='input-field text-sm py-3 w-full'
                        required>
                        <option value='NORMAL'>الزوجة موجودة</option>
                        <option value='LEGAL_INVITATION'>دعوة شرعية</option>
                        <option hidden value='NOT_EXIST'>
                          لا يوجد زوجة
                        </option>
                        <option value='OUT_OF_COUNTRY'>خارج القطر</option>
                        <option value='OUT_OF_PROVINCE'>خارج المحافظة</option>
                      </select>
                    </div>
                  </div>

                  {/* إظهار الحقول فقط إذا كانت الحالة NORMAL أو LEGAL_INVITATION */}
                  {(formData.femaleStatus === "NORMAL" ||
                    formData.femaleStatus === "LEGAL_INVITATION") && (
                    <div className='grid grid-cols-3 gap-4'>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          الاسم الأول <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='femaleName'
                          value={formData.femaleName}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='الاسم الأول'
                          required
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          اسم الأب <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='femaleFatherName'
                          value={formData.femaleFatherName}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='اسم الأب'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          اسم العائلة <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='femaleLastName'
                          value={formData.femaleLastName}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='اسم العائلة'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          تاريخ الميلاد <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='date'
                          name='femaleBirthDate'
                          value={formData.femaleBirthDate}
                          onChange={handleInputChange}
                          onPaste={(e) => handleDatePaste(e, "femaleBirthDate")}
                          className='input-field text-sm py-3'
                          placeholder='تاريخ الميلاد'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          الرقم الوطني <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          type='number'
                          name='femaleNationalId'
                          value={formData.femaleNationalId}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3 appearance-none'
                          placeholder='الرقم الوطني'
                          required
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          مكان الولادة
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='femaleBirthPlace'
                          value={formData.femaleBirthPlace}
                          onChange={handleInputChange}
                          onBlur={(e) =>
                            handleBirthPlaceBlur(e, "femaleBirthPlace")
                          }
                          className='input-field text-sm py-3'
                          placeholder='مكان الولادة'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          البلد
                        </label>
                        <input
                          autoComplete='off'
                          type='text'
                          name='femaleCountry'
                          value={formData.femaleCountry}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='البلد'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          القيد
                        </label>
                        <input
                          autoComplete='off'
                          tabIndex={-1}
                          type='text'
                          name='femaleRegistration'
                          value={formData.femaleRegistration}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3'
                          placeholder='القيد'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-semibold mb-2 text-gray-700'>
                          العمر (تلقائي) <span className='text-red-500'>*</span>
                        </label>
                        <input
                          autoComplete='off'
                          tabIndex={-1}
                          type='number'
                          name='femaleAge'
                          value={formData.femaleAge}
                          onChange={handleInputChange}
                          className='input-field text-sm py-3 bg-gray-100'
                          placeholder='العمر'
                          readOnly
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Info - Compact */}
                <div className='p-4 rounded-lg shadow-[0_0_10px_5px_rgba(0,0,0,0.045)] shad bg-white'>
                  <h3
                    className='text-base font-bold mb-4'
                    style={{ color: "var(--primary)" }}>
                    📋 معلومات إضافية :
                  </h3>
                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-xs font-semibold mb-2 text-gray-700'>
                        رقم الهاتف <span className='text-red-500'>*</span>
                      </label>
                      <input
                        autoComplete='off'
                        tabIndex={-1}
                        type='tel'
                        name='phoneNumber'
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className='input-field text-sm py-3'
                        placeholder='رقم الهاتف'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-semibold mb-2 text-gray-700'>
                        ملاحظات
                      </label>
                      <textarea
                        autoComplete='off'
                        tabIndex={-1}
                        name='notes'
                        value={formData.notes}
                        onChange={handleInputChange}
                        className='input-field text-sm py-3'
                        placeholder='ملاحظات'
                        rows={1}
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-semibold mb-2 text-gray-700'>
                        الأولوية <span className='text-red-500'>*</span>
                      </label>
                      <select
                        autoComplete='off'
                        tabIndex={-1}
                        name='priority'
                        value={formData.priority}
                        onChange={handleInputChange}
                        className='input-field text-sm py-3'>
                        <option value='0'>أولوية عادية</option>
                        <option value='1'>مُستعجل</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className='flex justify-center mt-8'>
                  <button
                    id='stopHere'
                    type='submit'
                    disabled={loading}
                    className='btn-primary px-12 py-3 text-lg font-bold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200'>
                    {loading
                      ? "⏳ جاري الحفظ..."
                      : editingId
                      ? "💾 حفظ التعديلات"
                      : "💾 حفظ وإنشاء دور"}
                  </button>
                </div>
              </form>
            </div>
          </div>
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

        {/* Sidebar - 35% */}
        <div
          className='w-100 border-r fixed left-0 h-screen flex flex-col z-0'
          style={{
            borderColor: "var(--light)",
            backgroundColor: "var(--primary)",
            top: 0,
          }}>
          {/* مساحة متطابقة مع الـ Header */}
          <div
            className='px-4 py-4'
            style={{ backgroundColor: "var(--primary)" }}>
            <div style={{ height: "36px" }}></div>{" "}
            {/* ارتفاع النص في الـ Header */}
          </div>

          <div
            className='p-3 font-bold text-white text-center flex-shrink-0'
            style={{ backgroundColor: "#988561" }}>
            <div className='flex flex-row items-center justify-between text-base gap-2'>
              <button
                onClick={handleOpenCancelledModal}
                className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition duration-200 flex items-center gap-1'
                title='عرض الأدوار الملغاة'>
                🔄 الملغاة
              </button>
              <div className='flex flex-row items-center gap-2'>
                <span className='bg-white cursor-default text-[#988561] w-5 h-5 rounded-full text-lg font-bold inline-flex items-center justify-center'>
                  !
                </span>
                <span>المراجعون المضافون اليوم ( {todayPatients.length} )</span>
              </div>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto p-3 space-y-2 bg-white'>
            {todayPatients.length === 0 ? (
              <div
                className='text-center py-8 text-sm'
                style={{ color: "var(--dark)" }}>
                لا توجد بيانات لهذا اليوم
              </div>
            ) : (
              todayPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-3 border-[1px] rounded-lg transition-all duration-400 hover:shadow-[0_0_10px_5px_rgba(0,0,0,0.075)] cursor-pointer ${
                    editingId === patient.queueId
                      ? "bg-[#054239] border-[#054239]"
                      : "bg-[#ffffff] border-gray-300"
                  }`}
                  onClick={() => handleEdit(patient)}>
                  <div className='flex items-center justify-between mb-2'>
                    <div
                      className={`text-xl px-2 py-0 font-bold ${
                        editingId === patient.queueId
                          ? "bg-white text-[#054239]"
                          : "bg-[#054239] text-white"
                      }`}>
                      #{patient.queue.queueNumber}
                    </div>
                    <div className='flex flex-row text-xs px-4'>
                      <span
                        className={`text-xs px-4 ${
                          editingId === patient.queueId
                            ? "text-gray-300"
                            : "text-gray-400"
                        }`}>
                        ID : {patient.patientId}
                      </span>
                      <div
                        className={`text-xs ${
                          editingId === patient.queueId ? "text-white" : ""
                        }`}
                        style={
                          editingId !== patient.queueId
                            ? { color: "var(--dark)" }
                            : {}
                        }>
                        {new Date(patient.createdAt).toLocaleTimeString(
                          "ar-SA",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='space-y-1 text-sm'>
                    <div
                      className={
                        editingId === patient.queueId ? "text-white" : ""
                      }
                      style={
                        editingId !== patient.queueId
                          ? { color: "var(--dark)" }
                          : {}
                      }>
                      <span className='font-bold'> 🧑 الزوج : </span>
                      {patient.maleName != null ? (
                        `${patient.maleName} ${patient.maleLastName}`
                      ) : patient.maleStatus === "NOT_EXIST" ? (
                        <span
                          className={
                            editingId === patient.queueId
                              ? "text-red-300"
                              : "text-red-500"
                          }>
                          لا يوجد زوج
                        </span>
                      ) : patient.maleStatus === "OUT_OF_COUNTRY" ? (
                        <span
                          className={
                            editingId === patient.queueId
                              ? "text-red-300"
                              : "text-red-500"
                          }>
                          خارج القطر
                        </span>
                      ) : patient.maleStatus === "OUT_OF_PROVINCE" ? (
                        <span
                          className={
                            editingId === patient.queueId
                              ? "text-red-300"
                              : "text-red-500"
                          }>
                          خارج المحافظة
                        </span>
                      ) : (
                        "-"
                      )}
                    </div>
                    <div
                      className={
                        editingId === patient.queueId ? "text-white" : ""
                      }
                      style={
                        editingId !== patient.queueId
                          ? { color: "var(--dark)" }
                          : {}
                      }>
                      <span className='font-bold'>👩 الزوجة : </span>
                      {patient.femaleName != null ? (
                        `${patient.femaleName} ${patient.femaleLastName}`
                      ) : patient.femaleStatus === "NOT_EXIST" ? (
                        <span
                          className={
                            editingId === patient.queueId
                              ? "text-red-300"
                              : "text-red-500"
                          }>
                          لا يوجد زوجة
                        </span>
                      ) : patient.femaleStatus === "OUT_OF_COUNTRY" ? (
                        <span
                          className={
                            editingId === patient.queueId
                              ? "text-red-300"
                              : "text-red-500"
                          }>
                          خارج القطر
                        </span>
                      ) : patient.femaleStatus === "OUT_OF_PROVINCE" ? (
                        <span
                          className={
                            editingId === patient.queueId
                              ? "text-red-300"
                              : "text-red-500"
                          }>
                          خارج المحافظة
                        </span>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                  <div className='flex flex-row items-end justify-end w-full gap-2'>
                    {patient.queue.priority?.toString() === "1" ? (
                      <div>
                        <span className='text-[10px]  bg-orange-500 text-white px-2 py-1 rounded-md'>
                          مُستعجل
                        </span>
                      </div>
                    ) : null}
                    {patient.maleStatus === "LEGAL_INVITATION" ||
                    patient.femaleStatus === "LEGAL_INVITATION" ? (
                      <div>
                        <span
                          className={`text-[10px]  ${
                            editingId === patient.queueId
                              ? "bg-white text-[#054239]"
                              : "bg-[#054239] text-white"
                          } px-2 py-1 rounded-md`}>
                          دعوة شرعية
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal للأدوار الملغاة */}
      {showCancelledModal && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={() => setShowCancelledModal(false)}>
          <div
            className='bg-white rounded-lg shadow-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden'
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className='bg-red-600 text-white p-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold flex items-center gap-2'>
                🔄 الأدوار الملغاة اليوم ({cancelledQueues.length})
              </h2>
              <button
                onClick={() => setShowCancelledModal(false)}
                className='text-white hover:text-gray-200 text-2xl font-bold transition'>
                ×
              </button>
            </div>

            {/* Content */}
            <div className='p-4 overflow-y-auto max-h-[calc(90vh-80px)]'>
              {loadingCancelled ? (
                <div className='text-center py-8'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto'></div>
                  <p className='mt-4 text-gray-600'>جاري التحميل...</p>
                </div>
              ) : cancelledQueues.length === 0 ? (
                <div className='text-center py-12'>
                  <div className='text-6xl mb-4'>✅</div>
                  <p className='text-xl text-gray-600'>
                    لا توجد أدوار ملغاة اليوم
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {cancelledQueues.map((queue) => {
                    const receptionData = queue.ReceptionData;
                    const patientName =
                      receptionData?.maleName && receptionData?.maleLastName
                        ? `${receptionData.maleName} ${receptionData.maleLastName}`
                        : receptionData?.femaleName &&
                          receptionData?.femaleLastName
                        ? `${receptionData.femaleName} ${receptionData.femaleLastName}`
                        : queue.patient.name;

                    return (
                      <div
                        key={queue.id}
                        className='border-2 border-gray-300 rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-gray-50'>
                        <div className='flex items-center justify-between'>
                          {/* معلومات الدور */}
                          <div className='flex-1'>
                            <div className='flex items-center gap-3 mb-2'>
                              <span className='bg-red-600 text-white px-4 py-2 rounded-lg text-xl font-bold'>
                                #{queue.queueNumber}
                              </span>
                              <div>
                                <h3 className='text-lg font-bold text-gray-800'>
                                  {patientName}
                                </h3>
                                <p className='text-sm text-gray-600'>
                                  ID: {queue.patientId}
                                </p>
                              </div>
                            </div>

                            <div className='grid grid-cols-2 gap-2 text-sm mt-3'>
                              <div className='flex items-center gap-2'>
                                <span className='font-semibold text-gray-700'>
                                  المحطة:
                                </span>
                                <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                                  {queue.currentStation.name}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <span className='font-semibold text-gray-700'>
                                  الوقت:
                                </span>
                                <span className='text-gray-600'>
                                  {new Date(queue.createdAt).toLocaleTimeString(
                                    "ar-SA",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                              {queue.priority === 1 && (
                                <div className='col-span-2'>
                                  <span className='bg-orange-500 text-white px-2 py-1 rounded text-xs'>
                                    مُستعجل
                                  </span>
                                </div>
                              )}
                              {queue.notes && (
                                <div className='col-span-2'>
                                  <span className='font-semibold text-gray-700'>
                                    ملاحظات:
                                  </span>
                                  <p className='text-gray-600 text-xs mt-1'>
                                    {queue.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* زر إعادة الطباعة */}
                          <div className='mr-4'>
                            <button
                              onClick={() =>
                                handleReinstateQueue(
                                  queue.id,
                                  queue.queueNumber
                                )
                              }
                              className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition duration-200 shadow-lg hover:shadow-xl flex items-center gap-2'>
                              🖨️ إعادة طباعة
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='bg-gray-100 p-4 flex justify-end gap-3 border-t'>
              <button
                onClick={() => setShowCancelledModal(false)}
                className='bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200'>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionPage;
