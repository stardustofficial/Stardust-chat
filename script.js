const BACKEND_URL = "https://stardust-backend-elp3.onrender.com";
const socket = io(BACKEND_URL);

// Core Local Storage Variables Schema to maintain absolute persistence
let currentUserId = "";
let currentUserName = "";
let currentUserCountry = "India";
let currentUserPfp = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

let addedFriends = [];
let pendingRequests = [];
let activeChatTargetId = "";
let selectedMessageElementId = null; 
let activeReplyContextObject = null;
let currentSelectedMomentAttachment = null; 

// Initializing Local Database Array inside LocalStorage for historical tracking data
let localChatsMessageCache = JSON.parse(localStorage.getItem('stardust_db_chats')) || {};
let localMomentsCache = JSON.parse(localStorage.getItem('stardust_db_moments')) || [];

window.onload = function() {
    // Check for previous authenticated sessions
    const savedUID = localStorage.getItem('stardust_uid');
    const savedName = localStorage.getItem('stardust_name');
    const savedCountry = localStorage.getItem('stardust_country');
    const savedPfp = localStorage.getItem('stardust_pfp');
    const savedFriendsList = localStorage.getItem('stardust_friends');

    if(savedFriendsList) addedFriends = JSON.parse(savedFriendsList);
    if(savedCountry) currentUserCountry = savedCountry;
    if(savedPfp) currentUserPfp = savedPfp;

    if(savedUID && savedName) {
        currentUserId = savedUID;
        currentUserName = savedName;
        launchApplicationShell();
    }
}

function executePermanentLogin() {
    const uidInput = document.getElementById('login-uid-input').value.trim().toLowerCase();
    const nameInput = document.getElementById('login-name-input').value.trim();

    if(!uidInput || !nameInput) return alert("Credentials fields can't be empty.");
    if(uidInput.includes(" ")) return alert("Spaces are not allowed in UIDs.");

    currentUserId = uidInput;
    currentUserName = nameInput;

    localStorage.setItem('stardust_uid', currentUserId);
    localStorage.setItem('stardust_name', currentUserName);
    localStorage.setItem('stardust_pfp', currentUserPfp);
    localStorage.setItem('stardust_country', currentUserCountry);

    launchApplicationShell();
}

function launchApplicationShell() {
    socket.emit('register_user', { userId: currentUserId, displayName: currentUserName, country: currentUserCountry });

    document.getElementById('login-screen').style.display = "none";
    document.getElementById('main-app').style.display = "flex";

    // Global variable binding
    updateProfileDOMSelectors();

    const dropdown = document.getElementById('input-edit-country');
    dropdown.innerHTML = `
        <option value="India" selected>India</option>
        <option value="United States">United States</option>
        <option value="United Kingdom">United Kingdom</option>
        <option value="Canada">Canada</option>
    `;

    // Initialize personal matrix signature code canvas
    document.getElementById('qrcode-display-canvas').innerHTML = "";
    new QRCode(document.getElementById('qrcode-display-canvas'), {
        text: currentUserId, width: 130, height: 130
    });

    renderContactsList();
    renderChatsList();
    renderMomentsWallFeed();

    switchTab('screen-chat', document.querySelectorAll('.dock-nav-item')[0]);
}

function updateProfileDOMSelectors() {
    document.getElementById('profile-lbl-name').innerText = currentUserName;
    document.getElementById('profile-lbl-id').innerText = "UID: " + currentUserId;
    document.getElementById('profile-lbl-country').innerText = currentUserCountry;
    document.getElementById('profile-pfp-display').style.backgroundImage = `url('${currentUserPfp}')`;
    document.getElementById('input-edit-displayname').value = currentUserName;
    document.getElementById('input-edit-uid').value = currentUserId;
}

// ================= PLATFORM TABS LAYOUT ROUTER =================
function switchTab(screenId, btnElement) {
    document.querySelectorAll('.app-tab-panel').forEach(panel => panel.style.display = "none");
    document.querySelectorAll('.dock-nav-item').forEach(item => item.classList.remove('active-dock-tab'));

    const target = document.getElementById(screenId);
    if(target) target.style.display = "block";
    if(btnElement) btnElement.classList.add('active-dock-tab');

    // Context controls configuration resets
    document.getElementById('add-moment-btn').classList.add('hidden');
    document.getElementById('back-chat-btn').classList.add('hidden');
    document.getElementById('contact-menu-wrapper').classList.add('hidden');
    document.getElementById('header-settings-btn').classList.add('hidden');

    if (screenId === 'screen-moment') {
        document.getElementById('add-moment-btn').classList.remove('hidden');
        document.getElementById('badge-nav-moment').classList.add('hidden');
    } else if (screenId === 'screen-contact') {
        document.getElementById('contact-menu-wrapper').classList.remove('hidden');
    } else if (screenId === 'screen-profile') {
        document.getElementById('header-settings-btn').classList.remove('hidden');
    }
}

