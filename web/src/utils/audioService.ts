// مساعد للقراءة الصوتية بالعربية
export class AudioService {
  private synth: SpeechSynthesis;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  // تشغيل نغمة التنبيه
  async playNotification() {
    try {
      // نغمة بسيطة باستخدام Audio Context
      const AudioContext =
        window.AudioContext ||
        (
          window as Window &
            typeof globalThis & {
              webkitAudioContext: typeof window.AudioContext;
            }
        ).webkitAudioContext;
      const audioContext = new AudioContext();

      // نغمة أولى
      this.playBeep(audioContext, 800, 0.2);
      // نغمة ثانية بعد فترة قصيرة
      setTimeout(() => this.playBeep(audioContext, 1000, 0.2), 200);
    } catch (error) {
      console.error("خطأ في تشغيل النغمة:", error);
    }
  }

  private playBeep(
    audioContext: AudioContext,
    frequency: number,
    duration: number
  ) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  // تحويل الأرقام الإنجليزية إلى عربية
  private convertToArabicNumber(num: number): string {
    const arabicNumbers: { [key: string]: string } = {
      "0": "صفر",
      "1": "واحد",
      "2": "اثنان",
      "3": "ثلاثة",
      "4": "أربعة",
      "5": "خمسة",
      "6": "ستة",
      "7": "سبعة",
      "8": "ثمانية",
      "9": "تسعة",
      "10": "عشرة",
      "11": "أحد عشر",
      "12": "اثنا عشر",
      "13": "ثلاثة عشر",
      "14": "أربعة عشر",
      "15": "خمسة عشر",
      "16": "ستة عشر",
      "17": "سبعة عشر",
      "18": "ثمانية عشر",
      "19": "تسعة عشر",
      "20": "عشرون",
    };

    if (num <= 20 && arabicNumbers[num.toString()]) {
      return arabicNumbers[num.toString()];
    }

    // للأرقام الأكبر من 20
    const numStr = num.toString();
    if (num < 100) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;

      const tensMap: { [key: string]: string } = {
        "2": "عشرون",
        "3": "ثلاثون",
        "4": "أربعون",
        "5": "خمسون",
        "6": "ستون",
        "7": "سبعون",
        "8": "ثمانون",
        "9": "تسعون",
      };

      if (ones === 0) {
        return tensMap[tens.toString()];
      }
      return `${arabicNumbers[ones.toString()]} و ${tensMap[tens.toString()]}`;
    }

    // للأرقام الأكبر، نقرأ رقم رقم
    return numStr
      .split("")
      .map((digit) => arabicNumbers[digit] || digit)
      .join(" ");
  }

  // القراءة الصوتية
  async speak(text: string, rate: number = 0.9) {
    // إيقاف أي قراءة سابقة
    this.synth.cancel();

    return new Promise<void>((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);

        // إعدادات الصوت
        utterance.lang = "ar-SA"; // اللغة العربية
        utterance.rate = rate; // سرعة القراءة
        utterance.pitch = 1; // نبرة الصوت
        utterance.volume = 1; // مستوى الصوت

        // محاولة اختيار صوت عربي
        const voices = this.synth.getVoices();
        const arabicVoice = voices.find(
          (voice) => voice.lang.includes("ar") || voice.lang.includes("AR")
        );

        if (arabicVoice) {
          utterance.voice = arabicVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (error) => {
          console.error("خطأ في القراءة الصوتية:", error);
          reject(error);
        };

        this.synth.speak(utterance);
      } catch (error) {
        console.error("خطأ في تهيئة القراءة الصوتية:", error);
        reject(error);
      }
    });
  }

  // دالة شاملة للنداء على المراجع
  async announcePatient(queueNumber: number, stationName: string) {
    try {
      console.log(`🔊 بدء النداء على الدور #${queueNumber} → ${stationName}`);

      // 1. تشغيل النغمة التنبيهية
      await this.playNotification();
      console.log("✅ تم تشغيل النغمة");

      // 2. انتظار قليلاً بعد النغمة
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 3. قراءة رقم الدور
      const numberText = this.convertToArabicNumber(queueNumber);
      console.log(`🗣️ قراءة: رقم ${numberText}`);
      await this.speak(`رقم ${numberText}`);

      // 4. انتظار قليلاً
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. قراءة اسم المحطة
      console.log(`🗣️ قراءة: إلى ${stationName}`);
      await this.speak(`إلى شباك رقم${stationName}`);

      console.log("✅ انتهى النداء بنجاح");
    } catch (error) {
      console.error("❌ خطأ في النداء على المراجع :", error);
      throw error; // إعادة رمي الخطأ ليظهر في console
    }
  }

  // تحميل الأصوات (يجب استدعاؤها عند التحميل)
  loadVoices() {
    return new Promise<void>((resolve) => {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        console.log(`✅ تم تحميل ${voices.length} صوت`);
        const arabicVoices = voices.filter(
          (v) => v.lang.includes("ar") || v.lang.includes("AR")
        );
        if (arabicVoices.length > 0) {
          console.log(`✅ عدد الأصوات العربية: ${arabicVoices.length}`);
          arabicVoices.forEach((v) =>
            console.log(`   - ${v.name} (${v.lang})`)
          );
        } else {
          console.warn(
            "⚠️ لم يتم العثور على أصوات عربية، سيتم استخدام الصوت الافتراضي"
          );
        }
        resolve();
      } else {
        console.log("⏳ انتظار تحميل الأصوات...");
        this.synth.onvoiceschanged = () => {
          const loadedVoices = this.synth.getVoices();
          console.log(`✅ تم تحميل ${loadedVoices.length} صوت`);
          resolve();
        };
      }
    });
  }
}

// إنشاء instance واحد
export const audioService = new AudioService();
