const request = indexedDB.open('satDB', 1);  // Use at least the current version number


dbRequest.onupgradeneeded = function(event) {
    let db = event.target.result;

    if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
        console.log('Categories store created.');
    }
    if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        // Create an index for 'category_id' within the 'products' store
        productStore.createIndex('category_id', 'category_id', { unique: false });
        console.log('Index on category_id created.');
    } else {
        // If the 'products' store already exists, ensure the index is also created
        const transaction = event.target.transaction;
        const productStore = transaction.objectStore('products');
        if (!productStore.indexNames.contains('category_id')) {
            productStore.createIndex('category_id', 'category_id', { unique: false });
        }
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
            if (!Array.isArray(categories)) {
                throw new TypeError('Expected an array of categories, received: ' + typeof categories);
            }
            const transaction = db.transaction(['categories'], 'readwrite');
            const store = transaction.objectStore('categories');
            store.clear();
            categories.forEach(category => {
                store.add(category);
            });
        })
        .catch(error => console.error('Error fetching categories:', error));
}


function fetchAndStoreProducts(db) {
    fetch('https://app.satsweets.com/api/products')  // Adjust the URL as necessary
        .then(response => response.json())
        .then(products => {
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            store.clear();
            products.forEach(product => {
                store.add(product);
            });
        })
        .catch(error => console.error('Error fetching products:', error));
}
