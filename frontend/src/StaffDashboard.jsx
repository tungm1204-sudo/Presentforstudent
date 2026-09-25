import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x44A3875B9BC1e497DD4c3129092753e12462231A";
const CONTRACT_ABI = [
  "function issueReward(address _student, uint256 _amount, string memory _achievementId) external",
  "function totalSupply() external view returns (uint256)"
];

function StaffDashboard({ account, lang, t }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [amounts, setAmounts] = useState({});
  const [ethBalance, setEthBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');

  useEffect(() => {
    fetchRequests();
    if (account) fetchStats();
  }, [account]);

  const fetchStats = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const ethBal = await provider.getBalance(account);
      setEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));
      
      const total = await contract.totalSupply();
      setTotalSupply(ethers.formatUnits(total, 18));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('https://presentforstudent.onrender.com/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.filter(r => r.status === 'Pending Review'));
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleAmountChange = (id, value) => {
    setAmounts({ ...amounts, [id]: value });
  };

  const handleApprove = async (req) => {
    const amount = amounts[req.id];
    if (!amount || parseFloat(amount) <= 0) return alert(lang === 'en' ? "Please enter a valid amount." : "Vui lòng nhập số lượng hợp lệ.");
    if (!account) return alert(t.notConnected);
    
    setLoading(true);
    setMessage('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.issueReward(
        req.studentAddress,
        ethers.parseUnits(amount.toString(), 18),
        req.id
      );
      setMessage(lang === 'en' ? `⏳ Processing reward...` : `⏳ Đang xử lý phát thưởng...`);
      await tx.wait();

      // Fallback update just in case event listener is slow
      await fetch(`https://presentforstudent.onrender.com/api/requests/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Issued' })
      });

      setMessage(lang === 'en' ? "✅ Reward successfully issued!" : "✅ Phát thưởng thành công!");
      fetchRequests();
    } catch (error) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.includes('rejected'))) {
        setMessage(lang === 'en' ? "❌ Transaction rejected." : "❌ Đã hủy giao dịch.");
        // Mark as failed
        await fetch(`https://presentforstudent.onrender.com/api/requests/${req.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Failed/Cancelled' })
        });
        fetchRequests();
      } else {
        setMessage(lang === 'en' ? "❌ Failed to issue reward." : "❌ Lỗi khi phát thưởng.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-indigo-600 dark:from-white dark:to-indigo-300 tracking-tight pb-2">{t.staffTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">{t.staffDesc}</p>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="modern-card p-6 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Gas Balance' : 'Số dư phí Gas'}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{ethBalance} <span className="text-lg text-slate-500">ETH</span></p>
          </div>
          <div className="text-4xl">⛽</div>
        </div>
        <div className="modern-card p-6 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Total ERT Minted' : 'Tổng ERT Đã Cấp'}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalSupply} <span className="text-lg text-slate-500">ERT</span></p>
          </div>
          <div className="text-4xl">🏦</div>
        </div>
      </div>
      
      {message && (
        <div className="modern-card p-4 text-center font-semibold text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-l-indigo-500">
          {message}
        </div>
      )}

      <div className="space-y-5">
        {requests.length === 0 ? (
          <div className="modern-card p-16 text-center">
            <span className="text-6xl block mb-6 drop-shadow-sm">📭</span>
            <p className="text-slate-500 dark:text-slate-400 text-lg">{t.noPending}</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="modern-card p-6 flex flex-col md:flex-row gap-6 items-center hover:shadow-2xl transition duration-300">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{req.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 mt-2">{req.description}</p>
                <div className="mt-4 text-sm font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 p-2 rounded-lg inline-block">
                  {t.student}: {req.studentAddress.substring(0, 8)}...{req.studentAddress.slice(-6)}
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={t.amount}
                    value={amounts[req.id] || ''}
                    onChange={(e) => handleAmountChange(req.id, e.target.value)}
                    className="modern-input w-36 p-3 pr-12 text-right font-medium"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">ERT</span>
                </div>
                <button
                  onClick={() => handleApprove(req)}
                  disabled={loading}
                  className="modern-button whitespace-nowrap"
                >
                  {loading ? t.processing : t.approveMint}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StaffDashboard;
