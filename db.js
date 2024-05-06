document.getElementById('invoiceDate').valueAsDate = new Date();

// Global variable to hold the database connection
let db;

let selectedCategoryId = null;


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

        // Highlight the selected category
        if (selectedCategoryId === category.id) {
            categoryDiv.style.backgroundColor = "lightblue"; // or any color you prefer
        } else {
            categoryDiv.style.backgroundColor = ""; // Default background
        }

        categoryDiv.onclick = function() {
            selectedCategoryId = category.id; // Update the selected category ID
            getAndDisplayProducts(category.id);
            displayCategories(categories); // Redraw the categories with the new selection
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




/* function displayCustomers(customers) {
    const customerSelect = document.querySelector(".customerslist select");
    customerSelect.innerHTML = "";
    customers.forEach(customer => {
        const option = document.createElement("option");
        option.value = customer.id;
        option.textContent = customer.name;
        customerSelect.appendChild(option);
    });
} */

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
    const request = indexedDB.open("mobsatDB",1);

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



function clearCart() {
    cart = []; // Clear the cart array
    sessionStorage.setItem('cart', JSON.stringify(cart));  // Set cart in session storage to an empty array
    displayCart();   // Update the cart display
    updateCartTotal();  // Update the total
    
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

       
    }
}


// Define the audio clip outside the addToCart function so it's not reloaded each time the function is called
const addCartSound = new Audio(
    "data:audio/wav;base64,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 /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
    );

    function addToCart(productId) {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const request = store.get(productId);
    
        addCartSound.play();
    
        request.onsuccess = function () {
            const product = request.result;
            if (!product) {
                console.error("Product not found!");
                return;
            }
    
            const existingProduct = cart.find(item => item.id === parseInt(productId, 10));
            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.unshift({...product, quantity: 1});
            }
            displayCart();   // Update the cart display
            updateCartTotal();  // Update the total
            sessionStorage.setItem('cart', JSON.stringify(cart));  // Store cart in session storage
        };
    
        request.onerror = function (event) {
            console.error("Error fetching product from IndexedDB:", event.target.error);
        };
    }
   

    

function increaseQuantity(productId) {
    const product = cart.find(item => item.id === parseInt(productId, 10));
    if (product) {
        product.quantity += 1;
        displayCart();  // Update the cart display
        updateCartTotal();  // Update the total

        addCartSound.play();
    }
}

function decreaseQuantity(productId) {
    const product = cart.find(item => item.id === parseInt(productId, 10));
    if (product && product.quantity > 1) {
        product.quantity -= 1;
    } else if (product) {
        cart.splice(cart.indexOf(product), 1);
    }
    displayCart();  // Update the cart display
    updateCartTotal();  // Update the total

    addCartSound.play();
}

function updateQuantity(input, productId) {
    const newQuantity = parseInt(input.value, 10);  // Parse the input value
    if (isNaN(newQuantity) || newQuantity < 1) {
        console.error('Invalid input. Quantity must be 1 or greater.');

        input.value = 1;  // Reset the value to 1 if input is invalid
        alert('Invaild input');
        return;  // Stop further processing
    }

    const product = cart.find(item => item.id === parseInt(productId, 10));
    if (!product) {
        console.error('Product not found in cart:', productId);
        return;
    }

    // Update the product quantity if everything is valid
    product.quantity = newQuantity;
    displayCart();  // Update the cart display
    updateCartTotal();  // Update the total
}


 
function updateCartTotal() {
    let totalCartAmount = 0; // Initialize total amount
    cart.forEach(item => {
        totalCartAmount += item.quantity * item.price; // Calculate total for each item and add to totalCartAmount
    });

    const totalDiv = document.querySelector(".cart-total h5");
    totalDiv.textContent = `Total: ₹${totalCartAmount.toFixed(2)}`;
    const totalItems = document.getElementById("totalItems");
    totalItems.textContent = "Total items: " + cart.length; // Display the number of items in the cart
    sessionStorage.setItem('cart', JSON.stringify(cart));  // Update cart in session storage
}




    
function checkout() {
    const invoiceDate = document.getElementById('invoiceDate').value;
    sessionStorage.setItem('invoiceDate', invoiceDate);  // Store invoice date in session storage
    const customerSelect = document.querySelector(".customerslist select");
    const customerId = customerSelect.value;
    sessionStorage.setItem('selectedCustomerId', customerId);  // Store customer ID in session storage
    // Other checkout logic...
}


function redirectToSalesList() {
    window.location.href = '/saleslist.html'; // Adjust the path as necessary
}



// Modify postInvoiceOnline to accept a callback function
function postInvoiceOnline(invoiceData, attempts = 1, onSuccessCallback = null) {
    fetch('https://app.satsweets.com/api/postinvoice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(invoiceData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not OK. Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Invoice posted successfully:', data);
        if (onSuccessCallback) {
            onSuccessCallback();
        }
    })
    .catch(error => {
        console.error('Error posting invoice:', error);
        if (attempts < 3) {
            console.log(`Attempt ${attempts}: Retrying...`);
            setTimeout(() => postInvoiceOnline(invoiceData, attempts + 1, onSuccessCallback), 2000);
        } else {
            alert('Failed to create invoice after several attempts: ' + error.message);
        }
    });
}



function storeInvoiceOffline(invoiceData) {
    const dbRequest = indexedDB.open('InvoicesDB', 1);

    dbRequest.onupgradeneeded = function(event) {
        var db = event.target.result;
        var store = db.createObjectStore('invoices', {keyPath: 'id', autoIncrement: true});
        store.createIndex('by_customer', 'customer_id');
    };

    dbRequest.onsuccess = function(event) {
        var db = event.target.result;
        var transaction = db.transaction('invoices', 'readwrite');
        var store = transaction.objectStore('invoices');
        store.add(invoiceData);
    };

    dbRequest.onerror = function(event) {
        console.error('Error opening IndexedDB:', event);
    };
}

// Add event listener to the checkout button
document.getElementById('checkout').addEventListener('click', checkout);



//Handle  if user comes online 

function handleNetworkOnline() {
    console.log('Network is back online, pushing stored invoices...');
    pushStoredInvoices();
}

function pushStoredInvoices() {
    const dbRequest = indexedDB.open('InvoicesDB', 1);
    dbRequest.onsuccess = function(event) {
        var db = event.target.result;
        var transaction = db.transaction('invoices', 'readonly');
        var store = transaction.objectStore('invoices');
        var getAllRequest = store.getAll();

        getAllRequest.onsuccess = function() {
            const invoices = getAllRequest.result;
            if (invoices.length > 0) {
                invoices.forEach(invoice => {
                    postInvoiceOnline(invoice, 1, () => {
                        // Callback function to remove the invoice from IndexedDB once successfully posted
                        removeInvoiceFromDB(invoice.id, db);
                    });
                });
            }
        };
    };

    dbRequest.onerror = function(event) {
        console.error('Error opening IndexedDB:', event);
    };
}

function removeInvoiceFromDB(invoiceId, db) {
    var transaction = db.transaction('invoices', 'readwrite');
    var store = transaction.objectStore('invoices');
    store.delete(invoiceId);
    transaction.oncomplete = function() {
        console.log(`Invoice ${invoiceId} successfully sent and removed from local storage.`);
    };
    transaction.onerror = function(event) {
        console.error('Error removing invoice from IndexedDB:', event);
    };
}


// Event listener for coming online
window.addEventListener('online', handleNetworkOnline);
