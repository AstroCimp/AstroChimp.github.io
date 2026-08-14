# MyEstate - Isolated GitHub Pages Version

This package is designed to avoid conflicts with an existing personal site.

Recommended personal-site structure:

assets/
  css/
    style.css
  images/
  js/
    main.js
index.html
README.md
myestate/
  index.html
  assets/
    css/
      myestate.css
    js/
      myestate.js

Why this version avoids conflicts:
- MyEstate has its own folder.
- Its CSS is named `myestate.css`, not `style.css`.
- Its JavaScript is named `myestate.js`, not `main.js`.
- CSS class names are prefixed with `myestate-`.
- JavaScript IDs are prefixed with `myestate`.
- JavaScript runs inside an IIFE so variables do not leak into the global scope.
- LocalStorage uses the unique key `myestate-save-v1`.

From your personal site's main page, link to:

<a href="myestate/">Play MyEstate</a>

The Back to Site button inside the game assumes:
personal-site/
  index.html
  myestate/
    index.html

The included Back to Site button already uses `href="../index.html"`, which is correct when `myestate/` sits beside your main `index.html`.
