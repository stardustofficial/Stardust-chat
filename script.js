// Global Configuration - Connected with your live Render URL
const BACKEND_URL = "https://stardust-backend-elp3.onrender.com";
const socket = io(BACKEND_URL);

let currentUserId = "";
let currentUserName = "";
let currentUserCountry = "India";

// ================= 1. LOGIN GATEWAY SYSTEM =================
function mockLogin(provider) {
    currentUserId = document.getElementById('edit-username').value.trim();
    currentUserName = document.getElementById('edit-display-name').value.trim();
    currentUserCountry = document.getElementById('edit-country').value;

    if (!currentUserId || !currentUserName) {
        alert("Please setup your profile username and name first inside fields!");
        return;
    }

    // Syncing names to Profile screen display labels
    document.getElementById('profile-lbl-name').innerText = currentUserName;
    document.getElementById('profile-lbl-id').innerText = currentUserId;

    // Backend Core Matrix Connection Link Trigger
    socket.emit('register_user', {
        userId: currentUserId,
        displayName: currentUserName,
        country: currentUserCountry
    });

    // Toggle screen viewing states
    document.getElementById('login-screen').classList.add('app-hidden');
    document.getElementById('main-app').classList.remove('app-hidden');
    
    // Default system landing screen setup
    switchTab('screen-chat', document.querySelectorAll('.nav-btn')[0]);
}

// ================= 2. CORE NAVIGATION CONTROLLER =================
function switchTab(screenId, btnElement) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active-screen'));

    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active-btn'));

    const TargetScreen = document.getElementById(screenId);
    if(TargetScreen) {
        TargetScreen.classList.add('active-screen');
    }
    if(btnElement) btnElement.classList.add('active-btn');

    // Action Header modifiers conditional adjustments
    const momentAddBtn = document.getElementById('add-moment-btn');
    const settingsBtn = document.getElementById('setting-profile-btn');

    momentAddBtn.classList.add('hidden');
    settingsBtn.classList.add('hidden');

    if (screenId === 'screen-moment') {
        momentAddBtn.classList.remove('hidden');
    } else if (screenId === 'screen-profile') {
        settingsBtn.classList.remove('hidden');
    }
}

function openScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active-screen'));
    
    const target = document.getElementById(screenId);
    if(target) target.classList.add('active-screen');
}

function backToMoments() {
    switchTab('screen-moment', document.querySelectorAll('.nav-btn')[2]);
}

// ================= 3. REAL-TIME CHAT ENGINE INTERFACES =================
socket.on('receive_private_message', (data) => {
    // Increment notification badge inside bottom bar matrix layout
    const badge = document.getElementById('badge-nav-chat');
    let currentCount = parseInt(badge.innerText) || 0;
    badge.innerText = currentCount + 1;
    badge.classList.remove('hidden');

    alert(`New text message from ${data.senderId}: ${data.message}`);
});

// ================= 4. MOMENTS PUBLISH & TIMELINE EVENT =================
function publishPost() {
    const caption = document.getElementById('post-caption').value.trim();
    if (!caption) return alert("Write a description message first!");

    const payload = {
        senderId: currentUserId,
        caption: caption,
        mediaUrl: "https://images.unsplash.com/photo-1540655037529-dec987208707?w=500", // Fallback system image mockup asset
        mediaType: 'image'
    };

    // Emit event directly to Render backend server
    socket.emit('publish_moment', payload);
    
    // Clear field elements
    document.getElementById('post-caption').value = "";
    backToMoments();
}

// Render server responds when any contact posts a new moment feed
socket.on('new_moment_feed_update', (momentData) => {
    const timeline = document.querySelector('.moments-timeline');
    if(!timeline) return;
    
    const card = document.createElement('div');
    card.className = "moment-premium-card";
    card.innerHTML = `
        <div class="moment-author">
            <div class="avatar-circle small"></div>
            <div>
                <h5>${momentData.authorName} (@${momentData.senderId})</h5>
                <span class="post-time">${momentData.timestamp}</span>
            </div>
        </div>
        <p class="post-text">${momentData.caption}</p>
    `;
    timeline.insertBefore(card, timeline.firstChild);

    // Light up an alert indicator badge on bottom navigation
    document.getElementById('badge-nav-moment').classList.remove('hidden');
});

// ================= 5. INTERACTION SYSTEMS UI CONTROLS =================
function logout() {
    if(confirm("Do you want to sign out from connection matrix?")) {
        location.reload();
    }
}
