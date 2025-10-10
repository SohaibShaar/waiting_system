import { useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import { ScreenDisplay } from "./components/ScreenDisplay";

function App() {
  const { isConnected, subscribeToDisplay, on } = useSocket();

  useEffect(() => {
    // الاشتراك في الشاشة العامة عند الاتصال
    if (isConnected) {
      subscribeToDisplay();

      // الاستماع لتحديثات الطابور
      on("queue-updated", (data) => {
        console.log("Queue updated:", data);
        // يمكن إضافة منطق التحديث التلقائي هنا
      });

      // الاستماع لتحديثات المحطات
      on("station-updated", (data) => {
        console.log("Station updated:", data);
        // يمكن إضافة منطق التحديث التلقائي هنا
      });
    }
  }, [isConnected, subscribeToDisplay, on]);

  return (
    <div className='min-h-screen bg-gray-100'>
      <div className='container mx-auto p-4'>
        <h1 className='text-3xl font-bold text-center mb-8'>
          نظام إدارة الأدوار
        </h1>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold'>الشاشة العامة</h2>
            <div
              className={`px-3 py-1 rounded-full text-sm ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
              {isConnected ? "متصل" : "غير متصل"}
            </div>
          </div>

          {/* عرض بيانات الشاشة */}
          <ScreenDisplay refreshInterval={5} />
        </div>
      </div>
    </div>
  );
}

export default App;
