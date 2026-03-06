import './firebase-init.js';
import { login, logout, initAuthListener, signInWithEmail, signUpWithEmail, resetPassword, updateUserProfile } from './auth/auth.js';
import { getVideosFromFirestore, syncYouTubeVideos, fetchYouTubeVideos, getUnreadNotificationsCount, markNotificationAsRead } from './services/youtube.js';
import { loadSectionsFromFirestore, addSectionToFirestore, updateSectionInFirestore, deleteSectionFromFirestore, loadFilesFromFirestore, addFileToFirestore, updateFileInFirestore, deleteFileFromFirestore } from './services/sections.js';
import { initGoogleDrive } from './services/google-drive.js';

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

// Helper function to render videos grid
function renderVideosGrid(videos) {
    if (videos.length === 0) {
        return '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-text-muted);">No videos available yet.</p>';
    }

    return videos.map(video => `
        <div class="card" style="padding: 0; overflow: hidden;">
            <img src="${video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}" alt="${video.title}" style="width: 100%; height: 160px; object-fit: cover;">
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

// Load and display sections
async function loadSections(containerId, parentId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const sections = await loadSectionsFromFirestore(parentId);

        if (sections.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-text-muted);">No sections yet. Click "Add New Section" to create one.</p>';
            return;
        }

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--spacing-md);">';

        sections.forEach(section => {
            const sectionCount = sections.filter(s => s.parentId === section.id).length;
            const driveFolderId = section.driveFolderId || '';
            const parentIdParam = parentId ? `'${parentId}'` : 'null';
            html += `
                <div class="card" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div onclick="openSection('${section.id}', '${section.name.replace(/'/g, "\\'")}', '${driveFolderId}', ${parentIdParam})" style="display: flex; align-items: center; padding: var(--spacing-md);">
                        <span class="material-icons-round" style="font-size: 32px; color: var(--color-primary); margin-right: var(--spacing-md);">${driveFolderId ? 'add_to_drive' : 'folder'}</span>
                        <div style="flex: 1;">
                            <h4 style="margin-bottom: 4px;">${section.name}</h4>
                            <p style="font-size: 0.85rem; color: var(--color-text-muted);">${sectionCount} subsections</p>
                        </div>
                        ${currentRole === 'ADMIN' ? `
                            <button onclick="event.stopPropagation(); editSection('${section.id}', '${section.name.replace(/'/g, "\\'")}')" style="background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px;">
                                <span class="material-icons-round">edit</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Back button if not root
        if (parentId !== null) {
            html = `<button onclick="loadSections('${containerId}', null)" style="margin-bottom: var(--spacing-md); padding: 8px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center;">
                <span class="material-icons-round" style="margin-right: 4px;">arrow_back</span>
                Back to Root
            </button>` + html;
        }

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading sections:', error);
        container.innerHTML = '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-danger);">Error loading sections.</p>';
    }
}

// Open section (show subsections and files)
window.openSection = async function (sectionId, sectionName, driveFolderId = '', parentId = null) {
    const container = document.getElementById('content-container');
    if (!container) return;

    container.innerHTML = `
        <div style="margin-bottom: var(--spacing-lg);">
            <button onclick="loadSections('sections-container', ${parentId === null ? 'null' : "'" + parentId + "'"})" style="margin-bottom: var(--spacing-md); padding: 8px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center;">
                <span class="material-icons-round" style="margin-right: 4px;">arrow_back</span>
                Back
            </button>
            <h2 style="margin-bottom: var(--spacing-md);">📁 ${sectionName}</h2>
            ${currentRole === 'ADMIN' ? `
                <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                    <button id="addSubsectionBtn" class="btn" onclick="event.preventDefault()" style="padding: 8px 16px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center;">
                        <span class="material-icons-round" style="margin-right: 4px; font-size: 18px;">create_new_folder</span>
                        Add Subsection
                    </button>
                    <button id="uploadFileInSectionBtn" class="btn" style="padding: 8px 16px; background: var(--color-success); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center;">
                        <span class="material-icons-round" style="margin-right: 4px; font-size: 18px;">upload_file</span>
                        Upload File
                    </button>
                </div>
            ` : ''}
        </div>
        
        <h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Subsections</h3>
        <div id="subsections-container"></div>
        
        <h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Files</h3>
        <div id="files-container"></div>
    `;

    // Load subsections
    await loadSections('subsections-container', sectionId);

    // Load files
    try {
        const filesContainer = document.getElementById('files-container');
        let htmlContent = '';

        if (driveFolderId) {
            filesContainer.innerHTML = '<p style="color: var(--color-text-muted); padding: var(--spacing-lg); text-align: center;">Fetching files from Google Drive...</p>';

            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js").then(async ({ httpsCallable }) => {
                try {
                    const listFiles = httpsCallable(window.functions, 'listFiles');
                    const result = await listFiles({ folderId: driveFolderId });
                    const driveFiles = result.data.files || [];

                    if (driveFiles.length === 0) {
                        htmlContent += '<p style="color: var(--color-text-muted); padding: var(--spacing-lg); text-align: center;">No files found in Google Drive folder.</p>';
                    } else {
                        htmlContent += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">' +
                            driveFiles.map(file => `
                                <div class="card" style="display: flex; align-items: center; padding: var(--spacing-md);">
                                    <img src="${file.iconLink}" style="width: 24px; height: 24px; margin-right: var(--spacing-md);" alt="icon">
                                    <div style="flex: 1;">
                                        <h4 style="margin-bottom: 4px;"><a href="${file.webViewLink}" target="_blank" style="text-decoration: none; color: inherit;">${file.name}</a></h4>
                                    </div>
                                    <a href="${file.webContentLink || file.webViewLink}" target="_blank" style="background: none; border: none; cursor: pointer; color: var(--color-primary); padding: 4px;">
                                        <span class="material-icons-round">download</span>
                                    </a>
                                </div>
                            `).join('') + '</div>';
                    }

                    filesContainer.innerHTML = htmlContent;
                } catch (driveError) {
                    console.error('Error fetching drive files:', driveError);
                    htmlContent += '<p style="color: var(--color-danger); padding: var(--spacing-lg); text-align: center;">Error fetching Google Drive files: ' + driveError.message + '</p>';
                    filesContainer.innerHTML = htmlContent;
                }
            });
        } else {
            const files = await loadFilesFromFirestore(sectionId);
            if (files.length === 0) {
                filesContainer.innerHTML = '<p style="color: var(--color-text-muted); padding: var(--spacing-lg); text-align: center;">No files uploaded yet.</p>';
            } else {
                filesContainer.innerHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-md);">' +
                    files.map(file => `
                        <div class="card" style="display: flex; align-items: center; padding: var(--spacing-md);">
                            <span class="material-icons-round" style="font-size: 32px; color: var(--color-primary); margin-right: var(--spacing-md);">insert_drive_file</span>
                            <div style="flex: 1;">
                                <h4 style="margin-bottom: 4px;">${file.name}</h4>
                                <p style="font-size: 0.85rem; color: var(--color-text-muted);">Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}</p>
                            </div>
                            ${currentRole === 'ADMIN' ? `
                                <button onclick="renameFile('${file.id}', '${file.name.replace(/'/g, "\\'")}')" style="background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px;">
                                    <span class="material-icons-round">edit</span>
                                </button>
                            ` : ''}
                        </div>
                    `).join('') + '</div>';
            }
        }
    } catch (error) {
        console.error('Error loading files:', error);
    }

    // Setup admin buttons
    if (currentRole === 'ADMIN') {
        document.getElementById('addSubsectionBtn').onclick = () => showAddSectionModal(sectionId);
        document.getElementById('uploadFileInSectionBtn').onclick = () => showUploadFileModal(sectionId, driveFolderId);
    }
};

// Show Add Section Modal
function showAddSectionModal(parentId = null) {
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div class="card" style="max-width: 400px; width: 90%; position: relative;">
                <button onclick="this.closest('#addSectionModal').remove()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--color-text-muted);">&times;</button>
                <h3 style="margin-bottom: var(--spacing-lg);">${parentId ? 'Add Subsection' : 'Add New Section'}</h3>
                <form id="addSectionForm">
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Section Name</label>
                        <input type="text" id="sectionNameInput" required placeholder="e.g., Anatomy Notes" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: var(--spacing-lg);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Google Drive Folder ID (Optional)</label>
                        <input type="text" id="driveFolderIdInput" placeholder="e.g., 1A2B3C4D5E..." style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">To fetch files automatically from a Drive folder</p>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                        <button type="button" onclick="this.closest('#addSectionModal').remove()" style="padding: 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">Cancel</button>
                        <button type="submit" style="padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">Create Section</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'addSectionModal';
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    document.getElementById('addSectionForm').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('sectionNameInput').value.trim();
        const driveFolderId = document.getElementById('driveFolderIdInput').value.trim();

        // Validate inputs
        if (!name) {
            alert('Section name is required');
            return;
        }

        // Check if user is authenticated
        if (!currentUser || !currentUser.uid) {
            alert('You must be logged in to create a section');
            console.error('currentUser not set:', currentUser);
            return;
        }

        try {
            console.log('Creating section with data:', { name, parentId, driveFolderId, createdBy: currentUser.uid });
            
            await addSectionToFirestore({
                name,
                parentId,
                driveFolderId: driveFolderId || null,
                createdBy: currentUser.uid
            });
            
            alert('Section created successfully!');
            document.body.removeChild(modalContainer);
            
            if (parentId) {
                // If creating subsection, reload the parent section
                openSection(parentId, 'Section');
            } else {
                // If creating root section, navigate to files tab and reload sections
                const filesTab = document.querySelector('[data-target="files"]');
                if (filesTab) {
                    filesTab.click();
                } else {
                    // Fallback: reload sections if container exists
                    const container = document.getElementById('sections-container');
                    if (container) {
                        loadSections('sections-container', null);
                    }
                }
            }
        } catch (error) {
            console.error('Section creation error:', error);
            alert('Failed to create section: ' + error.message);
        }
    };
}

// Show Upload File Modal
function showUploadFileModal(sectionId, driveFolderId = null) {
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div class="card" style="max-width: 500px; width: 90%; position: relative;">
                <button onclick="this.closest('#uploadFileModal').remove()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--color-text-muted);">&times;</button>
                <h3 style="margin-bottom: var(--spacing-lg);">Upload File</h3>
                <form id="uploadFileForm">
                    <div style="margin-bottom: var(--spacing-lg);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">File Name (Optional)</label>
                        <input type="text" id="fileNameInput" placeholder="Leave blank to use original filename" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: var(--spacing-lg);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Select File</label>
                        <input type="file" id="fileInput" required accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">Supported formats: PDF, DOC, PPT, XLS, JPG, PNG, GIF, MP4, MOV, AVI (Max 100MB)</p>
                    </div>
                    <div id="uploadProgress" style="display: none; margin-bottom: var(--spacing-lg);">
                        <div style="background: var(--color-surface); border-radius: var(--radius-md); overflow: hidden; height: 24px;">
                            <div id="progressBar" style="background: var(--color-primary); height: 100%; width: 0%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem;">0%</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                        <button type="button" onclick="this.closest('#uploadFileModal').remove()" style="padding: 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">Cancel</button>
                        <button type="submit" id="uploadBtn" style="padding: 12px; background: var(--color-success); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">Upload</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'uploadFileModal';
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    document.getElementById('uploadFileForm').onsubmit = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        const customFileName = document.getElementById('fileNameInput').value.trim();
        const uploadedFileName = customFileName || file.name;
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadProgress = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');

        if (file.size > 100 * 1024 * 1024) {
            alert('File size must be less than 100MB');
            return;
        }

        uploadBtn.disabled = true;
        uploadProgress.style.display = 'block';

        try {
            if (driveFolderId) {
                // Upload to Google Drive
                try {
                    const uploadFileToDrive = (await import('./services/google-drive.js')).uploadFileToDrive;
                    
                    // Simulate progress (actual progress depends on Google Drive API)
                    let progress = 0;
                    const progressInterval = setInterval(() => {
                        if (progress < 90) {
                            progress += Math.random() * 30;
                            if (progress > 90) progress = 90;
                            progressBar.style.width = progress + '%';
                            progressBar.textContent = Math.floor(progress) + '%';
                        }
                    }, 500);

                    const uploadedFile = await uploadFileToDrive(file, uploadedFileName, driveFolderId);
                    
                    clearInterval(progressInterval);
                    progress = 100;
                    progressBar.style.width = '100%';
                    progressBar.textContent = '100%';

                    // Also save metadata in Firestore for tracking
                    await addFileToFirestore({
                        name: uploadedFileName,
                        originalName: file.name,
                        sectionId,
                        fileType: file.type,
                        fileSize: file.size,
                        uploadedBy: currentUser.uid,
                        driveFileId: uploadedFile.id,
                        driveLink: uploadedFile.webViewLink
                    });

                    alert('File uploaded to Google Drive successfully!');
                } catch (driveError) {
                    console.error('Google Drive upload error:', driveError);
                    alert('Failed to upload to Google Drive. Saving locally instead.');
                    
                    // Fallback to local storage
                    await addFileToFirestore({
                        name: uploadedFileName,
                        originalName: file.name,
                        sectionId,
                        fileType: file.type,
                        fileSize: file.size,
                        uploadedBy: currentUser.uid
                    });
                }
            } else {
                // Just store metadata in Firestore
                progressBar.style.width = '100%';
                progressBar.textContent = '100%';
                
                await addFileToFirestore({
                    name: uploadedFileName,
                    originalName: file.name,
                    sectionId,
                    fileType: file.type,
                    fileSize: file.size,
                    uploadedBy: currentUser.uid
                });
                alert('File information saved successfully!');
            }

            document.body.removeChild(modalContainer);
            openSection(sectionId, 'Section');
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file: ' + error.message);
            uploadBtn.disabled = false;
        }
    };
}

// Rename file
window.renameFile = async function (fileId, currentName) {
    const newName = prompt('Enter new file name:', currentName);
    if (newName && newName !== currentName) {
        try {
            await updateFileInFirestore(fileId, { name: newName });
            alert('File renamed successfully!');
            // Reload files
            const sectionId = ''; // You'll need to track current section
            openSection(sectionId, 'Section');
        } catch (error) {
            alert('Failed to rename file: ' + error.message);
        }
    }
};

// Edit section
window.editSection = async function (sectionId, currentName) {
    const newName = prompt('Enter new section name:', currentName);
    if (newName && newName !== currentName) {
        try {
            await updateSectionInFirestore(sectionId, { name: newName });
            alert('Section renamed successfully!');
            loadSections('sections-container', null);
        } catch (error) {
            alert('Failed to rename section: ' + error.message);
        }
    }
};

// Render Profile Tab
function renderProfileTab() {
    const container = document.getElementById('content-container');
    if (!container) return;

    container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <h2 style="margin-bottom: var(--spacing-lg); text-align: center;">My Profile</h2>
            
            <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                <div style="position: relative; width: 150px; height: 150px; margin: 0 auto 10px;">
                    <img id="profilePhotoDisplay" src="${currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName) + '&background=0d6efd&color=fff&size=200'}" 
                         alt="Profile" 
                         style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid var(--color-primary);">
                    <button id="changePhotoBtn" style="position: absolute; bottom: 0; right: 0; background: var(--color-primary); border-radius: 50%; padding: 10px; border: 3px solid white; cursor: pointer;">
                        <span class="material-icons-round" style="color: white; font-size: 20px;">camera_alt</span>
                    </button>
                </div>
                <input type="file" id="profilePhotoUpload" accept="image/*" style="display: none;">
            </div>
            
            <div style="margin-bottom: var(--spacing-md);">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Full Name</label>
                <div style="display: flex; gap: var(--spacing-sm);">
                    <input type="text" id="profileNameInput" value="${currentUser.displayName}" 
                           style="flex: 1; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    <button id="updateNameBtn" style="padding: 12px 24px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">
                        Update
                    </button>
                </div>
            </div>
            
            <div style="margin-bottom: var(--spacing-md);">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
                <input type="email" value="${currentUser.email}" disabled 
                       style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem; background: #f5f5f5; color: var(--color-text-muted);">
            </div>
            
            <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--color-border);">
                <button id="signOutBtn" style="width: 100%; padding: 12px; background: var(--color-danger); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500; font-size: 1rem;">
                    <span class="material-icons-round" style="vertical-align: middle; margin-right: 8px;">logout</span>
                    Sign Out
                </button>
            </div>
        </div>
    `;

    // Setup change photo button
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const profilePhotoUpload = document.getElementById('profilePhotoUpload');
    const profilePhotoDisplay = document.getElementById('profilePhotoDisplay');
    const updateNameBtn = document.getElementById('updateNameBtn');
    const profileNameInput = document.getElementById('profileNameInput');
    const signOutBtn = document.getElementById('signOutBtn');

    changePhotoBtn.onclick = () => {
        profilePhotoUpload.click();
    };

    profilePhotoUpload.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        showLoader();

        try {
            // Upload to Firebase Storage
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js").then(async ({ ref, uploadBytes, getDownloadURL }) => {
                try {
                    const storageRef = ref(window.storage, `profile-photos/${currentUser.uid}/${Date.now()}_${file.name}`);
                    
                    // Upload file to storage
                    await uploadBytes(storageRef, file);
                    
                    // Get download URL
                    const photoURL = await getDownloadURL(storageRef);

                    // Update Firestore
                    await updateUserProfile(currentUser.uid, {
                        photoURL: photoURL
                    });

                    // Update Firebase Auth
                    const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
                    await updateProfile(currentUser, {
                        photoURL: photoURL
                    });

                    currentUser.photoURL = photoURL;
                    profilePhotoDisplay.src = photoURL;
                    alert('Profile photo updated successfully!');
                    hideLoader();
                } catch (storageError) {
                    console.error('Storage error:', storageError);
                    alert('Failed to upload photo to storage. Trying fallback method...');
                    
                    // Fallback: Use a simple image service
                    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName)}&background=0d6efd&color=fff&size=200&timestamp=${Date.now()}`;
                    
                    await updateUserProfile(currentUser.uid, {
                        photoURL: photoURL
                    });

                    const { updateProfile: updateAuthProfile } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
                    await updateAuthProfile(currentUser, {
                        photoURL: photoURL
                    });

                    currentUser.photoURL = photoURL;
                    profilePhotoDisplay.src = photoURL;
                    alert('Profile photo updated successfully (using avatar service)!');
                    hideLoader();
                }
            });
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo: ' + error.message);
            hideLoader();
        }
    };

    updateNameBtn.onclick = async () => {
        const newName = profileNameInput.value.trim();
        if (!newName) {
            alert('Please enter a name');
            return;
        }

        showLoader();

        try {
            await updateUserProfile(currentUser.uid, {
                displayName: newName
            });

            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js").then(async ({ updateProfile }) => {
                await updateProfile(currentUser, {
                    displayName: newName
                });

                currentUser.displayName = newName;
                alert('Name updated successfully!');
                hideLoader();
            });
        } catch (error) {
            alert('Failed to update name: ' + error.message);
            hideLoader();
        }
    };

    signOutBtn.onclick = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            showLoader();
            await logout();
        }
    };
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

// Professional Profile Edit Modal
function renderProfileEditModal() {
    const modalHtml = `
        <div id="profileModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div class="card" style="max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <button id="closeModalBtn" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--color-text-muted);">&times;</button>
                
                <h2 style="margin-bottom: var(--spacing-lg); text-align: center;">Edit Profile</h2>
                
                <!-- Profile Photo Upload -->
                <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                    <div style="position: relative; width: 120px; height: 120px; margin: 0 auto 10px;">
                        <img id="profilePreview" src="${currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName) + '&background=0d6efd&color=fff&size=200'}" 
                             alt="Profile" 
                             style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--color-primary); cursor: pointer;">
                        <div style="position: absolute; bottom: 0; right: 0; background: var(--color-primary); border-radius: 50%; padding: 8px; border: 3px solid white; cursor: pointer;">
                            <span class="material-icons-round" style="color: white; font-size: 16px;">camera_alt</span>
                        </div>
                    </div>
                    <input type="file" id="profilePhotoInput" accept="image/*" style="display: none;">
                    <p style="font-size: 0.9rem; color: var(--color-text-muted);">Click on photo to change</p>
                </div>
                
                <!-- Edit Form -->
                <form id="editProfileForm">
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Full Name *</label>
                        <input type="text" id="editName" value="${currentUser.displayName}" required 
                               style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem;">
                    </div>
                    
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
                        <input type="email" value="${currentUser.email}" disabled 
                               style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem; background: #f5f5f5; color: var(--color-text-muted);">
                        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">Email cannot be changed</p>
                    </div>
                    
                    <div style="margin-bottom: var(--spacing-md);">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Or Upload Photo</label>
                        <div style="border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: var(--spacing-md); text-align: center;">
                            <span class="material-icons-round" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: 8px;">cloud_upload</span>
                            <p style="font-size: 0.9rem; color: var(--color-text-muted);">Drag & drop or click to upload</p>
                            <p style="font-size: 0.85rem; color: var(--color-text-muted);">JPG, PNG (Max 2MB)</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); margin-top: var(--spacing-lg);">
                        <button type="button" id="cancelModalBtn" 
                                style="padding: 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-size: 1rem; font-weight: 500;">
                            Cancel
                        </button>
                        <button type="submit" 
                                style="padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 1rem; font-weight: 500;">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    // Get elements
    const profilePreview = document.getElementById('profilePreview');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const editProfileForm = document.getElementById('editProfileForm');

    // Handle photo click
    profilePreview.onclick = () => {
        profilePhotoInput.click();
    };

    // Handle file selection
    profilePhotoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert('File size must be less than 2MB');
                return;
            }

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePreview.src = event.target.result;
                window.selectedPhotoData = event.target.result; // Store for later use
            };
            reader.readAsDataURL(file);
        }
    };

    // Close modal
    closeModalBtn.onclick = () => {
        document.body.removeChild(modalContainer);
    };

    cancelModalBtn.onclick = () => {
        document.body.removeChild(modalContainer);
    };

    // Handle form submit
    editProfileForm.onsubmit = async (e) => {
        e.preventDefault();
        showLoader();

        const displayName = document.getElementById('editName').value;
        const photoURL = window.selectedPhotoURL || currentUser.photoURL;

        try {
            // Update Firestore
            await updateUserProfile(currentUser.uid, {
                displayName,
                photoURL: photoURL || null
            });

            // Update Firebase Auth profile
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js").then(async ({ updateProfile }) => {
                await updateProfile(currentUser, {
                    displayName,
                    photoURL: photoURL || null
                });

                // Update current user object
                currentUser.displayName = displayName;
                if (photoURL) currentUser.photoURL = photoURL;

                alert('Profile updated successfully!');
                document.body.removeChild(modalContainer);
                renderMainContent(currentUser, currentRole);
            });
        } catch (error) {
            alert('Failed to update profile: ' + error.message);
            hideLoader();
        }
    };
}

