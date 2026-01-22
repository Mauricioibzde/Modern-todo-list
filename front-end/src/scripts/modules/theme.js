export function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const iconSun = document.getElementById('icon-sun');
    const iconMoon = document.getElementById('icon-moon');
    
    // Check local storage or default to 'dark'
    // Defaulting to 'dark' because standard/current variables are dark
    const savedTheme = localStorage.getItem('theme');
    const currentTheme = savedTheme ? savedTheme : 'dark';
    
    setTheme(currentTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme');
            const newTheme = theme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update Icons
        if (theme === 'light') {
            // Light mode active -> Show Moon icon (to switch to dark)
            if (iconSun) iconSun.style.display = 'none';
            if (iconMoon) iconMoon.style.display = 'block';
        } else {
            // Dark mode active -> Show Sun icon (to switch to light)
            if (iconSun) iconSun.style.display = 'block';
            if (iconMoon) iconMoon.style.display = 'none';
        }
    }
}
