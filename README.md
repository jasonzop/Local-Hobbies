# Local Hobbies

A full-stack social networking app focused on connecting people through shared hobbies and local activities. Users can create profiles, discover nearby people with similar interests, send connection requests, match for activities, chat, share posts, and schedule hobby meetups.

## Features

* User authentication (Register / Login)
* Create and customize profiles

  * Bio
  * Profile picture
  * Cover image
  * Hobbies/interests
* Discover nearby users using live GPS location
* Radius-based user filtering
* Send and manage friend requests
* Match requests for hobby sessions
* Real-time style messaging system
* Social-media style hobby posts
* Availability scheduling system
* Mobile-friendly UI
* Cloudinary image uploads
* Persistent PostgreSQL database storage

---

## Tech Stack

### Frontend

* React Native
* Expo
* TypeScript
* AsyncStorage
* Expo Location

### Backend

* Spring Boot
* Java 17
* Gradle

### Database

* PostgreSQL
* Docker

### Image Hosting

* Cloudinary

---

## Project Structure

```bash
Local-Hobbies/
│
├── apps/
│   ├── api/          # Spring Boot backend
│   └── mobile/       # Expo React Native frontend
│
├── docker-compose.yml
├── start.sh
└── README.md
```

---

# Screenshots


* Login Screen
  <img width="1902" height="533" alt="image" src="https://github.com/user-attachments/assets/8ab30eb3-8990-4d71-b3af-16b15527c090" />

* Availability screen
  <img width="1911" height="1067" alt="image" src="https://github.com/user-attachments/assets/46b3bad0-b6f5-4239-a999-de861cf9e386" />

* Discover Screen
  <img width="1917" height="1068" alt="image" src="https://github.com/user-attachments/assets/b8a38656-3a73-4f41-9aa5-38b318aa821e" />

* Profile Screen
  <img width="1919" height="1068" alt="image" src="https://github.com/user-attachments/assets/26a40cb6-507e-4d37-86de-60e46224c212" />
  
* Friend Requests
  <img width="1911" height="649" alt="image" src="https://github.com/user-attachments/assets/282dfe3b-5ad2-49f6-8d82-f3f5200a0aa9" />

* Search Screen
  <img width="1915" height="1065" alt="image" src="https://github.com/user-attachments/assets/69912ac2-ee76-4299-92cb-a577b8e92989" />

* Chat System
  <img width="1909" height="1066" alt="image" src="https://github.com/user-attachments/assets/3f0cb4d4-a28c-4ab6-a2b7-b81a4886b2a9" />

---

# Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Local-Hobbies.git
cd Local-Hobbies
```

---

## 2. Start PostgreSQL Database

Make sure Docker is running.

```bash
docker compose up -d
```

---

## 3. Backend Setup

Go into backend folder:

```bash
cd apps/api
```

Run backend:

```bash
./gradlew bootRun
```

Backend runs on:

```bash
http://localhost:8080
```

Health check:

```bash
http://localhost:8080/health
```

---

## 4. Frontend Setup

Open another terminal:

```bash
cd apps/mobile
npm install
npx expo start -c
```

Expo runs on:

```bash
http://localhost:8081
```

---

# Environment Variables

Create a `.env` file inside:

```bash
apps/mobile/.env
```

Add:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME

EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=YOUR_UPLOAD_PRESET
```

---

# Database

PostgreSQL database is automatically created using Docker.

Default credentials:

```env
POSTGRES_DB=local_hobbies
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

---

# API Endpoints

## Authentication

```http
POST /auth/register
POST /auth/login
```

## Users

```http
GET    /users/discover
GET    /users/nearby
PATCH  /users/{id}/location
PATCH  /users/{id}/profile-image
PATCH  /users/{id}/cover-image
```

## Requests

```http
POST   /requests
GET    /me/requests
PATCH  /requests/{id}
```

## Messages

```http
POST /messages
GET  /messages
```

## Posts

```http
POST   /posts
GET    /posts
DELETE /posts/{id}
```

---

# Current Features In Progress

* Push notifications
* Real-time chat with WebSockets
* Hobby group creation
* Event scheduling
* Better recommendation algorithm
* Mobile app deployment
* Dark mode

---

# Future Goals

Local Hobbies aims to remove the awkward initial talking stage by helping users instantly connect through shared interests and local activities.

The goal is to build a platform where:

* People make real-life friends
* Users find activity partners nearby
* Communities form around hobbies
* Social media becomes more interactive and local

---

# License

This project is for educational and portfolio purposes.
