import './firebase-init.js';
import { login, logout, initAuthListener, signInWithEmail, signUpWithEmail, resetPassword, updateUserProfile } from './auth/auth.js';
import { getVideosFromFirestore, syncYouTubeVideos, fetchYouTubeVideos, getUnreadNotificationsCount, markNotificationAsRead } from './services/youtube.js';

const appContainer = document.getElementById('app');
const globalLoader = document.getElementById('global-loader');
const userProfileBtn = document.getElementById('userProfileBtn');
const bottomNavItems = document.querySelectorAll('.nav-item');

let currentUser = null;
let currentRole = null;

function showLoader() {
    globalLoader.classList.remove('hidden');
}

function hideLoader() {
    globalLoader.classList.add('hidden');
}

function renderLoginScreen() {
    appContainer.innerHTML = `
        <div style="max-width: 400px; margin: 0 auto; padding: var(--spacing-lg);">
            <div class="card">
                <h2 style="margin-bottom: var(--spacing-lg); text-align: center;">Welcome to Soul of Medico</h2>
                
                <!-- Google Sign In -->
                <button id="googleLoginBtn" class="btn" style="width: 100%; padding: 12px; background: #db4437; color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 1rem; font-weight: 500; margin-bottom: var(--spacing-md); display: flex; align-items: center; justify-content: center;">
                    <span class="material-icons-round" style="margin-right: 8px;">g_translate</span>
                    Sign in with Google
                </button>
                
                <div style="text-align: center; margin: var(--spacing-md) 0; color: var(--color-text-muted);">OR</div>
                
                <!-- Email/Password Form -->
                <form id="emailLoginForm">
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
                        <input type="email" id="loginEmail" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Password</label>
                        <input type="password" id="loginPassword" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <button type="submit" class="btn" style="width: 100%; padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 1rem; font-weight: 500;">Sign In</button>
                </form>
                
                <div style="margin-top: var(--spacing-md); text-align: center;">
                    <a href="#" id="forgotPasswordLink" style="color: var(--color-primary); text-decoration: none; font-size: 0.9rem;">Forgot Password?</a>
                </div>
                
                <div style="margin-top: var(--spacing-md); text-align: center; padding-top: var(--spacing-md); border-top: 1px solid var(--color-border);">
                    <p style="color: var(--color-text-muted); font-size: 0.9rem;">Don't have an account?</p>
                    <button id="showSignupBtn" class="btn" style="color: var(--color-primary); background: none; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 500;">Sign Up</button>
                </div>
            </div>
        </div>
    `;

    // Google Login
    document.getElementById('googleLoginBtn').addEventListener('click', async () => {
        showLoader();
        try {
            await login();
        } catch (e) {
            alert('Login failed: ' + e.message);
            hideLoader();
        }
    });

    // Email/Password Login
    document.getElementById('emailLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await signInWithEmail(email, password);
        } catch (e) {
            alert('Login failed: ' + e.message);
            hideLoader();
        }
    });

    // Show Sign Up
    document.getElementById('showSignupBtn').addEventListener('click', () => {
        renderSignUpScreen();
    });

    // Forgot Password
    document.getElementById('forgotPasswordLink').addEventListener('click', async (e) => {
        e.preventDefault();
        renderForgotPasswordScreen();
    });
}

