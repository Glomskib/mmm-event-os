/**
 * Jersey voting cutoff and open/closed helpers.
 *
 * Cutoff: May 1, 2026 at 23:59:59 America/New_York (EDT = UTC−4)
 *         = May 2, 2026 at 03:59:59 UTC
 */

export const JERSEY_VOTE_YEAR = 2026;

/** ISO UTC string of the voting cutoff. */
export const JERSEY_VOTE_CUTOFF_UTC = "2026-05-02T03:59:59.000Z";

/**
 * Returns true if voting is currently open for the given year.
 * Voting is only defined for JERSEY_VOTE_YEAR (2026).
 */
export function isVotingOpen(year: number = JERSEY_VOTE_YEAR): boolean {
  if (year !== JERSEY_VOTE_YEAR) return false;
  return Date.now() < new Date(JERSEY_VOTE_CUTOFF_UTC).getTime();
}
