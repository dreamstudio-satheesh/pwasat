window.onload = function() {
    // Open a connection to the IndexedDB
    const request = indexedDB.open('satsweetsDB', 1); 

    request.onsuccess = function(event) {
        const db = event.target.result;
        getAndDisplayCategories(db); // Call your function once the DOM is ready

        getAllProducts(db);
    };

    request.onerror = function(event) {
        console.error("Database error: " + event.target.errorCode);
        // Handle errors here
    };

    // Add onupgradeneeded event handler here if necessary
    request.onupgradeneeded = function(event) {
        // This is where you would create stores/indexes if they don't exist already
    };
};

// Rest of your code (e.g., getAndDisplayCategories function)


// Function to get and display categories
function getAndDisplayCategories(db) {
    const transaction = db.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.getAll();

    request.onsuccess = function(event) {
        displayCategories(event.target.result, db);
    };
}


// Function to get and display all products
function getAllProducts(db) {
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();

    request.onsuccess = function(event) {
        displayProducts(event.target.result); // Use the existing displayProducts function
    };
}

function displayCategories(categories, db) {
    console.log('Displaying categories:', categories); // Add this line
    
    const categoriesNav = document.getElementById('categories-nav');
    categoriesNav.innerHTML = ''; // Clear existing content
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        categoryDiv.textContent = category.name;
        categoryDiv.onclick = function() { getAndDisplayProducts(category.id, db); };
        categoriesNav.appendChild(categoryDiv);
    });
}

// Function to get and display products for a specific category
function getAndDisplayProducts(categoryId, db) {
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const index = store.index('category_id');
    const request = index.getAll(categoryId);

    request.onsuccess = function(event) {
        displayProducts(event.target.result);
    };
}

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; // Clear existing content
    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.innerHTML = `<h5>${product.name}</h5><p>${product.price}</p>`;
        productList.appendChild(productDiv);
    });
}

