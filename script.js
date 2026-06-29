// Function to handle switching between screens
function switchScreen(screenId, buttonElement) {
    // 1. Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));

    // 2. Remove active state from all navigation buttons
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // 3. Show the selected screen
    document.getElementById(screenId).classList.add('active');

    // 4. Mark the clicked button as active
    buttonElement.classList.add('active');
}
