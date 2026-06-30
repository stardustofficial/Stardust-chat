const BACKEND_URL = "https://stardust-backend-elp3.onrender.com";
const socket = io(BACKEND_URL);

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

// PERSISTENT CHAT HISTORY SYSTEM VIA BROWSER LOCAL DATABASE
let localChatsMessageCache = JSON.parse(localStorage.getItem('stardust_db_chats')) || {};
let localMomentsCache = JSON.parse(localStorage.getItem('stardust_db_moments')) || [];

window.onload = function() {
    // 1. Restore sessions securely
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

    // 2. HARDWARE OVER-RIDE EVENT LISTENERS FOR CLICKS
    const googleBtn = document.getElementById('btn-google-login');
    const wechatBtn = document.getElementById('btn-wechat-login');

    if(googleBtn) {
        googleBtn.addEventListener('click', function() {
            executeMockOAuth('Google');
        });
    }

    if(wechatBtn) {
        wechatBtn.addEventListener('click', function() {
            executeMockOAuth('WeChat');
        });
    }
}

function executeMockOAuth(provider) {
    console.log("OAuth Trigger initialized successfully for node:", provider);
    const mockHash = Math.floor(1000 + Math.random() * 9000);
    currentUserId = provider.toLowerCase() + "_" + mockHash;
    currentUserName = provider + " User " + mockHash;

    localStorage.setItem('stardust_uid', currentUserId);
    localStorage.setItem('stardust_name', currentUserName);
    localStorage.setItem('stardust_pfp', currentUserPfp);
    localStorage.setItem('stardust_country', currentUserCountry);

    launchApplicationShell();
}

function launchApplicationShell() {
    if(socket && socket.emit) {
        socket.emit('register_user', { userId: currentUserId, displayName: currentUserName, country: currentUserCountry });
    }

    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if(loginScreen) loginScreen.style.display = "none";
    if(mainApp) mainApp.style.display = "flex";

    updateProfileDOMSelectors();

    const dropdown = document.getElementById('input-edit-country');
    if (dropdown) {
        dropdown.innerHTML = `
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
        `;
        dropdown.value = currentUserCountry;
    }

    const qrContainer = document.getElementById('qrcode-display-canvas');
    if (qrContainer) {
        qrContainer.innerHTML = "";
        try {
            new QRCode(qrContainer, { text: currentUserId, width: 130, height: 130 });
        } catch (e) {
            console.log("QR Frame generator bypass state active.");
        }
    }

    renderContactsList();
    renderChatsList();
    renderMomentsWallFeed();

    switchTab('screen-chat', document.querySelectorAll('.dock-nav-item')[0]);
}

function updateProfileDOMSelectors() {
    if(document.getElementById('profile-lbl-name')) document.getElementById('profile-lbl-name').innerText = currentUserName;
    if(document.getElementById('profile-lbl-id')) document.getElementById('profile-lbl-id').innerText = "UID: " + currentUserId;
    if(document.getElementById('profile-lbl-country')) document.getElementById('profile-lbl-country').innerText = currentUserCountry;
    if(document.getElementById('profile-pfp-display')) document.getElementById('profile-pfp-display').style.backgroundImage = `url('${currentUserPfp}')`;
    if(document.getElementById('input-edit-displayname')) document.getElementById('input-edit-displayname').value = currentUserName;
    if(document.getElementById('input-edit-uid')) document.getElementById('input-edit-uid').value = currentUserId;
}

