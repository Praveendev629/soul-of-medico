import './firebase-init.js';
import { login, logout, initAuthListener } from './auth/auth.js';

const appContainer = document.getElementById('app');
const globalLoader = document.getElementById('global-loader');
const userProfileBtn = document.getElementById('userProfileBtn');
const bottomNavItems = document.querySelectorAll('.nav-item');

function showLoader() {
    globalLoader.classList.remove('hidden');
}

function hideLoader() {
    globalLoader.classList.add('hidden');
}

function renderLoginScreen() {
    appContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh;">
            <h2 style="margin-bottom: var(--spacing-lg);">Welcome to Soul of Medico</h2>
            <button id="loginBtn" class="btn btn-primary" style="padding: 12px 24px; border-radius: var(--radius-md); background: var(--color-primary); color: white; border: none; font-size: 1rem; font-weight: 500; cursor: pointer;">
                <span class="material-icons-round" style="vertical-align: middle; margin-right: 8px;">login</span>
                Sign in with Google
            </button>
        </div>
    `;

    document.getElementById('loginBtn').addEventListener('click', async () => {
        showLoader();
        try {
            await login();
        } catch (e) {
            alert('Login failed: ' + e.message);
            hideLoader();
        }
    });
}

function renderMainContent(user, role) {
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

    // Placeholder for content
    contentHtml += `
        <div id="content-container">
            <h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Recent Activity</h3>
            <p style="color: var(--color-text-muted); font-size: 0.9rem; text-align: center; padding: var(--spacing-lg) 0;">Select a tab from the bottom navigation to view content.</p>
        </div>
    `;

    appContainer.innerHTML = contentHtml;

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
        if (confirm('Do you want to sign out?')) {
            showLoader();
            await logout();
        }
    };
}

// Navigation Logic
bottomNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
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
                container.innerHTML = `<h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Videos</h3><div class="card" style="display:flex; align-items:center; justify-content:center; height:100px; background:#eee;"><span class="material-icons-round" style="font-size: 48px; color:#ccc;">play_circle_outline</span></div>`;
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
