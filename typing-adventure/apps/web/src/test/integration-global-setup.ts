const WT_SCHEMA = /[?&]schema=wt_[a-z0-9_]{1,60}(&|$)/

export default function setup() {
  const url = process.env.DATABASE_URL ?? ''
  const schemaParams = url.match(/[?&]schema=/g) ?? []
  if (schemaParams.length !== 1 || !WT_SCHEMA.test(url)) {
    throw new Error(
      'Integration tests refused: DATABASE_URL must contain exactly one schema=wt_<slug> (create a worktree with scripts/wt-new.sh). Never run against public.',
    )
  }
}
