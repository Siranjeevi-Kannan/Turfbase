-- =====================================
-- Turfbase Database Schema
-- Multi-Sport Turf and Court Booking System
-- =====================================

-- ======================
-- USER INFORMATION
-- ======================

CREATE TABLE USER_INFO (
  User_ID VARCHAR2(20) PRIMARY KEY,
  First_Name VARCHAR2(50) NOT NULL,
  Last_Name VARCHAR2(50) NOT NULL,
  Email VARCHAR2(100) UNIQUE,
  DOB DATE,
  Date_Registered DATE
);

-- ======================
-- USER PHONE NUMBERS
-- ======================

CREATE TABLE USER_PHONE (
  User_ID VARCHAR2(20),
  Phone_No VARCHAR2(15),
  PRIMARY KEY (User_ID, Phone_No),
  FOREIGN KEY (User_ID) REFERENCES USER_INFO(User_ID)
);

-- ======================
-- COURT
-- ======================

CREATE TABLE COURT (
  Court_ID VARCHAR2(20) PRIMARY KEY,
  Court_Name VARCHAR2(50) NOT NULL,
  Block VARCHAR2(10),
  Floor VARCHAR2(10),
  Capacity NUMBER,
  Rate NUMBER(10,2),
  Status VARCHAR2(20)
);

-- ======================
-- SPORT
-- ======================

CREATE TABLE SPORT (
  Sport_ID VARCHAR2(20) PRIMARY KEY,
  Sport_Name VARCHAR2(50) UNIQUE,
  Required_Players NUMBER,
  Rules VARCHAR2(4000)
);

-- ======================
-- COURT SPORT (M:N)
-- ======================

CREATE TABLE COURT_SPORT (
  Court_ID VARCHAR2(20),
  Sport_ID VARCHAR2(20),
  PRIMARY KEY (Court_ID, Sport_ID),
  FOREIGN KEY (Court_ID) REFERENCES COURT(Court_ID),
  FOREIGN KEY (Sport_ID) REFERENCES SPORT(Sport_ID)
);

-- ======================
-- SLOT (Weak Entity)
-- ======================

CREATE TABLE SLOT (
  Court_ID VARCHAR2(20),
  Slot_Number NUMBER,
  Slot_Date DATE,
  Start_Time DATE,
  End_Time DATE,
  Availability VARCHAR2(20),
  PRIMARY KEY (Court_ID, Slot_Number),
  FOREIGN KEY (Court_ID) REFERENCES COURT(Court_ID)
);

-- ======================
-- BOOKING
-- ======================

CREATE TABLE BOOKING (
  Booking_ID VARCHAR2(20) PRIMARY KEY,
  Booking_Date DATE,
  Booking_Status VARCHAR2(20),
  User_ID VARCHAR2(20),
  Court_ID VARCHAR2(20),
  Slot_Number NUMBER,
  FOREIGN KEY (User_ID) REFERENCES USER_INFO(User_ID),
  FOREIGN KEY (Court_ID, Slot_Number)
    REFERENCES SLOT(Court_ID, Slot_Number)
);

-- ======================
-- PAYMENT
-- ======================

CREATE TABLE PAYMENT (
  Payment_ID VARCHAR2(20) PRIMARY KEY,
  Payment_Date DATE,
  Amount NUMBER(10,2),
  Payment_Method VARCHAR2(30),
  Payment_Status VARCHAR2(20),
  Booking_ID VARCHAR2(20) UNIQUE,
  FOREIGN KEY (Booking_ID)
    REFERENCES BOOKING(Booking_ID)
);

-- ======================
-- STAFF
-- ======================

CREATE TABLE STAFF (
  Staff_ID VARCHAR2(20) PRIMARY KEY,
  Staff_Name VARCHAR2(50),
  Role VARCHAR2(50),
  Court_ID VARCHAR2(20),
  FOREIGN KEY (Court_ID) REFERENCES COURT(Court_ID)
);

-- ======================
-- STAFF CONTACT
-- ======================

CREATE TABLE STAFF_CONTACT (
  Staff_ID VARCHAR2(20),
  Contact VARCHAR2(15),
  PRIMARY KEY (Staff_ID, Contact),
  FOREIGN KEY (Staff_ID) REFERENCES STAFF(Staff_ID)
);

-- ======================
-- FEEDBACK
-- ======================

CREATE TABLE FEEDBACK (
  Feedback_ID VARCHAR2(20) PRIMARY KEY,
  Rating NUMBER CHECK (Rating BETWEEN 1 AND 5),
  Comments VARCHAR2(4000),
  Feedback_Date DATE,
  User_ID VARCHAR2(20),
  FOREIGN KEY (User_ID) REFERENCES USER_INFO(User_ID)
);
