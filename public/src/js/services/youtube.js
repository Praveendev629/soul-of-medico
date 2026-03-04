import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Channel information
const YOUTUBE_CHANNEL_ID = 'UC9_D5KyamXnm9PSqbIppx8Q';
const CHANNEL_HANDLE = '@soul-of-medico';

// Use YouTube RSS Feed (NO API KEY NEEDED!)
const RSS_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

// Fetch videos from YouTube RSS Feed
export async function fetchYouTubeVideos() {
    try {
        // Use CORS proxy to fetch RSS feed
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(corsProxy + encodeURIComponent(RSS_FEED_URL));
        
        if (!response.ok) {
            throw new Error('Failed to fetch RSS feed');
        }
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const entries = xmlDoc.getElementsByTagName('entry');
        const videos = [];
        
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const videoId = entry.getElementsByTagName('yt:videoId')[0]?.textContent;
            const title = entry.getElementsByTagName('title')[0]?.textContent;
            const publishedAt = entry.getElementsByTagName('published')[0]?.textContent;
            
            // Get author/channel name
            const author = entry.getElementsByTagName('author')[0];
            const channelTitle = author?.getElementsByTagName('name')[0]?.textContent || 'Soul of Medico';
            
            if (videoId) {
                videos.push({
                    id: videoId,
                    title: title,
                    description: '',
                    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    publishedAt: publishedAt,
                    channelTitle: channelTitle,
                    link: `https://www.youtube.com/watch?v=${videoId}`
                });
            }
        }
        
        return videos;
    } catch (error) {
        console.error('Error fetching YouTube videos via RSS:', error);
        // Fallback: Return empty array but don't break the app
        return [];
    }
}

// Get videos from Firestore
export async function getVideosFromFirestore() {
    try {
        const videosRef = collection(window.db, 'videos');
        const q = query(videosRef, orderBy('publishedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting videos from Firestore:', error);
        return [];
    }
}

// Add video to Firestore
export async function addVideoToFirestore(videoData) {
    try {
        const videosRef = collection(window.db, 'videos');
        await addDoc(videosRef, {
            ...videoData,
            addedAt: new Date().toISOString()
        });
        console.log('Video added to Firestore');
    } catch (error) {
        console.error('Error adding video to Firestore:', error);
    }
}

// Update video in Firestore
export async function updateVideoInFirestore(videoId, videoData) {
    try {
        const videoRef = doc(window.db, 'videos', videoId);
        await updateDoc(videoRef, videoData);
        console.log('Video updated in Firestore');
    } catch (error) {
        console.error('Error updating video in Firestore:', error);
    }
}

// Delete video from Firestore
export async function deleteVideoFromFirestore(videoId) {
    try {
        const videoRef = doc(window.db, 'videos', videoId);
        await deleteDoc(videoRef);
        console.log('Video deleted from Firestore');
    } catch (error) {
        console.error('Error deleting video from Firestore:', error);
    }
}

// Check for new videos and send notification
export async function checkForNewVideos() {
    try {
        const localVideos = await getVideosFromFirestore();
        const youtubeVideos = await fetchYouTubeVideos();
        
        const localVideoIds = localVideos.map(v => v.id);
        const newVideos = youtubeVideos.filter(v => !localVideoIds.includes(v.id));
        
        if (newVideos.length > 0) {
            // Add new videos to Firestore
            for (const video of newVideos) {
                await addVideoToFirestore(video);
            }
            
            // Create notification
            await createNotification('New Videos Available!', `${newVideos.length} new video(s) added from ${YOUTUBE_CHANNEL_ID}`);
            
            return newVideos;
        }
        
        return [];
    } catch (error) {
        console.error('Error checking for new videos:', error);
        return [];
    }
}

// Create notification in Firestore
export async function createNotification(title, message) {
    try {
        const notificationsRef = collection(window.db, 'notifications');
        await addDoc(notificationsRef, {
            title,
            message,
            read: false,
            createdAt: new Date().toISOString()
        });
        console.log('Notification created');
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Get unread notifications count
export async function getUnreadNotificationsCount() {
    try {
        const notificationsRef = collection(window.db, 'notifications');
        const querySnapshot = await getDocs(notificationsRef);
        let count = 0;
        
        querySnapshot.forEach(doc => {
            if (!doc.data().read) {
                count++;
            }
        });
        
        return count;
    } catch (error) {
        console.error('Error getting notifications count:', error);
        return 0;
    }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
    try {
        const notificationRef = doc(window.db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
        console.log('Notification marked as read');
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Sync YouTube videos with Firestore (call this periodically)
export async function syncYouTubeVideos() {
    try {
        await checkForNewVideos();
        console.log('YouTube videos synced successfully');
    } catch (error) {
        console.error('Error syncing YouTube videos:', error);
    }
}
