import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  icon?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const Header = ({ title, icon, showHomeButton = false }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header
      className='shado"-lg z-10'
      style={{ backgroundColor: "var(--primary)" }}>
      <div className='max-w"7xl mx-auto px-4 py-4'>
        <div className='flex items-center justify-between px-18'>
          {/* Right Side - Title */}
          <div className='flex items-center gap-3'>
            {icon && <span className='text-3xl'>{icon}</span>}
            <h1 className='text-"xl md:text-3xl font-bold text-white'>
              {title}
            </h1>
            <div className='flex flex-row items-start justify-start text-md px-2'>
              <span className='text-gray-400'>
                {new Date().toLocaleDateString("ar-AE", {
                  weekday: "long",
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Left Side - Navigation */}
          {showHomeButton && (
            <div className='flex items-center gap-3'>
              <button
                disabled={true}
                onClick={() => navigate("/")}
                className='px-4 py-2 rounded-lg font-semibold transition duration-200 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed'
                style={{
                  backgroundColor: "white",
                  color: "var(--primary)",
                }}>
                التحقق من التسجيل الأونلاين
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