function openScreen(screenId) {
    document.querySelectorAll('.app-tab-panel').forEach(panel => panel.style.display = "none");
    document.getElementById(screenId).style.display = "block";
}

// ================= CONTACT 3-DOT MANAGEMENT MENU =================
function toggleThreeDotMenu() {
    document.getElementById('threedot-dropdown').classList.toggle('hidden');
}

function triggerMenuAction(action) {
    document.getElementById('threedot-dropdown').classList.add('hidden');
    if (action === 'add') {
        const inputId = prompt("Enter peer Target UID:");
        if(inputId && inputId.trim().toLowerCase() !== currentUserId) {
            searchAndQueryTargetUID(inputId.trim().toLowerCase());
        }
    } else if (action === 'scan') {
        document.getElementById('scan-option-modal').classList.remove('hidden');
    } else if (action === 'group') {
        alert("Group Creation feature is ready to implement on higher system nodes.");
    }
}

function triggerHardwareScanner(type) {
    document.getElementById('scan-option-modal').classList.add('hidden');
    if(type === 'camera') {
        document.getElementById('hidden-camera-input').click();
    } else {
        document.getElementById('hidden-gallery-input').click();
    }
}

function processFakeQRScan() {
    const mockUID = prompt("QR Handshake Decoded! Confirm target user node link parsed:", "amit_singh");
    if(mockUID) searchAndQueryTargetUID(mockUID.trim().toLowerCase());
}

function searchAndQueryTargetUID(targetId) {
    document.getElementById('query-card-name').innerText = "Matrix Verified Peer";
    document.getElementById('query-card-uid').innerText = "UID: " + targetId;
    document.getElementById('queried-profile-card-popup').classList.remove('hidden');
}

function executeAddFriendFromQuery() {
    const rawUIDText = document.getElementById('query-card-uid').innerText.replace("UID: ", "");
    if(addedFriends.includes(rawUIDText)) return alert("Connection already active.");

    socket.emit('send_friend_request', { senderId: currentUserId, targetUserId: rawUIDText });
    document.getElementById('queried-profile-card-popup').classList.add('hidden');
    alert("Friend connection frame dispatched.");
}

// Inbound connection radar captures
socket.on('incoming_friend_alert', (data) => {
    if(!pendingRequests.includes(data.senderId) && !addedFriends.includes(data.senderId)) {
        pendingRequests.push(data.senderId);
        renderPendingRequestsPanel();
        triggerInAppNotificationSound();
    }
});

function renderPendingRequestsPanel() {
    const panel = document.getElementById('incoming-requests-panel');
    document.getElementById('request-count-label').innerText = pendingRequests.length;
    panel.innerHTML = "";
    
    if(pendingRequests.length === 0) return;

    pendingRequests.forEach(senderId => {
        const row = document.createElement('div');
        row.className = "contact-row";
        row.innerHTML = `
            <div class="user-avatar-mesh" style="background-image:url('${currentUserPfp}')"></div>
            <div class="chat-meta"><h4>${senderId}</h4><p>Wants to establish secure link</p></div>
            <div class="request-action-cluster">
                <button class="req-btn accept" onclick="acceptFriendConnection('${senderId}')">Accept</button>
                <button class="req-btn decline" onclick="declineFriendConnection('${senderId}')">Decline</button>
            </div>
        `;
        panel.appendChild(row);
    });
}

function acceptFriendConnection(id) {
    pendingRequests = pendingRequests.filter(p => p !== id);
    if(!addedFriends.includes(id)) addedFriends.push(id);
    localStorage.setItem('stardust_friends', JSON.stringify(addedFriends));
    
    renderPendingRequestsPanel();
    renderContactsList();
    renderChatsList();
}

