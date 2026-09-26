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
  const [students, setStudents] = useState({});

  useEffect(() => {
    fetchStudents();
    fetchRequests();
    if (account) fetchStats();
  }, [account]);

  const fetchStudents = async () => {
    try {
      const res = await fetch('https://presentforstudent.onrender.com/api/students');
      if (res.ok) {
        const data = await res.json();
        const studentMap = {};
        data.forEach(s => {
          studentMap[s.address.toLowerCase()] = s;
        });
        setStudents(studentMap);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    <div className="max-w-4xl mx-auto space-y-10 pb-12 font-sans">
      <div className="text-center mb-12">
        <div className="text-6xl mb-6">👨‍🏫</div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-academic-blue dark:text-academic-lightBlue mb-4">{t.staffTitle}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-lg mx-auto">{t.staffDesc}</p>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="edu-card p-8 flex items-center justify-between bg-white dark:bg-slate-800">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">{lang === 'en' ? 'Gas Balance' : 'Số dư phí Gas'}</p>
            <p className="text-3xl font-bold text-academic-dark dark:text-white">{ethBalance} <span className="text-lg font-medium text-gray-400">ETH</span></p>
          </div>
          <div className="text-5xl opacity-80 drop-shadow-sm">⛽</div>
        </div>
        <div className="edu-card p-8 flex items-center justify-between border-b-4 border-academic-gold bg-white dark:bg-slate-800">
          <div>
            <p className="text-sm font-semibold text-academic-blue dark:text-academic-lightBlue uppercase tracking-widest mb-2">{lang === 'en' ? 'Total ERT Minted' : 'Tổng ERT Đã Cấp'}</p>
            <p className="text-3xl font-bold text-academic-blue dark:text-academic-lightBlue">{totalSupply} <span className="text-lg font-medium text-gray-400">ERT</span></p>
          </div>
          <div className="text-5xl opacity-80 drop-shadow-sm">🏦</div>
        </div>
      </div>
      
      {message && (
        <div className="p-4 rounded-xl text-center font-semibold bg-blue-50 text-blue-800 border-l-4 border-blue-500 shadow-sm dark:bg-blue-900/30 dark:text-blue-300">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="edu-card p-16 text-center bg-slate-50 dark:bg-slate-800/50">
            <span className="text-6xl block mb-6 drop-shadow-sm">📭</span>
            <p className="text-gray-500 text-lg font-medium">{t.noPending}</p>
          </div>
        ) : (
          requests.map(req => {
            const studentInfo = students[req.studentAddress.toLowerCase()];
            return (
            <div key={req.id} className="edu-card p-8 flex flex-col md:flex-row gap-8 items-center border-l-4 border-l-academic-blue bg-white dark:bg-slate-800">
              <div className="flex-1 w-full">
                <h3 className="text-xl font-bold text-academic-dark dark:text-white">{req.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-3 text-base leading-relaxed">{req.description}</p>
                
                <div className="mt-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-sm">
                    🎓
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-academic-blue dark:text-academic-lightBlue">
                      {studentInfo ? studentInfo.name : 'Unknown Student'}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {studentInfo ? studentInfo.studentId : (req.studentAddress.substring(0, 8) + '...')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto pt-5 md:pt-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 md:pl-6">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={t.amount}
                    value={amounts[req.id] || ''}
                    onChange={(e) => handleAmountChange(req.id, e.target.value)}
                    className="edu-input w-full sm:w-36 pr-12 text-right"
                  />
                  <span className="absolute right-4 top-3.5 text-gray-400 font-semibold text-sm">ERT</span>
                </div>
                <button
                  onClick={() => handleApprove(req)}
                  disabled={loading}
                  className="edu-button whitespace-nowrap py-3"
                >
                  {loading ? t.processing : t.approveMint}
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default StaffDashboard;
