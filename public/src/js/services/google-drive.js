// Google Drive API Integration
const CLIENT_ID = '488447923830-1j5qdrosg6t56e5d01fsbtepr5f11fnn.apps.googleusercontent.com'; // Replace with your actual Client ID
const API_KEY = 'AQ.Ab8RN6Ld7J9Wh6IU8LUqDgeDKD4e2pZoqJf4n7a_9xw2MzV0Qw'; // Replace with your actual API Key
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = 'ya29.a0ATkoCc7_X9mkrIcP0fUxuEud5lIKO2ZFeT2ZEu-GtWh0PP9y3SN4V45Eebx-jufjHhsDR5lQpARE1lypLDPvIOjMu2cgLRBJW8a61PCOtsLzRfgw8xp3jc5B2a0dvcJGUxAvta_yc6xuOpaGH9XhzJngpNhMgUTT8lvMsQVEWkhuhifnHeAk0fx6mz4bFoIy-oUtFPYaCgYKATcSARISFQHGX2MiRB3krsXJe2CcrkxE6Su1tA0206';
let refreshToken = '1//04KAkx4X4QspNCgYIARAAGAQSNwF-L9IrzroFhZNJC3UWibMjPKvgWyzpN1L_r0fqlXf3ct8LpXASGUZY-n18LBzfSxYp2gwiB_I';

// Initialize Google API client
export async function initGoogleDrive() {
    return new Promise((resolve, reject) => {
        // Load Google Identity Services script first
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = () => {
            // Load gapi script after GIS is loaded
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.onload = () => {
                gapi.load('client', () => {
                    initializeGapi(resolve, reject);
                });
            };
            gapiScript.onerror = reject;
            document.head.appendChild(gapiScript);
        };
        gisScript.onerror = reject;
        document.head.appendChild(gisScript);
    });
}

async function initializeGapi(resolve, reject) {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS
        });
        gapiInited = true;
        
        // Initialize token client
        try {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: handleTokenResponse,
            });
            gisInited = true;
        } catch (gisError) {
            console.warn('Could not initialize token client:', gisError);
            gisInited = false;
        }
        
        console.log('Google Drive API initialized successfully');
        resolve();
    } catch (error) {
        console.error('Error initializing Google Drive API:', error);
        reject(error);
    }
}

function handleTokenResponse(response) {
    if (response.access_token) {
        accessToken = response.access_token;
        if (response.refresh_token) {
            refreshToken = response.refresh_token;
        }
        console.log('Token received');
    }
}

// Refresh access token
export async function refreshAccessToken() {
    return new Promise((resolve, reject) => {
        tokenClient.callback = (resp) => {
            if (resp.error) {
                reject(resp);
            } else {
                accessToken = resp.access_token;
                if (resp.refresh_token) {
                    refreshToken = resp.refresh_token;
                }
                console.log('Access token refreshed');
                resolve(accessToken);
            }
        };
        tokenClient.requestAccessToken({prompt: ''});
    });
}

// Get valid access token
async function getValidAccessToken() {
    if (!accessToken || accessToken === 'ya29.a0ATkoCc7_X9mkrIcP0fUxuEud5lIKO2ZFeT2ZEu-GtWh0PP9y3SN4V45Eebx-jufjHhsDR5lQpARE1lypLDPvIOjMu2cgLRBJW8a61PCOtsLzRfgw8xp3jc5B2a0dvcJGUxAvta_yc6xuOpaGH9XhzJngpNhMgUTT8lvMsQVEWkhuhifnHeAk0fx6mz4bFoIy-oUtFPYaCgYKATcSARISFQHGX2MiRB3krsXJe2CcrkxE6Su1tA0206') {
        try {
            return await refreshAccessToken();
        } catch (err) {
            console.error('Failed to refresh token, requesting new authorization:', err);
            return await authorize();
        }
    }
    return accessToken;
}

// Upload file to Google Drive using multipart method
export async function uploadFileToDrive(file, fileName, folderId = null) {
    try {
        console.log('Starting file upload to Google Drive...');
        console.log('gapiInited:', gapiInited, 'gisInited:', gisInited);
        
        // Check if APIs are initialized
        if (!gapiInited || !gisInited) {
            throw new Error('Google APIs not properly initialized. Please refresh the page.');
        }
        
        // First, ensure we have a valid token
        if (!gapi.client.getToken()) {
            console.log('No token found, requesting authorization...');
            await authorize();
        }
        
        const metadata = {
            name: fileName,
            mimeType: file.type
        };
        
        if (folderId) {
            metadata.parents = [folderId];
        }
        
        console.log('Uploading file with metadata:', metadata);
        
        // Use gapi.client for authenticated upload
        const response = await gapi.client.drive.files.create({
            resource: metadata,
            media: {
                mimeType: file.type,
                body: file
            },
            fields: 'id, name, webViewLink, webContentLink, mimeType'
        });
        
        const uploadedFile = response.result;
        console.log('File uploaded successfully:', uploadedFile);
        
        // Make file accessible via link
        try {
            await setFilePermissions(uploadedFile.id);
        } catch (permError) {
            console.warn('Could not set permissions:', permError);
        }
        
        return {
            id: uploadedFile.id,
            name: uploadedFile.name,
            webViewLink: uploadedFile.webViewLink,
            webContentLink: uploadedFile.webContentLink,
            mimeType: uploadedFile.mimeType
        };
    } catch (error) {
        console.error('Error uploading to Drive:', error);
        throw error;
    }
}

// Set file permissions to make it accessible
async function setFilePermissions(fileId) {
    try {
        // Use gapi.client for authenticated request
        if (gapi.client.getToken()) {
            await gapi.client.drive.permissions.create({
                fileId: fileId,
                resource: {
                    type: 'anyone',
                    role: 'reader'
                }
            });
        }
    } catch (error) {
        console.warn('Could not set file permissions:', error);
    }
}

// Authorize user
function authorize() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Token client not initialized'));
            return;
        }
        
        tokenClient.callback = async (resp) => {
            if (resp.error) {
                reject(resp);
            } else {
                resolve(resp);
            }
        };
        
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            tokenClient.requestAccessToken({prompt: ''});
        }
    });
}

// List files in Drive
export async function listDriveFiles(folderId = null) {
    try {
        if (!gapi.client.getToken()) {
            await authorize();
        }
        
        let query = "mimeType != 'application/vnd.google-apps.folder' and trashed = false";
        if (folderId) {
            query += ` and '${folderId}' in parents`;
        }
        
        const response = await gapi.client.drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, webViewLink, webContentLink, createdTime)',
            orderBy: 'createdTime desc'
        });
        
        return response.result.files || [];
    } catch (error) {
        console.error('Error listing files:', error);
        return [];
    }
}

// Delete file from Drive
export async function deleteFileFromDrive(fileId) {
    try {
        if (!gapi.client.getToken()) {
            await authorize();
        }
        
        await gapi.client.drive.files.delete({
            fileId: fileId
        });
        
        console.log('File deleted successfully');
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// Create folder in Drive
export async function createFolderInDrive(folderName, parentFolderId = null) {
    try {
        if (!gapi.client.getToken()) {
            await authorize();
        }
        
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
        };
        
        if (parentFolderId) {
            fileMetadata.parents = [parentFolderId];
        }
        
        const response = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id, name, webViewLink'
        });
        
        return response.result;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
}
