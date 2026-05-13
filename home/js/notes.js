// Notes Page JavaScript
const auth = firebase.auth();

auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = '../signin.html';
    }
});

// Notes functionality can be added here