# 🚗 FirstCarAI – Assignment 2 (SWP316D)

## 📖 Project Overview  

FirstCarAI is a 3-tier web application developed to assist users in selecting a car they can realistically afford based on their financial situation. The system collects user financial data, stores car information, and generates recommendations by analysing affordability, ownership costs, and user preferences.  

The system allows users to interact with data through a web interface where they can view, insert, update, and delete records while the backend processes logic and communicates with the database.

---

## 🗄️ Database Design (Open Source Database)

The system uses **PostgreSQL** as an open-source relational database. The database was designed using proper naming conventions (snake_case, clear and meaningful field names) and structured relationships between entities.

The main entities in the system include:

- Users  
- Cars  
- Recommendations  
- Insurance Estimates  
- User Preferences  
- Scraping Jobs  

Each table was created according to the ERD and includes appropriate primary keys and foreign key relationships to maintain data integrity.

### Key Relationships:
- A user can have multiple recommendations  
- A car can have multiple insurance estimates  
- A recommendation links a user to a car  
- A user can store preferences  

---

## 🧾 Database Script  

The database schema was implemented as follows:

```sql
CREATE TABLE public.cars (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  price numeric,
  mileage integer,
  fuel_type text,
  transmission text,
  scraped_source text,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  net_salary numeric,
  credit_score integer,
  years_licensed integer,
  gender text,
  location text,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.recommendations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  car_id uuid,
  estimated_monthly_cost numeric,
  insurance_cost numeric,
  loan_cost numeric,
  maintenance_cost numeric,
  fuel_cost numeric,
  score numeric,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES public.users(id),
  FOREIGN KEY (car_id) REFERENCES public.cars(id)
);

CREATE TABLE public.insurance_estimates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  car_id uuid,
  location text,
  risk_category text,
  estimated_monthly numeric,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (car_id) REFERENCES public.cars(id)
);

CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  preferred_brand text,
  car_type text,
  fuel_type text,
  transmission text,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.scraping_jobs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  source text,
  records_added integer,
  status text,
  started_at timestamp,
  completed_at timestamp,
  PRIMARY KEY (id)
);