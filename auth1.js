// Check if user is logged in
async function checkLogin() {
    const token = await getToken();  // Get token from IndexedDB
    if (!token) {
        // If no token is found, redirect to the login page
        window.location.href = '/login.html'; // Adjust the path as necessary
    }
    // You can add more checks here, like verifying the token with the server
}

// Run checkLogin when the document loads
document.addEventListener('DOMContentLoaded', checkLogin);

// Logout function
async function logout() {
    // Clear user session/token from IndexedDB
    await clearToken(); // Clears the token from IndexedDB

     /*  clearIndexedDB(); */

    // Redirect to login page or home page
    window.location.href = 'login.html'; // Change '/login.html' to your login page URL
}

// Function to retrieve the token from IndexedDB
async function getToken() {
    const db = await new Promise((resolve, reject) => {
        const openRequest = indexedDB.open("appSAT", 1);
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => resolve(openRequest.result);
        // Ensure 'auth' store exists
        openRequest.onupgradeneeded = (event) => {
            let db = event.target.result;
            if (!db.objectStoreNames.contains('auth')) {
                db.createObjectStore('auth');
            }
        };
    });

    const transaction = db.transaction('auth', 'readonly');
    const store = transaction.objectStore('auth');
    const getRequest = store.get('token');

    return new Promise((resolve, reject) => {
        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => {
            resolve(getRequest.result ? getRequest.result.value : null);
        };
    });
}

// Function to clear the token from IndexedDB
async function clearToken() {
    const db = await new Promise((resolve, reject) => {
        const openRequest = indexedDB.open("appSAT", 1);
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => resolve(openRequest.result);
        // Ensure 'auth' store exists
        openRequest.onupgradeneeded = (event) => {
            let db = event.target.result;
            if (!db.objectStoreNames.contains('auth')) {
                db.createObjectStore('auth');
            }
        };
    });

    const transaction = db.transaction('auth', 'readwrite');
    const store = transaction.objectStore('auth');
    const clearRequest = store.clear();

    return new Promise((resolve, reject) => {
        clearRequest.onerror = () => reject(clearRequest.error);
        clearRequest.onsuccess = () => {
            console.log('Token cleared.');
            resolve();
        };
    });
}


function clearIndexedDB() {
    var dbRequest = indexedDB.open('appSAT', 1);

    dbRequest.onsuccess = function(event) {
        var db = event.target.result;
        var transaction = db.transaction(['categories', 'products'], 'readwrite');
        transaction.objectStore('categories').clear();
        transaction.objectStore('products').clear();
        
        transaction.oncomplete = function() {
            console.log('All data cleared.');
        };
        
        transaction.onerror = function(event) {
            console.error('Error clearing data:', event.target.error);
        };
    };

    dbRequest.onerror = function(event) {
        console.error('Error accessing database:', event.target.error);
    };
}

