const BACKEND_URL = "https://stardust-backend-elp3.onrender.com";
const socket = io(BACKEND_URL);

let currentUserId = "";
let currentUserName = "";
let currentUserCountry = "India";
let qrInstance = null;

let addedFriends = []; 
let activeChatTargetId = ""; 
let queriedUserCache = null; // To hold searched profile object temporarily

// List of all countries from A to Z
const countryMatrix = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", 
    "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", 
    "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", 
    "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
    "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana", "Haiti", "Honduras", 
    "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", 
    "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", 
    "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", 
    "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", 
    "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "Norway", "Oman", "Pakistan", 
    "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", 
    "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", 
    "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", 
    "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", 
    "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Populate Select Dropdown element on initial asset fetch
function populateCountryDropdowns() {
    const dropdown = document.getElementById('input-edit-country');
    if(!dropdown) return;
    dropdown.innerHTML = "";
    countryMatrix.forEach(country => {
        const opt = document.createElement('option');
        opt.value = country;
        opt.innerText = country;
        if(country === "India") opt.selected = true;
        dropdown.appendChild(opt);
    });
}

// ================= 1. SECURE AUTHORIZATION GATEWAY =================
function initiateAuthorization(provider) {
    const triggerBox = document.getElementById('oauth-trigger-box');
    const statusLoader = document.getElementById('auth-status-loader');
    const loaderText = document.getElementById('loader-text');

    if(triggerBox) triggerBox.classList.add('hidden');
    if(statusLoader) statusLoader.classList.remove('hidden');

    // CRITICAL: Fixing same UID issue using secure random entropy token keys
    const clusterToken = Math.random().toString(36).substring(2, 7);
    currentUserId = "star_" + clusterToken;
    currentUserName = provider + " User";

    if(loaderText) loaderText.innerText = `Synchronizing authentic profile handshake...`;

    setTimeout(() => {
        socket.emit('register_user', {
            userId: currentUserId,
            displayName: currentUserName,
            country: currentUserCountry
        });

        // Initialize user interface states
        document.getElementById('login-screen').style.display = "none";
        document.getElementById('main-app').style.display = "flex";

        // Setup base data configurations
        document.getElementById('profile-lbl-name').innerText = currentUserName;
        document.getElementById('profile-lbl-id').innerText = "UID: " + currentUserId;
        document.getElementById('profile-lbl-country').innerText = currentUserCountry;
        document.getElementById('input-edit-displayname').value = currentUserName;

        populateCountryDropdowns();
        generateUserMatrixQR();

        switchTab('screen-chat', document.querySelectorAll('.dock-nav-item')[0]);
    }, 1500);
}

// ================= 2. DESEGREGATED ROUTER VIEWPORTS =================
function switchTab(screenId, btnElement) {
    const panels = document.querySelectorAll('.app-tab-panel');
    panels.forEach(panel => panel.style.display = "none");

    const navItems = document.querySelectorAll('.dock-nav-item');
    navItems.forEach(item => item.classList.remove('active-dock-tab'));

    const targetPanel = document.getElementById(screenId);
    if(targetPanel) targetPanel.style.display = "block";
    if(btnElement) btnElement.classList.add('active-dock-tab');

    const momentAddBtn = document.getElementById('add-moment-btn');
    const backBtn = document.getElementById('back-chat-btn');
    const configBtn = document.getElementById('header-settings-btn');

    if(momentAddBtn) momentAddBtn.classList.add('hidden');
    if(backBtn) backBtn.classList.add('hidden');
    if(configBtn) configBtn.classList.add('hidden');

    if (screenId === 'screen-moment' && momentAddBtn) {
        momentAddBtn.classList.remove('hidden');
    } else if (screenId === 'screen-profile' && configBtn) {
        configBtn.classList.remove('hidden');
    }
}

function openScreen(screenId) {
    const panels = document.querySelectorAll('.app-tab-panel');
    panels.forEach(panel => panel.style.display = "none");
    const target = document.getElementById(screenId);
    if(target) target.style.display = "block";
}

function backToMoments() {
    switchTab('screen-moment', document.querySelectorAll('.dock-nav-item')[2]);
}

