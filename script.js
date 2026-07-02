// Paste your verified credentials safely here
const firebaseConfig = {
  apiKey: "AIzaSyCn0bxGlF-dYxQX4PHRduz6HvUvDXUkzN4",
  authDomain: "stardust-chat.firebaseapp.com",
  projectId: "stardust-chat",
  storageBucket: "stardust-chat.firebasestorage.app",
  messagingSenderId: "686163822490",
  appId: "1:686163822490:web:0c576f5df2f8111b509c23",
  measurementId: "G-D7PGR3PMV6"
};

// Initialize Firebase Core Engine
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// 1. AUTH WATCHER (Real-Time Login State Tracking)
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        saveUserToFirestore(user);
        initializeMainApplication();
    } else {
        currentUser = null;
        document.getElementById('login-screen').style.display = "flex";
        document.getElementById('main-app').style.display = "none";
    }
});

// Google Identity Sign-In Flow
document.getElementById('btn-google-login').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert("Auth Error: " + err.message));
});

document.getElementById('btn-logout').addEventListener('click', () => {
    auth.signOut();
});

// Save user data securely in Central Database
function saveUserToFirestore(user) {
    db.collection("users").doc(user.uid).set({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        pfp: user.photoURL,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// 2. RUN APP ENGINE
function initializeMainApplication() {
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('main-app').style.display = "flex";

    // Dynamic Header Updates
    document.getElementById('profile-lbl-name').innerText = currentUser.displayName;
    document.getElementById('profile-lbl-email').innerText = currentUser.email;
    document.getElementById('profile-pfp-display').style.backgroundImage = `url('${currentUser.photoURL}')`;

    listenToMomentsTimeline();
    switchTab('screen-chat');
}

// 3. NAVIGATION MANAGEMENT
function switchTab(screenId) {
    document.querySelectorAll('.app-tab-panel').forEach(p => p.style.display = "none");
    document.getElementById(screenId).style.display = "block";

    document.getElementById('add-moment-btn').classList.add('hidden');
    if(screenId === 'screen-moment') {
        document.getElementById('add-moment-btn').classList.remove('hidden');
    }
}

// 4. REAL-TIME MOMENTS CONTROLLER (Automatic Sync Without Refresh)
document.getElementById('btn-publish-moment').addEventListener('click', () => {
    const caption = document.getElementById('post-caption').value.trim();
    if(!caption) return;

    db.collection("moments").add({
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPfp: currentUser.photoURL,
        caption: caption,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('post-caption').value = "";
        switchTab('screen-moment');
    });
});

function listenToMomentsTimeline() {
    db.collection("moments").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        const wall = document.getElementById('moments-feed-wall');
        if(!wall) return;
        wall.innerHTML = "";

        if(snapshot.empty) {
            wall.innerHTML = `<div class="empty-vector-slate">No moments posted on the network yet.</div>`;
            return;
        }

        snapshot.forEach(doc => {
            const m = doc.data();
            const card = document.createElement('div');
            card.className = "moment-card";
            card.innerHTML = `
                <div class="moment-header">
                    <div class="user-avatar-mesh" style="background-image:url('${m.senderPfp}')"></div>
                    <h5>${m.senderName}</h5>
                </div>
                <div class="moment-body"><p>${m.caption}</p></div>
            `;
            wall.appendChild(card);
        });
    });
}
