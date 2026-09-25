import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x44A3875B9BC1e497DD4c3129092753e12462231A";
const CONTRACT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function redeemTokens(uint256 _amount, string memory _itemId) external"
];

const STORE_ITEMS = [
  { id: "ITEM_1", name: { en: "University T-Shirt", vi: "Áo Thun Trường" }, cost: "0.005", image: "👕" },
  { id: "ITEM_2", name: { en: "Coffee Voucher", vi: "Voucher Cà Phê" }, cost: "0.002", image: "☕" },
  { id: "ITEM_3", name: { en: "Extra Credit Points", vi: "Cộng Điểm Rèn Luyện" }, cost: "0.01", image: "⭐" },
];

function StudentDashboard({ account, lang, t }) {
  const [balance, setBalance] = useState("0");
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reqForm, setReqForm] = useState({ title: '', description: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (account) {
      fetchBalance();
      fetchRequests();
      fetchLeaderboard();
    }
  }, [account]);

  const fetchBalance = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const bal = await contract.balanceOf(account);
      setBalance(ethers.formatUnits(bal, 18));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`https://presentforstudent.onrender.com/api/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.filter(r => r.studentAddress.toLowerCase() === account.toLowerCase()));
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`https://presentforstudent.onrender.com/api/requests`);
      if (res.ok) {
        const data = await res.json();
        // Calculate totals for each student (only Issued requests)
        const totals = {};
        data.forEach(req => {
          if (req.status === 'Issued') {
            totals[req.studentAddress] = (totals[req.studentAddress] || 0) + 1; // Assuming 1 request = 1 achievement point for simplicity, or we would need the actual amount from a new field. Since we don't store amount in requests.json, we'll just count the number of achievements!
          }
        });
        const sorted = Object.keys(totals).map(addr => ({
          address: addr,
          count: totals[addr]
        })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5
        setLeaderboard(sorted);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!account) return alert(t.notConnected);
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('https://presentforstudent.onrender.com/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: "REQ_" + Date.now(),
          studentAddress: account,
          title: reqForm.title,
          description: reqForm.description,
          date: new Date().toISOString()
        })
      });
      if (res.ok) {
        setMessage(lang === 'en' ? "✅ Request submitted successfully!" : "✅ Đã nộp đơn thành công!");
        setReqForm({ title: '', description: '' });
        fetchRequests();
      }
    } catch (err) {
      setMessage(lang === 'en' ? "❌ Failed to submit." : "❌ Lỗi: Không thể gửi đơn.");
    }
    setLoading(false);
  };

  const handleRedeem = async (item) => {
    if (parseFloat(balance) < parseFloat(item.cost)) {
      return alert(lang === 'en' ? "Not enough ERT!" : "Không đủ ERT!");
    }
    setLoading(true);
    setMessage('');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.redeemTokens(ethers.parseUnits(item.cost, 18), item.id);
      setMessage(t.processing);
      await tx.wait();
      
      setMessage(lang === 'en' ? `🎉 Redeemed: ${item.name.en}` : `🎉 Đổi quà thành công: ${item.name.vi}`);
      fetchBalance();
    } catch (error) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.includes('rejected'))) {
        setMessage(lang === 'en' ? "❌ Rejected." : "❌ Đã hủy giao dịch.");
      } else {
        setMessage(lang === 'en' ? "❌ Failed." : "❌ Thất bại.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-10">
      {message && (
        <div className="modern-card p-4 text-center font-semibold text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-l-indigo-500">
          {message}
        </div>
      )}

      {/* Top Section: Balance & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Balance Card */}
        <div className="lg:col-span-2 modern-card p-8 flex flex-col justify-center bg-gradient-to-r from-blue-50 to-indigo-100/50 dark:from-slate-800 dark:to-indigo-900/30 border-none">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t.myBalance}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-mono mb-6">{account}</p>
          </div>
          <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            {balance} <span className="text-3xl font-semibold text-slate-500 dark:text-slate-400">ERT</span>
          </div>
        </div>

        {/* Leaderboard Card */}
        <div className="modern-card p-6 border-t-4 border-t-yellow-400">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            🏆 {t.leaderboard}
          </h3>
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">{t.noData}</p>
            ) : (
              leaderboard.map((lb, idx) => (
                <div key={lb.address} className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">#{idx + 1}</span>
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                      {lb.address.substring(0, 6)}...{lb.address.slice(-4)}
                    </span>
                  </div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {lb.count} {lang === 'en' ? 'Achievements' : 'Thành tích'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Submit Request Form */}
        <div className="modern-card p-6 border-t-4 border-t-blue-500">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">📝 {t.submitAchievement}</h3>
          <form onSubmit={handleRequestSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.achTitle}</label>
              <input
                type="text"
                value={reqForm.title}
                onChange={e => setReqForm({...reqForm, title: e.target.value})}
                required
                className="modern-input w-full p-3"
                placeholder={t.achTitlePh}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.achDesc}</label>
              <textarea
                value={reqForm.description}
                onChange={e => setReqForm({...reqForm, description: e.target.value})}
                required
                rows={4}
                className="modern-input w-full p-3"
                placeholder={t.achDescPh}
              />
            </div>
            <button type="submit" disabled={loading} className="modern-button w-full">
              {loading ? t.submitting : t.submitBtn}
            </button>
          </form>
        </div>

        {/* Requests List */}
        <div className="modern-card p-6 flex flex-col h-full border-t-4 border-t-indigo-500">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">📜 {t.reqHistory}</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[350px]">
            {requests.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center italic mt-10">{t.noReq}</p>
            ) : (
              requests.map(req => (
                <div key={req.id} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4 transition hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-white pr-2">{req.title}</h4>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                      req.status === 'Issued' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800' : 
                      req.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800 animate-pulse-slow' :
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{req.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reward Store */}
      <div className="modern-card p-8">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">🎁 {t.rewardStore}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {STORE_ITEMS.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-6 text-center transform transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500 group">
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{item.image}</div>
              <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{item.name[lang]}</h4>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-6">
                {item.cost} ERT
              </p>
              <button 
                onClick={() => handleRedeem(item)}
                disabled={loading}
                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-colors duration-200"
              >
                {t.redeemNow}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
