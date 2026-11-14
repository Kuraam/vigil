/**
 * Placeholder shown in the content area while a page's code loads. Its blocks
 * follow the real page layout so nothing jumps when the page arrives.
 */
const Block = ({ className = '' }: { className?: string }) => <div className={`skeleton rounded-lg border border-line bg-panel ${className}`} />

export function PageSkeleton({ path }: { path: string }) {
  const page = path.split('/')[1] ?? ''
  return (
    <div role="status" aria-live="polite" aria-busy="true" data-testid="page-skeleton" className="space-y-6">
      <span className="sr-only">Loading page</span>
      <div className="space-y-2">
        <div className="skeleton h-8 w-56 rounded-md bg-raised" />
        <div className="skeleton h-4 w-full max-w-xl rounded bg-raised" />
      </div>
      {page === 'body-map' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
          <Block className="h-[28rem]" />
          <Block className="h-[28rem]" />
        </div>
      ) : page === 'triage' ? (
        <>
          <Block className="h-11 w-full max-w-lg" />
          <Block className="h-96" />
        </>
      ) : page === 'vitals' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Block key={i} className="h-80" />
          ))}
        </div>
      ) : (
        <>
          <Block className="h-40" />
          <Block className="h-72" />
        </>
      )}
    </div>
  )
}
