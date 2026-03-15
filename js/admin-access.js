/* Admin Access — Ctrl + Shift + A opens the admin page in a new tab */
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.open('admin.html', '_blank', 'noopener,noreferrer');
  }
});
