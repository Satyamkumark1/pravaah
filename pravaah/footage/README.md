# Footage

Store only synthetic/public/demo footage approved for use.
Never commit private venue CCTV or personally identifying material.

Videos uploaded through the dashboard's per-camera upload feature
(`POST /api/cameras/{camera_id}/video`) are streamed to a temporary OS
location and deleted immediately after processing — never written into
this directory.
