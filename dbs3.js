let db; // This will hold the database connection globally
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
        return;
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
    }).catch(error => console.error(`Error fetching ${storeName}:`, error));
}

// Function to fetch and display categories, products, or customers
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

function displayCategories(categories, db) {
    const categoriesNav = document.getElementById("categories-nav");
    categoriesNav.innerHTML = "";
    categories.forEach(category => {
        const categoryDiv = document.createElement("div");
        categoryDiv.className = "category";
        categoryDiv.textContent = category.name;
        categoryDiv.onclick = () => getAndDisplayProducts(category.id, db);
        categoriesNav.appendChild(categoryDiv);
    });
}

function displayProducts(products, db) {
    const productList = document.getElementById("product-list");
    productList.innerHTML = ""; // Clear previous products

    products.forEach(product => {
        const productDiv = document.createElement("div");
        productDiv.className = "product";
        productDiv.innerHTML = `
            <img src="${product.thumbnail_url}" alt="${product.name}" style="width: 100px; max-height: 90px;">
            <h5>${product.name}</h5>
            <p>Price: ${product.price}</p>
        `;
        productDiv.style.cursor = "pointer";
        productDiv.onclick = () => addToCart(product.id); // Attach event listener directly with access to `db`
        productList.appendChild(productDiv);
    });
}


function getAndDisplayProducts(categoryId, db) {
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");
    const index = store.index("category_id");
    handleIDBRequest(index.getAll(categoryId), (products) => displayProducts(products, db), `Failed to fetch products for category ${categoryId}:`);
}

function displayCustomers(customers) {
    const customerSelect = document.querySelector(".customerslist select");
    customerSelect.innerHTML = "";
    customers.forEach(customer => {
        const option = document.createElement("option");
        option.value = customer.id;
        option.textContent = customer.name;
        customerSelect.appendChild(option);
    });
}

const cart = [];

function addToCart(productId) {
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.get(productId);

    request.onsuccess = function () {
        const product = request.result;
        if (!product) {
            console.error("Product not found!");
            return;
        }

        const existingProduct = cart.find(item => item.id === productId);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.push({...product, quantity: 1});
        }
        displayCart();
    };

    request.onerror = function (event) {
        console.error("Error fetching product from IndexedDB:", event.target.error);
    };
}


function displayCart() {
    const cartItemsDiv = document.querySelector(".cart-items");
    cartItemsDiv.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${item.price}</span>
            <button onclick="decreaseQuantity('${item.id}')">-</button>
            <input type="number" class="form-control" value="${item.quantity}" readonly>
            <button onclick="increaseQuantity('${item.id}')">+</button>
        </div>
    `).join('');
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
    if (product && product.quantity > 1) {
        product.quantity -= 1;
    } else {
        cart.splice(cart.indexOf(product), 1);
    }
    displayCart();
}

// Initialization
window.onload = function () {
    const request = indexedDB.open("satDB", 5);

    request.onupgradeneeded = function (event) {
        const dbUpgrade = event.target.result;
        if (!dbUpgrade.objectStoreNames.contains("categories")) {
            dbUpgrade.createObjectStore("categories", { keyPath: "id" });
        }
        if (!dbUpgrade.objectStoreNames.contains("products")) {
            const productStore = dbUpgrade.createObjectStore("products", { keyPath: "id" });
            productStore.createIndex("category_id", "category_id", { unique: false });
        }
        if (!dbUpgrade.objectStoreNames.contains("customers")) {
            dbUpgrade.createObjectStore("customers", { keyPath: "id" });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result; // Set the global db variable
        fetchAndDisplayData("categories", displayCategories, "https://app.satsweets.com/api/categories");
        fetchAndDisplayData("products", displayProducts, "https://app.satsweets.com/api/products");
        fetchAndDisplayData("customers", displayCustomers, "https://app.satsweets.com/api/customers");
    };

    request.onerror = function (event) {
        console.error("Database error: ", event.target.errorCode);
    };
};
