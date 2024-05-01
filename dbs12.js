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
    let totalCartAmount = 0; // Variable to store the total amount of the cart

    // Clear the current contents of the cart display
    cartItemsDiv.innerHTML = "";

    // Generate HTML for each item in the cart
    cart.map(item => {
        const itemTotal = item.quantity * item.price;
        totalCartAmount += itemTotal;  // Add the item's total to the cart total

        return `
            <div class="cart-item">
                <span class="item-name">${item.name}</span>
                <span class="item-price">₹${item.price.toFixed(2)}</span>
                <span class="item-quantity">${item.quantity}</span>
                <span class="item-total">₹${itemTotal.toFixed(2)}</span>
                <button onclick="decreaseQuantity('${item.id}')">-</button>
                <input type="number" class="form-control" value="${item.quantity}" readonly>
                <button onclick="increaseQuantity('${item.id}')">+</button>
            </div>
        `;
    }).forEach(itemHTML => cartItemsDiv.innerHTML += itemHTML);  // Append each item's HTML to the cart display

    // Update the total display
    const totalDiv = document.querySelector(".cart-total h5");
    totalDiv.textContent = `Total: ₹${totalCartAmount.toFixed(2)}`;
}


function increaseQuantity(productId) {
    console.log("Increasing quantity for product ID:", productId);
    const product = cart.find(item => item.id === parseInt(productId, 10));  // Adjust type as necessary
    console.log("Product found:", product);
    if (product) {
        product.quantity += 1;
        product.total = product.quantity * product.price;  // Update total
        displayCart();
    } else {
        console.error("Product not found in cart with ID:", productId);
    }
}

function decreaseQuantity(productId) {
    console.log("Decreasing quantity for product ID:", productId);
    const product = cart.find(item => item.id === parseInt(productId, 10));  // Adjust type as necessary
    if (product && product.quantity > 1) {
        product.quantity -= 1;
        product.total = product.quantity * product.price;  // Update total
    } else if (product) {
        // Remove product if quantity reaches 0 or 1
        console.log("Removing product from cart.");
        cart.splice(cart.indexOf(product), 1);
    } else {
        console.error("Product not found in cart with ID:", productId);
    }
    displayCart();
}

function updateQuantity(input, productId) {
    const newQuantity = parseInt(input.value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
        console.error("Invalid quantity");
        displayCart();  // Reset to previous valid state
        return;
    }

    const product = cart.find(item => item.id === productId);
    if (product) {
        product.quantity = newQuantity;
        product.total = product.quantity * product.price;  // Update total
        displayCart();  // Refresh the display with updated quantities
    } else {
        console.error("Product not found");
    }
}
