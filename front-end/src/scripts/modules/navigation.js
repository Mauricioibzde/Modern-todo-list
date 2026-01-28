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
  function navigate(routeId) {
    handleRouteSideEffects(routeId);
    hideAllSections();
    showSectionByRoute(routeId);
    updateMenuActiveState(routeId);

    localStorage.setItem('currentView', routeId);
  }

  /* ======================================================
     EVENT BINDING
  ====================================================== */
  Object.keys(ROUTES).forEach(routeId => {
    const link = document.getElementById(routeId);
    if (!link) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(routeId);
      closeSidebarOnMobile();
    });
  });

  /* ======================================================
     INITIAL LOAD
  ====================================================== */
  const savedRoute =
    localStorage.getItem('currentView') || 'nav-dashboard';

  navigate(savedRoute);
}
