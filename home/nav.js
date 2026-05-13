document.addEventListener('DOMContentLoaded', function () {
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'home';
  const navItems = document.querySelectorAll('.tabbar li[data-page]');

  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.page === currentPage);
  });
});
