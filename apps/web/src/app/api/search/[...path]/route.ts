import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/api-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyGet(req, ['search', ...path]);
}
