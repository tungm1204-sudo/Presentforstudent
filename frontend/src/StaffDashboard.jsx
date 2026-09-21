import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x44A3875B9BC1e497DD4c3129092753e12462231A";
const CONTRACT_ABI = [
  "function issueReward(address _student, uint256 _amount, string memory _achievementId) external"
];

function StaffDashboard({ account }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [amounts, setAmounts] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

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
    if (!amount || parseFloat(amount) <= 0) return alert("Please enter a valid reward amount.");
    if (!account) return alert("Please connect wallet first!");
    
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
      setMessage(`⏳ Processing reward for ${req.title}... Please wait.`);
      await tx.wait();

      // Fallback update just in case event listener is slow
      await fetch(`https://presentforstudent.onrender.com/api/requests/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Issued' })
      });

      setMessage("✅ Reward successfully issued!");
      fetchRequests();
    } catch (error) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.includes('rejected'))) {
        setMessage("❌ Transaction rejected by user.");
        // Mark as failed
        await fetch(`https://presentforstudent.onrender.com/api/requests/${req.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Failed/Cancelled' })
        });
        fetchRequests();
      } else {
        setMessage("❌ Error: Failed to issue reward.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Staff Approval Dashboard</h2>
        <p className="text-slate-500 mt-2 text-lg">Review student achievements and issue ERT rewards</p>
      </div>
      
      {message && (
        <div className="modern-card p-4 text-center font-semibold text-indigo-800 bg-indigo-50 border-l-4 border-l-indigo-500">
          {message}
        </div>
      )}

      <div className="space-y-5">
        {requests.length === 0 ? (
          <div className="modern-card p-16 text-center">
            <span className="text-6xl block mb-6 drop-shadow-sm">📭</span>
            <p className="text-slate-500 text-lg">No pending requests at the moment.</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="modern-card p-6 flex flex-col md:flex-row gap-6 items-center hover:shadow-2xl transition duration-300">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">{req.title}</h3>
                <p className="text-slate-600 mt-2">{req.description}</p>
                <div className="mt-4 text-sm font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded-lg inline-block">
                  Student: {req.studentAddress.substring(0, 8)}...{req.studentAddress.slice(-6)}
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Amount..."
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
                  {loading ? 'Processing...' : 'Approve & Mint'}
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
