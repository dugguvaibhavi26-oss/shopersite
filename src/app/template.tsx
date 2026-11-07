/**
 * Wraps every page and re-mounts on navigation, so each page fades in as it opens.
 * Opacity only (no transform), so fixed headers and bottom bars stay put during the fade.
 */
export default function PageTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
