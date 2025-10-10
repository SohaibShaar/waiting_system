import { useState, useEffect } from "react";
import { apiService, type ScreenDataItem } from "../services/api";
import { useSocket } from "../hooks/useSocket";

interface ScreenDisplayProps {
  refreshInterval?: number; // بالثواني (للاستخدام كـ fallback)
}

export const ScreenDisplay = ({ refreshInterval = 30 }: ScreenDisplayProps) => {
  const [screenData, setScreenData] = useState<ScreenDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { isConnected, on } = useSocket();

  const fetchScreenData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getScreenDataCalled();

      if (response.success && response.data) {
        setScreenData(response.data.display);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(response.error || "فشل في تحميل البيانات");
      }
    } catch (err) {
      setError("خطأ في الاتصال بالخادم" + err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // تحميل البيانات الأولي
    fetchScreenData();

    // الاستماع لأحداث Socket.IO
    if (isConnected) {
      // تحديث البيانات عند تحديث الشاشة
      on("screen-data-updated", () => {
        console.log("📡 Received screen-data-updated event");
        fetchScreenData();
      });

      // تحديث البيانات عند استدعاء مريض
      on("patient-called", (data) => {
        console.log("📡 Received patient-called event:", data);
        fetchScreenData();
      });

      // تحديث البيانات عند تحديث المحطة
      on("station-updated", (data) => {
        console.log("📡 Received station-updated event:", data);
        fetchScreenData();
      });
    }

    // Fallback: تحديث دوري في حالة عدم الاتصال بـ Socket
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchScreenData();
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isConnected, refreshInterval]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CALLED":
        return "تم الاستدعاء";
      case "IN_PROGRESS":
        return "قيد التنفيذ";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CALLED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && screenData.length === 0) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        <span className='mr-2'>جاري التحميل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <div className='flex items-center'>
          <div className='text-red-600 mr-2'>⚠️</div>
          <div>
            <h3 className='text-red-800 font-medium'>خطأ في تحميل البيانات</h3>
            <p className='text-red-600 text-sm'>{error}</p>
            <button
              onClick={fetchScreenData}
              className='mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700'>
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* معلومات التحديث */}
      <div className='flex justify-between items-center text-sm text-gray-600'>
        <div className='flex items-center space-x-4 space-x-reverse'>
          <span>
            آخر تحديث:{" "}
            {lastUpdated ? formatTime(lastUpdated.toISOString()) : "غير محدد"}
          </span>
          <div
            className={`px-2 py-1 rounded text-xs ${
              isConnected
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
            {isConnected ? "تحديث فوري" : "تحديث دوري"}
          </div>
        </div>
        <button
          onClick={fetchScreenData}
          className='px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200'>
          تحديث يدوي
        </button>
      </div>

      {/* قائمة الاستدعاءات */}
      {screenData.length === 0 ? (
        <div className='text-center py-8 text-gray-500'>
          <div className='text-4xl mb-2'>📋</div>
          <p>لا توجد استدعاءات حالية</p>
        </div>
      ) : (
        <div className='grid gap-3'>
          {screenData.map((item, index) => (
            <div
              key={`${item.queueNumber}-${item.displayNumber}-${index}`}
              className='bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4 space-x-reverse'>
                  {/* رقم الدور */}
                  <div className='bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg'>
                    {item.queueNumber}
                  </div>

                  {/* معلومات المحطة */}
                  <div>
                    <div className='font-semibold text-gray-900'>
                      المحطة {item.displayNumber}
                    </div>
                    <div className='text-sm text-gray-600'>
                      {item.stationName}
                    </div>
                  </div>
                </div>

                {/* الحالة والوقت */}
                <div className='text-left'>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      item.status
                    )}`}>
                    {getStatusText(item.status)}
                  </div>
                  <div className='text-xs text-gray-500 mt-1'>
                    {formatTime(item.calledAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className='bg-gray-50 rounded-lg p-4'>
        <div className='grid grid-cols-2 gap-4 text-center'>
          <div>
            <div className='text-2xl font-bold text-blue-600'>
              {screenData.filter((item) => item.status === "CALLED").length}
            </div>
            <div className='text-sm text-gray-600'>تم الاستدعاء</div>
          </div>
          <div>
            <div className='text-2xl font-bold text-green-600'>
              {
                screenData.filter((item) => item.status === "IN_PROGRESS")
                  .length
              }
            </div>
            <div className='text-sm text-gray-600'>قيد التنفيذ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
