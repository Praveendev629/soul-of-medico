import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ============= SECTIONS =============

export async function loadSectionsFromFirestore(parentId = null) {
    try {
        const sectionsRef = collection(window.db, 'sections');
        const q = query(sectionsRef, where('parentId', '==', parentId));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading sections:', error);
        return [];
    }
}

export async function addSectionToFirestore(sectionData) {
    try {
        console.log('addSectionToFirestore called with:', sectionData);
        
        if (!sectionData.name) {
            throw new Error('Section name is required');
        }
        
        if (!window.db) {
            throw new Error('Firestore database not initialized. Please refresh the page.');
        }
        
        const sectionsRef = collection(window.db, 'sections');
        const docRef = await addDoc(sectionsRef, {
            ...sectionData,
            createdAt: new Date().toISOString()
        });
        
        console.log('Section added successfully with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding section:', error);
        throw error;
    }
}

export async function updateSectionInFirestore(sectionId, updates) {
    try {
        const sectionRef = doc(window.db, 'sections', sectionId);
        await updateDoc(sectionRef, updates);
        console.log('Section updated successfully');
    } catch (error) {
        console.error('Error updating section:', error);
        throw error;
    }
}

export async function deleteSectionFromFirestore(sectionId) {
    try {
        const sectionRef = doc(window.db, 'sections', sectionId);
        await deleteDoc(sectionRef);
        console.log('Section deleted successfully');
    } catch (error) {
        console.error('Error deleting section:', error);
        throw error;
    }
}

// ============= FILES =============

export async function loadFilesFromFirestore(sectionId) {
    try {
        const filesRef = collection(window.db, 'files');
        const q = query(filesRef, where('sectionId', '==', sectionId));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading files:', error);
        return [];
    }
}

export async function addFileToFirestore(fileData) {
    try {
        const filesRef = collection(window.db, 'files');
        await addDoc(filesRef, {
            ...fileData,
            uploadedAt: new Date().toISOString()
        });
        console.log('File added successfully');
    } catch (error) {
        console.error('Error adding file:', error);
        throw error;
    }
}

export async function updateFileInFirestore(fileId, updates) {
    try {
        const fileRef = doc(window.db, 'files', fileId);
        await updateDoc(fileRef, updates);
        console.log('File updated successfully');
    } catch (error) {
        console.error('Error updating file:', error);
        throw error;
    }
}

export async function deleteFileFromFirestore(fileId) {
    try {
        const fileRef = doc(window.db, 'files', fileId);
        await deleteDoc(fileRef);
        console.log('File deleted successfully');
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}
