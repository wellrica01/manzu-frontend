import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');

  // Define your target subdomain
  const targetSubdomain = 'pharmacy.manzu.ng';

  if (hostname === targetSubdomain) {
    // If the user visits pharmacy.manzu.ng/orders
    // url.pathname is "/orders"
    // We rewrite it to "/pharmacy/orders" internally
    return NextResponse.rewrite(new URL(`/pharmacy${url.pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};