// Minimal logger that writes to stderr so CLI stdout stays clean for output.
// Inside GitHub Actions, ::group:: / ::warning:: annotations are used.
const inActions = !!process.env.GITHUB_ACTIONS;
let verbose = !!process.env.TAKCHE_DEBUG;

export function setVerbose(v: boolean) {
  verbose = v;
}

export const log = {
  info(msg: string) {
    process.stderr.write(`${msg}\n`);
  },
  debug(msg: string) {
    if (verbose) process.stderr.write(inActions ? `::debug::${msg}\n` : `[debug] ${msg}\n`);
  },
  warn(msg: string) {
    process.stderr.write(inActions ? `::warning::${msg}\n` : `[warn] ${msg}\n`);
  },
  error(msg: string) {
    process.stderr.write(inActions ? `::error::${msg}\n` : `[error] ${msg}\n`);
  },
  group<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (inActions) process.stderr.write(`::group::${name}\n`);
    else process.stderr.write(`▸ ${name}\n`);
    return fn().finally(() => {
      if (inActions) process.stderr.write(`::endgroup::\n`);
    });
  },
};
