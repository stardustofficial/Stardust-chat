// Global Configuration - Connected with your live Render URL
const BACKEND_URL = "https://stardust-backend-elp3.onrender.com";
const socket = io(BACKEND_URL);

let currentUserId = "";
let currentUserName = "";
let currentUserCountry = "India";

let addedFriends = []; // Array to hold added friend IDs
let activeChatTargetId = ""; // Current open chat window user ID

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
    const backBtn = document.getElementById('back-chat-btn');

    momentAddBtn.classList.add('hidden');
    settingsBtn.classList.add('hidden');
    backBtn.classList.add('hidden');

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

// ================= 3. REAL-TIME CHAT & SEARCH ENGINE =================
function searchAndAddFriend() {
    const targetId = document.getElementById('search-friend-id').value.trim();
    if(!targetId) return alert("Please enter a valid User ID.");
    if(targetId === currentUserId) return alert("You cannot add yourself.");
    if(addedFriends.includes(targetId)) return alert("User already added to your contacts.");

    // Add locally and emit to server
    addedFriends.push(targetId);
    socket.emit('send_friend_request', { senderId: currentUserId, targetUserId: targetId });

    // Refresh UI lists
    renderContactsList();
    renderChatsList();
    document.getElementById('search-friend-id').value = "";
    alert("Contact added successfully.");
}

function renderContactsList() {
    const container = document.getElementById('contacts-list-container');
    container.innerHTML = "";
    if(addedFriends.length === 0) return;

    addedFriends.forEach(friendId => {
        const row = document.createElement('div');
        row.className = "contact-row";
        row.innerHTML = `
            <div class="avatar-circle"></div>
            <div class="contact-meta">
                <h4>User (${friendId})</h4>
            </div>
        `;
        container.appendChild(row);
    });
}

function renderChatsList() {
    const container = document.getElementById('chats-list-container');
    container.innerHTML = "";
    if(addedFriends.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#888; margin-top:20px;">No active chats. Add friends to start talking.</p>`;
        return;
    }

    addedFriends.forEach(friendId => {
        const row = document.createElement('div');
        row.className = "chat-row";
        row.onclick = () => openChatBox(friendId);
        row.innerHTML = `
            <div class="avatar-circle"></div>
            <div class="chat-meta">
                <h4>User ${friendId}</h4>
                <p id="last-msg-${friendId}">Click to start conversation</p>
            </div>
        `;
        container.appendChild(row);
    });
}

function openChatBox(friendId) {
    activeChatTargetId = friendId;
    
    // UI adjustment for dedicated chat view
    document.getElementById('main-header-title').innerText = "Chatting with " + friendId;
    document.getElementById('back-chat-btn').classList.remove('hidden');
    document.getElementById('app-global-nav').classList.add('app-hidden');
    
    document.getElementById('chat-messages-box').innerHTML = ""; // Clear log view
    openScreen('screen-chat-window');
}

function closeChatBox() {
    activeChatTargetId = "";
    document.getElementById('main-header-title').innerText = "STARDUST CHAT";
    document.getElementById('app-global-nav').classList.remove('app-hidden');
    switchTab('screen-chat', document.querySelectorAll('.nav-btn')[0]);
}

function dispatchMessage() {
    const msgText = document.getElementById('chat-type-input').value.trim();
    if(!msgText || !activeChatTargetId) return;

    const payload = {
        senderId: currentUserId,
        receiverId: activeChatTargetId,
        message: msgText
    };

    // Emit to Render backend server
    socket.emit('send_private_message', payload);

    // Show on my screen immediately
    appendVisualMessage(currentUserId, msgText, "outgoing");
    
    // Update last message pointer text in menu list safely
    const lastMsgPointer = document.getElementById(`last-msg-${activeChatTargetId}`);
    if(lastMsgPointer) lastMsgPointer.innerText = "You: " + msgText;

    document.getElementById('chat-type-input').value = "";
}

function appendVisualMessage(sender, text, type) {
    const msgBox = document.getElementById('chat-messages-box');
    const container = document.createElement('div');
    container.style.margin = "10px 0";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = type === "outgoing" ? "flex-end" : "flex-start";

    const bubble = document.createElement('div');
    bubble.style.padding = "10px 14px";
    bubble.style.borderRadius = "8px";
    bubble.style.maxWidth = "70%";
    bubble.style.background = type === "outgoing" ? "#007bff" : "#222";
    bubble.style.color = "#fff";
    bubble.style.fontSize = "14px";
    bubble.innerText = text;

    container.appendChild(bubble);
    msgBox.appendChild(container);
    msgBox.scrollTop = msgBox.scrollHeight; // Auto scroll down
}

// Render server responds when a private text message arrives
socket.on('receive_private_message', (data) => {
    // If chatting with this person right now, insert into view box directly
    if(activeChatTargetId === data.senderId) {
        appendVisualMessage(data.senderId, data.message, "incoming");
    } else {
        // Increment notification badge inside bottom bar matrix layout if tab is hidden
        const badge = document.getElementById('badge-nav-chat');
        let currentCount = parseInt(badge.innerText) || 0;
        badge.innerText = currentCount + 1;
        badge.classList.remove('hidden');
        
        // Auto add to friends list if a new unknown user pings
        if(!addedFriends.includes(data.senderId)){
            addedFriends.push(data.senderId);
            renderContactsList();
            renderChatsList();
        }
    }

    const lastMsgPointer = document.getElementById(`last-msg-${data.senderId}`);
    if(lastMsgPointer) lastMsgPointer.innerText = data.message;
});

// ================= 4. MOMENTS PUBLISH & TIMELINE EVENT =================
function publishPost() {
    const caption = document.getElementById('post-caption').value.trim();
    if (!caption) return alert("Write a description message first!");

    const payload = {
        senderId: currentUserId,
        caption: caption,
        mediaUrl: "https://images.unsplash.com/photo-1540655037529-dec987208707?w=500", 
        mediaType: 'image'
    };

    socket.emit('publish_moment', payload);
    document.getElementById('post-caption').value = "";
    backToMoments();
}

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
    document.getElementById('badge-nav-moment').classList.remove('hidden');
});

// ================= 5. INTERACTION SYSTEMS UI CONTROLS =================
function logout() {
    if(confirm("Do you want to sign out from connection matrix?")) {
        location.reload();
    }
}
function closeMediaFullscreen() {}
