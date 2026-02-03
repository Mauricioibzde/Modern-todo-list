/* ======================================================
   NAVIGATION INITIALIZER
====================================================== */

export function initNavigation() {

  /* ======================================================
     ROUTE CONFIG
     Mapeia menu → section
  ====================================================== */
  const ROUTES = {
    'nav-create-task': '.create-task',
    'nav-dashboard': '.dashboard',
    'nav-list-tasks': '.list-tasks',
    'nav-all-tasks': '.list-tasks',
    'nav-search': '.search',
    'nav-insights': '.dashboard',
    'nav-calendar': '.calendar-view',
    'nav-create-schedule': '.create-schedule',
    'nav-all-schedules': '.list-schedules'
  };

  /* ======================================================
     DOM CACHE
  ====================================================== */
  const sections = document.querySelectorAll('main > section');
  const menuItems = document.querySelectorAll('.menu .item');

  /* ======================================================
     FILTER DISPATCHER
     Comunicação desacoplada com task list
  ====================================================== */
  function dispatchTaskFilter(filter) {
    document.dispatchEvent(
      new CustomEvent('filterTasks', { detail: { filter } })
    );
  }

  /* ======================================================
     ROUTE SIDE EFFECTS
     Regras específicas por rota
  ====================================================== */
  function handleRouteSideEffects(routeId) {
    const filters = {
      'nav-list-tasks': 'pending',
      'nav-all-tasks': 'all'
    };

    if (filters[routeId]) {
      dispatchTaskFilter(filters[routeId]);
    }
  }

  /* ======================================================
     SECTION VISIBILITY
  ====================================================== */
  function hideAllSections() {
    sections.forEach(section =>
      section.classList.add('hidden')
    );
  }

  function showSectionByRoute(routeId) {
    const selector = ROUTES[routeId];
    if (!selector) return;

    const section = document.querySelector(selector);
    section?.classList.remove('hidden');
  }

  /* ======================================================
     MENU STATE
  ====================================================== */
  function updateMenuActiveState(routeId) {
    menuItems.forEach(item =>
      item.classList.toggle('active', item.id === routeId)
    );
  }

  /* ======================================================
     MOBILE SIDEBAR HANDLING
  ====================================================== */
  function closeSidebarOnMobile() {
    if (window.innerWidth > 768) return;

    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('main');

    if (sidebar?.classList.contains('active')) {
      sidebar.classList.remove('active');
      main?.classList.remove('sidebar-closed');
    }
  }

  /* ======================================================
     CORE ROUTE HANDLER
  ====================================================== */
  function navigate(routeId, addToHistory = true) {
    handleRouteSideEffects(routeId);
    hideAllSections();
    showSectionByRoute(routeId);
    updateMenuActiveState(routeId);
    closeSidebarOnMobile();

    localStorage.setItem('currentView', routeId);

    if (addToHistory) {
      const url = new URL(window.location);
      url.searchParams.set('page', routeId);
      window.history.pushState({ routeId }, '', url);
    }
  }

  /* ======================================================
     EVENT BINDING (DELEGATION & HISTORY)
  ====================================================== */
  
  // History Back/Forward
  window.addEventListener('popstate', (event) => {
    const routeId = event.state?.routeId || 'nav-dashboard';
    navigate(routeId, false);
  });

  // Menu Clicks
  document.addEventListener('click', e => {
     const link = e.target.closest('a');
     if (!link) return;
     
     // Check if ID is in ROUTES
     if (ROUTES[link.id]) {
         e.preventDefault();
         navigate(link.id);
     }
  });

  /* ======================================================
     INITIAL LOAD
  ====================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  const savedRoute = pageParam || localStorage.getItem('currentView') || 'nav-dashboard';

  // Replace current history entry so we have state
  const url = new URL(window.location);
  url.searchParams.set('page', savedRoute);
  window.history.replaceState({ routeId: savedRoute }, '', url);

  navigate(savedRoute, false);
}
