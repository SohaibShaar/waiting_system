import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import { useQueueUpdates } from "../hooks/useQueueUpdates";

const API_URL = "http://localhost:3003/api";

interface ReceptionData {
  id: number;
  queueId: number;
  maleName: string;
  maleLastName: string;
  maleFatherName: string;
  maleBirthDate: string;
  maleNationalId: string;
  maleAge: number;
  femaleName: string;
  femaleLastName: string;
  femaleFatherName: string;
  femaleBirthDate: string;
  femaleNationalId: string;
  femaleAge: number;
  phoneNumber?: string;
  notes?: string;
  createdAt: string;
  queue: {
    queueNumber: number;
    patient: {
      name: string;
    };
  };
}

const ReceptionPage = () => {
  const [formData, setFormData] = useState({
    maleName: "",
    maleLastName: "",
    maleFatherName: "",
    maleBirthDate: "",
    maleNationalId: "",
    maleAge: "",
    femaleName: "",
    femaleLastName: "",
    femaleFatherName: "",
    femaleBirthDate: "",
    femaleNationalId: "",
    femaleAge: "",
    phoneNumber: "",
    notes: "",
    priority: "0",
  });

  const [todayPatients, setTodayPatients] = useState<ReceptionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        maleBirthDate: new Date(formData.maleBirthDate).toISOString(),
        femaleBirthDate: new Date(formData.femaleBirthDate).toISOString(),
        maleAge: parseInt(formData.maleAge),
        femaleAge: parseInt(formData.femaleAge),
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
          resetForm();
          fetchTodayPatients();
        }
      } else {
        const response = await axios.post(`${API_URL}/reception`, dataToSend);
        if (response.data.success) {
          alert(`✅ تم إنشاء الدور #${response.data.queueNumber} بنجاح!`);
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
      maleName: "",
      maleLastName: "",
      maleFatherName: "",
      maleBirthDate: "",
      maleNationalId: "",
      maleAge: "",
      femaleName: "",
      femaleLastName: "",
      femaleFatherName: "",
      femaleBirthDate: "",
      femaleNationalId: "",
      femaleAge: "",
      phoneNumber: "",
      notes: "",
      priority: "0",
    });
  };

  const handleEdit = (patient: ReceptionData) => {
    setEditingId(patient.queueId);
    setFormData({
      maleName: patient.maleName,
      maleLastName: patient.maleLastName,
      maleFatherName: patient.maleFatherName,
      maleBirthDate: new Date(patient.maleBirthDate)
        .toISOString()
        .split("T")[0],
      maleNationalId: patient.maleNationalId,
      maleAge: patient.maleAge.toString(),
      femaleName: patient.femaleName,
      femaleLastName: patient.femaleLastName,
      femaleFatherName: patient.femaleFatherName,
      femaleBirthDate: new Date(patient.femaleBirthDate)
        .toISOString()
        .split("T")[0],
      femaleNationalId: patient.femaleNationalId,
      femaleAge: patient.femaleAge.toString(),
      phoneNumber: patient.phoneNumber || "",
      notes: patient.notes || "",
      priority: "0",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  return (
    <div
      className='h-screen flex flex-col overflow-hidden'
      style={{ backgroundColor: "var(--light)" }}>
      <Header title='محطة الاستقبال' icon='📝' />

      <div className='flex-1 flex overflow-hidden'>
        {/* Main Form Area - 65% */}
        <div className='flex-1 overflow-y-auto p-6'>
          <div className='card h-full'>
            <div className='card-header mb-4'>
              {editingId ? "تعديل بيانات المريض" : "إضافة مريض جديد"}
              {editingId && (
                <button
                  type='button'
                  onClick={handleCancelEdit}
                  className='mr-4 px-3 py-1 rounded-lg text-sm font-semibold transition duration-200'
                  style={{
                    backgroundColor: "var(--dark)",
                    color: "var(--white)",
                  }}>
                  ✖ إلغاء
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Male Data - Compact Grid */}
              <div
                className='p-3 rounded-lg'
                style={{ backgroundColor: "var(--light)" }}>
                <h3
                  className='text-sm font-semibold mb-3'
                  style={{ color: "var(--primary)" }}>
                  👨 بيانات الزوج
                </h3>
                <div className='grid grid-cols-3 gap-3'>
                  <input
                    type='text'
                    name='maleName'
                    value={formData.maleName}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='الاسم الأول *'
                    required
                  />
                  <input
                    type='text'
                    name='maleLastName'
                    value={formData.maleLastName}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='اسم العائلة *'
                    required
                  />
                  <input
                    type='text'
                    name='maleFatherName'
                    value={formData.maleFatherName}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='اسم الأب *'
                    required
                  />
                  <input
                    type='date'
                    name='maleBirthDate'
                    value={formData.maleBirthDate}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    required
                  />
                  <input
                    type='text'
                    name='maleNationalId'
                    value={formData.maleNationalId}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='الرقم الوطني *'
                    required
                  />
                  <input
                    type='number'
                    name='maleAge'
                    value={formData.maleAge}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='العمر *'
                    required
                  />
                </div>
              </div>

              {/* Female Data - Compact Grid */}
              <div
                className='p-3 rounded-lg'
                style={{ backgroundColor: "var(--light)" }}>
                <h3
                  className='text-sm font-semibold mb-3'
                  style={{ color: "var(--secondary)" }}>
                  👩 بيانات الزوجة
                </h3>
                <div className='grid grid-cols-3 gap-3'>
                  <input
                    type='text'
                    name='femaleName'
                    value={formData.femaleName}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='الاسم الأول *'
                    required
                  />
                  <input
                    type='text'
                    name='femaleLastName'
                    value={formData.femaleLastName}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='اسم العائلة *'
                    required
                  />
                  <input
                    type='text'
                    name='femaleFatherName'
                    value={formData.femaleFatherName}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='اسم الأب *'
                    required
                  />
                  <input
                    type='date'
                    name='femaleBirthDate'
                    value={formData.femaleBirthDate}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    required
                  />
                  <input
                    type='text'
                    name='femaleNationalId'
                    value={formData.femaleNationalId}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='الرقم الوطني *'
                    required
                  />
                  <input
                    type='number'
                    name='femaleAge'
                    value={formData.femaleAge}
                    onChange={handleInputChange}
                    className='input-field text-sm py-2'
                    placeholder='العمر *'
                    required
                  />
                </div>
              </div>

              {/* Additional Info - Compact */}
              <div className='grid grid-cols-3 gap-3'>
                <input
                  type='tel'
                  name='phoneNumber'
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className='input-field text-sm py-2'
                  placeholder='رقم الهاتف'
                />
                <select
                  name='priority'
                  value={formData.priority}
                  onChange={handleInputChange}
                  className='input-field text-sm py-2'>
                  <option value='0'>أولوية عادية</option>
                  <option value='1'>أولوية عالية</option>
                </select>
                <textarea
                  name='notes'
                  value={formData.notes}
                  onChange={handleInputChange}
                  className='input-field text-sm py-2'
                  placeholder='ملاحظات'
                  rows={1}
                />
              </div>

              {/* Submit Button */}
              <div className='flex justify-center pt-2'>
                <button
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
              style={{ backgroundColor: "var(--primary)" }}>
              <div className='text-base'>
                المرضى المضافون اليوم ({todayPatients.length})
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
                      <div className='text-xs' style={{ color: "var(--dark)" }}>
                        {new Date(patient.createdAt).toLocaleTimeString(
                          "ar-SA",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                    <div className='space-y-1 text-sm'>
                      <div style={{ color: "var(--dark)" }}>
                        <span className='font-semibold'>👨 </span>
                        {patient.maleName} {patient.maleLastName}
                      </div>
                      <div style={{ color: "var(--dark)" }}>
                        <span className='font-semibold'>👩 </span>
                        {patient.femaleName} {patient.femaleLastName}
                      </div>
                      {patient.phoneNumber && (
                        <div
                          className='text-xs'
                          style={{ color: "var(--secondary)" }}>
                          📱 {patient.phoneNumber}
                        </div>
                      )}
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
