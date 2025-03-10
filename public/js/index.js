document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const nav = document.querySelector('nav');

    // Display nav based on login status
    if (token) {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="create-post.html">Create Post</a>
            <a href="profile.html">Profile</a>
            <a href="#" id="logout">Logout</a>
        `;
        document.getElementById('logout').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '/public/index.html';
        });
    } else {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    }

    // Fetch and display all posts
    fetch('http://localhost:3000/api/posts')
        .then(res => res.json())
        .then(posts => {
            const postDiv = document.getElementById('posts');
            console.log(posts);
            posts.forEach(post => {
                const div = document.createElement('div');
                div.className = 'post';
                div.innerHTML = `
                    <h3><a href="post.html?id=${post.id}">${post.title}</a></h3>
                    <p>By ${post.username} on ${new Date(post.created_at).toLocaleString()}</p>
                `;
                postDiv.appendChild(div);
            });
        })            
        .catch(err => console.error('Error fetching posts:', err));
})