function renderContactsList() {
    const container = document.getElementById('contacts-list-container');
    container.innerHTML = "";
    addedFriends.forEach(f => {
        const row = document.createElement('div');
        row.className = "contact-row";
        row.onclick = () => openChatBox(f);
        row.innerHTML = `<div class="user-avatar-mesh" style="background-image:url('${currentUserPfp}')"></div><div class="chat-meta"><h4>${f}</h4><p>Click to stream terminal connection</p></div>`;
        container.appendChild(row);
    });
}

// ================= STABILIZED PERMANENT CHATS LOGS =================
function renderChatsList() {
    const container = document.getElementById('chats-list-container');
    container.innerHTML = "";
    if(addedFriends.length === 0) {
        container.innerHTML = `<div class="empty-vector-slate">No chat logs. Open menu to append friends.</div>`;
        return;
    }
    addedFriends.forEach(f => {
        const thread = localChatsMessageCache[f] || [];
        const lastMsgText = thread.length > 0 ? thread[thread.length - 1].message : "No historical trace log.";
        const row = document.createElement('div');
        row.className = "chat-row";
        row.onclick = () => openChatBox(f);
        row.innerHTML = `<div class="user-avatar-mesh" style="background-image:url('${currentUserPfp}')"></div><div class="chat-meta"><h4>${f}</h4><p>${lastMsgText}</p></div>`;
        container.appendChild(row);
    });
}

function openChatBox(friendId) {
    activeChatTargetId = friendId;
    document.getElementById('main-header-title').innerText = friendId;
    document.getElementById('back-chat-btn').classList.remove('hidden');
    document.getElementById('chat-messages-box').innerHTML = "";

    // Load from local operational memory cache arrays
    const thread = localChatsMessageCache[friendId] || [];
    thread.forEach(msg => appendVisualMessageNodeToVessel(msg));

    openScreen('screen-chat-window');
}

function closeChatBox() {
    activeChatTargetId = "";
    document.getElementById('main-header-title').innerText = "Stardust";
    renderChatsList();
    switchTab('screen-chat', document.querySelectorAll('.dock-nav-item')[0]);
}

function dispatchMessage() {
    const input = document.getElementById('chat-type-input');
    const txt = input.value.trim();
    if(!txt) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = "msg_" + Date.now();

    const dataPayload = {
        id: msgId,
        senderId: currentUserId,
        receiverId: activeChatTargetId,
        message: txt,
        time: timestamp,
        replyTo: activeReplyContextObject
    };

    socket.emit('send_private_message', dataPayload);
    
    // Save to Local DB State Storage instance
    saveIncomingMessageToLocalDatabase(activeChatTargetId, dataPayload);
    appendVisualMessageNodeToVessel(dataPayload);
    
    cancelReplyContext();
    input.value = "";
    document.getElementById('app-emoji-tray').classList.add('hidden');
}

function saveIncomingMessageToLocalDatabase(key, payload) {
    if(!localChatsMessageCache[key]) localChatsMessageCache[key] = [];
    localChatsMessageCache[key].push(payload);
    localStorage.setItem('stardust_db_chats', JSON.stringify(localChatsMessageCache));
}

function appendVisualMessageNodeToVessel(payload) {
    const box = document.getElementById('chat-messages-box');
    const direction = payload.senderId === currentUserId ? "outgoing" : "incoming";

    const wrapper = document.createElement('div');
    wrapper.className = `msg-bubble-wrapper ${direction}`;
    wrapper.id = payload.id;

    // Attach contextual press structural listeners
    wrapper.oncontextmenu = (e) => { e.preventDefault(); openLongPressMenuSheet(payload, direction); };
    
    // Mobile Touch Friendly Long Tap Detection Emulator
    let pressTimer;
    wrapper.ontouchstart = () => { pressTimer = setTimeout(() => openLongPressMenuSheet(payload, direction), 600); };
    wrapper.ontouchend = () => clearTimeout(pressTimer);

    let replyMarkup = "";
    if(payload.replyTo) {
        replyMarkup = `<span class="bubble-reply-context">↩ ${payload.replyTo}</span>`;
    }

    wrapper.innerHTML = `
        <div class="real-chat-bubble">
            ${replyMarkup}
            <span>${payload.message}</span>
        </div>
        <span class="bubble-timestamp">${payload.time}</span>
    `;

    box.appendChild(wrapper);
    box.scrollTop = box.scrollHeight;
}

