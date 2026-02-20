# Product Analytics Dashboard

A modern, full-stack product analytics dashboard built with Django and vanilla JavaScript. This application tracks user interactions, visualizes data with Chart.js, and provides filtering capabilities for detailed analysis.

## Features

- **User Authentication**: Secure Login system (Registration is handled via API/Admin).
- **Interactive Dashboard**:
    - **Bar Chart**: Visualizes feature usage counts.
        - *Interactive*: Click on a bar to drill down into that specific feature's trend over time.
    - **Line Chart**: Shows engagement trends over time (daily).
- **Advanced Filtering**:
    - **Date Range Picker**: Select custom date ranges (Today, Last 7 Days, Custom, etc.) using a modernized date picker.
    - **Demographic Filters**: Filter data by Age Group and Gender.
    - **Persistence**: Filter preferences are saved in cookies and persist across sessions.
- **Data Tracking**:
    - Tracks user clicks and interactions with specific features.
    - Interactions are fed back into the visualization engine.
- **Responsive Design**: Built with a sleek, dark-themed UI that works on various screen sizes.

## Technology Stack

- **Backend**: Django (Python), Django REST Framework
- **Database**: SQLite (default), PostgreSQL (compatible)
- **Frontend**: HTML5, CSS3 (Custom Dark Theme), JavaScript (Vanilla)
- **Libraries**:
    - [Chart.js](https://www.chartjs.org/) for data visualization.
    - [Date Range Picker](https://www.daterangepicker.com/) for date selection.
    - [Moment.js](https://momentjs.com/) for date manipulation.
    - [FontAwesome](https://fontawesome.com/) for icons.

## Prerequisites

- Python 3.8+
- `pip` (Python package manager)

## Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Create and Activate Virtual Environment**
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Apply Database Migrations**
    ```bash
    python manage.py migrate
    ```

5.  **Create a Superuser (Optional)**
    ```bash
    python manage.py createsuperuser
    ```

6.  **Seed Database (Optional)**
    To generate dummy data for testing the dashboard:
    ```bash
    python manage.py seed
    ```

## Running the Application

1.  **Start the Development Server**
    ```bash
    python manage.py runserver
    ```

2.  **Access the Dashboard**
    Open your browser and navigate to: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## Project Structure

- `dashboard/`: Core Django app containing models, views, and templates.
    - `models.py`: Defines `User` (custom) and `FeatureClick` models.
    - `views.py`: API endpoints for Analytics, Tracking, and Auth.
    - `management/commands/seed.py`: Custom command to population the database.
- `static/`: Static assets (CSS, JS).
    - `css/styles.css`: Custom dark theme styles.
    - `js/app.js`: Frontend logic for charts, filters, and API interaction.
- `templates/`: HTML templates.

## API Endpoints

- `POST /api/login/`: Obtain JWT access/refresh tokens.
- `POST /api/track/`: Record a user interaction (feature click).
- `GET /api/analytics/`: Retrieve aggregated data for charts based on filters.

## Usage Guidess

1.  **Login**: Use your credentials to log in.
    - **Default User**: `user_0` / `password123` (if database seeded).
2.  **Explore**: The dashboard immediately loads data for the default date range (Last 30 Days).
3.  **Filter**:
    - Use the **Date Range** picker at the top to select a specific time period.
    - Use **Age** and **Gender** dropdowns to refine the user segment.
    - The charts automatically update when filters change.
4.  **Drill Down**: Click on any bar in the **Feature Usage** chart to see the daily trend for that specific feature in the **Engagement Trend** line chart below.

## Scaling Architecture Strategy

**Question:** If this dashboard needed to handle 1 million write-events per minute, how would you change your backend architecture?

If the dashboard needs to handle 1 million write-events per minute (~16,000 per second), I would improve the backend like this:

Use a Message Queue (like Apache Kafka or Amazon Kinesis)
Instead of writing directly to the database, the API would send events to a queue.
This keeps the system fast and prevents the database from crashing under heavy load.

Process Data in Batches
Workers would read data from the queue and save it in bulk (for example, 10,000 records at once).
Batch writing is much faster than inserting one record at a time.

Use a High-Performance Database (like ClickHouse or TimescaleDB)
These databases are built to handle millions of records and fast analytics queries.

Add Caching (like Redis)
Store frequently requested dashboard results in cache so users get fast responses.

Scale Horizontally
Run multiple backend servers behind a load balancer so traffic is distributed evenly.