function switchTab(screenId, btnElement) {
    document.querySelectorAll('.app-tab-panel').forEach(panel => panel.style.display = "none");
    document.querySelectorAll('.dock-nav-item').forEach(item => item.classList.remove('active-dock-tab'));

    const target = document.getElementById(screenId);
    if(target) target.style.display = "block";
    if(btnElement) btnElement.classList.add('active-dock-tab');

    if(document.getElementById('add-moment-btn')) document.getElementById('add-moment-btn').classList.add('hidden');
    if(document.getElementById('back-chat-btn')) document.getElementById('back-chat-btn').classList.add('hidden');
    if(document.getElementById('contact-menu-wrapper')) document.getElementById('contact-menu-wrapper').classList.add('hidden');
    if(document.getElementById('header-settings-btn')) document.getElementById('header-settings-btn').classList.add('hidden');

    if (screenId === 'screen-moment') {
        if(document.getElementById('add-moment-btn')) document.getElementById('add-moment-btn').classList.remove('hidden');
        if(document.getElementById('badge-nav-moment')) document.getElementById('badge-nav-moment').classList.add('hidden');
    } else if (screenId === 'screen-contact') {
        if(document.getElementById('contact-menu-wrapper')) document.getElementById('contact-menu-wrapper').classList.remove('hidden');
    } else if (screenId === 'screen-profile') {
        if(document.getElementById('header-settings-btn')) document.getElementById('header-settings-btn').classList.remove('hidden');
    }
}

function openScreen(screenId) {
    document.querySelectorAll('.app-tab-panel').forEach(panel => panel.style.display = "none");
    const target = document.getElementById(screenId);
    if(target) target.style.display = "block";
}

function toggleThreeDotMenu() { 
    if(document.getElementById('threedot-dropdown')) document.getElementById('threedot-dropdown').classList.toggle('hidden'); 
}

function triggerMenuAction(action) {
    if(document.getElementById('threedot-dropdown')) document.getElementById('threedot-dropdown').classList.add('hidden');
    if (action === 'add') {
        const inputId = prompt("Enter target unique user ID:");
        if(inputId && inputId.trim().toLowerCase() !== currentUserId) {
            searchAndQueryTargetUID(inputId.trim().toLowerCase());
        }
    } else if (action === 'scan') {
        if(document.getElementById('scan-option-modal')) document.getElementById('scan-option-modal').classList.remove('hidden');
    } else if (action === 'group') {
        alert("Group Chat initialization payload active.");
    }
}

function triggerHardwareScanner(type) {
    if(document.getElementById('scan-option-modal')) document.getElementById('scan-option-modal').classList.add('hidden');
    if(type === 'camera' && document.getElementById('hidden-camera-input')) document.getElementById('hidden-camera-input').click();
    else if(document.getElementById('hidden-gallery-input')) document.getElementById('hidden-gallery-input').click();
}

function processFakeQRScan() {
    const parsedUID = prompt("Scan payload handshake captured! Confirm UID target parsed:", "user_node_99");
    if(parsedUID) searchAndQueryTargetUID(parsedUID.trim().toLowerCase());
}

function searchAndQueryTargetUID(targetId) {
    if(document.getElementById('query-card-name')) document.getElementById('query-card-name').innerText = "Matrix Verified Target User";
    if(document.getElementById('query-card-uid')) document.getElementById('query-card-uid').innerText = "UID: " + targetId;
    if(document.getElementById('queried-profile-card-popup')) document.getElementById('queried-profile-card-popup').classList.remove('hidden');
}

function executeAddFriendFromQuery() {
    const rawUIDText = document.getElementById('query-card-uid').innerText.replace("UID: ", "");
    if(addedFriends.includes(rawUIDText)) return alert("Node linked previously.");

    socket.emit('send_friend_request', { senderId: currentUserId, targetUserId: rawUIDText });
    if(document.getElementById('queried-profile-card-popup')) document.getElementById('queried-profile-card-popup').classList.add('hidden');
    alert("Inbound link trace request sent successfully.");
}

if(socket) {
    socket.on('incoming_friend_alert', (data) => {
        if(!pendingRequests.includes(data.senderId) && !addedFriends.includes(data.senderId)) {
            pendingRequests.push(data.senderId);
            renderPendingRequestsPanel();
            triggerInAppNotificationSound();
        }
    });
}

