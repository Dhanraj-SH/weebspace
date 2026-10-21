import type { Pagination as PaginationData } from '../lib/api'

export function Pagination({ page, data, onChange }: { page: number; data?: PaginationData; onChange: (page: number) => void }) {
  if (!data || data.totalPages <= 1) return null
  return <div className="pagination"><button disabled={page <= 1} onClick={() => onChange(page - 1)}>← Previous</button><span>{page} <i>/</i> {data.totalPages}</span><button disabled={page >= data.totalPages} onClick={() => onChange(page + 1)}>Next →</button></div>
}
