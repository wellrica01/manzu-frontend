import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  const targetSubdomain = 'pharmacy.manzu.ng';

  if (hostname === targetSubdomain) {
    // 1. Handle the Root: pharmacy.manzu.ng/
    // Since you have a (dashboard)/dashboard/page.jsx, 
    // we rewrite the root to that specific path.
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/pharmacy/dashboard', request.url));
    }

    // 2. Handle all other paths: pharmacy.manzu.ng/login, pharmacy.manzu.ng/orders, etc.
    // This will correctly resolve to (auth)/login or (dashboard)/orders
    return NextResponse.rewrite(new URL(`/pharmacy${url.pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};