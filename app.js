document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();  // Prevent the default form submission

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const token = await login(email, password);
            console.log('Logged in with token:', token);
            await saveToken(token);  // Save token in IndexedDB
            window.location.href = '/dashboard.html'; // Redirect to dashboard or appropriate page
        } catch (error) {
            console.error('Login failed:', error.message);
            alert('Login failed: ' + error.message); // Optionally update the UI to show an error message
        }
    });
});

const dbRequest = indexedDB.open("satDB", 8);

dbRequest.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'key' });
    }
};

dbRequest.onsuccess = function(event) {
    console.log("Database opened successfully!");
};

dbRequest.onerror = function(event) {
    console.error("Database error: " + event.target.errorCode);
};

async function saveToken(token) {
    const db = await new Promise((resolve, reject) => {
        const openRequest = indexedDB.open("satDB", 8);
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => resolve(openRequest.result);
    });

    const transaction = db.transaction('auth', 'readwrite');
    const store = transaction.objectStore('auth');
    const putRequest = store.put({ key: 'token', value: token });

    return new Promise((resolve, reject) => {
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
    });
}

async function login(email, password) {
    const response = await fetch('https://app.satsweets.com/api/login', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        return data.token;
    } else {
        throw new Error(data.message || 'Failed to log in');
    }
}
