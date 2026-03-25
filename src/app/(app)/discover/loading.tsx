export default function DiscoverLoading() {
  return (
    <div className="flex flex-col h-full px-5 pt-5">
      {/* Filter bar placeholder */}
      <div className="flex gap-2 mb-4">
        <div className="h-10 w-32 bg-stone-200 rounded-2xl animate-pulse" />
        <div className="h-10 w-24 bg-stone-200 rounded-2xl animate-pulse" />
        <div className="h-10 w-24 bg-stone-200 rounded-2xl animate-pulse" />
      </div>
      {/* Card skeleton */}
      <div className="flex-1 bg-stone-200 rounded-3xl animate-pulse mb-4" />
      {/* Action buttons */}
      <div className="flex justify-center gap-6 pb-4">
        <div className="w-16 h-16 bg-stone-200 rounded-full animate-pulse" />
        <div className="w-16 h-16 bg-stone-200 rounded-full animate-pulse" />
      </div>
    </div>
  )
}