function renderMainContent(user, role) {
    currentUser = user;
    currentRole = role;
    
    // Store globally for use in openSection and other functions
    window.currentUserGlobal = user;
    window.currentRoleGlobal = role;

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
            <div class="card" style="margin-top: var(--spacing-md);">
                <h3 style="margin-bottom: var(--spacing-sm); color: var(--color-primary);">📢 Notifications</h3>
                <span id="notification-badge" style="background: var(--color-danger); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; display: none;">0</span>
                <div id="notifications-list">
                    <p style="color: var(--color-text-muted); font-size: 0.9rem; padding: var(--spacing-md) 0;">No new notifications</p>
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

    // Check for notifications
    checkNotifications();

    // Setup Profile Button
    userProfileBtn.onclick = async () => {
        const choice = confirm('Choose:\nOK - Edit Profile\nCancel - Sign Out');
        if (choice) {
            renderProfileEditModal();
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

                    console.log('Fetching videos from Firestore...');
                    const videos = await getVideosFromFirestore();
                    console.log(`Found ${videos.length} videos in Firestore`);

                    // If no videos in Firestore, try to sync from YouTube
                    if (videos.length === 0) {
                        console.log('No videos in Firestore, syncing from YouTube...');
                        await syncYouTubeVideos();
                        const syncedVideos = await getVideosFromFirestore();
                        console.log(`Synced ${syncedVideos.length} videos from YouTube`);

                        if (syncedVideos.length === 0) {
                            videosGrid.innerHTML = '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-text-muted);">No videos available yet. Check back soon!</p>';
                        } else {
                            videosGrid.innerHTML = renderVideosGrid(syncedVideos);
                        }
                    } else {
                        videosGrid.innerHTML = renderVideosGrid(videos);
                    }
                } catch (error) {
                    console.error('Error loading videos:', error);
                    container.innerHTML += '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-danger);">Error loading videos. Please try again later.</p>';
                }
                break;

            case 'files':
                // Show admin controls for admins
                if (currentRole === 'ADMIN') {
                    container.innerHTML = `
                        <div style="margin-bottom: var(--spacing-lg);">
                            <button id="addSectionBtn" class="btn" style="padding: 12px 24px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 1rem; font-weight: 500; display: inline-flex; align-items: center;">
                                <span class="material-icons-round" style="margin-right: 8px;">add_circle</span>
                                Add New Section
                            </button>
                        </div>
                    `;
                }

                container.innerHTML += `
                    <h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Files & Sections</h3>
                    <div id="sections-container">
                        <p style="text-align: center; padding: var(--spacing-lg); color: var(--color-text-muted);">Loading sections...</p>
                    </div>
                `;

                // Load sections from Firestore
                try {
                    await loadSections('sections-container', null);

                    // Setup Add Section button after loading
                    if (currentRole === 'ADMIN') {
                        const addSectionBtn = document.getElementById('addSectionBtn');
                        if (addSectionBtn) {
                            addSectionBtn.onclick = () => showAddSectionModal(null);
                        }
                    }
                } catch (error) {
                    console.error('Error loading sections:', error);
                    document.getElementById('sections-container').innerHTML = '<p style="text-align: center; padding: var(--spacing-lg); color: var(--color-danger);">Error loading sections.</p>';
                }
                break;

            case 'downloads':
                container.innerHTML = `<h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Offline Downloads</h3><p style="color: var(--color-text-muted); font-size: 0.9rem; text-align: center; padding: var(--spacing-lg) 0;">No offline files available yet.</p>`;
                break;

            case 'profile':
                renderProfileTab();
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
        
        // Initialize Google Drive API
        console.log('Initializing Google Drive API...');
        initGoogleDrive().then(() => {
            console.log('Google Drive API initialized');
        }).catch(err => {
            console.warn('Google Drive API initialization skipped (file uploads may not work):', err);
        });

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
