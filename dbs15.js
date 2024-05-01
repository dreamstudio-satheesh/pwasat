// Global variable to hold the database connection
let db;

// Function to handle IndexedDB requests
function handleIDBRequest(request, onSuccess, onError) {
    request.onsuccess = function (event) {
        onSuccess(event.target.result);
    };
    request.onerror = function (event) {
        console.error(onError, event.target.error);
    };
}

// Function to fetch data from an API and store it in IndexedDB
function fetchDataAndStore(url, storeName) {
    if (!navigator.onLine) {
        console.log("Offline mode: Using cached data for", storeName);
        return; // Early return if offline, assuming data is already fetched earlier
    }
    return fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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

// Function to fetch and display data from IndexedDB
function fetchAndDisplayData(storeName, displayFunction, apiURL) {
    const store = db.transaction([storeName], "readonly").objectStore(storeName);
    handleIDBRequest(store.getAll(), (data) => {
        if (data.length === 0) {
            fetchDataAndStore(apiURL, storeName).then(() => fetchAndDisplayData(storeName, displayFunction, apiURL));
        } else {
            displayFunction(data);
        }
    }, `Failed to fetch ${storeName}:`);
}

// Display functions for categories, products, and customers
function displayCategories(categories) {
    const categoriesNav = document.getElementById("categories-nav");
    categoriesNav.innerHTML = "";
    categories.forEach(category => {
        const categoryDiv = document.createElement("div");
        categoryDiv.className = "category";
        categoryDiv.textContent = category.name;
        categoryDiv.onclick = function() {
            getAndDisplayProducts(category.id);
        };
        categoriesNav.appendChild(categoryDiv);
    });
}

function displayProducts(products) {
    const productList = document.getElementById("product-list");
    productList.innerHTML = ""; // Clear previous listings
    products.forEach(product => {
        // Check if thumbnail_url is valid; otherwise, use a default image
        const imageUrl = product.thumbnail_url ? product.thumbnail_url : "https://app.satsweets.com/assets/img/product/noimage.png";

        const productDiv = document.createElement("div");
        productDiv.className = "product";
        productDiv.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" style="width: 100px; max-height: 90px;">
            <h5>${product.name}</h5>
            <p>Price: ${product.price}</p>
        `;
        productDiv.style.cursor = "pointer";
        productDiv.onclick = () => addToCart(product.id); // Add to cart by product ID
        productList.appendChild(productDiv);
    });
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

function getAndDisplayProducts(categoryId) {
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");
    const index = store.index("category_id");
    handleIDBRequest(index.getAll(categoryId), (products) => {
        displayProducts(products);
    }, `Failed to fetch products for category ${categoryId}:`);
}


// Initialization
window.onload = function () {
    const request = indexedDB.open("satDB", 6);

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
        db = event.target.result; // Set the global database connection
        fetchAndDisplayData("categories", displayCategories, "https://app.satsweets.com/api/categories");
        fetchAndDisplayData("products", displayProducts, "https://app.satsweets.com/api/products");
        fetchAndDisplayData("customers", displayCustomers, "https://app.satsweets.com/api/customers");
    };

    request.onerror = function (event) {
        console.error("Database error: ", event.target.errorCode);
    };
};




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
            existingProduct.quantity += 1;  // Increase quantity
            existingProduct.total = existingProduct.quantity * existingProduct.price;  // Update total
        } else {
            // If the product is not already in the cart, add it with initial quantity and calculate the total
            cart.unshift({
                id: product.id,
                name: product.name,
                code: product.code,
                price: product.price,
                gst: product.gst || 0,  // Default gst to 0 if not present
                hsncode: product.hsncode,
                quantity: 1,
                total: product.price  // Initial total (price * quantity)
            });
        }
        displayCart();
        
        // Optionally, uncomment the next line to log the cart to the console
        // console.log('cart:', cart);
    };

    request.onerror = function (event) {
        console.error("Error fetching product from IndexedDB:", event.target.error);
    };
}


function displayCart() {
    const cartItemsDiv = document.querySelector(".cart-items");
    if (cartItemsDiv) {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-details">
                    <span class="item-name">${item.name} ₹${item.price}</span>
                </div>
                <div class="quantity-controls">
                    <button class="btn btn-sm" onclick="decreaseQuantity('${item.id}')">-</button>
                    <input type="number" style="width:60px;" class="form-control input-sm" 
                           value="${item.quantity}" min="1" 
                           onchange="updateQuantity(this, '${item.id}')"
                           id="quantity-${item.id}">
                    <button class="btn btn-sm" onclick="increaseQuantity('${item.id}')">+</button>
                </div>
            </div>
        `).join('');

        updateCartTotal(); 
    }
}

function updateQuantity(input, productId) {
    const newQuantity = parseInt(input.value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
        console.error("Invalid quantity");
        input.value = cart.find(item => item.id === productId).quantity; // Reset to the last valid value
        return;
    }

    const product = cart.find(item => item.id === productId);
    if (product) {
        product.quantity = newQuantity;
        displayCart(); // Reflect the updated quantity in UI
    } else {
        console.error("Product not found");
    }
}

function increaseQuantity(productId) {
    const input = document.querySelector(`#quantity-${productId}`);
    if (input) {
        input.value = parseInt(input.value, 10) + 1; // Increment the value shown in the input
        updateQuantity(input, productId); // Update cart and UI
    }
}

function decreaseQuantity(productId) {
    const input = document.querySelector(`#quantity-${productId}`);
    if (input && parseInt(input.value, 10) > 1) {
        input.value = parseInt(input.value, 10) - 1; // Decrement the value shown in the input
        updateQuantity(input, productId); // Update cart and UI
    }
}

function updateCartTotal() {
    let totalCartAmount = 0; // Initialize total amount

    // Iterate over each item in the cart to sum up the total
    cart.forEach(item => {
        totalCartAmount += item.quantity * item.price; // Calculate total for each item and add to totalCartAmount
    });

    // Select the total display element and update its content
    const totalDiv = document.querySelector(".cart-total h5");
    totalDiv.textContent = `Total: ₹${totalCartAmount.toFixed(2)}`;
}