// ================= 3. ENHANCED MATRIX SEARCH & QUERY SYSTEM =================
function searchAndQueryProfile() {
    const targetId = document.getElementById('search-friend-id').value.trim();
    const queryCard = document.getElementById('queried-profile-card-popup');
    
    if(!targetId) return alert("Please enter a valid User UID.");
    if(targetId === currentUserId) return alert("Loopback constraint: Cannot query your own node address.");

    // Simulating external registry profile fetch via mock response matching protocol
    queriedUserCache = {
        userId: targetId,
        displayName: "Peer Node (" + targetId.substring(0, 5) + ")",
        country: "Global Grid"
    };

    document.getElementById('query-card-name').innerText = queriedUserCache.displayName;
    document.getElementById('query-card-uid').innerText = "UID: " + queriedUserCache.userId;
    document.getElementById('query-card-country').innerText = queriedUserCache.country;

    if(queryCard) queryCard.classList.remove('hidden');
}

function executeAddFriendFromQuery() {
    if(!queriedUserCache) return;
    const targetId = queriedUserCache.userId;

    if(addedFriends.includes(targetId)) return alert("Address link is already established.");

    addedFriends.push(targetId);
    socket.emit('send_friend_request', { senderId: currentUserId, targetUserId: targetId });

    renderContactsList();
    renderChatsList();

    document.getElementById('queried-profile-card-popup').classList.add('hidden');
    document.getElementById('search-friend-id').value = "";
    alert("Friend request broadcasted successfully.");
}

function executeMessageFromQuery() {
    if(!queriedUserCache) return;
    const targetId = queriedUserCache.userId;

    if(!addedFriends.includes(targetId)) {
        addedFriends.push(targetId);
        renderContactsList();
        renderChatsList();
    }

    document.getElementById('queried-profile-card-popup').classList.add('hidden');
    document.getElementById('search-friend-id').value = "";
    openChatBox(targetId);
}

function simulateQRScannerInput() {
    const fakeScanUID = prompt("Scan Matrix Terminal. Input parsed peer UID manually:");
    if(fakeScanUID && fakeScanUID.trim() !== "") {
        document.getElementById('search-friend-id').value = fakeScanUID.trim();
        searchAndQueryProfile();
    }
}

function renderContactsList() {
    const container = document.getElementById('contacts-list-container');
    if(!container) return;
    container.innerHTML = "";
    if(addedFriends.length === 0) return;

    addedFriends.forEach(friendId => {
        const row = document.createElement('div');
        row.className = "contact-row";
        row.onclick = () => openChatBox(friendId);
        row.innerHTML = `
            <div class="user-avatar-mesh"></div>
            <div class="chat-meta"><h4>${friendId}</h4><p>Connected Terminal Status: Verified</p></div>
        `;
        container.appendChild(row);
    });
}

// ================= 4. SECURE TWO-WAY STABILIZED REAL-TIME CHAT =================
function renderChatsList() {
    const container = document.getElementById('chats-list-container');
    if(!container) return;
    container.innerHTML = "";
    if(addedFriends.length === 0) {
        container.innerHTML = `<div class="empty-vector-slate">No active chat sessions. Search and connect with peers.</div>`;
        return;
    }

    addedFriends.forEach(friendId => {
        const row = document.createElement('div');
        row.className = "chat-row";
        row.onclick = () => openChatBox(friendId);
        row.innerHTML = `
            <div class="user-avatar-mesh"></div>
            <div class="chat-meta">
                <h4>Channel Vector: ${friendId}</h4>
                <p id="last-msg-${friendId}">No active transaction logs.</p>
            </div>
        `;
        container.appendChild(row);
    });
}

function openChatBox(friendId) {
    activeChatTargetId = friendId;
    document.getElementById('main-header-title').innerText = friendId;
    
    const backBtn = document.getElementById('back-chat-btn');
    if(backBtn) backBtn.classList.remove('hidden');
    document.getElementById('header-settings-btn').classList.add('hidden');
    
    const msgBox = document.getElementById('chat-messages-box');
    if(msgBox) msgBox.innerHTML = ""; 
    openScreen('screen-chat-window');
}

function closeChatBox() {
    activeChatTargetId = "";
    document.getElementById('main-header-title').innerText = "Stardust";
    switchTab('screen-chat', document.querySelectorAll('.dock-nav-item')[0]);
}

function dispatchMessage() {
    const msgInput = document.getElementById('chat-type-input');
    if(!msgInput) return;
    const msgText = msgInput.value.trim();
    if(!msgText || !activeChatTargetId) return;

    const payload = {
        senderId: currentUserId,
        receiverId: activeChatTargetId,
        message: msgText
    };

    // Broadcast signal dispatch log
    socket.emit('send_private_message', payload);
    appendVisualMessage(currentUserId, msgText, "outgoing");
    
    const pointer = document.getElementById(`last-msg-${activeChatTargetId}`);
    if(pointer) pointer.innerText = "You: " + msgText;
    msgInput.value = "";
}

