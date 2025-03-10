document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const nav = document.querySelector('nav');
    if (token) {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="create-post.html">Create Post</a>
            <a href="profile.html">Profile</a>
            <a href='#' id="logout">Logout</a>
        `;
        document.getElementById('logout').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
        document.getElementById('comment-form').style.display = 'block';
    } else {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    }

    const postId = new URLSearchParams(window.location.search).get('id');
    if (!postId) {
        document.getElementById('post-content').innerHTML = '<p>Post not found</p>';
        return;
    }

    // Fetch post details
    try {
        fetch(`/api/posts/${postId}`)
        .then(res => res.json())
        .then(post => {
            document.getElementById('post-content').innerHTML = `
                <h2>${post.title}</h2>
                <p>By ${post.username} on ${new Date(post.created_at).toLocaleString()}</p>
                <p>${post.content}</p>
            `;
            const commentsDiv = document.getElementById('comments');
            post.comments.forEach(comment => {
                const div = document.createElement('div');
                div.className = 'comment';
                div.innerHTML = `
                    <p>${comment.content}</p>
                    <p>By ${comment.username} on ${new Date(comment.created_at).toLocaleString()}</p>
                `;
                commentsDiv.appendChild(div);
            });
        });
    } catch(err) {
        console.error('Error fetching post:', err);
    }  


    // Handle comment submission
    const form = document.getElementById('comment-form');
    form.addE
})