async function checkNotifications() {
    if (!currentUser) return;
    
    try {
        const count = await getUnreadNotificationsCount();
        const notificationBadge = document.getElementById('notification-badge');
        
        if (notificationBadge) {
            if (count > 0) {
                notificationBadge.style.display = 'block';
                notificationBadge.textContent = count > 9 ? '9+' : count;
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

function renderSignUpScreen() {
    appContainer.innerHTML = `
        <div style="max-width: 400px; margin: 0 auto; padding: var(--spacing-lg);">
            <div class="card">
                <h2 style="margin-bottom: var(--spacing-lg); text-align: center;">Create Account</h2>
                
                <form id="signUpForm">
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Full Name</label>
                        <input type="text" id="signupName" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
                        <input type="email" id="signupEmail" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Password</label>
                        <input type="password" id="signupPassword" required minlength="6" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <button type="submit" class="btn" style="width: 100%; padding: 12px; background: var(--color-success); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 1rem; font-weight: 500;">Sign Up</button>
                </form>
                
                <div style="margin-top: var(--spacing-lg); text-align: center; padding-top: var(--spacing-md); border-top: 1px solid var(--color-border);">
                    <p style="color: var(--color-text-muted); font-size: 0.9rem;">Already have an account?</p>
                    <button id="showLoginFromSignupBtn" class="btn" style="color: var(--color-primary); background: none; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 500;">Sign In</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('signUpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const displayName = document.getElementById('signupName').value;
        
        try {
            await signUpWithEmail(email, password, displayName);
            alert('Account created! Please check your email to verify your account before logging in.');
            renderLoginScreen();
        } catch (error) {
            alert('Sign up failed: ' + error.message);
            hideLoader();
        }
    });

    document.getElementById('showLoginFromSignupBtn').addEventListener('click', () => {
        renderLoginScreen();
    });
}

function renderForgotPasswordScreen() {
    appContainer.innerHTML = `
        <div style="max-width: 400px; margin: 0 auto; padding: var(--spacing-lg);">
            <div class="card">
                <h2 style="margin-bottom: var(--spacing-lg); text-align: center;">Reset Password</h2>
                <p style="color: var(--color-text-muted); text-align: center; margin-bottom: var(--spacing-lg);">Enter your email and we'll send you a password reset link.</p>
                
                <form id="resetPasswordForm">
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
                        <input type="email" id="resetEmail" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <button type="submit" class="btn" style="width: 100%; padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 1rem; font-weight: 500;">Send Reset Link</button>
                </form>
                
                <div style="margin-top: var(--spacing-md); text-align: center;">
                    <button id="backToLoginBtn" class="btn" style="color: var(--color-primary); background: none; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 500;">← Back to Login</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        const email = document.getElementById('resetEmail').value;
        
        try {
            await resetPassword(email);
            alert('Password reset email sent! Check your inbox.');
            renderLoginScreen();
        } catch (error) {
            alert('Failed to send reset email: ' + error.message);
            hideLoader();
        }
    });

    document.getElementById('backToLoginBtn').addEventListener('click', () => {
        renderLoginScreen();
    });
}

function renderEditProfileScreen() {
    appContainer.innerHTML = `
        <div style="max-width: 500px; margin: 0 auto; padding: var(--spacing-lg);">
            <div class="card">
                <h2 style="margin-bottom: var(--spacing-lg); text-align: center;">Edit Profile</h2>
                
                <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                    <img src="${currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName)}" 
                         alt="Profile" 
                         style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid var(--color-primary);">
                </div>
                
                <form id="editProfileForm">
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Full Name</label>
                        <input type="text" id="editName" value="${currentUser.displayName}" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
                        <input type="email" value="${currentUser.email}" disabled style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem; background: #f5f5f5;">
                        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">Email cannot be changed</p>
                    </div>
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Profile Photo URL</label>
                        <input type="url" id="editPhotoURL" value="${currentUser.photoURL || ''}" placeholder="https://example.com/photo.jpg" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">Leave empty to use default avatar</p>
                    </div>
                    <button type="submit" class="btn" style="width: 100%; padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 1rem; font-weight: 500;">Save Changes</button>
                </form>
                
                <div style="margin-top: var(--spacing-md); text-align: center;">
                    <button id="cancelEditBtn" class="btn" style="color: var(--color-text-muted); background: none; border: none; cursor: pointer; font-size: 0.95rem;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        const displayName = document.getElementById('editName').value;
        const photoURL = document.getElementById('editPhotoURL').value;
        
        try {
            await updateUserProfile(currentUser.uid, {
                displayName,
                photoURL: photoURL || null
            });
            
            // Update Firebase Auth profile too
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js").then(async ({ updateProfile }) => {
                await updateProfile(currentUser, {
                    displayName,
                    photoURL: photoURL || null
                });
                
                alert('Profile updated successfully!');
                currentUser.displayName = displayName;
                currentUser.photoURL = photoURL;
                renderMainContent(currentUser, currentRole);
            });
        } catch (error) {
            alert('Failed to update profile: ' + error.message);
            hideLoader();
        }
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        renderMainContent(currentUser, currentRole);
    });
}

function renderMainContent(user, role) {
    currentUser = user;
    currentRole = role;
    
    // Sync YouTube videos on login
    syncYouTubeVideos();
    
    let contentHtml = `
        <div class="card bg-primary-light">
            <h2 style="color: var(--color-primary-dark); margin-bottom: 8px;">Welcome, ${user.displayName.split(' ')[0]}</h2>
            <p style="color: var(--color-text-muted);">Role: <strong>${role}</strong></p>
        </div>
    `;

    if (role === 'ADMIN') {
        contentHtml += `
            <div class="card" style="border-left: 4px solid var(--color-danger); margin-top: var(--spacing-md);">
                <h3 style="margin-bottom: var(--spacing-sm); color: var(--color-danger);">Admin Area</h3>
                <p style="margin-bottom: var(--spacing-sm); font-size: 0.9rem; color: var(--color-text-muted);">Manage your educational content below.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-md); margin-top: var(--spacing-md);">
                    <button id="addSectionBtn" class="btn" style="padding: 16px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; text-align: left;">
                        <span class="material-icons-round" style="font-size: 24px; margin-right: 12px; vertical-align: middle;">add_circle</span>
                        <span style="font-weight: 500;">Add Section</span>
                    </button>
                    
                    <button id="uploadFileBtn" class="btn" style="padding: 16px; background: var(--color-success); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; text-align: left;">
                        <span class="material-icons-round" style="font-size: 24px; margin-right: 12px; vertical-align: middle;">cloud_upload</span>
                        <span style="font-weight: 500;">Upload File</span>
                    </button>
                    
                    <button id="addVideoBtn" class="btn" style="padding: 16px; background: var(--color-info); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; text-align: left;">
                        <span class="material-icons-round" style="font-size: 24px; margin-right: 12px; vertical-align: middle;">video_library</span>
                        <span style="font-weight: 500;">Add Video</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Add notifications section
    contentHtml += `
        <div class="card" style="margin-top: var(--spacing-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                <h3 style="color: var(--color-primary);">📢 Notifications</h3>
                <span id="notification-badge" style="background: var(--color-danger); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; display: none;">0</span>
            </div>
            <div id="notifications-list">
                <p style="color: var(--color-text-muted); font-size: 0.9rem; text-align: center; padding: var(--spacing-lg) 0;">No new notifications</p>
            </div>
        </div>
    `;

    // Placeholder for content
    contentHtml += `
        <div id="content-container">
            <h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Recent Activity</h3>
            <p style="color: var(--color-text-muted); font-size: 0.9rem; text-align: center; padding: var(--spacing-lg) 0;">Select a tab from the bottom navigation to view content.</p>
        </div>
    `;

    appContainer.innerHTML = contentHtml;

    // Check for notifications
    checkNotifications();

    // Setup Admin Buttons
    if (role === 'ADMIN') {
        document.getElementById('addSectionBtn').onclick = () => {
            alert('Add Section feature - Connect to Firestore to create sections');
        };
        
        document.getElementById('uploadFileBtn').onclick = () => {
            alert('Upload File feature - Integrate with Google Drive API');
        };
        
        document.getElementById('addVideoBtn').onclick = () => {
            alert('Add Video feature - Add video URLs or upload videos');
        };
    }

    // Setup Profile Button
    userProfileBtn.onclick = async () => {
        const choice = confirm('Choose:\nOK - Edit Profile\nCancel - Sign Out');
        if (choice) {
            renderEditProfileScreen();
        } else {
            showLoader();
            await logout();
        }
    };
}

// Navigation Logic
bottomNavItems.forEach(item => {
    item.addEventListener('click', async (e) => {
        e.preventDefault();

        // Update styling
        bottomNavItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Handle Routing
        const target = item.getAttribute('data-target');
        const container = document.getElementById('content-container');
        if (!container) return;

        switch (target) {
            case 'home':
                container.innerHTML = `<h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Recent Activity</h3><p style="color: var(--color-text-muted); font-size: 0.9rem; text-align: center; padding: var(--spacing-lg) 0;">Home Dashboard Content goes here.</p>`;
                break;
                
            case 'videos':
                container.innerHTML = `<h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Videos</h3><div id="videos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--spacing-md);"></div>`;
                
                // Fetch and display videos
                try {
                    const videosGrid = document.getElementById('videos-grid');
                    videosGrid.innerHTML = '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-text-muted);">Loading videos...</p>';
                    
                    const videos = await getVideosFromFirestore();
                    
                    if (videos.length === 0) {
                        videosGrid.innerHTML = '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-text-muted);">No videos available yet. Check back soon!</p>';
                    } else {
                        videosGrid.innerHTML = videos.map(video => `
                            <div class="card" style="padding: 0; overflow: hidden;">
                                <img src="${video.thumbnail || 'https://img.youtube.com/vi/${video.id}/hqdefault.jpg'}" alt="${video.title}" style="width: 100%; height: 160px; object-fit: cover;">
                                <div style="padding: var(--spacing-md);">
                                    <h4 style="margin-bottom: var(--spacing-sm); font-size: 0.95rem; line-height: 1.4;">${video.title}</h4>
                                    <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--spacing-sm);">${video.channelTitle || 'Soul of Medico'}</p>
                                    <p style="font-size: 0.75rem; color: var(--color-text-muted);">${new Date(video.publishedAt).toLocaleDateString()}</p>
                                    <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" style="display: inline-block; margin-top: var(--spacing-sm); padding: 8px 16px; background: var(--color-primary); color: white; text-decoration: none; border-radius: var(--radius-md); font-size: 0.85rem;">
                                        <span class="material-icons-round" style="font-size: 16px; vertical-align: middle; margin-right: 4px;">play_arrow</span>
                                        Watch Video
                                    </a>
                                </div>
                            </div>
                        `).join('');
                    }
                } catch (error) {
                    console.error('Error loading videos:', error);
                    container.innerHTML += '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-danger);">Error loading videos. Please try again later.</p>';
                }
                break;
                
            case 'files':
                container.innerHTML = `<h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Files</h3><p style="color: var(--color-text-muted); font-size: 0.9rem; text-align: center; padding: var(--spacing-lg) 0;">Document listing goes here.</p>`;
                break;
                
            case 'downloads':
                container.innerHTML = `<h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Offline Downloads</h3><p style="color: var(--color-text-muted); font-size: 0.9rem; text-align: center; padding: var(--spacing-lg) 0;">No offline files available yet.</p>`;
                break;
        }
    });
});

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }

    // Initialize Firebase first
    import('./firebase-init.js').then(() => {
        console.log('Firebase initialized successfully');
        
        // We add a slight delay to allow Firebase to initialize its state
        setTimeout(() => {
            initAuthListener(
                (user, role) => {
                    console.log('User logged in with role:', role);
                    hideLoader();
                    renderMainContent(user, role);
                },
                () => {
                    console.log('User logged out');
                    hideLoader();
                    renderLoginScreen();
                }
            );
        }, 500); // 500ms delay to ensure smooth loading transition initially
    }).catch(error => {
        console.error('Firebase initialization failed:', error);
        hideLoader();
        appContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh;">
                <h2 style="margin-bottom: var(--spacing-lg); color: var(--color-danger);">Initialization Error</h2>
                <p style="color: var(--color-text-muted); text-align: center;">Failed to initialize Firebase. Please check your configuration.</p>
                <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-top: var(--spacing-md);">Error: ${error.message}</p>
            </div>
        `;
    });
});
