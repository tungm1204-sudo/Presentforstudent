require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Setup JSON Databases
const ACHV_FILE = path.join(__dirname, 'achievements.json');
const REQ_FILE = path.join(__dirname, 'requests.json');
const REDEEM_FILE = path.join(__dirname, 'redemptions.json');
const STUDENT_FILE = path.join(__dirname, 'students.json');

const initFile = (file) => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([]));
};
[ACHV_FILE, REQ_FILE, REDEEM_FILE, STUDENT_FILE].forEach(initFile);

const getData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

// ABI and Contract Address
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const CONTRACT_ABI = [
    "event RewardIssued(address indexed student, uint256 amount, string achievementId, address indexed issuedBy)",
    "event TokensRedeemed(address indexed student, uint256 amount, string itemId)"
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// ==========================================
// API: STUDENTS (Định danh)
// ==========================================
app.get('/api/students', (req, res) => {
    try {
        res.json(getData(STUDENT_FILE));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/students/:address', (req, res) => {
    try {
        const students = getData(STUDENT_FILE);
        const student = students.find(s => s.address.toLowerCase() === req.params.address.toLowerCase());
        if (student) res.json(student);
        else res.status(404).json({ error: 'Not found' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/students', (req, res) => {
    const { address, name, studentId } = req.body;
    if (!address || !name || !studentId) return res.status(400).json({ error: 'Missing fields' });
    try {
        const students = getData(STUDENT_FILE);
        const index = students.findIndex(s => s.address.toLowerCase() === address.toLowerCase());
        if (index !== -1) {
            students[index] = { address, name, studentId };
        } else {
            students.push({ address, name, studentId });
        }
        saveData(STUDENT_FILE, students);
        res.status(201).json({ message: 'Student registered' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// API: STUDENT REQUESTS (Xin Duyệt)
// ==========================================
app.post('/api/requests', (req, res) => {
    const { id, studentAddress, title, description, date } = req.body;
    if (!id || !studentAddress || !title) return res.status(400).json({ error: 'Missing fields' });
    try {
        const requests = getData(REQ_FILE);
        requests.push({ id, studentAddress, title, description, date, status: 'Pending Review' });
        saveData(REQ_FILE, requests);
        res.status(201).json({ message: 'Request submitted', id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/requests', (req, res) => {
    try { res.json(getData(REQ_FILE)); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const { status, amount } = req.body;
    try {
        const requests = getData(REQ_FILE);
        const index = requests.findIndex(r => r.id === id);
        if (index !== -1) {
            requests[index].status = status;
            if (amount) requests[index].amount = amount;
            if (status === 'Issued') requests[index].issuedAt = new Date().toISOString();
            saveData(REQ_FILE, requests);
            res.json({ message: `Request updated to ${status}` });
        } else res.status(404).json({ error: 'Not found' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    try {
        const requests = getData(REQ_FILE);
        const newRequests = requests.filter(r => r.id !== id);
        saveData(REQ_FILE, newRequests);
        res.json({ message: 'Request deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// API: ACHIEVEMENTS (Trao Thưởng)
// ==========================================
app.post('/api/achievements', (req, res) => {
    const { id, studentAddress, title, description, date } = req.body;
    try {
        const achievements = getData(ACHV_FILE);
        achievements.push({ id, studentAddress, title, description, date, status: 'Pending' });
        saveData(ACHV_FILE, achievements);
        res.status(201).json({ message: 'Achievement saved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/achievements/:studentAddress', (req, res) => {
    try {
        const achievements = getData(ACHV_FILE);
        res.json(achievements.filter(a => a.studentAddress.toLowerCase() === req.params.studentAddress.toLowerCase()));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/achievements/:id/fail', (req, res) => {
    try {
        const achievements = getData(ACHV_FILE);
        const index = achievements.findIndex(a => a.id === req.params.id);
        if (index !== -1) {
            achievements[index].status = 'Failed/Cancelled';
            saveData(ACHV_FILE, achievements);
            res.json({ message: 'Marked as failed' });
        } else res.status(404).json({ error: 'Not found' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// API: REDEMPTIONS (Đổi Thưởng)
// ==========================================
app.get('/api/redemptions/:studentAddress', (req, res) => {
    try {
        const redemptions = getData(REDEEM_FILE);
        res.json(redemptions.filter(r => r.studentAddress.toLowerCase() === req.params.studentAddress.toLowerCase()));
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ==========================================
// EVENT LISTENERS
// ==========================================
if (CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    contract.on("RewardIssued", (student, amount, achievementId, issuedBy, event) => {
        console.log(`[Event] RewardIssued: ${amount} tokens to ${student} for ${achievementId}`);
        try {
            const requests = getData(REQ_FILE);
            const index = requests.findIndex(r => r.id === achievementId);
            if (index !== -1) {
                requests[index].status = 'Issued';
                requests[index].amount = ethers.formatUnits(amount, 18);
                requests[index].issuedAt = new Date().toISOString();
                saveData(REQ_FILE, requests);
            }
        } catch (err) { console.error(err); }
    });

    contract.on("TokensRedeemed", (student, amount, itemId, event) => {
        console.log(`[Event] TokensRedeemed: ${amount} tokens spent by ${student} for ${itemId}`);
        try {
            const redemptions = getData(REDEEM_FILE);
            redemptions.push({
                id: "RED_" + Date.now(),
                studentAddress: student,
                amount: ethers.formatUnits(amount, 18),
                itemId: itemId,
                date: new Date().toISOString()
            });
            saveData(REDEEM_FILE, redemptions);
        } catch (err) { console.error(err); }
    });
} else {
    console.log("Contract address not set. Event listeners are not active.");
}

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
