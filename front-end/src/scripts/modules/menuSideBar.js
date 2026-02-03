let btnMenu = document.querySelector('.menu-icon');
let sideBar = document.querySelector('.sidebar');
let mainContent = document.querySelector('main');

btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    sideBar.classList.toggle('active');
    mainContent.classList.toggle('sidebar-closed');
});

/*document.addEventListener("click", (e) => {
    e.stopPropagation();
    sideBar.classList.toggle('sidebar-closed');
  
  

});*/


document.addEventListener('click', (e) => {
    const isMobile = window.innerWidth <= 768;
    
    // On mobile, 'active' means visible. We want to close it if user clicks outside.
    if (isMobile && sideBar.classList.contains('active')) {
        if (!sideBar.contains(e.target) && !btnMenu.contains(e.target)) {
            sideBar.classList.remove('active');
            mainContent.classList.remove('sidebar-closed');
        }
    }
});