function renderPendingRequestsPanel() {
    const panel = document.getElementById('incoming-requests-panel');
    if(!panel) return;
    if(document.getElementById('request-count-label')) document.getElementById('request-count-label').innerText = pendingRequests.length;
    panel.innerHTML = "";
    
    if(pendingRequests.length === 0) return;

    pendingRequests.forEach(senderId => {
        const row = document.createElement('div');
        row.className = "contact-row";
        row.innerHTML = `
            <div class="user-avatar-mesh" style="background-image:url('${currentUserPfp}')"></div>
            <div class="chat-meta"><h4>${senderId}</h4><p>Requesting validation link</p></div>
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
    if(!container) return;
    container.innerHTML = "";
    addedFriends.forEach(f => {
        const row = document.createElement('div');
        row.className = "contact-row";
        row.onclick = () => openChatBox(f);
        row.innerHTML = `<div class="user-avatar-mesh" style="background-image:url('${currentUserPfp}')"></div><div class="chat-meta"><h4>${f}</h4><p>Tap to initialize connection</p></div>`;
        container.appendChild(row);
    });
}

function renderChatsList() {
    const container = document.getElementById('chats-list-container');
    if(!container) return;
    container.innerHTML = "";
    if(addedFriends.length === 0) {
        container.innerHTML = `<div class="empty-vector-slate">No active chat transactions yet.</div>`;
        return;
    }
    addedFriends.forEach(f => {
        const thread = localChatsMessageCache[f] || [];
        const lastMsgText = thread.length > 0 ? thread[thread.length - 1].message : "No previous data stream logs.";
        const row = document.createElement('div');
        row.className = "chat-row";
        row.onclick = () => openChatBox(f);
        row.innerHTML = `<div class="user-avatar-mesh" style="background-image:url('${currentUserPfp}')"></div><div class="chat-meta"><h4>${f}</h4><p>${lastMsgText}</p></div>`;
        container.appendChild(row);
    });
}

function openChatBox(friendId) {
    activeChatTargetId = friendId;
    if(document.getElementById('main-header-title')) document.getElementById('main-header-title').innerText = friendId;
    if(document.getElementById('back-chat-btn')) document.getElementById('back-chat-btn').classList.remove('hidden');
    if(document.getElementById('chat-messages-box')) document.getElementById('chat-messages-box').innerHTML = "";

    const thread = localChatsMessageCache[friendId] || [];
    thread.forEach(msg => appendVisualMessageNodeToVessel(msg));

    openScreen('screen-chat-window');
}

function closeChatBox() {
    activeChatTargetId = "";
    if(document.getElementById('main-header-title')) document.getElementById('main-header-title').innerText = "Stardust";
    renderChatsList();
    switchTab('screen-chat', document.querySelectorAll('.dock-nav-item')[0]);
}

function dispatchMessage() {
    const input = document.getElementById('chat-type-input');
    if(!input) return;
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
    saveIncomingMessageToLocalDatabase(activeChatTargetId, dataPayload);
    appendVisualMessageNodeToVessel(dataPayload);
    
    cancelReplyContext();
    input.value = "";
    if(document.getElementById('app-emoji-tray')) document.getElementById('app-emoji-tray').classList.add('hidden');
}

function saveIncomingMessageToLocalDatabase(key, payload) {
    if(!localChatsMessageCache[key]) localChatsMessageCache[key] = [];
    localChatsMessageCache[key].push(payload);
    localStorage.setItem('stardust_db_chats', JSON.stringify(localChatsMessageCache));
}

function appendVisualMessageNodeToVessel(payload) {
    const box = document.getElementById('chat-messages-box');
    if(!box) return;
    const direction = payload.senderId === currentUserId ? "outgoing" : "incoming";

    const wrapper = document.createElement('div');
    wrapper.className = `msg-bubble-wrapper ${direction}`;
    wrapper.id = payload.id;

    wrapper.oncontextmenu = (e) => { e.preventDefault(); openLongPressMenuSheet(payload, direction); };
    let touchTimer;
    wrapper.ontouchstart = () => { touchTimer = setTimeout(() => openLongPressMenuSheet(payload, direction), 650); };
    wrapper.ontouchend = () => clearTimeout(touchTimer);

    let replyMarkup = payload.replyTo ? `<span class="bubble-reply-context">↩ ${payload.replyTo}</span>` : "";

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

if(socket) {
    socket.on('receive_private_message', (data) => {
        saveIncomingMessageToLocalDatabase(data.senderId, data);
        if(activeChatTargetId === data.senderId) {
            appendVisualMessageNodeToVessel(data);
        } else {
            triggerInAppNotificationSound();
            const chatBadge = document.getElementById('badge-nav-chat');
            if(chatBadge) {
                chatBadge.innerText = (parseInt(chatBadge.innerText) || 0) + 1;
                chatBadge.classList.remove('hidden');
            }
        }
    });
}

function openLongPressMenuSheet(payload, direction) {
    selectedMessageElementId = { id: payload.id, text: payload.message, user: payload.senderId };
    if(document.getElementById('opt-edit')) document.getElementById('opt-edit').classList.add('hidden');
    if(direction === 'outgoing' && document.getElementById('opt-edit')) document.getElementById('opt-edit').classList.remove('hidden');
    if(document.getElementById('message-longpress-modal')) document.getElementById('message-longpress-modal').classList.remove('hidden');
}

function closeLongPressModal() { 
    if(document.getElementById('message-longpress-modal')) document.getElementById('message-longpress-modal').classList.add('hidden'); 
}

function handleContextAction(action) {
    closeLongPressModal();
    if(!selectedMessageElementId) return;

    if(action === 'copy') {
        navigator.clipboard.writeText(selectedMessageElementId.text);
    } else if(action === 'reply') {
        activeReplyContextObject = selectedMessageElementId.text;
        if(document.getElementById('reply-banner-text')) document.getElementById('reply-banner-text').innerText = `Replying: "${selectedMessageElementId.text}"`;
        if(document.getElementById('reply-context-banner')) document.getElementById('reply-context-banner').classList.remove('hidden');
    } else if(action === 'react') {
        alert("Reaction data injected.");
    } else if(action === 'edit') {
        const revised = prompt("Revise selection:", selectedMessageElementId.text);
        if(revised && revised.trim() !== "") {
            const thread = localChatsMessageCache[activeChatTargetId];
            const msgObj = thread.find(m => m.id === selectedMessageElementId.id);
            if(msgObj) {
                msgObj.message = revised;
                localStorage.setItem('stardust_db_chats', JSON.stringify(localChatsMessageCache));
                openChatBox(activeChatTargetId);
            }
        }
    }
}

function cancelReplyContext() {
    activeReplyContextObject = null;
    if(document.getElementById('reply-context-banner')) document.getElementById('reply-context-banner').classList.add('hidden');
}

function toggleEmojiTray() { if(document.getElementById('app-emoji-tray')) document.getElementById('app-emoji-tray').classList.toggle('hidden'); }
function insertVectorAsset(asset) { if(document.getElementById('chat-type-input')) document.getElementById('chat-type-input').value += asset; }

function handleMomentMediaSelection() {
    const file = document.getElementById('hidden-moment-media').files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentSelectedMomentAttachment = e.target.result;
        const targetView = document.getElementById('moment-media-preview');
        if(targetView) {
            targetView.innerHTML = file.type.includes('video') ? `<video src="${currentSelectedMomentAttachment}" autoplay muted loop></video>` : `<img src="${currentSelectedMomentAttachment}">`;
            targetView.classList.remove('hidden');
        }
    }
    reader.readAsDataURL(file);
}

function publishPost() {
    const txtArea = document.getElementById('post-caption');
    const cap = txtArea ? txtArea.value.trim() : "";
    if(!cap && !currentSelectedMomentAttachment) return;

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

    if(txtArea) txtArea.value = "";
    if(document.getElementById('moment-media-preview')) document.getElementById('moment-media-preview').classList.add('hidden');
    currentSelectedMomentAttachment = null;

    renderMomentsWallFeed();
    backToMoments();
}

if(socket) {
    socket.on('new_moment_feed_update', (data) => {
        localMomentsCache.unshift(data);
        localStorage.setItem('stardust_db_moments', JSON.stringify(localMomentsCache));
        renderMomentsWallFeed();
        if(document.getElementById('badge-nav-moment')) document.getElementById('badge-nav-moment').classList.remove('hidden');
    });
}

function renderMomentsWallFeed() {
    const wall = document.getElementById('moments-feed-wall');
    if(!wall) return;
    wall.innerHTML = "";
    
    if(localMomentsCache.length === 0) {
        wall.innerHTML = `<div class="empty-vector-slate">No shared timeline items logs found.</div>`;
        return;
    }

    localMomentsCache.forEach(m => {
        const card = document.createElement('div');
        card.className = "moment-card";
        let mediaTag = m.media ? (m.media.includes('video') ? `<video class="moment-attached-media" src="${m.media}" autoplay muted loop></video>` : `<img class="moment-attached-media" src="${m.media}">`) : "";
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
                <button class="footer-action-trigger-btn" onclick="executeLikeMoment('${m.id}')">Like (${m.likes})</button>
                <button class="footer-action-trigger-btn" onclick="appendCommentToMoment('${m.id}')">Comment</button>
            </div>
            <div class="moment-comments-log-box">${commentsBlock || 'No comment entries logged.'}</div>
        `;
        wall.appendChild(card);
    });
}

