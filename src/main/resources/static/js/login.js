// src/main/resources/static/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, senha: password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Falha no login. Verifique suas credenciais.');
            }

            const data = await response.json();
            localStorage.setItem('jwt_token', data.token);

            
            window.location.href = 'dashboard.html';

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Erro de Autenticação',
                text: error.message,
            });
        }
    });
});