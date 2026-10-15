import { NextRequest } from 'next/server';
import { proxyGet, proxyPost, proxyPut, proxyPatch, proxyDelete } from '@/lib/api-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyGet(req, ['templates', ...path]);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyPost(req, ['templates', ...path]);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyPut(req, ['templates', ...path]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyPatch(req, ['templates', ...path]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyDelete(req, ['templates', ...path]);
}
