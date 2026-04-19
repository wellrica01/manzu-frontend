import { NextResponse } from 'next/server';

// Change "middleware" to "proxy" here
export function proxy(request) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  const targetSubdomain = 'pharmacy.manzu.ng';

  if (hostname === targetSubdomain) {
    // Handle the Root: pharmacy.manzu.ng/ -> pharmacy/dashboard
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/pharmacy/dashboard', request.url));
    }

    // Handle all other paths
    return NextResponse.rewrite(new URL(`/pharmacy${url.pathname}`, request.url));
  }

  return NextResponse.next();
}

// Keep the config exactly as it was
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};