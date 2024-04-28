// db.js - This script will handle the IndexedDB operations

const dbRequest = indexedDB.open('satsweetsDB', 1);

dbRequest.onupgradeneeded = function(event) {
    let db = event.target.result;

    // Create object stores for this database
    if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
    }
};

function fetchAndStoreCategories() {
    fetch('https://app.satsweets.com/api/categories')
        .then(response => response.json())
        .then(categories => {
            const db = dbRequest.result;
            const transaction = db.transaction(['categories'], 'readwrite');
            const store = transaction.objectStore('categories');
            
            // Clear existing records to prevent duplicates
            store.clear();

            categories.forEach(category => {
                store.add(category);
            });
        })
        .catch(error => console.error('Error fetching categories:', error));
}

function fetchAndStoreProducts() {
    // Similarly for products, fetch and store them in IndexedDB
}

// Call these functions to initiate fetching and storing
fetchAndStoreCategories();
fetchAndStoreProducts();