socket.on('receive_private_message', (data) => {
    // Pipeline synchronization redirection
    saveIncomingMessageToLocalDatabase(data.senderId, data);
    
    if(activeChatTargetId === data.senderId) {
        appendVisualMessageNodeToVessel(data);
    } else {
        triggerInAppNotificationSound();
        const chatBadge = document.getElementById('badge-nav-chat');
        chatBadge.innerText = (parseInt(chatBadge.innerText) || 0) + 1;
        chatBadge.classList.remove('hidden');
    }
});

// ================= EXTENDED LONGPRESS SHEET IMPLEMENTATION =================
function openLongPressMenuSheet(payload, direction) {
    selectedMessageElementId = { id: payload.id, text: payload.message, user: payload.senderId };
    
    document.getElementById('opt-edit').classList.add('hidden');
    if(direction === 'outgoing') document.getElementById('opt-edit').classList.remove('hidden');

    document.getElementById('message-longpress-modal').classList.remove('hidden');
}

function closeLongPressModal() {
    document.getElementById('message-longpress-modal').classList.add('hidden');
}

function handleContextAction(action) {
    closeLongPressModal();
    if(!selectedMessageElementId) return;

    if(action === 'copy') {
        navigator.clipboard.writeText(selectedMessageElementId.text);
        alert("Message copied to clipboard matrix context.");
    } else if(action === 'reply') {
        activeReplyContextObject = selectedMessageElementId.text;
        document.getElementById('reply-banner-text').innerText = `Replying to: "${selectedMessageElementId.text}"`;
        document.getElementById('reply-context-banner').classList.remove('hidden');
    } else if(action === 'react') {
        alert("Reaction logged frame successfully.");
    } else if(action === 'edit') {
        const modified = prompt("Edit your localized message block:", selectedMessageElementId.text);
        if(modified && modified.trim() !== "") {
            // Update cache memory instantly
            const thread = localChatsMessageCache[activeChatTargetId];
            const matchingMsg = thread.find(m => m.id === selectedMessageElementId.id);
            if(matchingMsg) {
                matchingMsg.message = modified;
                localStorage.setItem('stardust_db_chats', JSON.stringify(localChatsMessageCache));
                openChatBox(activeChatTargetId); // Hot reload display frame layout instantly
            }
        }
    }
}

function cancelReplyContext() {
    activeReplyContextObject = null;
    document.getElementById('reply-context-banner').classList.add('hidden');
}

// Emoji panel insertions
function toggleEmojiTray() { document.getElementById('app-emoji-tray').classList.toggle('hidden'); }
function insertEmoji(em) { document.getElementById('chat-type-input').value += em; }

// ================= ADVANCED MEDIA ATTACHED MOMENTS TIMELINE =================
function handleMomentMediaSelection() {
    const file = document.getElementById('hidden-moment-media').files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentSelectedMomentAttachment = e.target.result;
        const targetView = document.getElementById('moment-media-preview');
        targetView.innerHTML = file.type.includes('video') ? `<video src="${currentSelectedMomentAttachment}" autoplay muted loop></video>` : `<img src="${currentSelectedMomentAttachment}">`;
        targetView.classList.remove('hidden');
    }
    reader.readAsDataURL(file);
}

function publishPost() {
    const cap = document.getElementById('post-caption').value.trim();
    if(!cap && !currentSelectedMomentAttachment) return alert("Moment post body scope missing.");

    const postPayload = {
        id: "post_" + Date.now(),
        senderId: currentUserId,
        caption: cap,
        media: currentSelectedMomentAttachment,
        likes: 0,
        comments: []
    };

    socket.emit('publish_moment', postPayload);
    
    localMomentsCache.unshift(postPayload);
    localStorage.setItem('stardust_db_moments', JSON.stringify(localMomentsCache));

    // Reset components parameters variables
    document.getElementById('post-caption').value = "";
    document.getElementById('moment-media-preview').classList.add('hidden');
    currentSelectedMomentAttachment = null;

    renderMomentsWallFeed();
    backToMoments();
}

socket.on('new_moment_feed_update', (data) => {
    // Intercept inbound remote feeds alerts arrays
    localMomentsCache.unshift(data);
    localStorage.setItem('stardust_db_moments', JSON.stringify(localMomentsCache));
    renderMomentsWallFeed();
    document.getElementById('badge-nav-moment').classList.remove('hidden');
});

