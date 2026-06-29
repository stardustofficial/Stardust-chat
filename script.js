// Function checking validation authentication state systems 
function mockLogin(provider) {
    console.log("Logged in via " + provider);
    
    // Hide auth card animation layout frame
    document.getElementById('login-screen').classList.add('app-hidden');
    
    // Unhide Main viewport panels layout framework wrapper
    document.getElementById('main-app').classList.remove('app-hidden');
}

// Function tab navigator controller
function switchTab(screenId, btnElement) {
    // Hide all internal wrapper screen layouts completely
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active-screen'));

    // Reset default active button states configurations inside bars
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active-btn'));

    // Highlight target active panel components
    document.getElementById(screenId).classList.add('active-screen');
    btnElement.classList.add('active-btn');

    // Dynamic Header icons handlers adjustments
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

// Custom direct shortcuts redirection to moments creator panel
function openScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

function backToMoments() {
    openScreen('screen-moment');
}

// Preview uploaded asset before publishing moment timeline row item
function previewMedia(input) {
    const holder = document.getElementById('media-preview-container');
    holder.innerHTML = ""; // reset previous
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            let elem;
            if (input.files[0].type.includes('video')) {
                elem = document.createElement('video');
                elem.controls = true;
            } else {
                elem = document.createElement('img');
            }
            elem.src = e.target.result;
            elem.style.width = "100%";
            elem.style.borderRadius = "8px";
            elem.style.marginTop = "10px";
            holder.appendChild(elem);
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Simulate creation workflow 
function publishPost() {
    const text = document.getElementById('post-caption').value;
    if(!text) return alert("Please type something first!");
    
    alert("Moment successfully saved and posted to local contacts network feed!");
    document.getElementById('post-caption').value = "";
    document.getElementById('media-preview-container').innerHTML = "";
    backToMoments();
}

// Action interactions utilities controls logic 
function toggleLike(btn) {
    btn.classList.toggle('liked');
    let countEl = btn.querySelector('.like-count');
    let currentCount = parseInt(countEl.innerText);
    btn.classList.contains('liked') ? currentCount++ : currentCount--;
    countEl.innerText = currentCount;
}

function toggleCommentSection(btn) {
    const card = btn.closest('.moment-premium-card');
    const commentArea = card.querySelector('.comment-dropdown-area');
    commentArea.classList.toggle('hidden');
}

// View fullscreen modal popup engine configurations logic
function openMediaFullscreen(src, type) {
    const overlay = document.getElementById('fullscreen-media-overlay');
    const holder = document.getElementById('overlay-content-holder');
    holder.innerHTML = "";
    
    let el = document.createElement('img');
    el.src = src;
    holder.appendChild(el);
    
    overlay.classList.remove('hidden');
}

function closeMediaFullscreen() {
    document.getElementById('fullscreen-media-overlay').classList.add('hidden');
}

function logout() {
    document.getElementById('main-app').classList.add('app-hidden');
    document.getElementById('login-screen').classList.remove('app-hidden');
}
