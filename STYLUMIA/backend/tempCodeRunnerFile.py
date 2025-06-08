from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io
import pandas as pd
import os

# Import your existing modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.clip_embeddings import get_embedding
from scripts.faiss_search import search


app = FastAPI()

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load product metadata
products_df = pd.read_csv(r"STYLUMIA\data\dresses_bd_processed_data.csv").set_index('product_id')

@app.post("/search")
async def search_by_image(file: UploadFile = File(...), top_k: int = 5):
    """
    Endpoint flow:
    1. Receive image upload
    2. Generate embedding using clip.py
    3. Search FAISS index via search_faiss.py
    4. Enrich results with product data
    """
    try:
        # 1. Validate input
        if not file.content_type.startswith("image/"):
            raise HTTPException(400, "Only image files allowed")

        # 2. Process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # 3. Get embedding (from your clip.py)
        embedding = get_embedding(image)
        
        # 4. Search FAISS (from your search_faiss.py)
        similar_product_ids = search(embedding, top_k=8)
        
        # 5. Prepare response
        results = []
        for product_id in similar_product_ids:
            product_data = products_df.loc[product_id].to_dict()
            
            results.append({
                "product_id": product_id,
                "image_url": f"/images/{product_id}.jpg",  # Assumes .jpg extension
                "product_name": product_data.get("product_name"),
                "brand": product_data.get("brand"),
                "price": product_data.get("selling_price"),
                # Add other fields as needed
            })
        
        return JSONResponse({
            "success": True,
            "results": results
        })

    except Exception as e:
        raise HTTPException(500, f"Search failed: {str(e)}")

# Serve product images
@app.get("/images/{product_id}.jpg")
async def get_product_image(product_id: str):
    image_path = os.path.join(r"STYLUMIA\images", f"{product_id}.jpg")
    if not os.path.exists(image_path):
        raise HTTPException(404, "Image not found")
    return FileResponse(image_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)