function renderMomentsWallFeed() {
    const wall = document.getElementById('moments-feed-wall');
    wall.innerHTML = "";
    
    if(localMomentsCache.length === 0) {
        wall.innerHTML = `<div class="empty-vector-slate">No shared timeline moments visible.</div>`;
        return;
    }

    localMomentsCache.forEach(m => {
        const card = document.createElement('div');
        card.className = "moment-card";
        
        let mediaTag = m.media ? (m.media.includes('video') || m.media.includes('mp4') ? `<video class="moment-attached-media" src="${m.media}" autoplay muted loop></video>` : `<img class="moment-attached-media" src="${m.media}">`) : "";
        
        let commentsBlock = m.comments.map(c => `<div><b>${c.user}:</b> ${c.text}</div>`).join('');

        card.innerHTML = `
            <div class="moment-header">
                <div class="user-avatar-mesh" style="width:32px; height:32px; background-image:url('${currentUserPfp}')"></div>
                <h5>${m.senderId}</h5>
                <span>Timeline Log</span>
            </div>
            <div class="moment-body"><p>${m.caption}</p></div>
            ${mediaTag}
            <div class="moment-interactive-footer">
                <button class="footer-action-trigger-btn" onclick="executeLikeMoment('${m.id}')">❤️ Like (${m.likes})</button>
                <button class="footer-action-trigger-btn" onclick="appendCommentToMoment('${m.id}')">💬 Comment</button>
            </div>
            <div class="moment-comments-log-box">${commentsBlock || 'No micro comment entries logged yet.'}</div>
        `;
        wall.appendChild(card);
    });
}

function executeLikeMoment(id) {
    const targeted = localMomentsCache.find(m => m.id === id);
    if(targeted) { targeted.likes++; localStorage.setItem('stardust_db_moments', JSON.stringify(localMomentsCache)); renderMomentsWallFeed(); }
}

function appendCommentToMoment(id) {
    const text = prompt("Append text comment matrix branch:");
    if(!text) return;
    const targeted = localMomentsCache.find(m => m.id === id);
    if(targeted) { targeted.comments.push({ user: currentUserId, text: text }); localStorage.setItem('stardust_db_moments', JSON.stringify(localMomentsCache)); renderMomentsWallFeed(); }
}

function backToMoments() { switchTab('screen-moment', document.querySelectorAll('.dock-nav-item')[2]); }

// ================= INTERACTIVE DYNAMIC PROFILE GRAPHICS =================
function toggleEditProfileModal() { document.getElementById('profile-edit-submodal').classList.toggle('hidden'); }

function processProfilePictureUpload() {
    const file = document.getElementById('hidden-pfp-input').files[0];
    if(file) {
        const r = new FileReader(); r.onload = (e) => { currentUserPfp = e.target.result; localStorage.setItem('stardust_pfp', currentUserPfp); updateProfileDOMSelectors(); }; r.readAsDataURL(file);
    }
}

function saveProfileChanges() {
    const nextUID = document.getElementById('input-edit-uid').value.trim().toLowerCase();
    const nextName = document.getElementById('input-edit-displayname').value.trim();
    const nextCountry = document.getElementById('input-edit-country').value;

    if(!nextUID || !nextName) return alert("Fields cannot be validated as blank lines.");
    if(nextUID.includes(" ")) return alert("UID structural syntax spaces are rejected.");

    currentUserId = nextUID;
    currentUserName = nextName;
    currentUserCountry = nextCountry;

    localStorage.setItem('stardust_uid', currentUserId);
    localStorage.setItem('stardust_name', currentUserName);
    localStorage.setItem('stardust_country', currentUserCountry);

    launchApplicationShell();
    toggleEditProfileModal();
}

function downloadQRCodeToGallery() {
    // Fetching the base canvas matrix image stream object context
    const imgTag = document.getElementById('qrcode-display-canvas').querySelector('img');
    if(!imgTag) return alert("QR generation failure profile loop.");
    
    const virtualLink = document.createElement('a');
    virtualLink.href = imgTag.src;
    virtualLink.download = `${currentUserId}_identity_matrix_qr.png`;
    document.body.appendChild(virtualLink);
    virtualLink.click();
    document.body.removeChild(virtualLink);
    alert("QR Identity code downloaded successfully to device files. Check gallery/downloads folder.");
}

function triggerInAppNotificationSound() {
    if(document.getElementById('setting-toggle-notif').checked) {
        document.getElementById('notif-sound-msg').play().catch(()=>{});
    }
}

function triggerLogout() {
    if(confirm("Warning! Purge local encrypted identities database records from browser window storage completely?")) {
        localStorage.clear();
        location.reload();
    }
}
