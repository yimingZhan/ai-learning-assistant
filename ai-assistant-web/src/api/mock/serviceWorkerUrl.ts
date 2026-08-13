export function getMockServiceWorkerUrl(locationHref: string) {
  return new URL("mockServiceWorker.js", locationHref).href;
}
