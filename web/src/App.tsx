import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import DisplayScreen from "./pages/DisplayScreen";
import ReceptionPage from "./pages/ReceptionPage";
import AccountingPage from "./pages/AccountingPage";
import LabPage from "./pages/LabPage";
import DoctorPage from "./pages/DoctorPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/display' element={<DisplayScreen />} />
        <Route path='/reception' element={<ReceptionPage />} />
        <Route path='/accounting' element={<AccountingPage />} />
        <Route path='/lab' element={<LabPage />} />
        <Route path='/doctor' element={<DoctorPage />} />
      </Routes>
    </Router>
  );
}

function HomePage() {
  return (
    <div
      className='min-h-screen flex items-center justify-center p-8'
      style={{
        background: "#054239",
      }}>
      <div className='max-w-5xl w-full'>
        <div
          className='text-center mb-12 p-8 rounded-2xl shadow-xl'
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
          }}>
          <div className='flex flex-row items-center justify-center'>
            <img
              src='/hamalogo2.png'
              alt='logo'
              className='w-45 h-30 items-center justify-center'
            />

            <div className='flex flex-col'>
              <h1 className='text-5xl font-bold text-white mb-4'>
                مخبر ما قبل الزواج - حماة
              </h1>
              <p className='text-xl text-white opacity-90'>
                نظام إدارة الأدوار
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {/* Display Screen */}
          <Link to='/display' className='transform hover:scale-105 transition'>
            <div
              className='rounded-lg shadow-xl p-8 text-center hover:shadow-2xl transition duration-300'
              style={{
                backgroundColor: "var(--white)",
                color: "var(--dark)",
              }}>
              <div className='text-6xl mb-4'>📺</div>
              <h2
                className='text-2xl font-bold mb-2'
                style={{ color: "var(--primary)" }}>
                الشاشة العامة
              </h2>
              <p style={{ color: "var(--dark)" }}>عرض الاستدعاءات المباشرة</p>
            </div>
          </Link>

          {/* Reception */}
          <Link
            to='/reception'
            className='transform hover:scale-105 transition'>
            <div
              className='rounded-lg shadow-xl p-8 text-center hover:shadow-2xl transition duration-300'
              style={{
                backgroundColor: "var(--white)",
                color: "var(--dark)",
              }}>
              <div className='text-6xl mb-4'>📝</div>
              <h2
                className='text-2xl font-bold mb-2'
                style={{ color: "var(--primary)" }}>
                الاستقبال
              </h2>
              <p style={{ color: "var(--dark)" }}>إضافة مراجع جديد</p>
            </div>
          </Link>

          {/* Accounting */}
          <Link
            to='/accounting'
            className='transform hover:scale-105 transition'>
            <div
              className='rounded-lg shadow-xl p-8 text-center hover:shadow-2xl transition duration-300'
              style={{
                backgroundColor: "var(--white)",
                color: "var(--dark)",
              }}>
              <div className='text-6xl mb-4'>💰</div>
              <h2
                className='text-2xl font-bold mb-2'
                style={{ color: "var(--primary)" }}>
                المحاسبة
              </h2>
              <p style={{ color: "var(--dark)" }}>تسجيل المدفوعات</p>
            </div>
          </Link>

          {/* Lab */}
          <Link to='/lab' className='transform hover:scale-105 transition'>
            <div
              className='rounded-lg shadow-xl p-8 text-center hover:shadow-2xl transition duration-300'
              style={{
                backgroundColor: "var(--white)",
                color: "var(--dark)",
              }}>
              <div className='text-6xl mb-4'>🔬</div>
              <h2
                className='text-2xl font-bold mb-2'
                style={{ color: "var(--primary)" }}>
                المختبر
              </h2>
              <p style={{ color: "var(--dark)" }}>الفحوصات الأولية</p>
            </div>
          </Link>

          {/* Doctor */}
          <Link to='/doctor' className='transform hover:scale-105 transition'>
            <div
              className='rounded-lg shadow-xl p-8 text-center hover:shadow-2xl transition duration-300'
              style={{
                backgroundColor: "var(--white)",
                color: "var(--dark)",
              }}>
              <div className='text-6xl mb-4'>👩‍⚕️</div>
              <h2
                className='text-2xl font-bold mb-2'
                style={{ color: "var(--primary)" }}>
                الطبيبة
              </h2>
              <p style={{ color: "var(--dark)" }}>الفحص النهائي</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App;
