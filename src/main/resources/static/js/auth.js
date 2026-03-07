
(function() {
    const token = localStorage.getItem('jwt_token');
    const loginUrl = '../html/login.html';
    
    if (!token && !window.location.href.endsWith(loginUrl)) {
        window.location.href = loginUrl;
        return;
    }
})();

function logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = '../html/login.html';
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        logout();
        return Promise.reject(new Error('Token não encontrado.'));
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { ...options, headers });

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

async function select2AuthTransport(params, success, failure) {
    const url = params.url + (params.data.q ? '?q=' + params.data.q : '');
    
    try {
        const response = await fetchWithAuth(url);
        if (!response.ok) {
            throw new Error('Falha na busca do Select2');
        }
        const data = await response.json();
        
        success({ results: data });
    } catch (error) {
        console.error("Erro no transporte do Select2:", error);
        failure();
    }
}