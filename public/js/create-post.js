document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const nav = document.querySelector('nav');
    nav.innerHTML = `
        <a href="index.html">Home</a>
        <a href="profile.html">Profile</a>
        <a href="#" id="logout">Logout</a>
    `;
    document.getElementById('logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    const form = document.getElementById('create-post-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;

        try {
            const res = await fetch('http://localhost:3000/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });
            if (!res.ok) throw new Error('Failed to create post');
            const { id } = await res.json();
            window.location.href = `post.html?id=${id}`;
        } catch (err) {
            alert('Error creating post: ' + err.message);
        }
    });
});