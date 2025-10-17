/* eslint-disable no-useless-escape */
import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import { useQueueUpdates } from "../hooks/useQueueUpdates";
import printQueueNumber from "../utils/queuePrinter";

const API_URL = "http://localhost:3003/api";

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

      <div className='flex-1 flex overflow-hidden'>
        {/* Main Form Area - 65% */}
        <div className='flex-1 overflow-y-auto p-6'>
          <div className='card h-full'>
            <div className='card-header mb-4 flex items-center justify-between'>
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

            <form
              onSubmit={handleSubmit}
              className='flex flex-col gap-1 items-stretch space-y-4 pb-4'>
              {/* Male Data - Compact Grid */}
              <div
                className=' p-3 rounded-lg'
                style={{ backgroundColor: "var(--light)" }}>
                <h3
                  className='text-sm font-bold mb-3'
                  style={{ color: "var(--primary)" }}>
                  👨 بيانات الزوج :
                </h3>
                <div className='grid grid-cols-3 gap-3 mb-3'>
                  <select
                    name='maleStatus'
                    value={formData.maleStatus}
                    onChange={handleInputChange}
                    className='input-field text-sm py-3 col-span-3'
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
                {/* إظهار الحقول فقط إذا كانت الحالة NORMAL أو LEGAL_INVITATION */}
                {(formData.maleStatus === "NORMAL" ||
                  formData.maleStatus === "LEGAL_INVITATION") && (
                  <div className='grid grid-cols-3 gap-3'>
                    <input
                      type='text'
                      name='maleName'
                      value={formData.maleName}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='الاسم الأول *'
                      required
                    />
                    <input
                      type='text'
                      name='maleLastName'
                      value={formData.maleLastName}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='اسم العائلة *'
                      required
                    />
                    <input
                      type='text'
                      name='maleFatherName'
                      value={formData.maleFatherName}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='اسم الأب *'
                      required
                    />
                    <input
                      type='date'
                      name='maleBirthDate'
                      value={formData.maleBirthDate}
                      onChange={handleInputChange}
                      onPaste={(e) => handleDatePaste(e, "maleBirthDate")}
                      className='input-field text-sm py-3'
                      placeholder='تاريخ الميلاد (dd/mm/yyyy)'
                      required
                    />
                    <input
                      type='text'
                      name='maleNationalId'
                      value={formData.maleNationalId}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='الرقم الوطني *'
                      required
                    />

                    <input
                      type='text'
                      name='maleBirthPlace'
                      value={formData.maleBirthPlace}
                      onChange={handleInputChange}
                      onBlur={(e) => handleBirthPlaceBlur(e, "maleBirthPlace")}
                      className='input-field text-sm py-3'
                      placeholder='مكان الولادة'
                    />
                    <input
                      type='text'
                      name='maleCountry'
                      value={formData.maleCountry}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='البلد'
                    />
                    <input
                      tabIndex={-1}
                      type='text'
                      name='maleRegistration'
                      value={formData.maleRegistration}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='القيد'
                    />
                    <input
                      tabIndex={-1}
                      type='number'
                      name='maleAge'
                      value={formData.maleAge}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3 bg-gray-100'
                      placeholder='العمر (تلقائي) *'
                      readOnly
                      required
                    />
                  </div>
                )}
              </div>

              {/* Female Data - Compact Grid */}
              <div
                className=' p-3 rounded-lg'
                style={{ backgroundColor: "var(--light)" }}>
                <h3
                  className='text-sm font-bold mb-3'
                  style={{ color: "var(--primary)" }}>
                  👩 بيانات الزوجة :
                </h3>
                <div className='grid grid-cols-3 gap-3 mb-3'>
                  <select
                    tabIndex={-1}
                    name='femaleStatus'
                    value={formData.femaleStatus}
                    onChange={handleInputChange}
                    className='input-field text-sm py-3 col-span-3'
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

                {/* إظهار الحقول فقط إذا كانت الحالة NORMAL أو LEGAL_INVITATION */}
                {(formData.femaleStatus === "NORMAL" ||
                  formData.femaleStatus === "LEGAL_INVITATION") && (
                  <div className='grid grid-cols-3 gap-3'>
                    <input
                      type='text'
                      name='femaleName'
                      value={formData.femaleName}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='الاسم الأول *'
                      required
                    />
                    <input
                      type='text'
                      name='femaleLastName'
                      value={formData.femaleLastName}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='اسم العائلة *'
                      required
                    />
                    <input
                      type='text'
                      name='femaleFatherName'
                      value={formData.femaleFatherName}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='اسم الأب *'
                      required
                    />
                    <input
                      type='date'
                      name='femaleBirthDate'
                      value={formData.femaleBirthDate}
                      onChange={handleInputChange}
                      onPaste={(e) => handleDatePaste(e, "femaleBirthDate")}
                      className='input-field text-sm py-3'
                      placeholder='تاريخ الميلاد (dd/mm/yyyy)'
                      required
                    />
                    <input
                      type='text'
                      name='femaleNationalId'
                      value={formData.femaleNationalId}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='الرقم الوطني *'
                      required
                    />

                    <input
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
                    <input
                      type='text'
                      name='femaleCountry'
                      value={formData.femaleCountry}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='البلد'
                    />
                    <input
                      tabIndex={-1}
                      type='text'
                      name='femaleRegistration'
                      value={formData.femaleRegistration}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3'
                      placeholder='القيد'
                    />
                    <input
                      tabIndex={-1}
                      type='number'
                      name='femaleAge'
                      value={formData.femaleAge}
                      onChange={handleInputChange}
                      className='input-field text-sm py-3 bg-gray-100'
                      placeholder='العمر (تلقائي) *'
                      readOnly
                      required
                    />
                  </div>
                )}
              </div>

              {/* Additional Info - Compact */}
              <div className='grid grid-cols-3 gap-4'>
                <input
                  tabIndex={-1}
                  type='tel'
                  name='phoneNumber'
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className='input-field text-sm py-3'
                  placeholder='رقم الهاتف'
                  required
                />

                <textarea
                  tabIndex={-1}
                  name='notes'
                  value={formData.notes}
                  onChange={handleInputChange}
                  className='input-field text-sm py-3'
                  placeholder='ملاحظات'
                  rows={1}
                />
                <select
                  name='priority'
                  value={formData.priority}
                  onChange={handleInputChange}
                  className='input-field text-sm py-3'>
                  <option value='0'>أولوية عادية</option>
                  <option value='1'>مُستعجل</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className='flex justify-center'>
                <button
                  id='stopHere'
                  type='submit'
                  disabled={loading}
                  className='btn-primary px-8 py-2 text-base disabled:opacity-50'>
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

        {/* Sidebar - 35% */}
        <div
          className='w-96 border-r overflow-hidden'
          style={{ borderColor: "var(--light)" }}>
          <div className='h-full flex flex-col'>
            <div
              className='p-3 font-bold text-white text-center'
              style={{ backgroundColor: "#988561" }}>
              <div className='text-base'>
                المراجعون المضافون اليوم ({todayPatients.length})
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
                    className='p-3 rounded-lg border transition duration-200 hover:shadow-md cursor-pointer'
                    style={{
                      backgroundColor:
                        editingId === patient.queueId
                          ? "var(--light)"
                          : "var(--white)",
                      borderColor: "var(--light)",
                    }}
                    onClick={() => handleEdit(patient)}>
                    <div className='flex items-center justify-between mb-2'>
                      <div
                        className='text-xl font-bold'
                        style={{ color: "var(--primary)" }}>
                        #{patient.queue.queueNumber}
                      </div>
                      <div className='flex flex-row text-xs px-4 text-gray-400'>
                        <span className='text-xs px-4 text-gray-400'>
                          ID : {patient.patientId}
                        </span>
                        <div
                          className='text-xs'
                          style={{ color: "var(--dark)" }}>
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
                      <div style={{ color: "var(--dark)" }}>
                        <span className='font-bold'> 🧑 الزوج : </span>
                        {patient.maleName != null ? (
                          `${patient.maleName} ${patient.maleLastName}`
                        ) : patient.maleStatus === "NOT_EXIST" ? (
                          <span className='text-red-500'>لا يوجد زوج</span>
                        ) : patient.maleStatus === "OUT_OF_COUNTRY" ? (
                          <span className='text-red-500'>خارج القطر</span>
                        ) : patient.maleStatus === "OUT_OF_PROVINCE" ? (
                          <span className='text-red-500'>خارج المحافظة</span>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div style={{ color: "var(--dark)" }}>
                        <span className='font-bold'>👩 الزوجة : </span>
                        {patient.femaleName != null ? (
                          `${patient.femaleName} ${patient.femaleLastName}`
                        ) : patient.femaleStatus === "NOT_EXIST" ? (
                          <span className='text-red-500'>لا يوجد زوجة</span>
                        ) : patient.femaleStatus === "OUT_OF_COUNTRY" ? (
                          <span className='text-red-500'>خارج القطر</span>
                        ) : patient.femaleStatus === "OUT_OF_PROVINCE" ? (
                          <span className='text-red-500'>خارج المحافظة</span>
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
                          <span className='text-[10px]  bg-[#054239] text-white px-2 py-1 rounded-md'>
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
      </div>
    </div>
  );
};

export default ReceptionPage;
