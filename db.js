const dbRequest = indexedDB.open('satsweetsDB', 1);

dbRequest.onupgradeneeded = function(event) {
    let db = event.target.result;

    if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
    }
};

dbRequest.onsuccess = function(event) {
    const db = event.target.result;
    fetchAndStoreCategories(db);
    fetchAndStoreProducts(db);
};

dbRequest.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

function fetchAndStoreCategories(db) {
    fetch('https://app.satsweets.com/api/categories')
        .then(response => response.json())
        .then(categories => {
            const transaction = db.transaction(['categories'], 'readwrite');
            const store = transaction.objectStore('categories');
            store.clear();
            categories.forEach(category => {
                store.add(category);
            });
        })
        .catch(error => console.error('Error fetching categories:', error));
};
