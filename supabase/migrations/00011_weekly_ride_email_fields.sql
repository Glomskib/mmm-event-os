-- ride_series: add route + location fields
ALTER TABLE public.ride_series
  ADD COLUMN meet_location text,
  ADD COLUMN route_ridewithgps_url text,
  ADD COLUMN route_strava_url text,
  ADD COLUMN route_wahoo_url text,
  ADD COLUMN notes text;

-- ride_occurrences: add override fields (all nullable)
ALTER TABLE public.ride_occurrences
  ADD COLUMN meet_location text,
  ADD COLUMN route_ridewithgps_url text,
  ADD COLUMN route_strava_url text,
  ADD COLUMN route_wahoo_url text,
  ADD COLUMN notes text;

-- profiles: add marketing opt-in
ALTER TABLE public.profiles
  ADD COLUMN marketing_opt_in boolean NOT NULL DEFAULT true;
