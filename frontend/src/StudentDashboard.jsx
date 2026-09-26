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
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    if (account) {
      fetchStudentInfo();
      fetchBalance();
      fetchRequests();
      fetchLeaderboard();
    }
  }, [account]);

  const fetchStudentInfo = async () => {
    try {
      const res = await fetch(`https://presentforstudent.onrender.com/api/students/${account}`);
      if (res.ok) {
        const data = await res.json();
        setStudentInfo(data);
      }
    } catch (err) {
      console.error("Error fetching student info:", err);
    }
  };

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
    <div className="max-w-6xl mx-auto space-y-10 pb-12 font-sans">
      {message && (
        <div className="p-4 rounded-xl text-center font-semibold bg-blue-50 text-blue-800 border-l-4 border-blue-500 shadow-sm dark:bg-blue-900/30 dark:text-blue-300">
          {message}
        </div>
      )}

      {/* Top Section: Balance & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Balance Card */}
        <div className="lg:col-span-2 edu-card p-8 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <div>
            <h2 className="text-3xl font-display font-bold text-academic-blue dark:text-academic-lightBlue mb-2">
              {lang === 'en' ? 'Welcome' : 'Xin chào'}, {studentInfo ? `${studentInfo.name} (${studentInfo.studentId})` : account.substring(0,6) + '...'}
            </h2>
            <p className="text-gray-500 text-sm font-mono mb-6">{account}</p>
          </div>
          <div className="text-6xl font-display font-bold text-academic-dark dark:text-academic-light">
            {balance} <span className="text-2xl text-gray-500 font-sans ml-1 font-medium">ERT</span>
          </div>
        </div>

        {/* Leaderboard Card */}
        <div className="edu-card p-6 border-t-4 border-t-academic-gold bg-white dark:bg-slate-800">
          <h3 className="text-xl font-display font-bold text-academic-dark dark:text-white mb-6 flex items-center gap-2">
            🏆 {t.leaderboard}
          </h3>
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-500 italic">{t.noData}</p>
            ) : (
              leaderboard.map((lb, idx) => (
                <div key={lb.address} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-academic-gold">#{idx + 1}</span>
                    <span className="text-sm font-mono text-academic-dark dark:text-academic-light">
                      {lb.address.substring(0, 6)}...{lb.address.slice(-4)}
                    </span>
                  </div>
                  <span className="font-semibold text-academic-blue dark:text-academic-lightBlue text-sm bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded-lg">
                    {lb.count} {lang === 'en' ? 'ACH' : 'TT'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Submit Request Form */}
        <div className="edu-card p-8 border-t-4 border-t-academic-lightBlue bg-white dark:bg-slate-800">
          <h3 className="text-xl font-display font-bold text-academic-dark dark:text-white mb-6 flex items-center gap-2">📝 {t.submitAchievement}</h3>
          <form onSubmit={handleRequestSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t.achTitle}</label>
              <input
                type="text"
                value={reqForm.title}
                onChange={e => setReqForm({...reqForm, title: e.target.value})}
                required
                className="edu-input w-full"
                placeholder={t.achTitlePh}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t.achDesc}</label>
              <textarea
                value={reqForm.description}
                onChange={e => setReqForm({...reqForm, description: e.target.value})}
                required
                rows={4}
                className="edu-input w-full resize-none"
                placeholder={t.achDescPh}
              />
            </div>
            <button type="submit" disabled={loading} className="edu-button w-full mt-2">
              {loading ? t.submitting : t.submitBtn}
            </button>
          </form>
        </div>

        {/* Requests List */}
        <div className="edu-card p-8 flex flex-col h-full border-t-4 border-t-academic-blue bg-white dark:bg-slate-800">
          <h3 className="text-xl font-display font-bold text-academic-dark dark:text-white mb-6 flex items-center gap-2">📜 {t.reqHistory}</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[350px]">
            {requests.length === 0 ? (
              <p className="text-gray-400 text-center italic mt-10">{t.noReq}</p>
            ) : (
              requests.map(req => (
                <div key={req.id} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-4 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-academic-dark dark:text-white pr-2">{req.title}</h4>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
                      req.status === 'Issued' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 
                      req.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{req.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reward Store */}
      <div className="edu-card p-8 bg-white dark:bg-slate-800">
        <h3 className="text-2xl font-display font-bold text-academic-dark dark:text-white mb-8 text-center flex items-center justify-center gap-2">🎁 {t.rewardStore}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {STORE_ITEMS.map(item => (
            <div key={item.id} className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 text-center transform transition duration-300 hover:-translate-y-1 hover:shadow-lg group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{item.image}</div>
              <h4 className="font-semibold text-lg text-academic-dark dark:text-white mb-2">{item.name[lang]}</h4>
              <p className="text-2xl font-bold text-academic-blue dark:text-academic-lightBlue mb-6">
                {item.cost} <span className="text-lg font-medium text-gray-500">ERT</span>
              </p>
              <button 
                onClick={() => handleRedeem(item)}
                disabled={loading}
                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 text-academic-blue dark:text-academic-lightBlue font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
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
