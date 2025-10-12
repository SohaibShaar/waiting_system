import { useEffect, useState } from "react";
import axios from "axios";
import { useQueueUpdates } from "../hooks/useQueueUpdates";

const API_URL = "http://localhost:3003/api";

interface QueueItem {
  id: number;
  queueNumber: number;
  status: string;
  priority: number;
  currentStation: {
    name: string;
    displayNumber: number;
  } | null;
  patient: {
    name: string;
  };
  ReceptionData?: {
    maleName: string;
    maleLastName: string;
    femaleName: string;
    femaleLastName: string;
  };
}

interface QueueSidebarProps {
  stationName: string;
  currentQueueId?: number;
}

const QueueSidebar = ({ stationName, currentQueueId }: QueueSidebarProps) => {
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
              q.currentStation.displayNumber === 3
            );
          } else if (stationName === "الطبيبة") {
            return (
              q.currentStation.name === "الطبيبة" ||
              q.currentStation.displayNumber === 4
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "WAITING":
        return "var(--secondary)";
      case "IN_SERVICE":
        return "var(--primary)";
      case "COMPLETED":
        return "#22c55e";
      case "CANCELLED":
        return "#ef4444";
      default:
        return "var(--dark)";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "نشط";
      case "WAITING":
        return "منتظر";
      case "IN_SERVICE":
        return "قيد الخدمة";
      case "COMPLETED":
        return "مكتمل";
      case "CANCELLED":
        return "ملغى";
      default:
        return status;
    }
  };

  return (
    <div
      className='h-full flex flex-col'
      style={{ backgroundColor: "var(--white)" }}>
      {/* Header */}
      <div
        className='p-4 font-bold text-white text-center'
        style={{ backgroundColor: "var(--primary)" }}>
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
              className='p-3 rounded-lg shadow-sm border-2 transition duration-200 hover:shadow-md'
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
                <div
                  className='text-2xl font-bold'
                  style={{ color: "var(--primary)" }}>
                  #{queue.queueNumber}
                </div>
                <div
                  className='text-xs px-2 py-1 rounded-full font-semibold'
                  style={{
                    backgroundColor: getStatusColor(queue.status),
                    color: "var(--white)",
                  }}>
                  {getStatusText(queue.status)}
                </div>
              </div>

              {/* Patient Names */}
              {queue.ReceptionData ? (
                <div className='space-y-1 text-sm'>
                  <div style={{ color: "var(--dark)" }}>
                    <span className='font-semibold'>👨 </span>
                    {queue.ReceptionData.maleName}{" "}
                    {queue.ReceptionData.maleLastName}
                  </div>
                  <div style={{ color: "var(--dark)" }}>
                    <span className='font-semibold'>👩 </span>
                    {queue.ReceptionData.femaleName}{" "}
                    {queue.ReceptionData.femaleLastName}
                  </div>
                </div>
              ) : (
                <div className='text-sm' style={{ color: "var(--dark)" }}>
                  {queue.patient.name}
                </div>
              )}

              {/* Current Station */}
              <div
                className='text-xs mt-2 pt-2 border-t'
                style={{
                  color: "var(--secondary)",
                  borderColor: "var(--light)",
                }}>
                📍 {queue.currentStation?.name || "جديد"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        className='p-3 text-center text-sm border-t'
        style={{
          backgroundColor: "var(--light)",
          color: "var(--dark)",
          borderColor: "var(--light)",
        }}>
        إجمالي الأدوار: <span className='font-bold'>{queues.length}</span>
      </div>
    </div>
  );
};

export default QueueSidebar;