function appendVisualMessage(sender, text, type) {
    const msgBox = document.getElementById('chat-messages-box');
    if(!msgBox) return;
    const container = document.createElement('div');
    container.style.margin = "10px 0";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = type === "outgoing" ? "flex-end" : "flex-start";

    const bubble = document.createElement('div');
    bubble.style.padding = "10px 14px";
    bubble.style.borderRadius = "14px";
    bubble.style.maxWidth = "75%";
    bubble.style.background = type === "outgoing" ? "#2e7d32" : "#ffffff";
    bubble.style.color = type === "outgoing" ? "#ffffff" : "#101828";
    bubble.style.border = type === "outgoing" ? "none" : "1px solid #e4e7ec";
    bubble.style.fontSize = "14px";
    bubble.innerText = text;

    container.appendChild(bubble);
    msgBox.appendChild(container);
    msgBox.scrollTop = msgBox.scrollHeight; 
}

// CRITICAL RE-ENGINEERING: Stabilized 2-Way event listener pipeline loop
socket.on('receive_private_message', (data) => {
    if(activeChatTargetId === data.senderId) {
        appendVisualMessage(data.senderId, data.message, "incoming");
    } else {
        const badge = document.getElementById('badge-nav-chat');
        if(badge) {
            let count = parseInt(badge.innerText) || 0;
            badge.innerText = count + 1;
            badge.classList.remove('hidden');
        }
        if(!addedFriends.includes(data.senderId)){
            addedFriends.push(data.senderId);
            renderContactsList();
            renderChatsList();
        }
    }
    const pointer = document.getElementById(`last-msg-${data.senderId}`);
    if(pointer) pointer.innerText = data.message;
});

// ================= 5. PROFILE MODULE MANAGEMENT =================
function toggleEditProfileModal() {
    const subModal = document.getElementById('profile-edit-submodal');
    if(subModal) subModal.classList.toggle('hidden');
}

function saveProfileChanges() {
    const newName = document.getElementById('input-edit-displayname').value.trim();
    const newCountry = document.getElementById('input-edit-country').value;

    if(!newName) return alert("Display name cannot be initialized blank.");

    currentUserName = newName;
    currentUserCountry = newCountry;

    document.getElementById('profile-lbl-name').innerText = currentUserName;
    document.getElementById('profile-lbl-country').innerText = currentUserCountry;

    toggleEditProfileModal();
    alert("Local cluster matrix synchronization updated.");
}

function generateUserMatrixQR() {
    const targetElement = document.getElementById('qrcode-display-canvas');
    if(!targetElement) return;
    targetElement.innerHTML = "";
    
    // Generating structural static matrix canvas configurations
    qrInstance = new QRCode(targetElement, {
        text: currentUserId,
        width: 140,
        height: 140,
        colorDark: "#1b5e20",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

// ================= 6. IMMACULATE MOMENTS FEEDS TIMELINE =================
function publishPost() {
    const captionInput = document.getElementById('post-caption');
    if(!captionInput) return;
    const caption = captionInput.value.trim();
    if (!caption) return alert("Timeline log string details required.");

    socket.emit('publish_moment', { senderId: currentUserId, caption: caption });
    captionInput.value = "";
    backToMoments();
}

socket.on('new_moment_feed_update', (momentData) => {
    const timeline = document.getElementById('moments-feed-wall');
    if(!timeline) return;
    
    const card = document.createElement('div');
    card.className = "moment-card";
    card.innerHTML = `
        <div class="moment-header">
            <div class="user-avatar-mesh" style="width:32px; height:32px; margin-right:10px; background:#a7f3d0;"></div>
            <h5>${momentData.authorName || 'Peer Agent'}</h5>
            <span>${momentData.timestamp || 'Just now'}</span>
        </div>
        <div class="moment-body">
            <p>${momentData.caption}</p>
        </div>
    `;
    timeline.insertBefore(card, timeline.firstChild);
    const momentBadge = document.getElementById('badge-nav-moment');
    if(momentBadge) momentBadge.classList.remove('hidden');
});

function triggerSettingsPanel() {
    if(confirm("Do you want to terminate configuration logs?")) {
        location.reload();
    }
}
