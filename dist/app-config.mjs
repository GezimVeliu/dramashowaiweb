// Set only published store URLs and a verified HTTPS universal/Android app link.
// Leave unavailable destinations null. No custom scheme or timed redirects.
export const appConfig = Object.freeze({
  appStoreUrl: null,
  googlePlayUrl: null,
  appLinkUrl: null,
  // Align these keys with the native app's link handler before enabling appLinkUrl.
  contentQueryKeys: { series: 'series', episode: 'episode' },
});

function httpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url : null;
  } catch { return null; }
}

export function detectPlatform(agent = '', touchPoints = 0) {
  if (/iPhone|iPad|iPod/i.test(agent) || (/Macintosh/i.test(agent) && touchPoints > 1)) return 'ios';
  if (/Android/i.test(agent)) return 'android';
  return 'desktop';
}

export function getAppDestinations(config, platform, content = null) {
  const links = [];
  const app = httpsUrl(config.appLinkUrl);
  if (app && (platform === 'ios' || platform === 'android')) {
    for (const key of ['series', 'episode']) {
      const param = config.contentQueryKeys?.[key];
      if (param && content?.[key]) app.searchParams.set(param, content[key]);
    }
    links.push({ kind: 'app', label: 'Open BONC', url: app.href });
  }
  const ios = httpsUrl(config.appStoreUrl);
  if (ios?.hostname === 'apps.apple.com' && (platform === 'ios' || platform === 'desktop')) {
    links.push({ kind: 'ios', label: 'View on the App Store', url: ios.href });
  }
  const android = httpsUrl(config.googlePlayUrl);
  if (android?.hostname === 'play.google.com' && (platform === 'android' || platform === 'desktop')) {
    links.push({ kind: 'android', label: 'View on Google Play', url: android.href });
  }
  return links;
}

