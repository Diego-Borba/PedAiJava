// static/js/global-admin.js
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content'); // Assumindo que o ID do conteúdo é 'content'
    if (sidebar && content) {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
    }
}