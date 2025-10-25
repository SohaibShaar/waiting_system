/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/api";

const API_URL = API_BASE_URL;

interface PasswordProtectedRouteProps {
  pageName: string;
  children: React.ReactNode;
}

const PasswordProtectedRoute = ({
  pageName,
  children,
}: PasswordProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // التحقق من sessionStorage
    const token = sessionStorage.getItem(`auth_token_${pageName}`);
    const masterToken = sessionStorage.getItem("auth_token_master");

    if (token || masterToken) {
      setIsAuthenticated(true);
    } else {
      // التركيز على حقل كلمة المرور
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [pageName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/verify-page`, {
        pageName,
        password,
      });

      if (response.data.success) {
        const { token, isMaster } = response.data;

        // حفظ التوكن في sessionStorage
        if (isMaster) {
          // كلمة مرور عامة - حفظها لجميع الصفحات
          sessionStorage.setItem("auth_token_master", token);
        } else {
          // كلمة مرور خاصة بالصفحة
          sessionStorage.setItem(`auth_token_${pageName}`, token);
        }

        setIsAuthenticated(true);
        setPassword("");
      }
    } catch (error) {
      console.error("خطأ في التحقق:", error);
      setError("كلمة المرور غير صحيحة");
      setPassword("");
      passwordInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div
      className='fixed flex-col inset-0 flex items-center justify-center'
      style={{
        background: "linear-gradient(135deg, #054239 0%, #0a6b5a 100%)",
      }}>
      <div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4'>
        {/* أيقونة القفل */}
        <div className='flex justify-center mb-6'>
          <div
            className='w-20 h-20 rounded-full flex items-center justify-center'
            style={{ backgroundColor: "rgba(5, 66, 57, 0.1)" }}>
            <svg
              className='w-10 h-10'
              style={{ color: "#054239" }}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>
        </div>

        {/* العنوان */}
        <div className='flex flex-col items-center justify-center'>
          <h2
            className='text-2xl font-bold text-center mb-2'
            style={{ color: "#054239" }}>
            صفحة محمية
          </h2>
          <p className='text-center text-gray-600 mb-6'>
            الرجاء إدخال كلمة المرور للدخول
          </p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 mb-2 text-right'>
              كلمة المرور
            </label>
            <input
              ref={passwordInputRef}
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#054239] text-center text-lg'
              placeholder='••••••••'
              disabled={loading}
              autoComplete='off'
            />
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className='bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg text-center'>
              <p className='font-semibold'>{error}</p>
            </div>
          )}

          {/* زر الدخول */}
          <button
            type='submit'
            disabled={loading || !password}
            className='w-full py-3 rounded-lg font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            style={{
              backgroundColor: "#054239",
              color: "white",
            }}>
            {loading ? (
              <span className='flex items-center justify-center gap-2'>
                <svg
                  className='animate-spin h-5 w-5'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
                جاري التحقق...
              </span>
            ) : (
              <span className='flex items-center justify-center gap-2'>
                دخول
              </span>
            )}
          </button>
        </form>
      </div>
      <span className='flex flex-col justify-center items-center text-white text-sm mt-4'>
        نقابة الأطباء © مخبر ما قبل الزواج - حماة
        <a target='_blank' href='https://wa.me/963930294306'>
          تطوير صهيب الشعار
        </a>
      </span>
    </div>
  );
};

export default PasswordProtectedRoute;
