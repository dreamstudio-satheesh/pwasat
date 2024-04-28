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
