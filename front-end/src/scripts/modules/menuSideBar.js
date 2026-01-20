let btnMenu = document.querySelector('.menu-icon');
let sideBar = document.querySelector('.sidebar');
let mainContent = document.querySelector('main');

btnMenu.addEventListener('click', () => {
    sideBar.classList.toggle('active');
    mainContent.classList.toggle('sidebar-closed');
    console.log('clicked');
});