// --- Simple Local "Database" ---
let users = JSON.parse(localStorage.getItem('vc_users') || '{}');
let blockchain = JSON.parse(localStorage.getItem('vc_blockchain') || '[]');
let voteCounts = JSON.parse(localStorage.getItem('vc_voteCounts') || '{}');
let loggedInUser = sessionStorage.getItem('vc_logged_user');

// --- UI Elements ---
const authSection = document.getElementById('auth-section');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const votingSection = document.getElementById('voting-section');
const votingForm = document.getElementById('voting-form');
const voteError = document.getElementById('vote-error');
const alreadyVoted = document.getElementById('already-voted');
const resultsSection = document.getElementById('results-section');
const voteCountUl = document.getElementById('vote-count');
const blockchainSection = document.getElementById('blockchain-section');
const blockchainLog = document.getElementById('blockchain-log');
const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');

const candidates = [ 'ashriya', 'nilisha','prapti','ayushna'];

// --- Blockchain Simulation ---
function hashBlock(block) {
    // Simple hash: JSON + last hash
    return btoa(unescape(encodeURIComponent(
        JSON.stringify(block) + (block.prevHash || '')
    ))).slice(0, 20);
}

function addBlock(user, candidate) {
    const lastBlock = blockchain.length ? blockchain[blockchain.length-1] : null;
    const block = {
        index: blockchain.length,
        timestamp: new Date().toISOString(),
        user,
        candidate,
        prevHash: lastBlock ? lastBlock.hash : 'genesis',
    };
    block.hash = hashBlock(block);
    blockchain.push(block);
    localStorage.setItem('vc_blockchain', JSON.stringify(blockchain));
}

function updateVoteCount(candidate) {
    voteCounts[candidate] = (voteCounts[candidate] || 0) + 1;
    localStorage.setItem('vc_voteCounts', JSON.stringify(voteCounts));
}

// --- UI Logic ---
function show(section) {
    authSection.style.display = 'none';
    votingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    blockchainSection.style.display = 'none';
    section.style.display = '';
}

function updateUI() {
    if (loggedInUser) {
        show(votingSection);
        resultsSection.style.display = '';
        blockchainSection.style.display = '';
        userInfo.innerText = "User: " + loggedInUser;
        logoutBtn.style.display = '';
        if (users[loggedInUser] && users[loggedInUser].voted) {
            votingForm.style.display = 'none';
            alreadyVoted.innerText = `You already voted for "${users[loggedInUser].voted}".`;
        } else {
            votingForm.style.display = '';
            alreadyVoted.innerText = '';
        }
        renderVoteCounts();
        renderBlockchain();
    } else {
        show(authSection);
        userInfo.innerText = "";
        logoutBtn.style.display = 'none';
    }
}

function renderVoteCounts() {
    voteCountUl.innerHTML = '';
    candidates.forEach(cand => {
        const li = document.createElement('li');
        li.innerText = `${cand}: ${voteCounts[cand] || 0}`;
        voteCountUl.appendChild(li);
    });
}

function renderBlockchain() {
    blockchainLog.innerHTML = '';
    blockchain.forEach(block => {
        const div = document.createElement('div');
        div.className = 'block';
        div.innerHTML = `
            <b>Block #${block.index}</b> | <small>${block.timestamp}</small><br>
            User: ${block.user}<br>
            Candidate: ${block.candidate}<br>
            Hash: <code>${block.hash}</code><br>
            Prev: <code>${block.prevHash}</code>
        `;
        blockchainLog.appendChild(div);
    });
}

// --- Live Update (simulate via localStorage event) ---
window.addEventListener('storage', (event) => {
    if (event.key === 'vc_blockchain' || event.key === 'vc_voteCounts') {
        blockchain = JSON.parse(localStorage.getItem('vc_blockchain') || '[]');
        voteCounts = JSON.parse(localStorage.getItem('vc_voteCounts') || '{}');
        renderVoteCounts();
        renderBlockchain();
    }
});

// --- Auth Logic ---
authForm.onsubmit = (e) => {
    e.preventDefault();
    const username = authForm.username.value.trim();
    const password = authForm.password.value.trim();
    if (!/^[\w]{3,15}$/.test(username)) {
        authError.innerText = "Username: 3-15 letters or numbers only.";
        return;
    }
    if (password.length < 3 || password.length > 15) {
        authError.innerText = "Password: 3-15 characters.";
        return;
    }
    if (!users[username]) {
        // Register
        users[username] = { password, voted: null };
        localStorage.setItem('vc_users', JSON.stringify(users));
    }
    if (users[username].password !== password) {
        authError.innerText = "Incorrect password.";
        return;
    }
    loggedInUser = username;
    sessionStorage.setItem('vc_logged_user', username);
    authError.innerText = "";
    updateUI();
};

// --- Voting Logic ---
votingForm.onsubmit = (e) => {
    e.preventDefault();
    voteError.innerText = "";
    const candidate = votingForm.candidate.value;
    if (!candidate || !candidates.includes(candidate)) {
        voteError.innerText = "Please select a valid candidate.";
        return;
    }
    if (users[loggedInUser].voted) {
        voteError.innerText = "You have already voted!";
        return;
    }
    // Add to blockchain and vote count
    addBlock(loggedInUser, candidate);
    updateVoteCount(candidate);
    users[loggedInUser].voted = candidate;
    localStorage.setItem('vc_users', JSON.stringify(users));
    // Live update for all tabs
    localStorage.setItem('vc_update', Date.now());
    updateUI();
};

// --- Logout Logic ---
logoutBtn.onclick = () => {
    sessionStorage.removeItem('vc_logged_user');
    loggedInUser = null;
    updateUI();
};

// --- Initial UI ---
updateUI();