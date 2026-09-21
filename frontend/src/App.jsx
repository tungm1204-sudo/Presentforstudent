import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import StaffDashboard from './StaffDashboard';
import StudentDashboard from './StudentDashboard';
import { Wallet } from 'lucide-react';

function App() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("User rejected request");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || null);
      });
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Navbar */}
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
            EduRewards
          </div>
          <div className="space-x-4 flex items-center">
            <Link to="/" className="text-gray-700 hover:text-blue-500">Student</Link>
            <Link to="/staff" className="text-gray-700 hover:text-blue-500">Staff</Link>
            <button
              onClick={connectWallet}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Wallet size={18} />
              {account ? `${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<StudentDashboard account={account} />} />
            <Route path="/staff" element={<StaffDashboard account={account} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
