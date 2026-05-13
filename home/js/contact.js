// Contact Page JavaScript
const auth = firebase.auth();

auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = '../signin.html';
    }
});

// Contact form functionality can be added here