// Check if user is logged in
function checkLogin() {
    const token = localStorage.getItem('token');
    if (!token) {
        // If no token is found, redirect to the login page
        window.location.href = '/login.html'; // Adjust the path as necessary
    }
    // You can add more checks here, like verifying the token with the server
}

// Run checkLogin when the document loads
document.addEventListener('DOMContentLoaded', checkLogin);
