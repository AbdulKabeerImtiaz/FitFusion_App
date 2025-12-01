from app.db import get_connection
import json

def load_exercises():
    """
    Load all exercises from database and convert to document format for RAG
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT id, name, muscle_group, difficulty, equipment_required, description, video_url
        FROM exercise
        ORDER BY id
    """)
    
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    documents = []
    for row in rows:
        # Parse JSON equipment list
        equipment = json.loads(row['equipment_required']) if row['equipment_required'] else []
        equipment_str = ', '.join(equipment) if equipment else 'None'
        
        # Create compact text representation to save tokens
        text = f"{row['name']} | {row['muscle_group']} | {row['difficulty']} | Equip: {equipment_str} | {row['description'] or 'N/A'}".strip()
        
        # Create metadata for filtering
        metadata = {
            "source": "exercise",
            "id": row['id'],
            "name": row['name'],
            "muscle_group": row['muscle_group'],
            "difficulty": row['difficulty'],
            "equipment": equipment_str  # Use string representation for ChromaDB compatibility
        }
        
        documents.append({
            "text": text,
            "metadata": metadata
        })
    
    print(f"✓ Loaded {len(documents)} exercises from database")
    return documents
