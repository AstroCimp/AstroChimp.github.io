document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("currentYear");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const backToTop = document.getElementById("backToTop");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 500) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }
    });

    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    const navLinks = document.querySelectorAll(".navbar .nav-link");
    const navbarCollapse = document.getElementById("mainNavbar");

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            if (navbarCollapse.classList.contains("show")) {
                bootstrap.Collapse.getOrCreateInstance(navbarCollapse).hide();
            }
        });
    });
});
