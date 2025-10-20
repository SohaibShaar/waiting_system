import { useCallback, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { audioService } from "../utils/audioService";

interface CalledPatient {
  queueNumber: number;
  displayNumber: number;
  stationId: number;
  calledAt: string;
}

const DisplayScreen = () => {
  const [, setSocket] = useState<Socket | null>(null);
  const [recentCalls, setRecentCalls] = useState<CalledPatient[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isProcessingAnnouncement, setIsProcessingAnnouncement] =
    useState(false);
  const [pendingCallsCount, setPendingCallsCount] = useState(0); // لتتبع التغييرات
  const pendingCallsRef = useRef<CalledPatient[]>([]);

  const getStationName = useCallback((displayNumber: number) => {
    const stations: { [key: number]: string } = {
      1: "الاستقبال",
      2: "إلى شباك واحد",
      3: "إلى غرفة الطبيب",
      4: "إلى غرفة سحب الدم",
    };
    return stations[displayNumber] || `الشاشة ${displayNumber}`;
  }, []);

  // تفعيل الصوت تلقائياً عند تحميل الصفحة
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioService.loadVoices();
        // محاولة تشغيل صوت تجريبي
        await audioService.playNotification();
        setAudioEnabled(true);
        console.log("✅ تم تفعيل الصوت تلقائياً");
      } catch (error) {
        console.error("❌ خطأ في تفعيل الصوت التلقائي:", error);
        // في حالة فشل التشغيل التلقائي، نفعل الصوت على أي حال
        setAudioEnabled(true);
      }
    };

    initAudio();
  }, []);

  // معالجة طابور الاستدعاءات
  useEffect(() => {
    console.log(
      `🔍 useEffect triggered - pendingCallsCount: ${pendingCallsCount}, isProcessing: ${isProcessingAnnouncement}, queueLength: ${pendingCallsRef.current.length}`
    );

    if (isProcessingAnnouncement || pendingCallsRef.current.length === 0) {
      return;
    }

    const processNextCall = async () => {
      setIsProcessingAnnouncement(true);
      const nextCall = pendingCallsRef.current[0];

      if (!nextCall) {
        setIsProcessingAnnouncement(false);
        return;
      }

      console.log(`🔄 معالجة الدور #${nextCall.queueNumber}`);
      console.log(`📋 عدد الأدوار المنتظرة: ${pendingCallsRef.current.length}`);

      try {
        // 1. إضافة الدور إلى الشاشة
        setRecentCalls((prev) => [nextCall, ...prev].slice(0, 10));

        // 2. تشغيل الصوت (إذا كان مفعلاً)
        if (audioEnabled) {
          const stationName = getStationName(nextCall.displayNumber);
          console.log(`🔊 تشغيل الصوت للدور #${nextCall.queueNumber}`);
          await audioService.announcePatient(nextCall.queueNumber, stationName);
          console.log(`✅ انتهى الصوت للدور #${nextCall.queueNumber}`);
        } else {
          console.log(`🔇 الصوت معطل - لن يتم تشغيل النداء`);
        }

        // 3. إزالة الدور من الطابور مباشرة (بدون انتظار)
        pendingCallsRef.current = pendingCallsRef.current.slice(1);
        console.log(`✅ تم الانتهاء من معالجة الدور #${nextCall.queueNumber}`);
        console.log(`📋 الأدوار المتبقية: ${pendingCallsRef.current.length}`);

        // إعادة تشغيل المعالجة للدور التالي
        setPendingCallsCount(pendingCallsRef.current.length);
      } catch (error) {
        console.error("❌ خطأ في معالجة الدور:", error);
        // حتى في حالة الخطأ، نزيل الدور من الطابور
        pendingCallsRef.current = pendingCallsRef.current.slice(1);
        setPendingCallsCount(pendingCallsRef.current.length);
      } finally {
        setIsProcessingAnnouncement(false);
      }
    };

    processNextCall();
  }, [
    isProcessingAnnouncement,
    audioEnabled,
    getStationName,
    pendingCallsCount,
  ]); // إضافة pendingCallsCount

  useEffect(() => {
    const newSocket = io("http://192.168.1.100:3003");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ متصل بالخادم");
      setIsConnected(true);
      newSocket.emit("subscribe-display");
    });

    newSocket.on("disconnect", () => {
      console.log("❌ انقطع الاتصال");
      setIsConnected(false);
    });

    newSocket.on("patient-called", (data: CalledPatient) => {
      console.log("📢 استقبال استدعاء جديد:", data);

      // التحقق من عدم وجود الدور في الطابور
      const isInQueue = pendingCallsRef.current.some(
        (call) =>
          call.queueNumber === data.queueNumber &&
          call.displayNumber === data.displayNumber
      );

      if (!isInQueue) {
        pendingCallsRef.current.push(data);
        console.log(`➕ تمت إضافة الدور #${data.queueNumber} إلى الطابور`);
        console.log(
          `📋 عدد الأدوار في الطابور: ${pendingCallsRef.current.length}`
        );
        setPendingCallsCount(pendingCallsRef.current.length); // ✅ تحديث العداد لتشغيل useEffect
      } else {
        console.log(`⚠️ الدور #${data.queueNumber} موجود بالفعل في الطابور`);
      }
    });

    return () => {
      console.log("🔌 إغلاق اتصال WebSocket");
      newSocket.close();
    };
  }, []); // ✅ Empty dependency array - يتم إنشاؤه مرة واحدة فقط

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className='min-h-screen text-white flex flex-col'
      style={{
        background: "#054239",
      }}>
      {/* Header */}
      <div
        className='p-6 shadow-lg'
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <h1 className='text-4xl font-bold'>🏥 الأدوار</h1>
          <div className='flex items-center gap-4'>
            {/* Audio Status */}
            <div
              className='text-lg px-4 py-2 rounded-lg'
              style={{
                backgroundColor: audioEnabled
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(239, 68, 68, 0.2)",
                color: audioEnabled ? "#22c55e" : "#ef4444",
              }}>
              {audioEnabled ? "🔊 الصوت مفعل" : "🔇 جاري تفعيل الصوت..."}
            </div>
            {/* Connection Status */}
            <div className='text-lg'>
              {isConnected ? (
                <span className='text-green-400'>● متصل</span>
              ) : (
                <span className='text-red-400'>○ غير متصل</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Calls - Cards Layout */}
      <div className='flex-1 max-w-7xl w-full mx-auto px-4 pb-12 flex flex-col justify-center'>
        <div className='space-y-8'>
          {/* آخر استدعاء - Card كبيرة */}
          <div
            className='rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105'
            style={{
              backgroundColor: "var(--white)",
              border: "4px solid var(--primary)",
            }}>
            <div className='flex items-center justify-between'>
              <div className='flex-1 text-center '>
                <p
                  className='text-2xl font-bold mx-4 mb-3'
                  style={{ color: "var(--primary)" }}>
                  رقم الدور
                </p>
                <div
                  className='text-7xl font-bold'
                  style={{ color: "var(--primary)" }}>
                  {recentCalls[0]?.queueNumber || "--"}
                </div>
              </div>
              <div
                className='flex-1 text-center border-r-4 border-l-4'
                style={{ borderColor: "var(--light)" }}>
                <p
                  className='text-2xl font-bold mx-4 mb-3'
                  style={{ color: "var(--secondary)" }}>
                  التوجه
                </p>
                <div
                  className='text-4xl font-bold mx-4'
                  style={{ color: "var(--secondary)" }}>
                  {recentCalls[0]
                    ? "" + getStationName(recentCalls[0].displayNumber)
                    : "بانتظار الاستدعاء"}
                </div>
              </div>
              <div className='flex-1 text-center'>
                <p
                  className='text-2xl font-bold mx-4 mb-3'
                  style={{ color: "var(--dark)" }}>
                  الوقت
                </p>
                <div
                  className='text-3xl font-mono font-bold mx-4'
                  style={{ color: "var(--dark)" }}>
                  {recentCalls[0]
                    ? formatTime(recentCalls[0].calledAt)
                    : "--:--:--"}
                </div>
              </div>
            </div>
          </div>

          {/* الاستدعاءات السابقة - 4 Cards صغيرة */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, index) => {
              const call = recentCalls[index + 1];
              return (
                <div
                  key={
                    call
                      ? `${call.queueNumber}-${call.calledAt}`
                      : `empty-${index}`
                  }
                  className='rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105'
                  style={{
                    backgroundColor: "var(--white)",
                    border: "2px solid var(--light)",
                    opacity: call ? 1 : 0.5,
                  }}>
                  <div className='text-center'>
                    <p
                      className='text-sm font-semibold mb-2'
                      style={{ color: "var(--dark)" }}>
                      رقم الدور
                    </p>
                    <div
                      className='text-5xl font-bold mb-4'
                      style={{ color: "var(--primary)" }}>
                      {call?.queueNumber || "--"}
                    </div>
                    <div
                      className='text-lg font-semibold mb-2'
                      style={{ color: "var(--secondary)" }}>
                      {call ? getStationName(call.displayNumber) : "..."}
                    </div>
                    <div
                      className='text-sm font-mono'
                      style={{ color: "var(--dark)" }}>
                      {call ? formatTime(call.calledAt) : "--:--:--"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className='p-6 mt-auto shadow-lg w-full text-center justify-center items-center flex'
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
        <div className='text-center justify-center items-center flex flex-row'>
          <img
            src='/eagle.png'
            alt='logo'
            className='w-50 h-25 items-center justify-center'
          />
          <div className='flex flex-col items-center justify-center'>
            <p className='text-xl'>مخبر ما قبل الزواج - حماة</p>
            <p className='text-lg mt-2'>
              {new Date().toLocaleDateString("ar-SY", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
