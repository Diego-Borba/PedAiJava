
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content'); 
    const body = document.body;

    if (sidebar) {
        sidebar.classList.toggle('collapsed');

        if (window.innerWidth <= 768) { 
            if (!sidebar.classList.contains('collapsed')) {
                body.classList.add('sidebar-mobile-open');
            } else {
                body.classList.remove('sidebar-mobile-open');
            }
        } else {
            body.classList.remove('sidebar-mobile-open');
        }
    }
    if (content) {
        content.classList.toggle('collapsed');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', function(event) {
        if (window.innerWidth <= 768 && document.body.classList.contains('sidebar-mobile-open')) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.contains(event.target) && !event.target.closest('.toggle-btn')) {
                if (!sidebar.classList.contains('collapsed')) { 
                    toggleSidebar(); 
                }
            }
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.body.classList.remove('sidebar-mobile-open');
        } else {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                document.body.classList.add('sidebar-mobile-open');
            } else {
                document.body.classList.remove('sidebar-mobile-open');
            }
        }
    });
});