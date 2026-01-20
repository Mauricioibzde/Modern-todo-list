export function initNavigation() {
    const navItems = {
        'nav-create-task': '.create-task',
        'nav-dashboard': '.dashboard',
        'nav-list-tasks': '.list-tasks',
        'nav-all-tasks': '.list-tasks',
        'nav-search': '.search',
        'nav-insights': '.dashboard' // Reuse dashboard for now
    };

    const sections = document.querySelectorAll('main > section');
    const menuItems = document.querySelectorAll('.menu .item');

    // Import filter function dynamically or dispatch event
    // For simplicity, we'll dispatch an event meant for other modules (like form.js/taskList.js)
    function dispatchFilterEvent(filterType) {
        const event = new CustomEvent('filterTasks', { detail: { filter: filterType } });
        document.dispatchEvent(event);
    }

    function setActiveSection(targetId) {
        // Handle specific logic (Filter)
        if (targetId === 'nav-list-tasks') {
            dispatchFilterEvent('pending');
        } else if (targetId === 'nav-all-tasks') {
            dispatchFilterEvent('all');
        }

        // Hide all sections
        sections.forEach(section => {
            section.classList.add('hidden');
        });

        // Show target section
        const targetSelector = navItems[targetId];
        if (targetSelector) {
            const targetSection = document.querySelector(targetSelector);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        }

        // Update active menu state
        menuItems.forEach(item => {
            if (item.id === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Save current view
        localStorage.setItem('currentView', targetId);
    }

    // Attach click events
    Object.keys(navItems).forEach(id => {
        const link = document.getElementById(id);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveSection(id);

                // Auto-close sidebar on mobile
                if (window.innerWidth <= 768) {
                    const sideBar = document.querySelector('.sidebar');
                    const mainContent = document.querySelector('main');
                    
                    // On mobile, 'active' class means the sidebar is OPEN (visible).
                    // We want to remove it to close the sidebar.
                    if (sideBar && sideBar.classList.contains('active')) {
                        sideBar.classList.remove('active');
                        if (mainContent) mainContent.classList.remove('sidebar-closed');
                    }
                }
            });
        }
    });

    // Initialize with saved view or default to dashboard
    const savedView = localStorage.getItem('currentView') || 'nav-dashboard';
    setActiveSection(savedView);
}
