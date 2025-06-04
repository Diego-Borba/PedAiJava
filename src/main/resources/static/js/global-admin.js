// static/js/global-admin.js
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content'); // Usado para a lógica de desktop
    const body = document.body;

    if (sidebar) {
        sidebar.classList.toggle('collapsed');

        // Lógica para overlay e desabilitar scroll do body em mobile
        // Aplicar apenas quando a sidebar NÃO está collapsed (ou seja, está aberta/expandida)
        if (window.innerWidth <= 768) { 
            if (!sidebar.classList.contains('collapsed')) {
                // Se a sidebar está aberta (NÃO tem 'collapsed')
                body.classList.add('sidebar-mobile-open');
            } else {
                // Se a sidebar está fechada/recolhida (TEM 'collapsed')
                body.classList.remove('sidebar-mobile-open');
            }
        } else {
            // Em telas maiores (desktop), remove a classe para garantir que não interfira
            body.classList.remove('sidebar-mobile-open');
        }
    }

    // A classe 'collapsed' no content é importante para o desktop ajustar a margem.
    // Em mobile, o CSS para .content e .content.collapsed agora é o mesmo (margin-left: 80px),
    // então esta linha não terá impacto visual de margem no mobile, mas é inofensiva e necessária para desktop.
    if (content) {
        content.classList.toggle('collapsed');
    }
}

// Opcional: Fechar a sidebar mobile (quando expandida) ao clicar no overlay
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', function(event) {
        if (window.innerWidth <= 768 && document.body.classList.contains('sidebar-mobile-open')) {
            const sidebar = document.getElementById('sidebar');
            // Verifica se o clique foi no body (que tem o ::before como overlay)
            // E não foi na própria sidebar ou no botão de toggle dentro dela.
            if (sidebar && !sidebar.contains(event.target) && !event.target.closest('.toggle-btn')) {
                if (!sidebar.classList.contains('collapsed')) { // Se estiver expandida
                    toggleSidebar(); // Chama a função para recolher
                }
            }
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.body.classList.remove('sidebar-mobile-open');
        } else {
            // Ao redimensionar para mobile, reavaliar se o overlay deve estar ativo
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                document.body.classList.add('sidebar-mobile-open');
            } else {
                document.body.classList.remove('sidebar-mobile-open');
            }
        }
    });
});