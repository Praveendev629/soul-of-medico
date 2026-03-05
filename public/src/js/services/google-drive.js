// Google Drive API Integration
const CLIENT_ID = '1060370205325-s0rq68mhv2gtjrivvvs064mrf0q0u4e2.apps.googleusercontent.com'; // Replace with your actual Client ID
const API_KEY = 'AIzaSyD9tS0rLdPz9t7906aW9wLsKkU4xWl6i8g'; // Replace with your actual API Key
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Initialize Google API client
export async function initGoogleDrive() {
    return new Promise((resolve, reject) => {
        // Load gapi script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            gapi.load('client', initializeGapi);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function initializeGapi() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS
        });
        gapiInited = true;
        
        // Initialize token client
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '',
        });
        gisInited = true;
        
        console.log('Google Drive API initialized');
    } catch (error) {
        console.error('Error initializing Google Drive API:', error);
        throw error;
    }
}

// Upload file to Google Drive
export async function uploadFileToDrive(file, fileName, folderId = null) {
    try {
        // Check if user is authorized
        if (!gapi.client.getToken()) {
            await authorize();
        }
        
        const metadata = {
            name: fileName,
            mimeType: file.type
        };
        
        if (folderId) {
            metadata.parents = [folderId];
        }
        
        const accessToken = gapi.client.getToken().access_token;
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(metadata)
        });
        
        const fileInfo = await response.json();
        
        // Now upload the actual file content
        const form = new FormData();
        form.append('file', file);
        
        const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=media&upload_id=${fileInfo.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Length': file.size.toString()
            },
            body: file
        });
        
        const uploadedFile = await uploadResponse.json();
        
        // Make file accessible via link
        await setFilePermissions(uploadedFile.id);
        
        return {
            id: uploadedFile.id,
            name: uploadedFile.name,
            webViewLink: uploadedFile.webViewLink,
            webContentLink: uploadedFile.webContentLink
        };
    } catch (error) {
        console.error('Error uploading to Drive:', error);
        throw error;
    }
}

// Set file permissions to make it accessible
async function setFilePermissions(fileId) {
    try {
        const accessToken = gapi.client.getToken().access_token;
        
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'anyone',
                role: 'reader'
            })
        });
    } catch (error) {
        console.error('Error setting permissions:', error);
    }
}

// Authorize user
function authorize() {
    return new Promise((resolve, reject) => {
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
