// Global Configuration - Connected with your live Render URL
const BACKEND_URL = "https://stardust-backend-elp3.onrender.com";
const socket = io(BACKEND_URL);

let currentUserId = "";
let currentUserName = "";
let currentUserCountry = "India";

let addedFriends = []; 
let activeChatTargetId = ""; 

// ================= 1. LOGIN GATEWAY SYSTEM =================
function mockLogin(provider) {
    const userField = document.getElementById('edit-username');
    const nameField = document.getElementById('edit-display-name');
    const countryField = document.getElementById('edit-country');

    if(!userField || !nameField) return;

    currentUserId = userField.value.trim();
    currentUserName = nameField.value.trim();
    currentUserCountry = countryField ? countryField.value : "India";

    if (!currentUserId || !currentUserName) {
        alert("Please setup your profile username and name first inside fields!");
        return;
    }

    const lblName = document.getElementById('profile-lbl-name');
    const lblId = document.getElementById('profile-lbl-id');
    if(lblName) lblName.innerText = currentUserName;
    if(lblId) lblId.innerText = currentUserId;

    socket.emit('register_user', {
        userId: currentUserId,
        displayName: currentUserName,
        country: currentUserCountry
    });

    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');

    if(loginScreen) loginScreen.style.display = "none";
    if(mainApp) mainApp.style.display = "block";
    
    switchTab('screen-chat', document.querySelectorAll('.nav-btn')[0]);
}

// ================= 2. CORE NAVIGATION CONTROLLER =================
function switchTab(screenId, btnElement) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.display = "none"; 
    });

    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active-btn'));

    const TargetScreen = document.getElementById(screenId);
    if(TargetScreen) {
        TargetScreen.style.display = "block"; 
    }
    if(btnElement) btnElement.classList.add('active-btn');

    const momentAddBtn = document.getElementById('add-moment-btn');
    const settingsBtn = document.getElementById('setting-profile-btn');
    const backBtn = document.getElementById('back-chat-btn');

    if(momentAddBtn) momentAddBtn.classList.add('hidden');
    if(settingsBtn) settingsBtn.classList.add('hidden');
    if(backBtn) backBtn.classList.add('hidden');

    if (screenId === 'screen-moment' && momentAddBtn) {
        momentAddBtn.classList.remove('hidden');
    } else if (screenId === 'screen-profile' && settingsBtn) {
        settingsBtn.classList.remove('hidden');
    }
}

function openScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.display = "none";
    });
    
    const target = document.getElementById(screenId);
    if(target) {
        target.style.display = "block";
    }
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

    addedFriends.push(targetId);
    socket.emit('send_friend_request', { senderId: currentUserId, targetUserId: targetId });

    renderContactsList();
    renderChatsList();
    document.getElementById('search-friend-id').value = "";
    alert("Contact added successfully.");
}

function renderContactsList() {
    const container = document.getElementById('contacts-list-container');
    if(!container) return;
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
    if(!container) return;
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
    
    document.getElementById('main-header-title').innerText = "Chatting with " + friendId;
    const backBtn = document.getElementById('back-chat-btn');
    if(backBtn) backBtn.classList.remove('hidden');
    
    const globalNav = document.getElementById('app-global-nav');
    if(globalNav) globalNav.style.display = "none";
    
    const msgBox = document.getElementById('chat-messages-box');
    if(msgBox) msgBox.innerHTML = ""; 
    openScreen('screen-chat-window');
}

function closeChatBox() {
    activeChatTargetId = "";
    document.getElementById('main-header-title').innerText = "STARDUST CHAT";
    const globalNav = document.getElementById('app-global-nav');
    if(globalNav) globalNav.style.display = "flex";
    switchTab('screen-chat', document.querySelectorAll('.nav-btn')[0]);
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

    socket.emit('send_private_message', payload);
    appendVisualMessage(currentUserId, msgText, "outgoing");
    
    const lastMsgPointer = document.getElementById(`last-msg-${activeChatTargetId}`);
    if(lastMsgPointer) lastMsgPointer.innerText = "You: " + msgText;

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
    bubble.style.borderRadius = "8px";
    bubble.style.maxWidth = "70%";
    bubble.style.background = type === "outgoing" ? "#007bff" : "#222";
    bubble.style.color = "#fff";
    bubble.style.fontSize = "14px";
    bubble.innerText = text;

    container.appendChild(bubble);
    msgBox.appendChild(container);
    msgBox.scrollTop = msgBox.scrollHeight; 
}

socket.on('receive_private_message', (data) => {
    if(activeChatTargetId === data.senderId) {
        appendVisualMessage(data.senderId, data.message, "incoming");
    } else {
        const badge = document.getElementById('badge-nav-chat');
        if(badge) {
            let currentCount = parseInt(badge.innerText) || 0;
            badge.innerText = currentCount + 1;
            badge.classList.remove('hidden');
        }
        
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
    const captionInput = document.getElementById('post-caption');
    if(!captionInput) return;
    const caption = captionInput.value.trim();
    if (!caption) return alert("Write a description message first!");

    const payload = {
        senderId: currentUserId,
        caption: caption,
        mediaUrl: "https://images.unsplash.com/photo-1540655037529-dec987208707?w=500", 
        mediaType: 'image'
    };

    socket.emit('publish_moment', payload);
    captionInput.value = "";
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
        <div style="padding: 10px 0;">
            <p class="post-text">${momentData.caption}</p>
        </div>
    `;
    timeline.insertBefore(card, timeline.firstChild);
    const momentBadge = document.getElementById('badge-nav-moment');
    if(momentBadge) momentBadge.classList.remove('hidden');
});

// ================= 5. INTERACTION SYSTEMS UI CONTROLS =================
function logout() {
    if(confirm("Do you want to sign out from connection matrix?")) {
        location.reload();
    }
}
function closeMediaFullscreen() {}
