import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/v1', '') || '/';
  const query = request.nextUrl.searchParams.toString();
  const url = `http://localhost:4000/api/v1${path}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    headers: { cookie: request.headers.get('cookie') || '' },
  });
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (['set-cookie', 'content-type', 'content-length'].includes(k.toLowerCase())) {
      headers.set(k, v);
    }
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers,
  });
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/v1', '') || '/';
  const body = await request.text();
  const cookie = request.headers.get('cookie') || '';
  const res = await fetch(`http://localhost:4000/api/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      cookie,
    },
    body,
  });
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (['set-cookie', 'content-type', 'content-length'].includes(k.toLowerCase())) {
      headers.set(k, v);
    }
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers,
  });
}

export async function PUT(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/v1', '') || '/';
  const body = await request.text();
  const cookie = request.headers.get('cookie') || '';
  const res = await fetch(`http://localhost:4000/api/v1${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      cookie,
    },
    body,
  });
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (['set-cookie', 'content-type', 'content-length'].includes(k.toLowerCase())) {
      headers.set(k, v);
    }
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers,
  });
}

export async function PATCH(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/v1', '') || '/';
  const body = await request.text();
  const cookie = request.headers.get('cookie') || '';
  const res = await fetch(`http://localhost:4000/api/v1${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      cookie,
    },
    body,
  });
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (['set-cookie', 'content-type', 'content-length'].includes(k.toLowerCase())) {
      headers.set(k, v);
    }
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers,
  });
}

export async function DELETE(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/v1', '') || '/';
  const cookie = request.headers.get('cookie') || '';
  const res = await fetch(`http://localhost:4000/api/v1${path}`, {
    method: 'DELETE',
    headers: { cookie },
  });
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (['set-cookie', 'content-type', 'content-length'].includes(k.toLowerCase())) {
      headers.set(k, v);
    }
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers,
  });
}
