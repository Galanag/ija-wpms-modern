import { NextRequest, NextResponse } from 'next/server';
import { proxyGet, proxyPost, proxyPut, proxyPatch, proxyDelete } from '@/lib/api-proxy';

// All requests under /api/* are proxied to the IJA-WPMS NestJS API using the
// centralized, secure proxy helper (see src/lib/api-proxy.ts).

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyGet(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyPost(req, path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyPut(req, path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyPatch(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyDelete(req, path);
}
