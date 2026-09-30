import { defineEventHandler, sendRedirect } from 'h3';

/**
 * Page URLs are served under one spelling only: lower-cased, without a trailing slash.
 * Variants such as /Button or /button/ otherwise render the same page with a 200 and
 * split crawl budget across duplicates, so they get a permanent redirect to the canonical path.
 * Files (anything with an extension) and framework paths are left untouched.
 */
export default defineEventHandler((event) => {
    if (event.method !== 'GET' && event.method !== 'HEAD') return;

    const [pathname, query] = event.path.split(/\?(.*)/s);

    if (pathname === '/' || pathname.startsWith('/_') || /\.[a-z0-9]+$/i.test(pathname)) return;

    const canonical = pathname.toLowerCase().replace(/\/+$/, '') || '/';

    if (canonical !== pathname) {
        return sendRedirect(event, query ? `${canonical}?${query}` : canonical, 301);
    }
});
