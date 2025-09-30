// src/main/resources/static/js/auth.js
(function() {
    const token = localStorage.getItem('jwt_token');
    const loginUrl = '../html/login.html';
    
    // Se não há token e não estamos na página de login, redireciona.
    if (!token && !window.location.href.endsWith(loginUrl)) {
        window.location.href = loginUrl;
        return;
    }
})();

function logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = '../html/login.html';
}

/**
 * Função global para fazer requisições fetch com o token de autenticação.
 * Use esta função no lugar de 'fetch()' em todas as chamadas para a API protegida.
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('jwt_token');

    // Se por algum motivo o token sumir, desloga o usuário.
    if (!token) {
        logout();
        return Promise.reject(new Error('Token não encontrado.'));
    }

    // Adiciona o cabeçalho de autorização, mantendo outros cabeçalhos que já existam.
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { ...options, headers });

        // Se o token for inválido ou expirado, o servidor retornará 401 ou 403.
        // Nesse caso, deslogamos o usuário.
        if (response.status === 401 || response.status === 403) {
            logout();
            return Promise.reject(new Error('Sessão expirada. Faça o login novamente.'));
        }

        return response;
    } catch (error) {
        console.error('Erro na requisição com autenticação:', error);
        return Promise.reject(error);
    }
}