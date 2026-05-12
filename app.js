function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// THIS IS A TEMPORARY BACK BUTTON FOR DEVELOPMENT/TESTING.
// DO NOT UNCOMMENT THIS UNLESS YOU KNOW WHAT YOU'RE DOING.

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() {
  showScreen('screen-home');
}

// END TEMPORARY BACK BUTTON