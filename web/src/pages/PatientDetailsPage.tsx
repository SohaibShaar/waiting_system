/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import { API_BASE_URL } from "../services/api";

const API_URL = API_BASE_URL;

interface PatientData {
  id: number;
  queueId: number;
  patientId: number;
  completedAt: string;
  patient: {
    id: number;
    name: string;
  };
  ReceptionData: {
    maleName: string;
    maleLastName: string;
    maleFatherName: string;
    maleMotherName: string;
    maleNationalId: string;
    maleBirthPlace: string;
    maleRegistration: string;
    maleCountry: string;
    maleBirthDate: string;
    maleAge: number;
    maleStatus: string;
    femaleName: string;
    femaleLastName: string;
    femaleFatherName: string;
    femaleMotherName: string;
    femaleNationalId: string;
    femaleBirthPlace: string;
    femaleRegistration: string;
    femaleCountry: string;
    femaleBirthDate: string;
    femaleAge: number;
    femaleStatus: string;
    phoneNumber: string;
    notes: string;
  };
  AccountingData: {
    totalAmount: number;
    isPaid: boolean;
    notes: string;
  };
  LabData: {
    isMaleHealthy: string;
    isFemaleHealthy: string;
    maleNotes: string;
    femaleNotes: string;
    doctorName: string;
  };
  DoctorData: {
    maleBloodType: string;
    femaleBloodType: string;
    maleHIVstatus: string;
    femaleHIVstatus: string;
    maleHBSstatus: string;
    femaleHBSstatus: string;
    maleHBCstatus: string;
    femaleHBCstatus: string;
    maleHIVvalue: string;
    femaleHIVvalue: string;
    maleHBSvalue: string;
    femaleHBSvalue: string;
    maleHBCvalue: string;
    femaleHBCvalue: string;
    maleHemoglobinEnabled: boolean;
    femaleHemoglobinEnabled: boolean;
    maleHbS: string;
    maleHbF: string;
    maleHbA1c: string;
    maleHbA2: string;
    maleHbSc: string;
    maleHbD: string;
    maleHbE: string;
    maleHbC: string;
    femaleHbS: string;
    femaleHbF: string;
    femaleHbA1c: string;
    femaleHbA2: string;
    femaleHbSc: string;
    femaleHbD: string;
    femaleHbE: string;
    femaleHbC: string;
    maleNotes: string;
    femaleNotes: string;
    notes: string;
  };
}

const PatientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("reception");

  // Editable reception data
  const [editedReception, setEditedReception] = useState<any>({});

  // Editable doctor data
  const [editedDoctor, setEditedDoctor] = useState<any>({});

  useEffect(() => {
    loadPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/doctor/completed/${id}`);
      if (response.data.success) {
        setData(response.data.data);
        setEditedReception(response.data.data.ReceptionData || {});
        setEditedDoctor(response.data.data.DoctorData || {});
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
      alert("❌ خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!window.confirm("هل أنت متأكد من حفظ التعديلات؟")) {
      return;
    }

    // التحقق من فصيلة الدم إذا كان في تبويب الطبيب
    if (activeTab === "doctor") {
      if (
        !editedDoctor.maleBloodType &&
        data?.ReceptionData?.maleStatus !== "LEGAL_INVITATION" &&
        data?.ReceptionData?.maleStatus !== "NOT_EXIST"
      ) {
        alert("⚠️ يرجى إدخال فصيلة دم الزوج");
        return;
      }
      if (
        !editedDoctor.femaleBloodType &&
        data?.ReceptionData?.femaleStatus !== "LEGAL_INVITATION" &&
        data?.ReceptionData?.femaleStatus !== "NOT_EXIST"
      ) {
        alert("⚠️ يرجى إدخال فصيلة دم الزوجة");
        return;
      }
    }

    try {
      setSaving(true);

      // Save based on active tab
      if (activeTab === "reception") {
        await axios.put(`${API_URL}/doctor/completed/${id}`, editedReception);
      } else if (activeTab === "doctor") {
        await axios.put(
          `${API_URL}/doctor/completed/${id}/doctor`,
          editedDoctor
        );
      }

      alert("✅ تم حفظ التعديلات بنجاح!");
      loadPatientData();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("❌ خطأ في حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className='h-screen flex flex-col'
        style={{ backgroundColor: "var(--light)" }}>
        <Header title='تفاصيل المريض' icon='📋' />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-xl' style={{ color: "var(--primary)" }}>
            ⏳ جاري التحميل...
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className='h-screen flex flex-col'
        style={{ backgroundColor: "var(--light)" }}>
        <Header title='تفاصيل المريض' icon='📋' />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-xl text-red-600'>
            ❌ لم يتم العثور على البيانات
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className='min-h-screen flex flex-col'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='تفاصيل المريض' icon='📋' />

      <div className='flex-1 p-6 overflow-y-auto'>
        <div className='max-w-7xl mx-auto'>
          {/* Header Info */}
          <div
            className='card p-6 mb-6'
            style={{ backgroundColor: "var(--primary)" }}>
            <div className='flex justify-between items-center text-white'>
              <div>
                <h2 className='text-3xl font-bold mb-2'>
                  الدور #{data.queueId}
                </h2>
                <p className='text-lg opacity-90'>
                  رقم المريض: {data.patient.id}
                </p>
              </div>
              <div className='text-left'>
                <p className='text-sm opacity-75'>تاريخ الإكمال</p>
                <p className='text-lg'>
                  {new Date(data.completedAt).toLocaleDateString("ar-SY")}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className='card mb-6'>
            <div className='flex border-b overflow-x-auto'>
              <button
                onClick={() => setActiveTab("reception")}
                className={`px-6 py-3 font-semibold ${
                  activeTab === "reception"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-600"
                }`}>
                📝 بيانات الاستقبال
              </button>
              <button
                onClick={() => setActiveTab("accounting")}
                className={`px-6 py-3 font-semibold ${
                  activeTab === "accounting"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-600"
                }`}>
                💰 المحاسبة
              </button>
              <button
                onClick={() => setActiveTab("lab")}
                className={`px-6 py-3 font-semibold ${
                  activeTab === "lab"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-600"
                }`}>
                🩺 غرفة الفحص الطبي
              </button>
              <button
                onClick={() => setActiveTab("doctor")}
                className={`px-6 py-3 font-semibold ${
                  activeTab === "doctor"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-600"
                }`}>
                👩‍⚕️ الطبيبة
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className='card p-6'>
            {activeTab === "reception" && (
              <ReceptionTab
                data={editedReception}
                originalNotes={data.ReceptionData?.notes}
                onChange={setEditedReception}
              />
            )}
            {activeTab === "accounting" && (
              <AccountingTab data={data.AccountingData} />
            )}
            {activeTab === "lab" && <LabTab data={data.LabData} />}
            {activeTab === "doctor" && (
              <DoctorTab data={editedDoctor} onChange={setEditedDoctor} />
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex gap-4 mt-6'>
            {(activeTab === "reception" || activeTab === "doctor") && (
              <button
                onClick={handleSave}
                disabled={saving}
                className='btn-success px-8 py-3 text-lg disabled:opacity-50'>
                {saving ? "💾 جاري الحفظ..." : "💾 حفظ التعديلات"}
              </button>
            )}
            <button
              onClick={() => navigate("/doctor")}
              className='bg-gray-500 text-white hover:opacity-80 cursor-pointer rounded-lg px-8 py-3 text-lg'>
              ← رجوع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reception Tab Component
const ReceptionTab = ({
  data,
  originalNotes,
  onChange,
}: {
  data: any;
  originalNotes: string;
  onChange: (data: any) => void;
}) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NORMAL":
        return "عادي";
      case "LEGAL_INVITATION":
        return "دعوة شرعية";
      case "NOT_EXIST":
        return "غير موجود";
      case "OUT_OF_COUNTRY":
        return "خارج البلد";
      case "OUT_OF_PROVINCE":
        return "خارج المحافظة";
      default:
        return "عادي";
    }
  };

  return (
    <div className='space-y-8'>
      {/* Phone Number */}
      <div
        className='p-4 rounded-lg'
        style={{ backgroundColor: "var(--light)" }}>
        <label className='block text-sm font-semibold mb-2'>
          📞 رقم الهاتف
        </label>
        <input
          type='text'
          value={data.phoneNumber || ""}
          onChange={(e) => updateField("phoneNumber", e.target.value)}
          className='input-field w-full'
          placeholder='رقم الهاتف'
        />
      </div>

      {/* Male Data */}
      <div>
        <h3
          className='text-xl font-bold mb-4 pb-2 border-b-2'
          style={{ color: "var(--primary)" }}>
          👨 بيانات الخطيب
        </h3>

        {/* Male Status Badge */}
        <div className='mb-4'>
          <span
            className={`px-4 py-2 rounded-lg font-semibold ${
              data.maleStatus === "NORMAL"
                ? "bg-green-100 text-green-800"
                : data.maleStatus === "LEGAL_INVITATION"
                ? "bg-purple-100 text-purple-800"
                : "bg-orange-100 text-orange-800"
            }`}>
            الحالة: {getStatusLabel(data.maleStatus || "NORMAL")}
          </span>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-semibold mb-1'>الاسم</label>
            <input
              type='text'
              value={data.maleName || ""}
              onChange={(e) => updateField("maleName", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>الكنية</label>
            <input
              type='text'
              value={data.maleLastName || ""}
              onChange={(e) => updateField("maleLastName", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>اسم الأب</label>
            <input
              type='text'
              value={data.maleFatherName || ""}
              onChange={(e) => updateField("maleFatherName", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>اسم الأم</label>
            <input
              type='text'
              value={data.maleMotherName || ""}
              onChange={(e) => updateField("maleMotherName", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>
              الرقم الوطني
            </label>
            <input
              type='text'
              value={data.maleNationalId || ""}
              onChange={(e) => updateField("maleNationalId", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>
              مكان الولادة
            </label>
            <input
              type='text'
              value={data.maleBirthPlace || ""}
              onChange={(e) => updateField("maleBirthPlace", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>القيد</label>
            <input
              type='text'
              value={data.maleRegistration || ""}
              onChange={(e) => updateField("maleRegistration", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>الدولة</label>
            <input
              type='text'
              value={data.maleCountry || ""}
              onChange={(e) => updateField("maleCountry", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>
              تاريخ الولادة
            </label>
            <input
              type='date'
              value={
                data.maleBirthDate
                  ? new Date(data.maleBirthDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => updateField("maleBirthDate", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>العمر</label>
            <input
              type='number'
              value={data.maleAge || ""}
              onChange={(e) => updateField("maleAge", parseInt(e.target.value))}
              className='input-field w-full'
            />
          </div>
        </div>
      </div>

      {/* Female Data */}
      <div>
        <h3
          className='text-xl font-bold mb-4 pb-2 border-b-2'
          style={{ color: "var(--primary)" }}>
          👩 بيانات الخطيبة
        </h3>

        {/* Female Status Badge */}
        <div className='mb-4'>
          <span
            className={`px-4 py-2 rounded-lg font-semibold ${
              data.femaleStatus === "NORMAL"
                ? "bg-green-100 text-green-800"
                : data.femaleStatus === "LEGAL_INVITATION"
                ? "bg-purple-100 text-purple-800"
                : "bg-orange-100 text-orange-800"
            }`}>
            الحالة: {getStatusLabel(data.femaleStatus || "NORMAL")}
          </span>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-semibold mb-1'>الاسم</label>
            <input
              type='text'
              value={data.femaleName || ""}
              onChange={(e) => updateField("femaleName", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>الكنية</label>
            <input
              type='text'
              value={data.femaleLastName || ""}
              onChange={(e) => updateField("femaleLastName", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>اسم الأب</label>
            <input
              type='text'
              value={data.femaleFatherName || ""}
              onChange={(e) => updateField("femaleFatherName", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>اسم الأم</label>
            <input
              type='text'
              value={data.femaleMotherName || ""}
              onChange={(e) => updateField("femaleMotherName", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>
              الرقم الوطني
            </label>
            <input
              type='text'
              value={data.femaleNationalId || ""}
              onChange={(e) => updateField("femaleNationalId", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>
              مكان الولادة
            </label>
            <input
              type='text'
              value={data.femaleBirthPlace || ""}
              onChange={(e) => updateField("femaleBirthPlace", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>القيد</label>
            <input
              type='text'
              value={data.femaleRegistration || ""}
              onChange={(e) =>
                updateField("femaleRegistration", e.target.value)
              }
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>الدولة</label>
            <input
              type='text'
              value={data.femaleCountry || ""}
              onChange={(e) => updateField("femaleCountry", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>
              تاريخ الولادة
            </label>
            <input
              type='date'
              value={
                data.femaleBirthDate
                  ? new Date(data.femaleBirthDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => updateField("femaleBirthDate", e.target.value)}
              className='input-field w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>العمر</label>
            <input
              type='number'
              value={data.femaleAge || ""}
              onChange={(e) =>
                updateField("femaleAge", parseInt(e.target.value))
              }
              className='input-field w-full'
            />
          </div>
        </div>
      </div>

      {/* Reception Notes (Read-only) */}
      {originalNotes && (
        <div
          className='p-4 rounded-lg'
          style={{
            backgroundColor: "#fff3cd",
            borderLeft: "4px solid #ffc107",
          }}>
          <h4 className='font-semibold mb-2 text-sm'>
            📝 ملاحظات الاستقبال (للعرض فقط)
          </h4>
          <p className='text-sm text-gray-700'>{originalNotes}</p>
        </div>
      )}
    </div>
  );
};

// Accounting Tab Component
const AccountingTab = ({ data }: { data: any }) => {
  if (!data) {
    return (
      <div className='text-center py-12 text-gray-500'>
        لا توجد بيانات محاسبة
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-6'>
        <div
          className='p-6 rounded-lg text-center'
          style={{ backgroundColor: "var(--light)" }}>
          <div className='text-4xl mb-2'>💰</div>
          <div className='text-sm text-gray-600 mb-1'>المبلغ الكلي</div>
          <div
            className='text-2xl font-bold'
            style={{ color: "var(--primary)" }}>
            {data.totalAmount || 0} ل.س
          </div>
        </div>
        <div
          className='p-6 rounded-lg text-center'
          style={{ backgroundColor: "var(--light)" }}>
          <div className='text-4xl mb-2'>{data.isPaid ? "✅" : "❌"}</div>
          <div className='text-sm text-gray-600 mb-1'>حالة الدفع</div>
          <div
            className='text-2xl font-bold'
            style={{ color: data.isPaid ? "green" : "red" }}>
            {data.isPaid ? "مدفوع" : "غير مدفوع"}
          </div>
        </div>
      </div>

      {data.notes && (
        <div
          className='p-4 rounded-lg'
          style={{ backgroundColor: "var(--light)" }}>
          <h4 className='font-semibold mb-2'>📝 ملاحظات المحاسبة</h4>
          <p>{data.notes}</p>
        </div>
      )}
    </div>
  );
};

// Lab Tab Component
const LabTab = ({ data }: { data: any }) => {
  if (!data) {
    return (
      <div className='text-center py-12 text-gray-500'>
        لا توجد بيانات مختبر
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Doctor Name */}
      <div
        className='p-4 rounded-lg text-center'
        style={{ backgroundColor: "var(--light)" }}>
        <div className='text-sm text-gray-600 mb-1'>اسم الطبيب</div>
        <div className='text-xl font-bold' style={{ color: "var(--primary)" }}>
          {data.doctorName || "غير محدد"}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-6'>
        {/* Male Health Status */}
        <div
          className='p-6 rounded-lg'
          style={{
            backgroundColor:
              data.isMaleHealthy === "HEALTHY" ? "#d4edda" : "#f8d7da",
          }}>
          <h4 className='font-semibold mb-3'>👨 حالة الخطيب</h4>
          <div className='text-3xl font-bold mb-2'>
            {data.isMaleHealthy === "HEALTHY" ? (
              <span className='text-green-700'>✓ سليم</span>
            ) : (
              <span className='text-red-700'>✗ غير سليم</span>
            )}
          </div>
          <div className='text-sm mt-3'>
            <strong>ملاحظات:</strong>
            <p className='mt-1'>{data.maleNotes || "لا توجد ملاحظات"}</p>
          </div>
        </div>

        {/* Female Health Status */}
        <div
          className='p-6 rounded-lg'
          style={{
            backgroundColor:
              data.isFemaleHealthy === "HEALTHY" ? "#d4edda" : "#f8d7da",
          }}>
          <h4 className='font-semibold mb-3'>👩 حالة الخطيبة</h4>
          <div className='text-3xl font-bold mb-2'>
            {data.isFemaleHealthy === "HEALTHY" ? (
              <span className='text-green-700'>✓ سليمة</span>
            ) : (
              <span className='text-red-700'>✗ غير سليمة</span>
            )}
          </div>
          <div className='text-sm mt-3'>
            <strong>ملاحظات:</strong>
            <p className='mt-1'>{data.femaleNotes || "لا توجد ملاحظات"}</p>
          </div>
        </div>
      </div>

      {/* General Lab Notes */}
      <div
        className='p-4 rounded-lg'
        style={{ backgroundColor: "var(--light)" }}>
        <h4 className='font-semibold mb-2'>📝 ملاحظات عامة</h4>
        <p>{data.notes || "لا توجد ملاحظات عامة"}</p>
      </div>
    </div>
  );
};

// Doctor Tab Component
const DoctorTab = ({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) => {
  if (!data) {
    return (
      <div className='text-center py-12 text-gray-500'>لا توجد بيانات طبيب</div>
    );
  }

  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className='space-y-8'>
      {/* Blood Types */}
      <div className='grid grid-cols-2 gap-6'>
        <div
          className='p-4 rounded-lg'
          style={{ backgroundColor: "var(--light)" }}>
          <h4 className='font-semibold mb-2'>👨 فصيلة دم الخطيب *</h4>
          <select
            value={data.maleBloodType || ""}
            onChange={(e) => updateField("maleBloodType", e.target.value)}
            required
            className='input-field w-full text-lg font-bold'
            style={{
              color: "var(--primary)",
              borderColor: !data.maleBloodType ? "#ef4444" : undefined,
              borderWidth: !data.maleBloodType ? "2px" : undefined,
            }}>
            <option value=''>اختر الفصيلة *</option>
            {bloodTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {!data.maleBloodType && (
            <span className='text-xs text-red-500 mt-1 block'>
              هذا الحقل إجباري
            </span>
          )}
        </div>
        <div
          className='p-4 rounded-lg'
          style={{ backgroundColor: "var(--light)" }}>
          <h4 className='font-semibold mb-2'>👩 فصيلة دم الخطيبة *</h4>
          <select
            value={data.femaleBloodType || ""}
            onChange={(e) => updateField("femaleBloodType", e.target.value)}
            required
            className='input-field w-full text-lg font-bold'
            style={{
              color: "var(--primary)",
              borderColor: !data.femaleBloodType ? "#ef4444" : undefined,
              borderWidth: !data.femaleBloodType ? "2px" : undefined,
            }}>
            <option value=''>اختر الفصيلة *</option>
            {bloodTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {!data.femaleBloodType && (
            <span className='text-xs text-red-500 mt-1 block'>
              هذا الحقل إجباري
            </span>
          )}
        </div>
      </div>

      {/* Disease Tests */}
      <div className='grid grid-cols-2 gap-6'>
        {/* Male Tests */}
        <div>
          <h4
            className='font-semibold mb-3 pb-2 border-b'
            style={{ color: "var(--primary)" }}>
            👨 فحوصات الخطيب
          </h4>
          <div className='space-y-3'>
            {/* HIV Test */}
            <div className='p-3 rounded bg-gray-50'>
              <div className='flex justify-between items-center mb-2'>
                <span className='font-semibold'>HIV:</span>
                <select
                  value={data.maleHIVstatus || "NEGATIVE"}
                  onChange={(e) => updateField("maleHIVstatus", e.target.value)}
                  className='input-field text-sm py-1 px-3'>
                  <option value='NEGATIVE'>سلبي</option>
                  <option value='POSITIVE'>إيجابي</option>
                </select>
              </div>
              {data.maleHIVstatus === "POSITIVE" && (
                <input
                  type='text'
                  value={data.maleHIVvalue || ""}
                  onChange={(e) => updateField("maleHIVvalue", e.target.value)}
                  placeholder='القيمة الرقمية'
                  className='input-field text-sm py-1 w-full'
                />
              )}
            </div>

            {/* HBS Test */}
            <div className='p-3 rounded bg-gray-50'>
              <div className='flex justify-between items-center mb-2'>
                <span className='font-semibold'>HBV:</span>
                <select
                  value={data.maleHBSstatus || "NEGATIVE"}
                  onChange={(e) => updateField("maleHBSstatus", e.target.value)}
                  className='input-field text-sm py-1 px-3'>
                  <option value='NEGATIVE'>سلبي</option>
                  <option value='POSITIVE'>إيجابي</option>
                </select>
              </div>
              {data.maleHBSstatus === "POSITIVE" && (
                <input
                  type='text'
                  value={data.maleHBSvalue || ""}
                  onChange={(e) => updateField("maleHBSvalue", e.target.value)}
                  placeholder='القيمة الرقمية'
                  className='input-field text-sm py-1 w-full'
                />
              )}
            </div>

            {/* HBC Test */}
            <div className='p-3 rounded bg-gray-50'>
              <div className='flex justify-between items-center mb-2'>
                <span className='font-semibold'>HCV:</span>
                <select
                  value={data.maleHBCstatus || "NEGATIVE"}
                  onChange={(e) => updateField("maleHBCstatus", e.target.value)}
                  className='input-field text-sm py-1 px-3'>
                  <option value='NEGATIVE'>سلبي</option>
                  <option value='POSITIVE'>إيجابي</option>
                </select>
              </div>
              {data.maleHBCstatus === "POSITIVE" && (
                <input
                  type='text'
                  value={data.maleHBCvalue || ""}
                  onChange={(e) => updateField("maleHBCvalue", e.target.value)}
                  placeholder='القيمة الرقمية'
                  className='input-field text-sm py-1 w-full'
                />
              )}
            </div>
          </div>

          {/* Hemoglobin Tests */}
          <div className='mt-4'>
            <div className='flex items-center gap-2 mb-2'>
              <input
                type='checkbox'
                id='maleHemoglobinEnabled'
                checked={data.maleHemoglobinEnabled || false}
                onChange={(e) =>
                  updateField("maleHemoglobinEnabled", e.target.checked)
                }
                className='w-4 h-4'
              />
              <label
                htmlFor='maleHemoglobinEnabled'
                className='font-semibold text-sm'>
                الخضاب الشاذة
              </label>
            </div>
            {data.maleHemoglobinEnabled && (
              <div className='grid grid-cols-2 gap-2 mt-2'>
                <div>
                  <label className='text-xs font-semibold'>HbS</label>
                  <input
                    type='text'
                    value={data.maleHbS || ""}
                    onChange={(e) => updateField("maleHbS", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbF</label>
                  <input
                    type='text'
                    value={data.maleHbF || ""}
                    onChange={(e) => updateField("maleHbF", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbA1c</label>
                  <input
                    type='text'
                    value={data.maleHbA1c || ""}
                    onChange={(e) => updateField("maleHbA1c", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbA2</label>
                  <input
                    type='text'
                    value={data.maleHbA2 || ""}
                    onChange={(e) => updateField("maleHbA2", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbSc</label>
                  <input
                    type='text'
                    value={data.maleHbSc || ""}
                    onChange={(e) => updateField("maleHbSc", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbD</label>
                  <input
                    type='text'
                    value={data.maleHbD || ""}
                    onChange={(e) => updateField("maleHbD", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbE</label>
                  <input
                    type='text'
                    value={data.maleHbE || ""}
                    onChange={(e) => updateField("maleHbE", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbC</label>
                  <input
                    type='text'
                    value={data.maleHbC || ""}
                    onChange={(e) => updateField("maleHbC", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
              </div>
            )}
          </div>

          <div className='mt-3'>
            <label className='font-semibold text-sm block mb-1'>ملاحظات:</label>
            <textarea
              value={data.maleNotes || ""}
              onChange={(e) => updateField("maleNotes", e.target.value)}
              className='input-field text-sm w-full'
              rows={3}
              placeholder='ملاحظات الخطيب...'
            />
          </div>
        </div>

        {/* Female Tests */}
        <div>
          <h4
            className='font-semibold mb-3 pb-2 border-b'
            style={{ color: "var(--primary)" }}>
            👩 فحوصات الخطيبة
          </h4>
          <div className='space-y-3'>
            {/* HIV Test */}
            <div className='p-3 rounded bg-gray-50'>
              <div className='flex justify-between items-center mb-2'>
                <span className='font-semibold'>HIV:</span>
                <select
                  value={data.femaleHIVstatus || "NEGATIVE"}
                  onChange={(e) =>
                    updateField("femaleHIVstatus", e.target.value)
                  }
                  className='input-field text-sm py-1 px-3'>
                  <option value='NEGATIVE'>سلبي</option>
                  <option value='POSITIVE'>إيجابي</option>
                </select>
              </div>
              {data.femaleHIVstatus === "POSITIVE" && (
                <input
                  type='text'
                  value={data.femaleHIVvalue || ""}
                  onChange={(e) =>
                    updateField("femaleHIVvalue", e.target.value)
                  }
                  placeholder='القيمة الرقمية'
                  className='input-field text-sm py-1 w-full'
                />
              )}
            </div>

            {/* HBS Test */}
            <div className='p-3 rounded bg-gray-50'>
              <div className='flex justify-between items-center mb-2'>
                <span className='font-semibold'>HBV:</span>
                <select
                  value={data.femaleHBSstatus || "NEGATIVE"}
                  onChange={(e) =>
                    updateField("femaleHBSstatus", e.target.value)
                  }
                  className='input-field text-sm py-1 px-3'>
                  <option value='NEGATIVE'>سلبي</option>
                  <option value='POSITIVE'>إيجابي</option>
                </select>
              </div>
              {data.femaleHBSstatus === "POSITIVE" && (
                <input
                  type='text'
                  value={data.femaleHBSvalue || ""}
                  onChange={(e) =>
                    updateField("femaleHBSvalue", e.target.value)
                  }
                  placeholder='القيمة الرقمية'
                  className='input-field text-sm py-1 w-full'
                />
              )}
            </div>

            {/* HBC Test */}
            <div className='p-3 rounded bg-gray-50'>
              <div className='flex justify-between items-center mb-2'>
                <span className='font-semibold'>HCV:</span>
                <select
                  value={data.femaleHBCstatus || "NEGATIVE"}
                  onChange={(e) =>
                    updateField("femaleHBCstatus", e.target.value)
                  }
                  className='input-field text-sm py-1 px-3'>
                  <option value='NEGATIVE'>سلبي</option>
                  <option value='POSITIVE'>إيجابي</option>
                </select>
              </div>
              {data.femaleHBCstatus === "POSITIVE" && (
                <input
                  type='text'
                  value={data.femaleHBCvalue || ""}
                  onChange={(e) =>
                    updateField("femaleHBCvalue", e.target.value)
                  }
                  placeholder='القيمة الرقمية'
                  className='input-field text-sm py-1 w-full'
                />
              )}
            </div>
          </div>

          {/* Hemoglobin Tests */}
          <div className='mt-4'>
            <div className='flex items-center gap-2 mb-2'>
              <input
                type='checkbox'
                id='femaleHemoglobinEnabled'
                checked={data.femaleHemoglobinEnabled || false}
                onChange={(e) =>
                  updateField("femaleHemoglobinEnabled", e.target.checked)
                }
                className='w-4 h-4'
              />
              <label
                htmlFor='femaleHemoglobinEnabled'
                className='font-semibold text-sm'>
                الخضاب الشاذة
              </label>
            </div>
            {data.femaleHemoglobinEnabled && (
              <div className='grid grid-cols-2 gap-2 mt-2'>
                <div>
                  <label className='text-xs font-semibold'>HbS</label>
                  <input
                    type='text'
                    value={data.femaleHbS || ""}
                    onChange={(e) => updateField("femaleHbS", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbF</label>
                  <input
                    type='text'
                    value={data.femaleHbF || ""}
                    onChange={(e) => updateField("femaleHbF", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbA1c</label>
                  <input
                    type='text'
                    value={data.femaleHbA1c || ""}
                    onChange={(e) => updateField("femaleHbA1c", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbA2</label>
                  <input
                    type='text'
                    value={data.femaleHbA2 || ""}
                    onChange={(e) => updateField("femaleHbA2", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbSc</label>
                  <input
                    type='text'
                    value={data.femaleHbSc || ""}
                    onChange={(e) => updateField("femaleHbSc", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbD</label>
                  <input
                    type='text'
                    value={data.femaleHbD || ""}
                    onChange={(e) => updateField("femaleHbD", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbE</label>
                  <input
                    type='text'
                    value={data.femaleHbE || ""}
                    onChange={(e) => updateField("femaleHbE", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold'>HbC</label>
                  <input
                    type='text'
                    value={data.femaleHbC || ""}
                    onChange={(e) => updateField("femaleHbC", e.target.value)}
                    className='input-field text-sm py-1 w-full'
                  />
                </div>
              </div>
            )}
          </div>

          <div className='mt-3'>
            <label className='font-semibold text-sm block mb-1'>ملاحظات:</label>
            <textarea
              value={data.femaleNotes || ""}
              onChange={(e) => updateField("femaleNotes", e.target.value)}
              className='input-field text-sm w-full'
              rows={3}
              placeholder='ملاحظات الخطيبة...'
            />
          </div>
        </div>
      </div>

      {/* General Notes */}
      <div
        className='p-4 rounded-lg'
        style={{ backgroundColor: "var(--light)" }}>
        <h4 className='font-semibold mb-2'>📝 التقرير النهائي والتوصيات</h4>
        <textarea
          value={data.notes || ""}
          onChange={(e) => updateField("notes", e.target.value)}
          className='input-field w-full'
          rows={4}
          placeholder='التقرير النهائي والتوصيات...'
        />
      </div>
    </div>
  );
};

export default PatientDetailsPage;
