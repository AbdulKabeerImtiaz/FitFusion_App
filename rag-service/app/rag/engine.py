"""
Core RAG Engine using LlamaIndex, ChromaDB, and Google Gemini
"""
import os
import json
from typing import List, Dict, Optional
from datetime import datetime

from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.llms.gemini import Gemini
import chromadb

from app.config import GOOGLE_API_KEY, CHROMA_PERSIST_DIR, EMBEDDING_MODEL, LLM_MODEL
from app.loaders.exercise_loader import load_exercises
from app.loaders.food_loader import load_food_items
from app.rag.prompts import build_workout_prompt, build_diet_prompt, calculate_macros
from app.models.workout_plan_schema import WorkoutPlan
from app.models.diet_plan_schema import DietPlan

class RAGEngine:
    """
    Retrieval-Augmented Generation engine for FitFusion
    Handles vector indexing, retrieval, and plan generation
    """
    
    def __init__(self):
        print("🚀 Initializing RAG Engine...")
        
        # Configure Google Gemini
        os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
        
        # Initialize embedding model
        self.embed_model = GeminiEmbedding(
            model_name=EMBEDDING_MODEL,
            api_key=GOOGLE_API_KEY
        )
        
        # Initialize LLM
        self.llm = Gemini(
            model_name=LLM_MODEL,
            api_key=GOOGLE_API_KEY,
            temperature=0.7,  # Higher temperature for variety while maintaining structure
            max_tokens=8192   # Maximum output limit for Gemini 2.0 Flash
        )
        
        # Set global settings
        Settings.embed_model = self.embed_model
        Settings.llm = self.llm
        Settings.chunk_size = 512
        Settings.chunk_overlap = 50
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        
        # Build or load index
        self.index = None
        self.last_indexed_at = None
        self._initialize_index()
        
        print("✓ RAG Engine initialized successfully")
    
    def _initialize_index(self):
        """Initialize or load existing vector index"""
        try:
            # Try to get existing collection
            collection = self.chroma_client.get_collection("fitfusion_collection")
            vector_count = collection.count()
            
            if vector_count > 0:
                print(f"✓ Found existing index with {vector_count} vectors")
                self._load_existing_index()
            else:
                print("⚠ Empty collection found, rebuilding index...")
                self._build_fresh_index()
        except Exception as e:
            print(f"⚠ No existing collection found: {e}")
            print("Building fresh index...")
            self._build_fresh_index()
    
    def _load_existing_index(self):
        """Load existing vector index from ChromaDB"""
        try:
            collection = self.chroma_client.get_collection("fitfusion_collection")
            
            vector_store = ChromaVectorStore(
                chroma_collection=collection
            )
            
            storage_context = StorageContext.from_defaults(
                vector_store=vector_store
            )
            
            self.index = VectorStoreIndex.from_vector_store(
                vector_store=vector_store,
                storage_context=storage_context
            )
            
            self.last_indexed_at = datetime.now().isoformat()
            print("✓ Loaded existing vector index")
            
        except Exception as e:
            print(f"✗ Error loading index: {e}")
            self._build_fresh_index()
    
    def _build_fresh_index(self):
        """Build new vector index from database"""
        print("📚 Loading data from database...")
        
        # Load exercises and food items
        exercise_docs = load_exercises()
        food_docs = load_food_items()
        
        # Convert to LlamaIndex Document objects
        documents = []
        
        for doc in exercise_docs:
            documents.append(Document(
                text=doc['text'],
                metadata=doc['metadata']
            ))
        
        for doc in food_docs:
            documents.append(Document(
                text=doc['text'],
                metadata=doc['metadata']
            ))
        
        print(f"✓ Loaded {len(documents)} documents ({len(exercise_docs)} exercises, {len(food_docs)} foods)")
        
        # Create or get collection
        try:
            self.chroma_client.delete_collection("fitfusion_collection")
        except:
            pass
        
        collection = self.chroma_client.create_collection(
            name="fitfusion_collection",
            metadata={"description": "FitFusion exercises and food items"}
        )
        
        # Create vector store
        vector_store = ChromaVectorStore(
            chroma_collection=collection
        )
        
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store
        )
        
        # Build index with rate limiting
        print("🔄 Creating embeddings with rate limiting (this may take a few minutes)...")
        
        # Initialize empty index
        self.index = VectorStoreIndex.from_documents(
            [],
            storage_context=storage_context,
        )
        
        # Process in batches to respect API limits
        import time
        batch_size = 5
        total_docs = len(documents)
        
        for i in range(0, total_docs, batch_size):
            batch = documents[i : i + batch_size]
            print(f"  - Processing batch {i//batch_size + 1}/{(total_docs + batch_size - 1)//batch_size} ({len(batch)} docs)...")
            
            # Insert batch into index (triggers embedding generation)
            for doc in batch:
                self.index.insert(doc)
            
            # Sleep to respect rate limits (approx 60 RPM for free tier)
            if i + batch_size < total_docs:
                time.sleep(2)
        
        self.last_indexed_at = datetime.now().isoformat()
        print(f"✓ Index built successfully with {len(documents)} documents")
    
    def generate_workout_plan(self, user_preferences: dict) -> dict:
        """
        Generate personalized workout plan using RAG
        """
        print("💪 Generating workout plan...")
        
        # Build query for exercise retrieval
        query_parts = []
        if user_preferences.get('targetMuscleGroups'):
            query_parts.append(f"muscle groups: {', '.join(user_preferences['targetMuscleGroups'])}")
        if user_preferences.get('equipmentList'):
            query_parts.append(f"equipment: {', '.join(user_preferences['equipmentList'])}")
        query_parts.append(f"difficulty: {user_preferences.get('experienceLevel', 'beginner')}")
        
        query = "exercises for " + ", ".join(query_parts)
        
        # Retrieve relevant exercises (retrieve more to ensure variety across weeks)
        # For a multi-week plan, we need enough exercises to avoid repetition
        retriever = self.index.as_retriever(
            similarity_top_k=30,  # Reduced from 50 to save tokens while maintaining variety
            filters=MetadataFilters(filters=[ExactMatchFilter(key="source", value="exercise")])
        )
        
        retrieved_nodes = retriever.retrieve(query)
        exercise_context = "\n\n".join([node.text for node in retrieved_nodes])
        
        # Build prompt
        prompt = build_workout_prompt(user_preferences, exercise_context)
        
        # Generate with LLM
        response = self.llm.complete(prompt)
        response_text = response.text.strip()
        
        # Parse JSON response
        try:
            # Extract JSON if wrapped in markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            plan_dict = json.loads(response_text)
            
            # Validate with Pydantic
            workout_plan = WorkoutPlan(**plan_dict)
            
            print("✓ Workout plan generated successfully")
            return workout_plan.model_dump()
            
        except json.JSONDecodeError as e:
            print(f"✗ JSON parsing error: {e}")
            print(f"Response: {response_text[:500]}")
            raise ValueError("Failed to parse workout plan JSON from LLM response")
        except Exception as e:
            print(f"✗ Validation error: {e}")
            raise ValueError(f"Workout plan validation failed: {str(e)}")
    
    def generate_diet_plan(self, user_preferences: dict) -> dict:
        """
        Generate personalized diet plan using RAG
        """
        print("🍽️ Generating diet plan...")
        
        # Calculate macro targets
        macros = calculate_macros(user_preferences)
        print(f"📊 Calculated macros: {macros}")
        
        # Build query for food retrieval
        query_parts = [f"Pakistani food items"]
        if user_preferences.get('dietaryPreference') == 'veg':
            query_parts.append("vegetarian")
        elif user_preferences.get('dietaryPreference') == 'non_veg':
            query_parts.append("meat protein")
        
        query = " ".join(query_parts)
        
        # Retrieve relevant food items
        retriever = self.index.as_retriever(
            similarity_top_k=20,
            filters=MetadataFilters(filters=[ExactMatchFilter(key="source", value="food_item")])
        )
        
        retrieved_nodes = retriever.retrieve(query)
        food_context = "\n\n".join([node.text for node in retrieved_nodes])
        
        # Build prompt
        prompt = build_diet_prompt(user_preferences, food_context, macros)
        
        # Generate with LLM
        response = self.llm.complete(prompt)
        response_text = response.text.strip()
        
        # Parse JSON response
        try:
            # Extract JSON if wrapped in markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            plan_dict = json.loads(response_text)
            
            # Validate with Pydantic
            diet_plan = DietPlan(**plan_dict)
            
            print("✓ Diet plan generated successfully")
            return diet_plan.model_dump()
            
        except json.JSONDecodeError as e:
            print(f"✗ JSON parsing error: {e}")
            print(f"Response: {response_text[:500]}")
            raise ValueError("Failed to parse diet plan JSON from LLM response")
        except Exception as e:
            print(f"✗ Validation error: {e}")
            raise ValueError(f"Diet plan validation failed: {str(e)}")
    
    def reindex(self, tables: Optional[List[str]] = None):
        """
        Rebuild the vector index
        """
        print(f"🔄 Reindexing {tables if tables else 'all tables'}...")
        self._build_fresh_index()
        return {
            "status": "success",
            "indexed_at": self.last_indexed_at,
            "message": "Index rebuilt successfully"
        }
    
    def get_status(self) -> dict:
        """
        Get current index status
        """
        try:
            collection = self.chroma_client.get_collection("fitfusion_collection")
            vector_count = collection.count()
            
            return {
                "status": "healthy",
                "index_exists": True,
                "vector_count": vector_count,
                "last_indexed_at": self.last_indexed_at,
                "embedding_model": EMBEDDING_MODEL,
                "llm_model": LLM_MODEL
            }
        except Exception as e:
            return {
                "status": "error",
                "index_exists": False,
                "error": str(e)
            }
