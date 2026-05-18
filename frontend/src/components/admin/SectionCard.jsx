export default function SectionCard({ title, description, children, action }) {
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      {(title || action) && (
        <div className="px-6 py-5 border-b border-[#1f1f1f] flex items-center justify-between bg-[#151515]">
          <div>
            {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
