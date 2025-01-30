# ParcelPro Server

Welcome to the ParcelPro Server! This server serves as the backend for the ParcelPro application, a parcel delivery management system. It provides APIs for managing users, parcels, and reviews, as well as handling admin-specific tasks.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Parcel Management](#parcel-management)
  - [Review Management](#review-management)
  - [Admin Operations](#admin-operations)
- [Error Handling](#error-handling)
- [License](#license)

---

## Features
- JWT-based authentication and role-based authorization.
- CRUD operations for users, parcels, and reviews.
- Admin-specific endpoints for analytics and user management.
- Middleware for token and admin verification.
- MongoDB integration for data storage.

## Technologies Used
- **Node.js**: JavaScript runtime.
- **Express.js**: Web framework.
- **MongoDB**: NoSQL database.
- **dotenv**: For environment variable management.
- **jsonwebtoken**: For secure token generation and verification.

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/abujaforhadi/ParcelPro-server.git
   cd ParcelPro-Server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see [Environment Variables](#environment-variables)).
4. Start the server:
   ```bash
   npm start
   ```
5. The server will run on `http://localhost:3000` or the port specified in your environment variables.

## Environment Variables
Create a `.env` file in the root directory with the following keys:

```env
PORT=3000
user=<your-mongodb-username>
pass=<your-mongodb-password>
secret_key=<your-jwt-secret-key>
```

## API Endpoints

### Authentication
- **Generate JWT Token**:
  - **POST** `/jwt`
  - **Body**: `{ email: "user@example.com" }`
  - **Response**: `{ token: "<JWT-token>" }`

### User Management
- **Get All Users**:
  - **GET** `/users`
- **Get Total Users**:
  - **GET** `/totaluser`
- **Create a User**:
  - **POST** `/users`
  - **Body**: `{ email, displayName, photoURL }`
- **Update User by ID**:
  - **PATCH** `/userupdate/:id`
- **Assign Role (Admin)**:
  - **PATCH** `/users/:id`
  - **Requires**: Admin privileges.
- **Delete User**:
  - **DELETE** `/users/:id`
  - **Requires**: Admin privileges.

### Parcel Management
- **Book a Parcel**:
  - **POST** `/bookparcel`
  - **Requires**: User authentication.
- **Update Parcel Status by ID**:
  - **PATCH** `/parcels/:id`
- **Cancel Parcel by ID**:
  - **PATCH** `/parcelcancel/:id`
- **Update Parcel Details by ID**:
  - **PUT** `/updateparcels/:id`
  - **Requires**: User authentication.
- **Get User Parcels**:
  - **GET** `/myparcels?email=<user-email>`
- **Get All Parcels**:
  - **GET** `/allparcels?startDate=<start-date>&endDate=<end-date>`
- **Assign Delivery Person**:
  - **PUT** `/updateparcel/:id`

### Review Management
- **Add Review**:
  - **POST** `/reviews`
  - **Body**: `{ deliveryManId, giverName, giverImage, rating, feedback }`
- **Get All Reviews**:
  - **GET** `/allreview`
- **Get Reviews for Delivery Man**:
  - **GET** `/reviews?deliveryManId=<id>`
- **Delete Review**:
  - **DELETE** `/reviews/:id`

### Admin Operations
- **Admin Stats**:
  - **GET** `/admin/stats`
  - Provides analytics on bookings and deliveries.

## Error Handling
All API endpoints return appropriate HTTP status codes and error messages.
- **401 Unauthorized**: When no valid token is provided.
- **403 Forbidden**: When the user lacks necessary privileges.
- **404 Not Found**: When a resource is not found.
- **500 Internal Server Error**: For unexpected errors.

## License
This project is licensed under the MIT License.

