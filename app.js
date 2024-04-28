document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();  // Prevent the default form submission

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const token = await login(email, password);
            console.log('Logged in with token:', token);
            // Redirect to another page or update UI upon successful login
            window.location.href = '/dashboard.html'; // Redirect to dashboard or appropriate page
        } catch (error) {
            console.error('Login failed:', error.message);
            // Optionally update the UI to show an error message
            alert('Login failed: ' + error.message);
        }
    });
});

async function login(email, password) {
    const response = await fetch('https://app.satsweets.com/api/login', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('token', data.token);  // Assuming the token is returned directly
        return data.token;
    } else {
        throw new Error(data.message || 'Failed to log in');
    }
}





// Function to get and display categories
function getAndDisplayCategories(db) {
    const transaction = db.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.getAll();

    request.onsuccess = function(event) {
        displayCategories(event.target.result);
    };
}

function displayCategories(categories) {
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

