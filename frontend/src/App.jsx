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
        navigate('/student');
      }
    } catch (error) {
      console.error("Error determining role:", error);
      // Fallback to student if error
      setRole('student');
      navigate('/student');
    }
  };

  const logout = () => {
    setAccount('');
    setRole(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="w-full p-4 flex justify-between items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
            ERT
          </span>
          <span className="font-bold text-slate-700 dark:text-slate-200 hidden sm:inline">System</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          
          {/* Language Toggle */}
          <button 
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
            className="font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg"
            title="Đổi ngôn ngữ / Switch Language"
          >
            {lang === 'en' ? '🇬🇧 EN' : '🇻🇳 VN'}
          </button>

          {/* Account Info / Logout */}
          {account && (
            <div className="flex items-center gap-3 ml-2 border-l pl-4 border-slate-300 dark:border-slate-600">
              <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold hidden md:inline">
                {role === 'staff' ? '👨‍🏫 Staff' : '🎓 Student'}
              </span>
              <button 
                onClick={logout}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 py-1.5 px-3 rounded-lg font-bold transition"
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
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in-up text-center">
              <div className="text-8xl mb-6 drop-shadow-lg">🎓</div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-4">
                {t.welcome}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-lg mx-auto">
                {t.description}
              </p>
              <button 
                onClick={connectWallet}
                className="modern-button text-xl px-10 py-4"
              >
                🦊 {t.connectWallet}
              </button>
            </div>
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

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
