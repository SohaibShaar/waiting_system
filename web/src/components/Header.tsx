import { Link, useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  icon?: string;
  showBackButton?: boolean;
}

const Header = ({ title, icon, showBackButton = true }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className='shadow-lg' style={{ backgroundColor: "var(--primary)" }}>
      <div className='max-w-7xl mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          {/* Right Side - Title */}
          <div className='flex items-center gap-3'>
            {icon && <span className='text-4xl'>{icon}</span>}
            <h1 className='text-2xl md:text-3xl font-bold text-white'>
              {title}
            </h1>
          </div>

          {/* Left Side - Navigation */}
          <div className='flex items-center gap-3'>
            {showBackButton && (
              <button
                onClick={() => navigate("/")}
                className='px-4 py-2 rounded-lg font-semibold transition duration-200 hover:shadow-lg'
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--white)",
                }}>
                🏠 الصفحة الرئيسية
              </button>
            )}
            <div
              className='text-white text-sm md:text-base px-3 py-1 rounded-lg'
              style={{ backgroundColor: "var(--dark)" }}>
              {new Date().toLocaleDateString("ar-SA", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
