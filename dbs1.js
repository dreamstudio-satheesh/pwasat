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
function fetchDataAndStore(url, db, storeName) {
    if (!navigator.onLine) {
        console.log("Offline mode: Using cached data for", storeName);
        return; // Early return if offline, assuming data is already fetched earlier
    }
    return fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
    }).then(data => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        store.clear();
        data.forEach(item => store.add(item));
        return transaction.complete;
    }).catch(error => console.error(`Error fetching ${storeName}:`, error));
}

// Function to fetch and display categories, products or customers
function fetchAndDisplayData(db, storeName, displayFunction, apiURL) {
    const store = db.transaction([storeName], "readonly").objectStore(storeName);
    handleIDBRequest(store.getAll(), (data) => {
        if (data.length === 0) {
            fetchDataAndStore(apiURL, db, storeName).then(() => fetchAndDisplayData(db, storeName, displayFunction, apiURL));
        } else {
            displayFunction(data, db);
        }
    }, `Failed to fetch ${storeName}:`);
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
        <div class="product" onclick="addToCart(${JSON.stringify(product)})" style="cursor: pointer;">
            <img src="${product.thumbnail_url}" alt="${product.name}" style="width: 100px; max-height: 90px;">
            <h5>${product.name}</h5>
            <p>Price: ${product.price}</p>
        </div>
    `).join('');
}

function getAndDisplayProducts(categoryId, db) {
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");
    const index = store.index("category_id");
    handleIDBRequest(index.getAll(categoryId), (products) => {
        displayProducts(products);
    }, `Failed to fetch products for category ${categoryId}:`);
}

function displayCustomers(customers) {
    const customerSelect = document.querySelector(".customerslist select");
    customerSelect.innerHTML = ""; // Clear existing options
    customers.forEach(customer => {
        const option = document.createElement("option");
        option.value = customer.id;
        option.textContent = customer.name;
        customerSelect.appendChild(option);
    });
}

// Initialization
window.onload = function () {
    const request = indexedDB.open("satDB", 5);

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
        fetchAndDisplayData(db, "customers", displayCustomers, "https://app.satsweets.com/api/customers");
    };
};






const cart = [];

function addToCart(product) {
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    displayCart();
}

function increaseQuantity(productId) {
    const product = cart.find(item => item.id === productId);
    if (product) {
        product.quantity += 1;
        displayCart();
    }
}

function decreaseQuantity(productId) {
    const product = cart.find(item => item.id === productId);
    if (product) {
        product.quantity -= 1;
        if (product.quantity <= 0) {
            cart.splice(cart.indexOf(product), 1);
        }
        displayCart();
    }
}


function displayCart() {
    const cartItemsDiv = document.querySelector(".cart-items");
    cartItemsDiv.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${item.price}</span>
            <button onclick="decreaseQuantity(${item.id})">-</button>
            <input type="number" class="form-control" value="${item.quantity}" readonly>
            <button onclick="increaseQuantity(${item.id})">+</button>
        </div>
    `).join('');
}

