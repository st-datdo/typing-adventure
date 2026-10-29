const WT_SCHEMA = /[?&]schema=wt_[a-z0-9_]{1,60}(&|$)/

export default function setup() {
  const url = process.env.DATABASE_URL ?? ''
  if (!WT_SCHEMA.test(url)) {
    throw new Error(
      'Integration tests refused: DATABASE_URL must contain schema=wt_<slug> (create a worktree with scripts/wt-new.sh). Never run against public.',
    )
  }
}
