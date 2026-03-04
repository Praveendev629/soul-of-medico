const { onCall } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const cors = require('cors')({ origin: true });

admin.initializeApp();

// TODO: Replace with your actual OAuth2 credentials
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});

exports.uploadFile = onCall(async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new admin.auth.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    // Check if user is an admin (Assuming Admin role in Firestore user doc)
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'ADMIN') {
        throw new admin.auth.HttpsError(
            'permission-denied',
            'Only admins can upload files.'
        );
    }

    const { fileName, fileMimeType, fileData } = request.data;
    const buffer = Buffer.from(fileData, 'base64');

    try {
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: fileMimeType,
            },
            media: {
                mimeType: fileMimeType,
                body: buffer,
            },
            fields: 'id, webViewLink, webContentLink',
        });

        return {
            success: true,
            fileId: response.data.id,
            url: response.data.webViewLink,
            downloadUrl: response.data.webContentLink
        };
    } catch (error) {
        logger.error("Error uploading file to Drive", error);
        throw new admin.auth.HttpsError('internal', 'Error uploading file');
    }
});
