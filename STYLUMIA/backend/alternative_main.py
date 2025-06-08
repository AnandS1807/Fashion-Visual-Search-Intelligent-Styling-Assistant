from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from PIL import Image
import io
import pandas as pd
import os
import sys
import logging
from datetime import datetime


os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

# Configure logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import your existing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.clip_embeddings import get_embedding
from scripts.faiss_search import EmbeddingSimilaritySearch

app = FastAPI()

search_engine = EmbeddingSimilaritySearch(r"C:\Users\ANAND\Downloads\STYLUMIA\STYLUMIA\faiss_index")

# CORS Setup - Enhanced for debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,  # Added for better CORS support
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS middleware configured")


# Load product metadata with corrected path handling
current_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(current_dir, "..", "data", "dresses_bd_processed_data.csv")
logger.info(f"Loading product data from: {data_path}")

try:
    products_df = pd.read_csv(data_path).set_index('product_id')
    logger.info(f"Product data loaded successfully. Shape: {products_df.shape}")
    logger.info(f"Sample product IDs: {list(products_df.index[:5])}")
except Exception as e:
    logger.error(f"Failed to load product data: {e}")
    raise

# DEBUG: Add a simple health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint to verify backend is running"""
    logger.info("Health check requested")
    return JSONResponse({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "message": "Stylumia backend is running"
    })

@app.post("/search")
async def search_by_image(file: UploadFile = File(...), top_k: int = 5):
    """
    Endpoint flow:
    1. Receive image upload
    2. Generate embedding using clip.py
    3. Search FAISS index via search_faiss.py
    4. Enrich results with product data
    """
    # DEBUG: Log request details
    logger.info("=== NEW SEARCH REQUEST ===")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info(f"File received: {file.filename}")
    logger.info(f"File content type: {file.content_type}")
    logger.info(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")
    logger.info(f"Top K requested: {top_k}")
    
    try:
        # 1. Validate input
        logger.info("Step 1: Validating input...")
        if not file.content_type.startswith("image/"):
            logger.error(f"Invalid file type: {file.content_type}")
            raise HTTPException(400, "Only image files allowed")
        logger.info("✓ File type validation passed")

        # 2. Process image
        logger.info("Step 2: Processing image...")
        contents = await file.read()
        logger.info(f"✓ File read successfully. Size: {len(contents)} bytes")
        
        image = Image.open(io.BytesIO(contents))
        logger.info(f"✓ PIL Image created successfully. Size: {image.size}, Mode: {image.mode}")
        
        # 3. Get embedding (from your clip.py)
        logger.info("Step 3: Generating embedding...")
        embedding = get_embedding(image)
        logger.info(f"✓ Embedding generated. Shape: {embedding.shape if embedding is not None else 'None'}")
        
        if embedding is None:
            logger.error("Embedding generation failed")
            raise HTTPException(500, "Failed to generate image embedding")
        
        # 4. Search FAISS (from your search_faiss.py)
        logger.info("Step 4: Searching FAISS index...")
        similar_product_ids = search_engine.search(embedding, top_k=5)
        logger.info(f"✓ FAISS search completed. Found {len(similar_product_ids)} results")
        logger.info(f"Similar product IDs: {similar_product_ids}")
        
        # 5. Prepare response
        logger.info("Step 5: Preparing response...")
        results = []
        for i, product_id in enumerate(similar_product_ids):
            logger.info(f"Processing result {i+1}: {product_id}")
            
            if product_id not in products_df.index:
                logger.warning(f"Product ID {product_id} not found in metadata")
                continue
                
            product_data = products_df.loc[product_id].to_dict()
            
            result = {
                "product_id": product_id,
                "image_url": f"/images/images_dresses/{product_id}.jpg",  # Assumes .jpg extension
                "product_name": product_data.get("product_name"),
                "brand": product_data.get("brand"),
                "price": product_data.get("selling_price"),
                # Add other fields as needed
            }
            results.append(result)
            logger.info(f"✓ Added result: {product_data.get('product_name', 'Unknown')}")
        
        logger.info(f"✓ Response prepared with {len(results)} results")
        
        response = {
            "success": True,
            "results": results,
            "total_found": len(results),
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info("=== SEARCH REQUEST COMPLETED SUCCESSFULLY ===")
        return JSONResponse(response)

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"=== SEARCH REQUEST FAILED ===")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Search failed: {str(e)}")


IMAGES_BASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "images", "images_dresses")

# Serve product images with corrected path handling
@app.get("/images/images_dresses/{product_id}.jpg")
async def get_product_image(product_id: str):
    logger.info(f"Image request for product: {product_id}")
    current_dir = os.path.dirname(os.path.abspath(__file__))
    image_path = os.path.join(IMAGES_BASE_PATH, f"{product_id}.jpg")
    logger.info(f"Looking for image at: {image_path}")
    
    if not os.path.exists(image_path):
        logger.warning(f"Image not found: {image_path}")
        raise HTTPException(404, "Image not found")
    
    logger.info(f"✓ Serving image: {product_id}.jpg")
    return FileResponse(image_path)

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server on http://0.0.0.0:8000")
    logger.info("API endpoints available:")
    logger.info("  - GET  /health - Health check")
    logger.info("  - POST /search - Image search")
    logger.info("  - GET  /images/images_dresses/{product_id}.jpg - Product images")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")