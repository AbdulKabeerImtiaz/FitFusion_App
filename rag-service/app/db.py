import mysql.connector
from mysql.connector import Error
from app.config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB
import time

def get_connection(max_retries=5, retry_delay=5):
    """
    Create MySQL connection with retry logic for Docker startup delays
    """
    for attempt in range(max_retries):
        try:
            connection = mysql.connector.connect(
                host=MYSQL_HOST,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DB,
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            if connection.is_connected():
                print(f"✓ Successfully connected to MySQL database: {MYSQL_DB}")
                return connection
        except Error as e:
            print(f"Attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                raise Exception(f"Failed to connect to MySQL after {max_retries} attempts")
    
    return None

def test_connection():
    """Test database connection"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM exercise")
        exercise_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM food_item")
        food_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return {
            "status": "connected",
            "exercises": exercise_count,
            "food_items": food_count
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
