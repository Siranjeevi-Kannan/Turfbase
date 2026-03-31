# Turfbase

Turfbase is a web-based application designed to manage multi-sport turf and court bookings efficiently. The system replaces manual booking processes with a structured platform that manages courts, sports, slots, bookings, payments, staff, and user feedback.

The application integrates a web frontend with a Node.js backend and an Oracle database to provide a centralized platform for managing turf reservations.

---

## Features

- User Management (registration and multiple contact numbers)
- Court Management (location, capacity, rate, and availability)
- Sport Management (rules and required players)
- Court–Sport Mapping
- Slot Management (date and time scheduling)
- Booking System with real-time slot allocation
- Payment Tracking (amount, method, and status)
- Staff Management
- Feedback and Rating System

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- Oracle SQL

---

# Prerequisites

Before running this project, ensure the following software is installed.

---

## 1. Node.js and npm

Download and install Node.js:

https://nodejs.org/

Verify installation:

```bash
node -v
npm -v
```

---

## 2. Oracle Database

Oracle Database Express Edition (XE) is recommended.

Ensure:
- Oracle Database is installed
- The database service is running
- You have a connection string such as:

```
localhost/XE
```

---

## 3. Oracle Instant Client

The Node.js Oracle driver requires Oracle Instant Client.

Download it from:

https://www.oracle.com/database/technologies/instant-client.html

In this project the following version is used:

```
instantclient_23_26
```

Setup steps:

1. Download the Instant Client package.
2. Extract it to a directory (for example `C:\instantclient_23_26`).
3. Add the folder to your system `PATH` environment variable.

Example:

```
C:\instantclient_23_26
```

---

## 4. Install Oracle Node Driver

Install the Oracle driver required for database connectivity:

```bash
npm install oracledb
```

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/Siranjeevi-Kannan/Turfbase.git
cd Turfbase
```

---

## 2. Install Dependencies

Install all required Node modules:

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the root directory of the project.

Example:

```
DB_USER=your_oracle_username
DB_PASSWORD=your_oracle_password
DB_CONNECTION=localhost/XE
```

Example (do not commit real credentials):

```
DB_USER=system
DB_PASSWORD=yourpassword
DB_CONNECTION=localhost/XE
```

Make sure the `.env` file is **not pushed to GitHub**. Add it to your `.gitignore` file if it is not already included.

Your backend code should read these variables using the `dotenv` package.

Install dotenv if needed:

```bash
npm install dotenv
```

---

## 4. Setup the Database Schema

Before running the application, you must create the database tables.

1. Open Oracle SQL Developer or SQL*Plus.
2. Locate the file `schema.sql` in the project repository.
3. Execute the script.

This script creates all required tables, relationships, and constraints needed for the application.

---

## 5. Start the Server

Run the Node.js server:

```bash
node server.js
```

---

## 6. Open the Application

Open your browser and go to:

```
http://localhost:3000
```

---

# Project Structure

```
Turfbase
│
├── public/              # Frontend files
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── server.js            # Main server
├── db.js                # Database connection
├── schema.sql           # Database schema
├── package.json
└── README.md
```

---

# Academic Context

This project was developed as part of the **Database Systems** course to demonstrate database design, normalization, SQL implementation, and database connectivity with a web-based application.
