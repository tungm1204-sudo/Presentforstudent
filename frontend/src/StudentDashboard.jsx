import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x44A3875B9BC1e497DD4c3129092753e12462231A";
const CONTRACT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function redeemTokens(uint256 _amount, string memory _itemId) external"
];

const STORE_ITEMS = [
  { id: "ITEM_1", name: "University T-Shirt", cost: "50", image: "👕" },
  { id: "ITEM_2", name: "Highland Coffee Voucher", cost: "20", image: "☕" },
  { id: "ITEM_3", name: "Extra Credit Points (+1)", cost: "100", image: "⭐" },
];

function StudentDashboard({ account }) {
  const [balance, setBalance] = useState("0");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reqForm, setReqForm] = useState({ title: '', description: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (account) {
      fetchBalance();
      fetchRequests();
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

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!account) return alert("Connect wallet first!");
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
        setMessage("✅ Request submitted successfully! Waiting for staff approval.");
        setReqForm({ title: '', description: '' });
        fetchRequests();
      }
    } catch (err) {
      setMessage("❌ Error: Failed to submit request.");
    }
    setLoading(false);
  };

  const handleRedeem = async (item) => {
    if (parseFloat(balance) < parseFloat(item.cost)) {
      return alert("Not enough ERT tokens to redeem this item!");
    }
    setLoading(true);
    setMessage('');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.redeemTokens(ethers.parseUnits(item.cost, 18), item.id);
      setMessage(`⏳ Processing transaction for ${item.name}... Please wait.`);
      await tx.wait();
      
      setMessage(`🎉 Successfully redeemed: ${item.name}!`);
      fetchBalance();
    } catch (error) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.includes('rejected'))) {
        setMessage("❌ Transaction rejected by user.");
      } else {
        setMessage("❌ Error: Transaction failed.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up pb-10">
      {message && (
        <div className="modern-card p-4 text-center font-semibold text-indigo-800 bg-indigo-50 border-l-4 border-l-indigo-500">
          {message}
        </div>
      )}

      {/* Balance Card */}
      <div className="modern-card p-8 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-100/50 border-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">My ERT Balance</h2>
          <p className="text-slate-500 text-sm font-mono">{account || "Wallet not connected"}</p>
        </div>
        <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          {balance} <span className="text-2xl font-semibold text-slate-500">ERT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Submit Request Form */}
        <div className="modern-card p-6 border-t-4 border-t-blue-500">
          <h3 className="text-xl font-bold text-slate-800 mb-6">📝 Submit Achievement Proof</h3>
          <form onSubmit={handleRequestSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Achievement Title</label>
              <input
                type="text"
                value={reqForm.title}
                onChange={e => setReqForm({...reqForm, title: e.target.value})}
                required
                className="modern-input w-full p-3"
                placeholder="e.g. First Prize in Hackathon..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description / Proof Link</label>
              <textarea
                value={reqForm.description}
                onChange={e => setReqForm({...reqForm, description: e.target.value})}
                required
                rows={4}
                className="modern-input w-full p-3"
                placeholder="Describe what you achieved and provide evidence links..."
              />
            </div>
            <button type="submit" disabled={loading} className="modern-button w-full">
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        </div>

        {/* Requests List */}
        <div className="modern-card p-6 flex flex-col h-full border-t-4 border-t-indigo-500">
          <h3 className="text-xl font-bold text-slate-800 mb-6">📜 My Requests History</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[350px]">
            {requests.length === 0 ? (
              <p className="text-slate-400 text-center italic mt-10">No requests submitted yet.</p>
            ) : (
              requests.map(req => (
                <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 pr-2">{req.title}</h4>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                      req.status === 'Issued' ? 'bg-green-100 text-green-700 border border-green-200' : 
                      req.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 animate-pulse-slow' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{req.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reward Store */}
      <div className="modern-card p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">🎁 Reward Store</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {STORE_ITEMS.map(item => (
            <div key={item.id} className="bg-white border-2 border-slate-100 rounded-2xl p-6 text-center transform transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-indigo-100 group">
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{item.image}</div>
              <h4 className="font-bold text-lg text-slate-800 mb-2">{item.name}</h4>
              <p className="text-2xl font-extrabold text-indigo-600 mb-6">
                {item.cost} ERT
              </p>
              <button 
                onClick={() => handleRedeem(item)}
                disabled={loading}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl transition-colors duration-200"
              >
                Redeem Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
