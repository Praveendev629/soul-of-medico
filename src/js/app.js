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
            <div class="card" style="border-left: 4px solid var(--color-danger);">
                <h3 style="margin-bottom: var(--spacing-sm); color: var(--color-danger);">Admin Area</h3>
                <p style="margin-bottom: var(--spacing-sm); font-size: 0.9rem; color: var(--color-text-muted);">Upload files to Google Drive and manage sections.</p>
                <button class="btn" style="padding: 8px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer;">Manage Uploads</button>
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
    // We expect Firebase to be initialized globally in index.html,
    // so we can just setup the auth listener here.

    // We add a slight delay to allow Firebase to initialize its state
    setTimeout(() => {
        initAuthListener(
            (user, role) => {
                hideLoader();
                renderMainContent(user, role);
            },
            () => {
                hideLoader();
                renderLoginScreen();
            }
        );
    }, 500); // 500ms delay to ensure smooth loading transition initially
});
