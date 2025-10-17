import { useEffect, useState } from "react";
import axios from "axios";
import { useQueueUpdates } from "../hooks/useQueueUpdates";

const API_URL = "http://localhost:3003/api";

interface QueueItem {
  id: number;
  queueNumber: number;
  patientId: number;
  status: string;
  priority: number;
  currentStation: {
    id: number;
    name: string;
    displayNumber: number;
  } | null;
  patient: {
    id: number;
    name: string;
    phoneNumber?: string;
    nationalId?: string;
  };
  ReceptionData?: {
    id: number;
    patientId: number;
    maleName: string;
    maleLastName: string;
    femaleName: string;
    femaleLastName: string;
    phoneNumber?: string;
    femaleStatus: string;
    maleStatus: string;
  };
}

interface QueueSidebarProps {
  stationName: string;
  currentQueueId?: number;
  stationId?: number | null;
  onSelectQueue?: (queue: QueueItem) => void; // callback عند اختيار دور
}

const QueueSidebar = ({
  stationName,
  currentQueueId,

  onSelectQueue,
}: QueueSidebarProps) => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates via WebSocket
  const { updateTrigger } = useQueueUpdates();

  const fetchQueues = async () => {
    try {
      console.log(`🔍 جاري جلب الأدوار لـ ${stationName}...`);
      const response = await axios.get(`${API_URL}/queue/active`);

      if (response.data.success) {
        console.log(`✅ تم جلب ${response.data.queues.length} دور نشط`);

        // Filter queues based on current station
        const filteredQueues = response.data.queues.filter((q: QueueItem) => {
          if (!q.currentStation) return false;

          // Show only queues that are currently at this station
          if (stationName === "المحاسبة") {
            return (
              q.currentStation.name === "المحاسبة" ||
              q.currentStation.displayNumber === 2
            );
          } else if (stationName === "المختبر") {
            return (
              q.currentStation.name === "المختبر" ||
              q.currentStation.name === "الفحص الطبي" ||
              q.currentStation.displayNumber === 3
            );
          } else if (stationName === "سحب الدم") {
            return (
              q.currentStation.name === "سحب الدم" ||
              q.currentStation.displayNumber === 4
            );
          } else if (stationName === "الطبيبة") {
            return (
              q.currentStation.name === "الطبيبة" ||
              q.currentStation.name === "الدكتور" ||
              q.currentStation.displayNumber === 5
            );
          }

          return false;
        });

        console.log(
          `📋 تم العثور على ${filteredQueues.length} دور ينتظر في ${stationName}`
        );

        // Sort by queue number
        filteredQueues.sort(
          (a: QueueItem, b: QueueItem) => a.queueNumber - b.queueNumber
        );

        setQueues(filteredQueues);
      }
    } catch (error) {
      console.error("❌ خطأ في جلب الأدوار:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationName, updateTrigger]); // Refetch when WebSocket triggers update

  // عند النقر على بطاقة المراجع
  const handleQueueClick = (queue: QueueItem) => {
    if (onSelectQueue) {
      onSelectQueue(queue);
    }
  };

  return (
    <div
      className='h-full flex flex-col'
      style={{ backgroundColor: "var(--white)" }}>
      {/* مساحة متطابقة مع الـ Header */}
      <div className='px-4 py-4' style={{ backgroundColor: "var(--primary)" }}>
        <div style={{ height: "36px" }}></div>
      </div>

      {/* Header */}
      <div
        className='p-4 font-bold text-white text-center flex-shrink-0'
        style={{ backgroundColor: "#988561" }}>
        <div className='text-lg'>📋 قائمة الانتظار</div>
        <div className='text-sm opacity-90 mt-1'>{stationName}</div>
      </div>

      {/* Queue List */}
      <div className='flex-1 overflow-y-auto p-3 space-y-2'>
        {loading ? (
          <div className='text-center py-8' style={{ color: "var(--dark)" }}>
            جاري التحميل...
          </div>
        ) : queues.length === 0 ? (
          <div className='text-center py-8' style={{ color: "var(--dark)" }}>
            لا توجد أدوار حالياً
          </div>
        ) : (
          queues.map((queue) => (
            <div
              key={queue.id}
              onClick={() => handleQueueClick(queue)}
              className='p-3 rounded-lg shadow-sm border-2 transition duration-200 hover:shadow-md cursor-pointer hover:border-primary'
              style={{
                backgroundColor:
                  queue.id === currentQueueId ? "var(--light)" : "var(--white)",
                borderColor:
                  queue.id === currentQueueId
                    ? "var(--primary)"
                    : "var(--light)",
              }}>
              {/* Queue Number */}
              <div className='flex items-center justify-between mb-2'>
                <div className='text-xl bg-[#054239] text-white px-3 py-1  font-bold'>
                  #{queue.queueNumber}
                </div>
                <div className='flex flex-row w-full justify-end items-end gap-1'>
                  {queue.ReceptionData?.femaleStatus === "LEGAL_INVITATION" ||
                  queue.ReceptionData?.maleStatus === "LEGAL_INVITATION" ? (
                    <span className='text-[9px] px-2 py-1 rounded-full font-semibold bg-[#054239] text-white'>
                      دعوة شرعية
                    </span>
                  ) : null}
                  {queue.priority === 1 ? (
                    <span className='text-[9px] px-2 py-1 rounded-full font-semibold bg-orange-500 text-white'>
                      مُستعجل
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Patient Names */}
              {queue.ReceptionData ? (
                <div className='space-y-1 text-sm'>
                  <div style={{ color: "var(--dark)" }}>
                    <span className='font-semibold'>👨 </span>
                    {queue.ReceptionData.maleStatus === "LEGAL_INVITATION" ? (
                      <>
                        {queue.ReceptionData.maleName}{" "}
                        {queue.ReceptionData.maleLastName}
                      </>
                    ) : queue.ReceptionData.maleStatus === "NOT_EXIST" ? (
                      <span className='text-red-500'>لا يوجد زوج</span>
                    ) : queue.ReceptionData.maleStatus === "OUT_OF_COUNTRY" ? (
                      <span className='text-red-500'>خارج القطر</span>
                    ) : queue.ReceptionData.maleStatus === "OUT_OF_PROVINCE" ? (
                      <span className='text-red-500'>خارج المحافظة</span>
                    ) : (
                      <>
                        {queue.ReceptionData.maleName}{" "}
                        {queue.ReceptionData.maleLastName}
                      </>
                    )}
                  </div>
                  <div style={{ color: "var(--dark)" }}>
                    <span className='font-semibold'>👩 </span>
                    {queue.ReceptionData.femaleStatus === "NORMAL" ||
                    queue.ReceptionData.femaleStatus === "LEGAL_INVITATION" ? (
                      <>
                        {queue.ReceptionData.femaleName}{" "}
                        {queue.ReceptionData.femaleLastName}
                      </>
                    ) : queue.ReceptionData.femaleStatus === "NOT_EXIST" ? (
                      <span className='text-red-500'>لا يوجد زوجة</span>
                    ) : queue.ReceptionData.femaleStatus ===
                      "OUT_OF_COUNTRY" ? (
                      <span className='text-red-500'>خارج القطر</span>
                    ) : queue.ReceptionData.femaleStatus ===
                      "OUT_OF_PROVINCE" ? (
                      <span className='text-red-500'>خارج المحافظة</span>
                    ) : (
                      <>
                        {queue.ReceptionData.maleName}{" "}
                        {queue.ReceptionData.maleLastName}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className='text-sm' style={{ color: "var(--dark)" }}>
                  {queue.patient.name}
                </div>
              )}

              <div className='flex flex-row justify-end text-gray-400 items-end text-xs mt-2 text-center'>
                ID : {queue.ReceptionData?.patientId}
              </div>

              {/* Current Station 
              <div
                className='text-xs mt-2 pt-2 border-t'
                style={{
                  color: "var(--secondary)",
                  borderColor: "var(--light)",
                }}>
                {queue.currentStation?.name || "جديد"}
              </div>

              <div
                className='text-xs mt-2 text-center'
                style={{ color: "var(--accent)" }}>
                اضغط للتفاصيل
              </div>
              */}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        className='p-3 text-center text-sm border-t'
        style={{
          backgroundColor: "#054239",
          color: "#ffffff",
        }}>
        إجمالي الأدوار: <span className='font-bold'>{queues.length}</span>
      </div>
    </div>
  );
};

export default QueueSidebar;
