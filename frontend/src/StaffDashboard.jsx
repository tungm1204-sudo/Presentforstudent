import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

const CONTRACT_ADDRESS = "0x44A3875B9BC1e497DD4c3129092753e12462231A";
const CONTRACT_ABI = [
  "function issueReward(address _student, uint256 _amount, string memory _achievementId) external",
  "function totalSupply() external view returns (uint256)"
];

function StaffDashboard({ account, lang, t }) {
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
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
        setHistory(data.filter(r => r.status === 'Issued').sort((a,b) => new Date(b.issuedAt || b.date) - new Date(a.issuedAt || a.date)));
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
    if (!amount || parseFloat(amount) <= 0) return toast.error(lang === 'en' ? "Please enter a valid positive amount." : "Vui lòng nhập số lượng hợp lệ lớn hơn 0.");
    if (!account) return toast.error(t.notConnected);
    
    const toastId = toast.loading(lang === 'en' ? "Waiting for blockchain confirmation..." : "Đang chờ xác nhận từ Blockchain...");
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.issueReward(
        req.studentAddress,
        ethers.parseUnits(amount.toString(), 18),
        req.id
      );
      toast.loading(lang === 'en' ? "Processing reward..." : "Đang xử lý phát thưởng...", { id: toastId });
      await tx.wait();

      await fetch(`https://presentforstudent.onrender.com/api/requests/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Issued', amount: amount.toString() })
      });

      toast.success(lang === 'en' ? "✅ Reward successfully issued!" : "✅ Phát thưởng thành công!", { id: toastId });
      fetchRequests();
      fetchStats();
      setAmounts({ ...amounts, [req.id]: '' });
    } catch (error) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.includes('rejected'))) {
        toast.error(lang === 'en' ? "Transaction rejected." : "Bạn đã hủy giao dịch.", { id: toastId });
        await fetch(`https://presentforstudent.onrender.com/api/requests/${req.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Failed/Cancelled' })
        });
        fetchRequests();
      } else {
        toast.error(lang === 'en' ? "Failed to issue reward." : "Lỗi khi phát thưởng.", { id: toastId });
      }
    }
    setLoading(false);
  };

  const handleReject = async (id) => {
    const toastId = toast.loading(lang === 'en' ? "Rejecting..." : "Đang từ chối...");
    setLoading(true);
    try {
      const res = await fetch(`https://presentforstudent.onrender.com/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Failed/Cancelled' })
      });
      if (res.ok) {
        toast.success(lang === 'en' ? "Request rejected." : "Đã từ chối đơn.", { id: toastId });
        fetchRequests();
      } else {
        toast.error("Failed to reject.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error rejecting request.", { id: toastId });
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const header = "Date,Student Name,Student ID,Wallet Address,Achievement,Amount (ERT)\n";
    const rows = history.map(req => {
      const s = students[req.studentAddress.toLowerCase()] || {};
      return `"${new Date(req.issuedAt || req.date).toLocaleString()}","${s.name || 'Unknown'}","${s.studentId || ''}","${req.studentAddress}","${req.title}","${req.amount || 0}"`;
    }).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "staff_transaction_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`max-w-5xl mx-auto space-y-10 pb-12 font-sans ${loading ? 'pointer-events-none opacity-60 transition-opacity' : ''}`}>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-academic-blue border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-semibold text-academic-dark dark:text-white">Processing Transaction...</p>
          </div>
        </div>
      )}
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
              
              <div className="flex flex-col items-stretch gap-3 w-full md:w-auto pt-5 md:pt-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 md:pl-6">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
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
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors shadow-sm"
                >
                  {lang === 'en' ? '❌ Reject Request' : '❌ Từ chối đơn này'}
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Staff Transaction History */}
      <div className="edu-card p-8 border-t-4 border-t-emerald-500 bg-white dark:bg-slate-800 mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-xl font-display font-bold text-academic-dark dark:text-white flex items-center gap-2">
            📊 {lang === 'en' ? 'Transaction History' : 'Lịch Sử Chuyển Tiền'}
          </h3>
          <button onClick={exportToCSV} className="edu-button text-sm py-2 px-4 bg-emerald-600 hover:bg-emerald-700">
            {lang === 'en' ? '📥 Export to CSV' : '📥 Tải file CSV'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-sm uppercase text-gray-500">
                <th className="p-3 font-semibold">{lang === 'en' ? 'Date' : 'Ngày'}</th>
                <th className="p-3 font-semibold">{lang === 'en' ? 'Student' : 'Sinh Viên'}</th>
                <th className="p-3 font-semibold">{lang === 'en' ? 'Achievement' : 'Thành tích'}</th>
                <th className="p-3 font-semibold text-right">{lang === 'en' ? 'Amount' : 'Số tiền'}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-400 italic">
                    {lang === 'en' ? 'No transactions yet.' : 'Chưa có giao dịch nào.'}
                  </td>
                </tr>
              ) : (
                history.map(req => {
                  const s = students[req.studentAddress.toLowerCase()];
                  return (
                    <tr key={req.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(req.issuedAt || req.date).toLocaleDateString()} <br/>
                        <span className="text-xs text-gray-400">{new Date(req.issuedAt || req.date).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-academic-blue dark:text-academic-lightBlue text-sm">{s ? s.name : 'Unknown'}</p>
                        <p className="text-xs font-mono text-gray-500">{s ? s.studentId : req.studentAddress.substring(0,8)+'...'}</p>
                      </td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate" title={req.title}>
                        {req.title}
                      </td>
                      <td className="p-3 text-right font-bold text-green-600 dark:text-green-400 font-mono">
                        +{req.amount || '?'} ERT
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
