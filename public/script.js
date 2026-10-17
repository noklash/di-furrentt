
(() => {
    "use strict";

    const root = document.documentElement;
    const THEME_KEY = "difurrent-theme";
    const CONSENT_KEY = "difurrent-consent";

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) =>
        Array.from(scope.querySelectorAll(selector));

    const safeStorage = {
        get(key) {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch {
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch {
                // Storage may be unavailable in restricted browsing contexts.
            }
        }
    };

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /*
     * Theme management
     *
     * The saved preference is light, dark, or system.
     * The resolved theme applied to the document is always light or dark.
     */

    function resolveTheme(preference) {
        if (preference === "system") {
            return colorScheme.matches ? "dark" : "light";
        }

        return preference === "dark" ? "dark" : "light";
    }

    function getThemePreference() {
        const stored = safeStorage.get(THEME_KEY);

        if (["light", "dark", "system"].includes(stored)) {
            return stored;
        }

        const initialPreference = root.dataset.themePreference;

        if (["light", "dark", "system"].includes(initialPreference)) {
            return initialPreference;
        }

        return "system";
    }

    let themePreference = getThemePreference();

    function applyTheme(preference, persist = true) {
        if (!["light", "dark", "system"].includes(preference)) {
            preference = "system";
        }

        themePreference = preference;

        const resolvedTheme = resolveTheme(preference);

        root.dataset.theme = resolvedTheme;
        root.dataset.themePreference = preference;

        const themeColor = $("meta[name='theme-color']");

        if (themeColor) {
            themeColor.setAttribute(
                "content",
                resolvedTheme === "dark" ? "#0b0c0c" : "#f1f0eb"
            );
        }

        $$("[data-theme-choice]").forEach((button) => {
            const selected = button.dataset.themeChoice === preference;

            button.setAttribute("aria-pressed", String(selected));
            button.classList.toggle("is-selected", selected);
        });

        const themeButtonLabel = $(".theme-button-label");

        if (themeButtonLabel) {
            themeButtonLabel.textContent =
                preference.charAt(0).toUpperCase() + preference.slice(1);
        }

        if (persist) {
            safeStorage.set(THEME_KEY, preference);
        }

        closeThemeMenu();
    }

    const themeButton = $(".theme-button");
    const themeMenu = $("#theme-menu");

    function openThemeMenu() {
        if (!themeButton || !themeMenu) return;

        themeMenu.hidden = false;
        themeButton.setAttribute("aria-expanded", "true");
    }

    function closeThemeMenu() {
        if (!themeButton || !themeMenu) return;

        themeMenu.hidden = true;
        themeButton.setAttribute("aria-expanded", "false");
    }

    function toggleThemeMenu() {
        if (!themeMenu || !themeButton) return;

        if (themeMenu.hidden) {
            openThemeMenu();
        } else {
            closeThemeMenu();
        }
    }

    themeButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleThemeMenu();
    });

    themeMenu?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-theme-choice]");

        if (!button) return;

        applyTheme(button.dataset.themeChoice);
    });

    $$("[data-theme-choice]").forEach((button) => {
        button.addEventListener("click", () => {
            applyTheme(button.dataset.themeChoice);
        });
    });

    document.addEventListener("click", (event) => {
        if (
            themeMenu &&
            themeButton &&
            !themeMenu.contains(event.target) &&
            !themeButton.contains(event.target)
        ) {
            closeThemeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeThemeMenu();
        }
    });

    function handleSystemThemeChange() {
        if (themePreference === "system") {
            applyTheme("system", false);
        }
    }

    if (typeof colorScheme.addEventListener === "function") {
        colorScheme.addEventListener("change", handleSystemThemeChange);
    } else if (typeof colorScheme.addListener === "function") {
        colorScheme.addListener(handleSystemThemeChange);
    }

    applyTheme(themePreference, false);

    /*
     * Mobile navigation
     */

    const menuToggle = $(".menu-toggle");
    const mobileNav = $("#mobile-nav");

    function openMobileNav() {
        if (!menuToggle || !mobileNav) return;

        mobileNav.hidden = false;
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close navigation");
        root.classList.add("mobile-nav-open");
    }

    function closeMobileNav() {
        if (!menuToggle || !mobileNav) return;

        mobileNav.hidden = true;
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
        root.classList.remove("mobile-nav-open");
    }

    function toggleMobileNav() {
        if (!mobileNav) return;

        if (mobileNav.hidden) {
            openMobileNav();
        } else {
            closeMobileNav();
        }
    }

    menuToggle?.addEventListener("click", toggleMobileNav);

    $$("#mobile-nav a").forEach((link) => {
        link.addEventListener("click", closeMobileNav);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileNav();
        }
    });

    const desktopBreakpoint = window.matchMedia("(min-width: 981px)");

    function handleDesktopNavigation(event) {
        if (event.matches) {
            closeMobileNav();
        }
    }

    if (typeof desktopBreakpoint.addEventListener === "function") {
        desktopBreakpoint.addEventListener("change", handleDesktopNavigation);
    } else if (typeof desktopBreakpoint.addListener === "function") {
        desktopBreakpoint.addListener(handleDesktopNavigation);
    }

    /*
     * Project details dialog
     */

    const projectDialog = $("#project-dialog");
    const projectOpenButton = $("[data-open-project]");
    const projectCloseButton = $("[data-close-project]");

    function openProjectDialog() {
        if (!projectDialog) return;

        if (typeof projectDialog.showModal === "function") {
            if (!projectDialog.open) {
                projectDialog.showModal();
            }
        } else {
            projectDialog.setAttribute("open", "");
        }
    }

    function closeProjectDialog() {
        if (!projectDialog) return;

        if (typeof projectDialog.close === "function" && projectDialog.open) {
            projectDialog.close();
        } else {
            projectDialog.removeAttribute("open");
        }
    }

    projectOpenButton?.addEventListener("click", openProjectDialog);
    projectCloseButton?.addEventListener("click", closeProjectDialog);

    projectDialog?.addEventListener("click", (event) => {
        if (event.target === projectDialog) {
            closeProjectDialog();
        }
    });

    projectDialog?.addEventListener("close", () => {
        projectOpenButton?.focus({ preventScroll: true });
    });

    /*
     * Privacy preferences and consent
     *
     * Essential functionality is always active.
     * Optional categories default to disabled.
     * This script stores the visitor's preferences but does not load an
     * analytics provider or enable third-party tracking by itself.
     */

    const consentBanner = $("#consent-banner");
    const consentModal = $("#consent-modal");
    const analyticsCheckbox = $("#consent-analytics");
    const functionalCheckbox = $("#consent-functional");

    const consentAcceptButton = $("[data-consent-accept]");
    const consentRejectButtons = $$("[data-consent-reject]");
    const consentSettingsButton = $("[data-consent-settings]");
    const consentSaveButton = $("[data-consent-save]");
    const consentCloseButtons = $$("[data-consent-close]");
    const consentPreferencesButtons = $$("[data-open-consent-preferences]");

    function readConsent() {
        const stored = safeStorage.get(CONSENT_KEY);

        if (!stored) return null;

        try {
            const consent = JSON.parse(stored);

            if (
                typeof consent !== "object" ||
                consent === null ||
                consent.version !== 1 ||
                typeof consent.analytics !== "boolean" ||
                typeof consent.functional !== "boolean"
            ) {
                return null;
            }

            return consent;
        } catch {
            return null;
        }
    }

    function updateConsentControls(consent) {
        if (analyticsCheckbox) {
            analyticsCheckbox.checked = Boolean(consent?.analytics);
        }

        if (functionalCheckbox) {
            functionalCheckbox.checked = Boolean(consent?.functional);
        }
    }

    function hideConsentBanner() {
        if (!consentBanner) return;

        consentBanner.hidden = true;
        root.classList.remove("consent-banner-visible");
    }

    function showConsentBanner() {
        if (!consentBanner) return;

        consentBanner.hidden = false;
        root.classList.add("consent-banner-visible");
    }

    function saveConsent({ analytics = false, functional = false } = {}) {
        const consent = {
            version: 1,
            essential: true,
            analytics: Boolean(analytics),
            functional: Boolean(functional),
            updatedAt: new Date().toISOString()
        };

        const saved = safeStorage.set(CONSENT_KEY, JSON.stringify(consent));

        hideConsentBanner();
        updateConsentControls(consent);

        document.dispatchEvent(
            new CustomEvent("difurrent:consentchange", {
                detail: {
                    ...consent,
                    persisted: saved
                }
            })
        );

        return consent;
    }

    function openConsentPreferences() {
        if (!consentModal) return;

        updateConsentControls(readConsent());

        if (typeof consentModal.showModal === "function") {
            if (!consentModal.open) {
                consentModal.showModal();
            }
        } else {
            consentModal.setAttribute("open", "");
        }
    }

    function closeConsentPreferences() {
        if (!consentModal) return;

        if (typeof consentModal.close === "function" && consentModal.open) {
            consentModal.close();
        } else {
            consentModal.removeAttribute("open");
        }
    }

    function rejectOptionalConsent() {
        saveConsent({
            analytics: false,
            functional: false
        });

        closeConsentPreferences();
    }

    function acceptOptionalConsent() {
        saveConsent({
            analytics: true,
            functional: true
        });

        closeConsentPreferences();
    }

    function saveSelectedConsent() {
        saveConsent({
            analytics: analyticsCheckbox?.checked ?? false,
            functional: functionalCheckbox?.checked ?? false
        });

        closeConsentPreferences();
    }

    consentAcceptButton?.addEventListener("click", acceptOptionalConsent);

    consentRejectButtons.forEach((button) => {
        button.addEventListener("click", rejectOptionalConsent);
    });

    consentSettingsButton?.addEventListener("click", openConsentPreferences);

    consentSaveButton?.addEventListener("click", saveSelectedConsent);

    consentCloseButtons.forEach((button) => {
        button.addEventListener("click", closeConsentPreferences);
    });

    consentPreferencesButtons.forEach((button) => {
        button.addEventListener("click", openConsentPreferences);
    });

    consentModal?.addEventListener("click", (event) => {
        if (event.target === consentModal) {
            closeConsentPreferences();
        }
    });

    consentModal?.addEventListener("close", () => {
        consentPreferencesButtons[0]?.focus({ preventScroll: true });
    });

    const existingConsent = readConsent();

    if (existingConsent) {
        updateConsentControls(existingConsent);
        hideConsentBanner();
    } else {
        showConsentBanner();
    }

    /*
     * Article table of contents
     *
     * Builds the sidebar list from the article body headings and
     * gives every heading a stable anchor id. Runs before the
     * in-page navigation wiring so the generated links animate too.
     */

    function uniqueHeadingId(heading, index, usedIds) {
        const base =
            heading.textContent
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "") || `section-${index + 1}`;

        let id = base;
        let counter = 2;

        while (usedIds.has(id)) {
            id = `${base}-${counter}`;
            counter++;
        }

        return id;
    }

    function setupArticleToc() {
        const content =
            $("[data-notion-content]") || $(".article-content");

        const list = $("[data-toc-list]");
        const aside = $(".article-toc") || $("[data-article-toc]");

        if (!content || !list) return;

        // The live reader injects the article body after this runs.
        if (content.children.length === 0) return;

        const headings = $$("h2, h3", content);

        list.innerHTML = "";

        if (headings.length === 0) {
            if (aside) aside.hidden = true;

            return;
        }

        if (aside) aside.hidden = false;

        const usedIds = new Set();

        headings.forEach((heading, index) => {
            const id = uniqueHeadingId(heading, index, usedIds);

            heading.id = id;
            usedIds.add(id);

            const link = document.createElement("a");

            link.href = `#${id}`;
            link.textContent = heading.textContent.trim();

            if (heading.tagName === "H3") {
                link.classList.add("toc-subheading");
            }

            list.appendChild(link);
        });
    }

    /*
     * public/notion-article.js looks for this global and calls it
     * again once it has injected a live article body.
     */

    window.setupArticleToc = setupArticleToc;

    setupArticleToc();

    /*
     * Smooth in-page navigation
     *
     * Native browser behaviour remains available when reduced motion is
     * enabled. Links with external destinations are unaffected.
     */

    $$('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");

            if (!href || href === "#") return;

            let target;

            try {
                target = document.querySelector(href);
            } catch {
                return;
            }

            if (!target) return;

            if (reducedMotion.matches) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            if (window.location.hash !== href) {
                history.pushState(null, "", href);
            }
        });
    });

    /*
     * Reveal elements as they enter the viewport.
     * Content remains visible if IntersectionObserver is unavailable.
     */

    const revealSelectors = [
        ".philosophy-grid h2",
        ".philosophy-grid .copy-column",
        ".areas-intro",
        ".areas-grid .area",
        ".engineering-grid h2",
        ".about-grid h2",
        ".featured-project",
        ".project-grid .project-placeholder",
        ".process-tree > div",
        ".writing-header",
        ".contact-content",
        ".contact-services",
        ".contact-form-wrapper"
    ];

    const revealElements = [
        ...new Set(revealSelectors.flatMap((selector) => $$(selector)))
    ];

    if (
        !reducedMotion.matches &&
        "IntersectionObserver" in window
    ) {
        let revealReported = false;

        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                revealReported = true;

                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -36px 0px"
            }
        );

        revealElements.forEach((element) => {
            element.classList.add("reveal-ready");
            revealObserver.observe(element);
        });

        /*
         * A working IntersectionObserver reports the current state of
         * every observed element on the next frame. If nothing has been
         * reported shortly after setup, the observer is not functional
         * in this environment, so show the content rather than leaving
         * it hidden.
         */

        window.setTimeout(() => {
            if (revealReported) return;

            revealElements.forEach((element) => {
                element.classList.add("is-visible");
            });
        }, 3000);
    } else {
        revealElements.forEach((element) => {
            element.classList.add("is-visible");
        });
    }

    /*
     * Current year
     */

    const currentYear = $("#current-year");

    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
    }

    /*
     * Allow article cards injected after initial page load to receive
     * the same reveal treatment.
     */

    document.addEventListener("difurrent:articlesloaded", () => {
        if (reducedMotion.matches || !("IntersectionObserver" in window)) {
            $$(".article-list > *").forEach((element) => {
                element.classList.add("is-visible");
            });

            return;
        }

        const articleObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -36px 0px"
            }
        );

        $$(".article-list > *").forEach((element) => {
            if (element.classList.contains("is-visible")) return;

            element.classList.add("reveal-ready");
            articleObserver.observe(element);
        });
    });

    /*
     * Expose no global configuration object. Components communicate
     * through DOM events when other site scripts need to respond.
     */
})();
