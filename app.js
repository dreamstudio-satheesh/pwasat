document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('https://app.satsweets.com/api/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'your_email', password: 'your_password' })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        return response.json();
    })
    .then(data => {
        console.log('Login successful:', data);
        localStorage.setItem('token', data.token); // Assuming the token is in the response
        // Redirect or handle next steps
    })
    .catch(error => {
        console.error('Login failed:', error);
    });

});
