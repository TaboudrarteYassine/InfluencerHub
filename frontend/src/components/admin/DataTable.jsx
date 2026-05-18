import { Loader2 } from 'lucide-react'

export default function DataTable({ columns, data, isLoading, emptyMessage = "No results found" }) {
  if (isLoading) {
    return (
      <div className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="p-8 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center text-slate-500">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📭</span>
          </div>
          <p className="font-medium text-slate-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#1f1f1f] bg-[#151515]">
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f1f1f]">
          {data.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-[#151515] transition-colors group">
              {columns.map((col, j) => (
                <td key={j} className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
