# Theme Debug Instructions

If the theme toggle is not working, try these steps:

1. **Clear localStorage:**
   - Open browser console (F12)
   - Run: `localStorage.removeItem('theme')`
   - Refresh the page

2. **Check current theme:**
   - Open browser console
   - Run: `localStorage.getItem('theme')`
   - Should return 'light' or 'dark'

3. **Manually set theme:**
   - Open browser console
   - Run: `document.documentElement.classList.add('dark')` (for dark mode)
   - Run: `document.documentElement.classList.remove('dark')` (for light mode)

4. **Check if toggle is working:**
   - Click the theme toggle button
   - Check console for "Theme toggle clicked" message
   - Check if `document.documentElement.classList.contains('dark')` changes

5. **Force light mode:**
   - Open browser console
   - Run: `localStorage.setItem('theme', 'light')`
   - Refresh the page

