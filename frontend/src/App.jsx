import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import StudentDashboard from './StudentDashboard';
import StaffDashboard from './StaffDashboard';
import { translations } from './translations';
import './App.css';

const CONTRACT_ADDRESS = "0x44A3875B9BC1e497DD4c3129092753e12462231A";
const CONTRACT_ABI = [
  "function owner() external view returns (address)",
  "function isAuthorizedStaff(address) external view returns (bool)"
];

function AppContent() {
  const [account, setAccount] = useState('');
  const [role, setRole] = useState(null); // 'staff', 'student', or null
  const [lang, setLang] = useState('en');
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  const t = translations[lang];

  useEffect(() => {
    // Apply theme
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
  }, [isDark]);

  useEffect(() => {
    checkIfWalletIsConnected();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts) => {
    // Tự động đăng xuất khi người dùng đổi ví trên MetaMask
    logout();
  };

  const checkIfWalletIsConnected = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await determineRole(accounts[0]);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        await determineRole(accounts[0]);
      } catch (error) {
        console.error(error);
      }
    } else {
      alert(t.noMetaMask);
    }
  };

  const determineRole = async (userAddress) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const ownerAddress = await contract.owner();
      const isStaff = await contract.isAuthorizedStaff(userAddress);

      if (userAddress.toLowerCase() === ownerAddress.toLowerCase() || isStaff) {
        setRole('staff');
        navigate('/staff');
      } else {
        setRole('student');
        try {
          const res = await fetch(`https://presentforstudent.onrender.com/api/students/${userAddress}`); // or production URL
          if (res.ok) {
            navigate('/student');
          } else {
            navigate('/register');
          }
        } catch (err) {
          navigate('/register');
        }
      }
    } catch (error) {
      console.error("Error determining role:", error);
      setRole('student');
      navigate('/register');
    }
  };

  const registerStudent = async (name, studentId) => {
    try {
      const res = await fetch('https://presentforstudent.onrender.com/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account, name, studentId })
      });
      if (res.ok) {
        navigate('/student');
      }
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  const logout = () => {
    setAccount('');
    setRole(null);
    navigate('/');
  };

  return (
  return (
    <div className="min-h-screen flex flex-col font-sans bg-academic-light dark:bg-academic-dark transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="w-full p-4 flex justify-between items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-academic-border dark:border-academic-borderDark sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-academic-blue flex items-center justify-center text-white font-display font-bold shadow-md text-xl">
            🎓
          </div>
          <span className="font-display font-bold text-academic-blue dark:text-academic-lightBlue text-xl tracking-tight hidden sm:inline">University Portal</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full text-academic-dark dark:text-academic-light hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          
          {/* Language Toggle */}
          <button 
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
            className="font-bold text-academic-blue bg-academic-light dark:bg-slate-700 px-3 py-1.5 rounded-lg hover:bg-academic-border dark:hover:bg-slate-600 transition"
            title="Switch Language"
          >
            {lang === 'en' ? '🇬🇧 EN' : '🇻🇳 VN'}
          </button>

          {/* Account Info / Logout */}
          {account && (
            <div className="flex items-center gap-3 ml-2 border-l pl-4 border-academic-border dark:border-academic-borderDark">
              <span className="text-sm font-semibold text-academic-blue dark:text-academic-lightBlue hidden md:inline bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                {role === 'staff' ? '👨‍🏫 Staff' : '👨‍🎓 Student'}
              </span>
              <button 
                onClick={logout}
                className="text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 py-2 px-4 rounded-xl font-bold transition-all shadow-sm"
              >
                {t.disconnect}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8">
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col items-center justify-center min-h-[75vh] text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-academic-blue rounded-full flex items-center justify-center text-5xl text-white shadow-xl mb-8 shadow-blue-500/30">
                🎓
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-academic-dark dark:text-white mb-4">
                {t.welcome}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
                {t.description}
              </p>
              <button 
                onClick={connectWallet}
                className="edu-button text-xl px-10 py-4 shadow-lg shadow-blue-500/30 flex items-center gap-3"
              >
                🦊 {t.connectWallet}
              </button>
            </div>
          } />
          
          <Route path="/register" element={
            role === 'student' ? (
              <StudentRegistration 
                account={account} 
                lang={lang} 
                onSubmit={registerStudent} 
              />
            ) : <Navigate to="/" />
          } />
          
          <Route path="/student" element={
            role === 'student' ? <StudentDashboard account={account} lang={lang} t={t} /> : <Navigate to="/" />
          } />
          
          <Route path="/staff" element={
            role === 'staff' ? <StaffDashboard account={account} lang={lang} t={t} /> : <Navigate to="/" />
          } />
        </Routes>
      </main>
    </div>
  );
}

function StudentRegistration({ account, lang, onSubmit }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="edu-card p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-6">📝</div>
        <h2 className="text-2xl font-display font-bold text-academic-dark dark:text-white mb-2">
          {lang === 'en' ? 'Student Registration' : 'Đăng Ký Thông Tin'}
        </h2>
        <p className="text-gray-500 mb-8">
          {lang === 'en' ? 'Please provide your details before accessing the dashboard.' : 'Vui lòng cung cấp thông tin sinh viên để tiếp tục.'}
        </p>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(name, studentId); }} className="space-y-5 text-left">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {lang === 'en' ? 'Full Name' : 'Họ và tên'}
            </label>
            <input 
              required
              className="edu-input w-full"
              placeholder={lang === 'en' ? 'e.g. John Doe' : 'VD: Nguyễn Văn A'}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {lang === 'en' ? 'Student ID' : 'Mã số sinh viên'}
            </label>
            <input 
              required
              className="edu-input w-full uppercase"
              placeholder={lang === 'en' ? 'e.g. SE123456' : 'VD: SE123456'}
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
            />
          </div>
          <button type="submit" className="edu-button w-full mt-4">
            {lang === 'en' ? 'Complete Registration' : 'Hoàn Tất Đăng Ký'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
