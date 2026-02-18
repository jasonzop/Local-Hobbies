# API Contract (MVP)

Base URL: /api

## Auth
POST /auth/signup
- body: { "email": "", "password": "" }
- returns: { "token": "", "user": { "id": "", "email": "" } }

POST /auth/login
- body: { "email": "", "password": "" }
- returns: { "token": "", "user": { "id": "", "email": "" } }

## Me (Profile)
GET /me
- returns: { profile... }

PUT /me
- body: { "displayName": "", "bio": "", "campus": "", "lat": 0, "lng": 0, "radiusMiles": 5 }
- returns: updated profile

## Hobbies
GET /hobbies
- returns: [{ "id": 1, "name": "Music" }, ...]

PUT /me/hobbies
- body: { "hobbyIds": [1,2,3] }
- returns: { "hobbyIds": [1,2,3] }

## Availability
POST /me/availability
- body: { "date": "YYYY-MM-DD", "startTime": "18:00", "endTime": "19:00" }
- returns: created slot

GET /me/availability?date=YYYY-MM-DD
- returns: list of slots for that date

DELETE /me/availability/:slotId
- returns: { "deleted": true }

## Discover
GET /discover?hobbyId=1&date=YYYY-MM-DD&start=18:00&end=19:00
- returns: list of matching users within radius:
  [{ "userId": "", "displayName": "", "bio": "", "distanceMiles": 1.2 }]

## Requests
POST /requests
- body: { "receiverId": "", "hobbyId": 1, "date": "YYYY-MM-DD", "startTime": "18:00", "endTime": "19:00" }
- returns: created request

GET /me/requests?type=incoming|outgoing
- returns: list of requests

PATCH /requests/:id
- body: { "status": "accepted" | "declined" | "cancelled" }
- returns: updated request
