export default function RequestsLoading() {
  return (
    <div className="px-5 pt-8">
      {/* Header placeholder */}
      <div className="h-8 w-40 bg-stone-200 rounded-lg animate-pulse mb-1" />
      <div className="h-4 w-56 bg-stone-100 rounded-lg animate-pulse mb-6" />
      {/* Request cards */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="h-4 w-32 bg-stone-200 rounded-lg animate-pulse mb-2" />
              <div className="h-3 w-44 bg-stone-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-stone-200 rounded-full animate-pulse" />
          </div>
          <div className="h-3 w-24 bg-stone-100 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  )
}
