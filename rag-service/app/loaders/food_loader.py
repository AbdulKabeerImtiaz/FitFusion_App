from app.db import get_connection
import json

def load_food_items():
    """
    Load all food items from database and convert to document format for RAG
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT id, name, category, calories_per_100g, protein_per_100g, 
               carbs_per_100g, fats_per_100g, vitamins, minerals, 
               serving_description, is_veg, description
        FROM food_item
        ORDER BY id
    """)
    
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    documents = []
    for row in rows:
        # Parse JSON fields
        vitamins = json.loads(row['vitamins']) if row['vitamins'] else {}
        minerals = json.loads(row['minerals']) if row['minerals'] else {}
        
        vitamins_str = ', '.join([f"{k}: {v}" for k, v in vitamins.items()]) if vitamins else 'Not specified'
        minerals_str = ', '.join([f"{k}: {v}" for k, v in minerals.items()]) if minerals else 'Not specified'
        
        # Create rich text representation
        text = f"""
Food Item: {row['name']}
ID: {row['id']}
Category: {row['category']}
Vegetarian: {'Yes' if row['is_veg'] else 'No'}
Nutritional Information (per 100g):
  - Calories: {row['calories_per_100g']} kcal
  - Protein: {row['protein_per_100g']} g
  - Carbohydrates: {row['carbs_per_100g']} g
  - Fats: {row['fats_per_100g']} g
Vitamins: {vitamins_str}
Minerals: {minerals_str}
Serving Description: {row['serving_description'] or 'Standard serving'}
Description: {row['description'] or 'No description available'}
        """.strip()
        
        # Create metadata for filtering
        metadata = {
            "source": "food_item",
            "id": row['id'],
            "name": row['name'],
            "category": row['category'],
            "is_veg": row['is_veg'],
            "calories": row['calories_per_100g'],
            "protein": row['protein_per_100g']
        }
        
        documents.append({
            "text": text,
            "metadata": metadata
        })
    
    print(f"✓ Loaded {len(documents)} food items from database")
    return documents
