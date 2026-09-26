import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

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
  const [studentInfo, setStudentInfo] = useState(null);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    if (account) {
      fetchStudentInfo();
      fetchBalance();
      fetchRequests();
      fetchRedemptions();
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

  const fetchRedemptions = async () => {
    try {
      const res = await fetch(`https://presentforstudent.onrender.com/api/redemptions/${account}`);
      if (res.ok) {
        const data = await res.json();
        setRedemptions(data);
      }
    } catch (error) {
      console.error("Error fetching redemptions:", error);
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
    if (!account) return toast.error(t.notConnected);
    
    const toastId = toast.loading(lang === 'en' ? "Submitting request..." : "Đang gửi đơn...");
    setLoading(true);
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
        toast.success(lang === 'en' ? "Request submitted successfully!" : "Đã nộp đơn thành công!", { id: toastId });
        setReqForm({ title: '', description: '' });
        fetchRequests();
      } else {
        toast.error(lang === 'en' ? "Failed to submit." : "Lỗi: Không thể gửi đơn.", { id: toastId });
      }
    } catch (err) {
      toast.error(lang === 'en' ? "Failed to submit." : "Lỗi: Không thể gửi đơn.", { id: toastId });
    }
    setLoading(false);
  };

  const handleCancelRequest = async (id) => {
    const toastId = toast.loading(lang === 'en' ? "Canceling..." : "Đang hủy đơn...");
    setLoading(true);
    try {
      const res = await fetch(`https://presentforstudent.onrender.com/api/requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(lang === 'en' ? "Request canceled." : "Đã hủy đơn.", { id: toastId });
        fetchRequests();
      } else {
        toast.error("Failed to cancel.", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to cancel.", { id: toastId });
    }
    setLoading(false);
  };

  const handleRedeem = async (item) => {
    if (parseFloat(balance) < parseFloat(item.cost)) {
      return toast.error(lang === 'en' ? "Not enough ERT!" : "Không đủ ERT!");
    }
    const toastId = toast.loading(lang === 'en' ? "Waiting for blockchain confirmation..." : "Đang chờ xác nhận từ Blockchain...");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.redeemTokens(ethers.parseUnits(item.cost, 18), item.id);
      toast.loading(lang === 'en' ? "Processing transaction..." : "Đang xử lý giao dịch trên Blockchain...", { id: toastId });
      await tx.wait();
      
      toast.success(lang === 'en' ? `🎉 Redeemed: ${item.name.en}` : `🎉 Đổi quà thành công: ${item.name.vi}`, { id: toastId });
      fetchBalance();
      fetchRedemptions();
    } catch (error) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.includes('rejected'))) {
        toast.error(lang === 'en' ? "Transaction rejected by user." : "Bạn đã hủy giao dịch.", { id: toastId });
      } else {
        toast.error(lang === 'en' ? "Transaction failed." : "Giao dịch thất bại.", { id: toastId });
      }
    }
    setLoading(false);
  };

  const ledger = [
    ...requests.filter(r => r.status === 'Issued').map(r => ({ type: 'earn', title: r.title, amount: r.amount || '?', date: r.issuedAt || r.date, id: r.id })),
    ...redemptions.map(r => ({ type: 'spend', title: r.itemId, amount: r.amount, date: r.date, id: r.id }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className={`max-w-6xl mx-auto space-y-10 pb-12 font-sans ${loading ? 'pointer-events-none opacity-60 transition-opacity' : ''}`}>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-academic-blue border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-semibold text-academic-dark dark:text-white">Processing...</p>
          </div>
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
                    <span className="font-bold text-xl">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-academic-gold text-base">#{idx + 1}</span>}
                    </span>
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
              <div className="flex flex-col items-center justify-center h-full mt-10">
                <span className="text-5xl grayscale opacity-50 mb-3">📭</span>
                <p className="text-gray-400 text-center italic">{t.noReq}</p>
              </div>
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
                  
                  {req.status === 'Pending Review' && (
                    <div className="mt-3 text-right">
                      <button onClick={() => handleCancelRequest(req.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 underline transition-colors">
                        {lang === 'en' ? 'Cancel Request' : 'Hủy đơn này'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Student Ledger */}
      <div className="edu-card p-8 border-t-4 border-t-emerald-500 bg-white dark:bg-slate-800">
        <h3 className="text-xl font-display font-bold text-academic-dark dark:text-white mb-6 flex items-center gap-2">📊 {lang === 'en' ? 'Transaction History' : 'Lịch Sử Giao Dịch'}</h3>
        <div className="space-y-3">
          {ledger.length === 0 ? (
             <p className="text-gray-400 text-sm italic">{lang === 'en' ? 'No transactions yet.' : 'Chưa có giao dịch nào.'}</p>
          ) : (
            ledger.map(tx => (
              <div key={tx.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-academic-dark dark:text-white">
                    {tx.type === 'earn' ? tx.title : `Bought: ${STORE_ITEMS.find(i => i.id === tx.title)?.name[lang] || tx.title}`}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(tx.date).toLocaleString()}</span>
                </div>
                <div className={`font-bold font-mono ${tx.type === 'earn' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount} ERT
                </div>
              </div>
            ))
          )}
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
