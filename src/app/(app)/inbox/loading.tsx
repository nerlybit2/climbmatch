export default function InboxLoading() {
  return (
    <div className="px-5 pt-8">
      {/* Header placeholder */}
      <div className="h-8 w-32 bg-stone-200 rounded-lg animate-pulse mb-1" />
      <div className="h-4 w-48 bg-stone-100 rounded-lg animate-pulse mb-6" />
      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        <div className="h-10 flex-1 bg-stone-200 rounded-2xl animate-pulse" />
        <div className="h-10 flex-1 bg-stone-100 rounded-2xl animate-pulse" />
      </div>
      {/* Inbox items */}
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <div className="w-14 h-14 bg-stone-200 rounded-2xl animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-28 bg-stone-200 rounded-lg animate-pulse mb-2" />
            <div className="h-3 w-40 bg-stone-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-stone-200 rounded-xl animate-pulse" />
        </div>
      ))}
    </div>
  )
}