function executeLikeMoment(id) {
    const target = localMomentsCache.find(m => m.id === id);
    if(target) { target.likes++; localStorage.setItem('stardust_db_moments', JSON.stringify(localMomentsCache)); renderMomentsWallFeed(); }
}

function appendCommentToMoment(id) {
    const txt = prompt("Write comment string data:");
    if(!txt) return;
    const target = localMomentsCache.find(m => m.id === id);
    if(target) { target.comments.push({ user: currentUserId, text: txt }); localStorage.setItem('stardust_db_moments', JSON.stringify(localMomentsCache)); renderMomentsWallFeed(); }
}

function backToMoments() { switchTab('screen-moment', document.querySelectorAll('.dock-nav-item')[2]); }

function toggleEditProfileModal() { if(document.getElementById('profile-edit-submodal')) document.getElementById('profile-edit-submodal').classList.toggle('hidden'); }

function processProfilePictureUpload() {
    const file = document.getElementById('hidden-pfp-input').files[0];
    if(file) {
        const r = new FileReader(); r.onload = (e) => { currentUserPfp = e.target.result; localStorage.setItem('stardust_pfp', currentUserPfp); updateProfileDOMSelectors(); }; r.readAsDataURL(file);
    }
}

function saveProfileChanges() {
    const updatedUID = document.getElementById('input-edit-uid').value.trim().toLowerCase();
    const updatedName = document.getElementById('input-edit-displayname').value.trim();
    const updatedCountry = document.getElementById('input-edit-country').value;

    if(!updatedUID || !updatedName) return alert("Values can't be null lines.");
    if(updatedUID.includes(" ")) return alert("Spaces are completely prohibited inside system UIDs.");

    currentUserId = updatedUID;
    currentUserName = updatedName;
    currentUserCountry = updatedCountry;

    localStorage.setItem('stardust_uid', currentUserId);
    localStorage.setItem('stardust_name', currentUserName);
    localStorage.setItem('stardust_country', currentUserCountry);

    launchApplicationShell();
    toggleEditProfileModal();
}

function downloadQRCodeToGallery() {
    const imgObj = document.getElementById('qrcode-display-canvas').querySelector('img');
    if(!imgObj) return alert("QR Engine data stream broken node status.");
    
    const handlerLink = document.createElement('a');
    handlerLink.href = imgObj.src;
    handlerLink.download = `${currentUserId}_signature_matrix_qr.png`;
    document.body.appendChild(handlerLink);
    handlerLink.click();
    document.body.removeChild(handlerLink);
}

function triggerInAppNotificationSound() {
    if(document.getElementById('setting-toggle-notif') && document.getElementById('setting-toggle-notif').checked) {
        if(document.getElementById('notif-sound-msg')) document.getElementById('notif-sound-msg').play().catch(()=>{});
    }
}

function triggerLogout() {
    if(confirm("Purge browser local environment data files caches permanently?")) {
        localStorage.clear();
        location.reload();
    }
}
