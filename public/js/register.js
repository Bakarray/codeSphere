document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    nav.innerHTML = `
        <a href="index.html">Home</a>
        <a href="login.html">Login</a>
        <a href="register.html">Register</a>
    `;

    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;

        try {
            const res = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            if (!res.ok) throw new Error('Registration failed');
            const { token } = await res.json();
            localStorage.setItem('token', token);
            window.location.href = '/public/index.html';
        } catch (err) {
            alert('Registration failed: ' + err.message);
        }
    });
});