// Check if user is logged in
function checkLogin() {
    const token = localStorage.getItem('token');
    if (!token) {
        // If no token is found, redirect to the login page
        window.location.href = '/login.html'; // Adjust the path as necessary
    }
    // You can add more checks here, like verifying the token with the server
}

// Run checkLogin when the document loads
document.addEventListener('DOMContentLoaded', checkLogin);



function logout() {
    // Clear user session/token from local storage or cookies
    localStorage.removeItem('token'); // Assuming you store a token named 'token'
    
    clearIndexedDB();

    // Redirect to login page or home page
    window.location.href = 'login.html'; // Change '/login.html' to your login page URL
}


function clearIndexedDB() {
    var dbRequest = indexedDB.open('satDB', 1);

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

