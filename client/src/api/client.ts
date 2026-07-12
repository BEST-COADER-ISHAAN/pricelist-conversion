import type { Entry, Header, HeaderWithEntries } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchHeaders(): Promise<Header[]> {
  return request<Header[]>('/headers');
}

export function fetchHeader(id: number): Promise<HeaderWithEntries> {
  return request<HeaderWithEntries>(`/headers/${id}`);
}

export function saveHeader(
  header: Header,
  entries: Entry[],
  id?: number,
): Promise<HeaderWithEntries> {
  if (id) {
    return request<HeaderWithEntries>(`/headers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ header, entries }),
    });
  }
  return request<HeaderWithEntries>('/headers', {
    method: 'POST',
    body: JSON.stringify({ header, entries }),
  });
}

export function deleteHeader(id: number): Promise<void> {
  return request<void>(`/headers/${id}`, { method: 'DELETE' });
}

export function parseNames(input: string): Promise<{ products: string[] }> {
  return request<{ products: string[] }>('/parse-names', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export function exportExcel(headerId?: number): void {
  const url = headerId ? `/api/export?headerId=${headerId}` : '/api/export';
  window.open(url, '_blank');
}
