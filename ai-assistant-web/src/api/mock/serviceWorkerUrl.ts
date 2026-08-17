export function getMockServiceWorkerUrl(locationHref: string) {
  return new URL("mockServiceWorker.js", locationHref).href;
}

export function getDemoApiBase(locationHref: string) {
  const location = new URL(locationHref);
  const pathname = location.pathname.endsWith("/")
    ? location.pathname.slice(0, -1)
    : location.pathname.replace(/\/[^/]+\.[^/]+$/, "");

  return `${location.origin}${pathname}`;
}
