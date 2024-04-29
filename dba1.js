const token = localStorage.getItem('token');



// Open a connection to the IndexedDB
window.onload = function () {
  
  const request = indexedDB.open("satDB", 3);

  request.onupgradeneeded = function (event) {
    const db = event.target.result;

    // Create the 'categories' object store if it doesn't exist
    if (!db.objectStoreNames.contains("categories")) {
      db.createObjectStore("categories", { keyPath: "id" });
    }

    // Create the 'products' object store if it doesn't exist
    if (!db.objectStoreNames.contains("products")) {
      const productStore = db.createObjectStore("products", { keyPath: "id" });
      productStore.createIndex("category_id", "category_id", { unique: false });
    }
  };

  request.onsuccess = function (event) {
    const db = event.target.result;
    // First fetch and store categories

    fetchAndStoreCategories(db)
      .then(() => {
        // Once categories are fetched and stored, display them
        getAndDisplayCategories(db);
      })
      .catch((error) =>
        console.error("Error in fetching/storing categories:", error)
      );

    // Similarly, fetch and store products then display them
    fetchAndStoreProducts(db)
      .then(() => {
        getAllProducts(db);
      })
      .catch((error) =>
        console.error("Error in fetching/storing products:", error)
      );
  };
};

function getAndDisplayCategories(db) {
  const transaction = db.transaction(["categories"], "readonly");
  const store = transaction.objectStore("categories");
  const request = store.getAll();

  request.onsuccess = function (event) {
    displayCategories(event.target.result, db);
  };

  request.onerror = function (event) {
    console.error(
      "Failed to fetch categories:",
      event.target.error.name + " - " + event.target.error.message
    );
  };
}

function getAllProducts(db) {
  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");
  const request = store.getAll();

  request.onsuccess = function (event) {
    displayProducts(event.target.result);
  };

  request.onerror = function (event) {
    console.error(
      "Failed to fetch products:",
      event.target.error.name + " - " + event.target.error.message
    );
  };
}

function fetchAndStoreCategories(db) {
  if (!navigator.onLine) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["categories"], "readonly");
      const store = transaction.objectStore("categories");
      const request = store.getAll();
      request.onsuccess = function (event) {
        if (event.target.result.length > 0) {
          displayCategories(event.target.result, db);
          resolve();
        } else {
          console.log("No categories available offline.");
          reject(new Error("No categories available offline."));
        }
      };
      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  } else {
    return new Promise((resolve, reject) => {

      fetch("https://app.satsweets.com/api/categories", {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((categories) => {
          console.log("Fetched categories:", categories); // Logging fetched categories

          const transaction = db.transaction(["categories"], "readwrite");
          const store = transaction.objectStore("categories");
          store.clear();
          categories.forEach((category) => {
            store.add(category);
          });
          transaction.oncomplete = () => resolve(); // Resolve promise when transaction completes
          transaction.onerror = () => reject(transaction.error); // Reject on error
        })
        .catch((error) => {
          console.error("Error fetching categories:", error);
          reject(error); // Reject promise on fetch error
        });
    });
  }
}

function fetchAndStoreProducts(db) {
  if (!navigator.onLine) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["products"], "readonly");
      const store = transaction.objectStore("products");
      const request = store.getAll();

      request.onsuccess = function (event) {
        if (event.target.result.length > 0) {
          displayProducts(event.target.result);
          resolve();
        } else {
          console.log("No products available offline.");
          reject(new Error("No products available offline."));
        }
      };

      request.onerror = function (event) {
        console.error(
          "Failed to fetch products:",
          event.target.error.name + " - " + event.target.error.message
        );
        reject(event.target.error);
      };
    });
  } else {
    // Continue with your existing logic for online scenario
    return new Promise((resolve, reject) => {
      fetch("https://app.satsweets.com/api/products", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((products) => {
          const transaction = db.transaction(["products"], "readwrite");
          const store = transaction.objectStore("products");
          store.clear();
          products.forEach((product) => {
            store.add(product);
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
          reject(error);
        });
    });
  }
}

function displayCategories(categories, db) {
  const categoriesNav = document.getElementById("categories-nav");
  categoriesNav.innerHTML = ""; // Clear existing content
  categories.forEach((category) => {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category";
    categoryDiv.textContent = category.name;
    categoryDiv.onclick = function () {
      getAndDisplayProducts(category.id, db);
    };
    categoriesNav.appendChild(categoryDiv);
  });
}

function displayProducts(products) {
  const productList = document.getElementById("product-list");
  productList.innerHTML = ""; // Clear existing content
  products.forEach((product) => {
    const productDiv = document.createElement("div");
    productDiv.className = "product";
    productDiv.innerHTML = `<h5>${product.name}</h5><p>${product.price}</p>`;
    productList.appendChild(productDiv);
  });
}

function getAndDisplayProducts(categoryId, db) {
  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");
  const index = store.index("category_id");
  const request = index.getAll(categoryId);

  request.onsuccess = function (event) {
    displayProducts(event.target.result);
  };

  request.onerror = function (event) {
    console.error(
      "Error fetching products by category:",
      event.target.error.message
    );
  };
}
