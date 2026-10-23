export interface DetectedClient {
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
}

export function parseClientInfo(request: Request): DetectedClient {
  const headers = request.headers;
  const userAgent = headers.get('user-agent') || '';

  // 1. Detect Operating System
  let os = 'Unknown OS';
  if (/windows nt 10\.0/i.test(userAgent)) {
    os = 'Windows 11 / 10';
  } else if (/windows nt 6\.3/i.test(userAgent)) {
    os = 'Windows 8.1';
  } else if (/windows nt 6\.2/i.test(userAgent)) {
    os = 'Windows 8';
  } else if (/windows nt 6\.1/i.test(userAgent)) {
    os = 'Windows 7';
  } else if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/iphone os ([0-9_]+)/i.test(userAgent)) {
    const ver = RegExp.$1.replace(/_/g, '.');
    os = `iOS ${ver}`;
  } else if (/ipad.*os ([0-9_]+)/i.test(userAgent)) {
    const ver = RegExp.$1.replace(/_/g, '.');
    os = `iPadOS ${ver}`;
  } else if (/mac os x ([0-9_]+)/i.test(userAgent)) {
    const ver = RegExp.$1.replace(/_/g, '.');
    os = `macOS ${ver}`;
  } else if (/android ([0-9.]+)/i.test(userAgent)) {
    os = `Android ${RegExp.$1}`;
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  }

  // 2. Detect Browser
  let browser = 'Unknown Browser';
  if (/edg\/([0-9.]+)/i.test(userAgent)) {
    browser = `Edge ${RegExp.$1}`;
  } else if (/opr\/([0-9.]+)/i.test(userAgent)) {
    browser = `Opera ${RegExp.$1}`;
  } else if (/chrome\/([0-9.]+)/i.test(userAgent)) {
    browser = `Chrome ${RegExp.$1}`;
  } else if (/firefox\/([0-9.]+)/i.test(userAgent)) {
    browser = `Firefox ${RegExp.$1}`;
  } else if (/version\/([0-9.]+).*safari/i.test(userAgent)) {
    browser = `Safari ${RegExp.$1}`;
  } else if (/safari/i.test(userAgent)) {
    browser = 'Safari';
  }

  // 3. Detect Device
  const modelHeader = headers.get('sec-ch-ua-model');
  let device = modelHeader?.replace(/"/g, '') || '';

  if (!device) {
    if (/iphone/i.test(userAgent)) {
      device = 'iPhone';
    } else if (/ipad/i.test(userAgent)) {
      device = 'iPad';
    } else if (/samsung|sm-[a-z0-9]+/i.test(userAgent)) {
      device = 'Samsung Galaxy Device';
    } else if (/pixel/i.test(userAgent)) {
      device = 'Google Pixel';
    } else if (/android/i.test(userAgent)) {
      device = 'Android Mobile';
    } else if (/macintosh|mac os/i.test(userAgent)) {
      device = 'MacBook / Mac Desktop';
    } else if (/windows/i.test(userAgent)) {
      device = 'Windows PC / Laptop';
    } else {
      device = 'Desktop Computer';
    }
  }

  // 4. Detect IP Address
  const ipAddress =
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1';

  // 5. Detect Location
  const cfCity = headers.get('cf-ipcity');
  const cfCountry = headers.get('cf-ipcountry');

  let location = 'Jakarta, Indonesia';
  if (cfCity && cfCountry) {
    location = `${cfCity}, ${cfCountry}`;
  } else if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'localhost') {
    location = 'Jakarta, Indonesia (Localhost)';
  } else if (
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    location = 'Jakarta, Indonesia (Jaringan Lokal)';
  }

  return {
    device,
    browser,
    os,
    ipAddress,
    location,
  };
}

export function formatLastActive(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 120) {
    return 'Active right now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} minutes ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour} hours ago`;
  }

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) {
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `Yesterday at ${timeStr}`;
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
