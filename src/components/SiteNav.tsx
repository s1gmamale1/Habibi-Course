import Link from "next/link";

/**
 * The app's first navigation.
 *
 * Until now there was no <nav> anywhere in src/: no header, no tab bar, no breadcrumb,
 * no skip link. Navigation was link-to-link and /teach was reachable from nowhere.
 *
 * /teach stays off this list on purpose — WISHLIST wants that route GATED once accounts
 * exist, so making 74 teacher notes discoverable now would move the wrong way.
 *
 * The print stylesheet (globals.css:270) already hides `nav`, so this drops out of
 * printed pages with no extra work.
 */
export function SiteNav() {
  return (
    <>
      <a href="#content" className="skip-link">Skip to content</a>
      <nav aria-label="Site" className="glass-strong sticky top-0 z-20 border-b border-white/10">
        <ul className="mx-auto flex max-w-3xl gap-5 px-6 py-3 text-sm">
          <li><Link href="/" className="text-white/75 hover:text-white">Course</Link></li>
          <li><Link href="/library" className="text-white/75 hover:text-white">Library</Link></li>
          <li className="ml-auto"><Link href="/credits" className="text-white/55 hover:text-white">Credits</Link></li>
        </ul>
      </nav>
    </>
  );
}
