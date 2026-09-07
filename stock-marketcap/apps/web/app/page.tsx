export default function HomePlaceholder() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
        MVP skeleton
      </span>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Stock Marketcap</h1>
      <p className="mt-3 text-lg text-gray-600">
        Nigerian equity research &amp; portfolio-intelligence platform.
      </p>
      <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        All market and financial figures shown in this build come from a{" "}
        <strong>clearly labeled mock dataset</strong> (source = <code>mock</code>).
        Nothing here is live market data or investment advice.
      </p>
      <p className="mt-6 text-sm text-gray-500">
        The market dashboard, stock directory, and score UI are built in the
        following steps.
      </p>
    </main>
  );
}
