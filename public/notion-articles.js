
"use strict";

(() => {
    const container = document.querySelector("[data-notion-articles]");

    if (!container) {
        return;
    }

    const configuredLimit = Number.parseInt(
        container.dataset.limit || "3",
        10
    );

    const limit = Number.isFinite(configuredLimit)
        ? Math.max(0, configuredLimit)
        : 3;

    const featuredOnly = container.dataset.featured === "true";

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function safeArticleUrl(article) {
        const slug = String(article.slug || "").trim();
        const fallback = slug
            ? `/articles/${encodeURIComponent(slug)}/`
            : "/articles/";

        const candidate = String(
            article.canonicalUrl || fallback
        ).trim();

        if (candidate.startsWith("/")) {
            return escapeHtml(candidate);
        }

        try {
            const url = new URL(candidate, window.location.origin);

            if (
                url.protocol !== "https:" &&
                url.protocol !== "http:"
            ) {
                return escapeHtml(fallback);
            }

            return escapeHtml(url.href);
        } catch {
            return escapeHtml(fallback);
        }
    }

    function formatDate(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        }).format(date);
    }

    function createArrow() {
        return `
            <svg
                class="arrow"
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M4 12L12 4M5 4H12V11"
                    stroke="currentColor"
                    stroke-width="1.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        `;
    }

    function createArticleRow(article, index) {
        const href = safeArticleUrl(article);
        const title = escapeHtml(
            article.title || "Untitled article"
        );
        const category = escapeHtml(
            article.category || "Technology"
        );
        const date = formatDate(article.publishDate);
        const dateTime = escapeHtml(
            article.publishDate || ""
        );

        return `
            <a
                class="article-row"
                href="${href}"
                aria-label="Read article: ${title}"
            >
                <span class="article-row-index">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <small class="article-row-category">
                    ${category}
                </small>

                <h3 class="article-row-title">
                    ${title}
                </h3>

                <time
                    class="article-row-date"
                    ${dateTime ? `datetime="${dateTime}"` : ""}
                >${escapeHtml(date)}</time>

                ${createArrow()}
            </a>
        `;
    }

    function renderArticles(articles) {
        container.innerHTML = `
            <div class="article-list">
                ${articles.map(createArticleRow).join("")}
            </div>
        `;
    }

    function renderEmpty() {
        container.innerHTML = `
            <div class="articles-empty">
                <span class="articles-empty-index">00</span>

                <div>
                    <p class="articles-empty-label">
                        WRITING / DATABASE
                    </p>

                    <p class="articles-empty-text">
                        No articles are available to display.
                        Published technical notes and field reports
                        will appear here.
                    </p>
                </div>
            </div>
        `;
    }

    function renderError() {
        container.innerHTML = `
            <div class="articles-empty articles-error">
                <span class="articles-empty-index">!</span>

                <div>
                    <p class="articles-empty-label">
                        WRITING / UNAVAILABLE
                    </p>

                    <p class="articles-empty-text">
                        The article index could not be loaded.
                        Please try again later.
                    </p>
                </div>
            </div>
        `;
    }

    fetch("/api/articles", {
        headers: {
            Accept: "application/json"
        }
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Article request failed: ${response.status}`
                );
            }

            return response.json();
        })
        .then((data) => {
            if (!data || typeof data !== "object") {
                throw new Error("Invalid article response.");
            }

            let articles = Array.isArray(data.articles)
                ? data.articles
                : [];

            if (featuredOnly) {
                articles = articles.filter(
                    (article) => article.featured === true
                );
            }

            articles = articles.slice(0, limit);

            if (articles.length === 0) {
                renderEmpty();
                return;
            }

            renderArticles(articles);
        })
        .catch((error) => {
            console.error(
                "[Difurrent] Unable to load articles:",
                error
            );

            renderError();
        });
})();
