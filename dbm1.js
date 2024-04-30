const token = localStorage.getItem("token");

// Utility to handle requests to IndexedDB
function handleIDBRequest(request, onSuccess, onError) {
    request.onsuccess = function (event) {
        onSuccess(event.target.result);
    };
    request.onerror = function (event) {
        console.error(onError, event.target.error);
    };
}

// Generic function to fetch data from the API and store it in IndexedDB
function fetchAndDisplayData(db, storeName, displayFunction, apiURL) {
    const store = db.transaction([storeName], "readonly").objectStore(storeName);
    handleIDBRequest(store.getAll(), (data) => {
        if (data.length === 0) {
            fetchDataAndStore(apiURL, db, storeName).then(() => fetchAndDisplayData(db, storeName, displayFunction, apiURL));
        } else {
            displayFunction(data);
        }
    }, `Failed to fetch ${storeName}:`);
}

// Function to fetch and display categories or products
function fetchAndDisplayData(db, storeName, displayFunction) {
    const store = db.transaction([storeName], "readonly").objectStore(storeName);
    handleIDBRequest(store.getAll(), (data) => {
        if (data.length === 0) {
            const apiURL = storeName === 'categories' ? "https://app.satsweets.com/api/categories" : "https://app.satsweets.com/api/products";
            fetchDataAndStore(apiURL, db, storeName).then(() => fetchAndDisplayData(db, storeName, displayFunction));
        } else {
            displayFunction(data, db);
        }
    }, `Failed to fetch ${storeName}:`);
}

// Step 2: Fetch and store customer data
function fetchAndDisplayCustomers(db) {
    const customerStoreName = 'customers';
    const customerAPIURL = "https://app.satsweets.com/api/customers";
    fetchAndDisplayData(db, customerStoreName, displayCustomers, customerAPIURL);
}

// Display functions
function displayCategories(categories, db) {
    const categoriesNav = document.getElementById("categories-nav");
    categoriesNav.innerHTML = "";
    categories.forEach(category => {
        const categoryDiv = document.createElement("div");
        categoryDiv.className = "category";
        categoryDiv.textContent = category.name;
        categoryDiv.onclick = function() {
            getAndDisplayProducts(category.id, db);
        };
        categoriesNav.appendChild(categoryDiv);
    });
}


function displayProducts(products) {
    const productList = document.getElementById("product-list");
    productList.innerHTML = products.map(product => `
        <div class="product">
            <img src="${product.thumbnail_url}" alt="${product.name}" style="width: 100px; max-height: 90px;">
            <h5>${product.name}</h5>
            <p>Price: ${product.price}</p>
        </div>
    `).join('');
}

// Display function for customers dropdown
function displayCustomers(customers) {
    const customerSelect = document.querySelector(".cart-header select");
    customers.forEach(customer => {
        const option = document.createElement("option");
        option.value = customer.id;
        option.textContent = customer.name;
        customerSelect.appendChild(option);
    });
}


function getAndDisplayProducts(categoryId, db) {
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");
    const index = store.index("category_id");
    handleIDBRequest(index.getAll(categoryId), (products) => {
        displayProducts(products);
    }, `Failed to fetch products for category ${categoryId}:`);
}

// Initialization
window.onload = function () {
    const request = indexedDB.open("satDB", 4);

    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("categories")) {
            db.createObjectStore("categories", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("products")) {
            const productStore = db.createObjectStore("products", { keyPath: "id" });
            productStore.createIndex("category_id", "category_id", { unique: false });
        }

        if (!db.objectStoreNames.contains("customers")) {
            db.createObjectStore("customers", { keyPath: "id" });
        }
    };

    request.onsuccess = function (event) {
        const db = event.target.result;
        fetchAndDisplayData(db, "categories", displayCategories, "https://app.satsweets.com/api/categories");
        fetchAndDisplayData(db, "products", displayProducts, "https://app.satsweets.com/api/products");
        fetchAndDisplayCustomers(db);
    };
};
