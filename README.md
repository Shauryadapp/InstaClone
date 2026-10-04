# InstaClone Backend API

A RESTful backend service for an Instagram clone, built with **FastAPI**, **SQLAlchemy**, and **Pydantic**[cite: 2]. This service currently handles user authentication, registration with Argon2 password hashing[cite: 2], and persistent storage using SQLite[cite: 2].

---

## Tech Stack

* **Language:** Python[cite: 2]
* **Framework:** FastAPI
* **Database & ORM:** SQLite (`instagram.db`), SQLAlchemy[cite: 2]
* **Data Validation:** Pydantic[cite: 2]
* **Security & Auth:** Argon2 password hashing (`passlib`), OAuth2 JWT[cite: 2]

---

## Project Structure

```text
InstaClone/
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py             # User SQLAlchemy database model
│   ├── routers/
│   │   ├── __init__.py
│   │   └── auth.py             # Authentication endpoints (signup, login)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py             # Pydantic schemas for user validation
│   ├── utils/
│   │   ├── __init__.py
│   │   └── security.py         # Password hashing & token handling
│   ├── __init__.py
│   ├── database.py             # SQLite engine & database session
│   └── main.py                 # FastAPI application instance & router setup
├── .gitignore
├── instagram.db                # Local SQLite database
└── requirements.txt            # Project dependencies
```[cite: 2]

---

## Database Schema (`users` Table)

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique identifier for each user |
| `username` | String | Unique, Not Null | Public handle chosen by the user |
| `email` | String | Unique, Not Null | User email address |
| `hashed_password` | String | Not Null | Argon2id secure password hash |

[cite: 2]

---

## Getting Started

### 1. Clone the Repository

```powershell
git clone [https://github.com/Shauryadapp/InstaClone.git](https://github.com/Shauryadapp/InstaClone.git)
cd InstaClone
git checkout backend
```[cite: 2]

### 2. Set Up the Virtual Environment

Using Windows PowerShell:

```powershell
python -m venv .instavenv
.instavenv\Scripts\activate
```[cite: 2]

### 3. Install Dependencies

```powershell
pip install -r requirements.txt
```[cite: 2]

### 4. Run the Development Server

```powershell
uvicorn app.main:app --reload
```[cite: 2]

The API will be available locally at `http://127.0.0.1:8000`[cite: 2].

---

## Interactive API Docs

FastAPI serves interactive documentation directly:

* **Swagger UI:** `http://127.0.0.1:8000/docs`
* **ReDoc:** `http://127.0.0.1:8000/redoc`

---

## Current API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/signup` / `/auth/register` | Register a new user account | No |
| `POST` | `/auth/login` | Authenticate user and receive access token | No |
