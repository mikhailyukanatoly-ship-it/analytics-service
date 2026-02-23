# Goal

Implement a small backend service that imports three CSV files into a SQL database and
exposes three analytics endpoints. The point is not UI or perfect productization; it is to
demonstrate clean backend implementation, correct joins across tables, and non-trivial SQL
aggregations.

# Data

You will receive three CSVs:

- accounts: public Facebook profiles and basic attributes
- posts: posts authored by these profiles (connect to accounts via `profile_id`)
- sources_for_followers: follower counts for profiles (connect to accounts via a
  profile/source identifier)

# Required endpoints

## 1) Leaderboard (engagement normalized by followers)

Purpose: Rank profiles by engagement quality over a selected time window, adjusting for
audience size. All methods must include `{ type: "Facebook" }`.

What it should do:

- Compute per-profile summary stats in a time range:
  - number of posts, total comments, average comments per post
  - follower count
  - a normalized engagement metric (e.g., comments per 1k followers or similar)
- Return a ranked list (top N) with basic profile info and computed metrics.
- Support basic filters (at least: time window; optionally verified/restricted).

## 2) Best posting time (per profile)

Purpose: Identify when a given profile tends to get the strongest engagement.

What it should do:

- Bucket posts into time slots (e.g., day-of-week x hour).
- Compute engagement per slot (e.g., average comments per post).
- Return top-performing slots with sample size (number of posts in that slot), so the result
  is based on sufficient data.

## 3) Consistency score (per profile)

Purpose: Quantify how regular vs bursty a profile's posting behavior is.

What it should do:

- For one profile and a time window, compute posting regularity indicators such as:
  - activity ratio (how many days/weeks were active)
  - typical gap between posts (median/average)
  - variability of gaps (how stable or irregular the schedule is)
- Return the metrics (and optionally a single composite consistency score), plus enough
  context to interpret them (posts in range, active periods, etc.).

# Expectations

- The service should be easy to run locally.
- Results should be deterministic and explained by the data (avoid hand-wavy heuristics
  with no outputs).
- Handle missing follower counts or missing posts gracefully (still return sensible output
  or clear insufficient data cases).
- Keep it small and readable; focus on correctness, not feature creep.

# Delivery format

Provide a public Git repository link containing the full source code and instructions to run it
locally.

# AI usage

Using AI tools is allowed, but be ready to clearly and explain the reasoning behind each line
of code you submit.
