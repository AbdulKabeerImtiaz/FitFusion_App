import os
from dotenv import load_dotenv

load_dotenv()

# MySQL Configuration
MYSQL_HOST = os.getenv("RAG_MYSQL_HOST", "mysql")
MYSQL_USER = os.getenv("RAG_MYSQL_USER", "fitfusion_user")
MYSQL_PASSWORD = os.getenv("RAG_MYSQL_PASSWORD", "fitfusion_pass_2024")
MYSQL_DB = os.getenv("RAG_MYSQL_DB", "fitfusion")

# Google Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# ChromaDB Configuration
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

# Internal API Key for authentication
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "fitfusion_internal_key_2024")

# Model Configuration
EMBEDDING_MODEL = "models/embedding-001"
LLM_MODEL = "gemini-1.5-flash"
