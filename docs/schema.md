# Database Schema (MVP)

## users
- id (UUID, PK)
- email (unique, not null)
- password_hash OR auth_provider_uid
- created_at

## profiles
- user_id (UUID, PK, FK -> users.id)
- display_name
- bio
- campus (optional)
- lat (decimal)
- lng (decimal)
- radius_miles (int)

## hobbies
- id (serial, PK)
- name (unique)

## user_hobbies
- user_id (FK -> users.id)
- hobby_id (FK -> hobbies.id)
- PK (user_id, hobby_id)

## availability_slots
- id (UUID, PK)
- user_id (FK -> users.id)
- date (date)
- start_time (time)
- end_time (time)
- status (available | booked)
- unique (user_id, date, start_time, end_time)

## match_requests
- id (UUID, PK)
- sender_id (FK -> users.id)
- receiver_id (FK -> users.id)
- hobby_id (FK -> hobbies.id)
- date (date)
- start_time (time)
- end_time (time)
- status (pending | accepted | declined | cancelled)
- created_at
