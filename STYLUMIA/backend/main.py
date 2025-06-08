from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from PIL import Image
import io
import os
import json
from typing import List, Dict, Any, Optional
import uvicorn
import faiss
import clip
import torch
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stylumia Image Search API", version="1.0.0")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static images
if os.path.exists("images_dressees"):
    app.mount("/images", StaticFiles(directory="images_dressees"), name="images")

class StylumiaImageSearch:
    def __init__(self, 
                 index_path=r"C:\Users\ANAND\Downloads\STYLUMIA\STYLUMIA\faiss_index",
                 images_dir=r"C:\Users\ANAND\Downloads\STYLUMIA\images_dressees"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.images_dir = images_dir
        self.model = None
        self.preprocess = None
        self.index = None
        self.product_ids = []
        
        # Initialize CLIP model
        self._load_clip_model()
        # Load FAISS index
        self._load_index(index_path)

    def _load_clip_model(self):
        """Load CLIP model"""
        try:
            logger.info("Loading CLIP model...")
            self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
            logger.info(f"CLIP model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Error loading CLIP model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load CLIP model: {str(e)}")

    def _load_index(self, index_path):
        """Load FAISS index and product IDs"""
        try:
            if not os.path.exists(index_path):
                raise FileNotFoundError(f"Index directory not found: {index_path}")

            index_file = os.path.join(index_path, "cosine_index.faiss")
            ids_file = os.path.join(index_path, "product_ids.npy")

            if not os.path.exists(index_file) or not os.path.exists(ids_file):
                raise FileNotFoundError("Required index files not found")

            self.index = faiss.read_index(index_file)
            self.product_ids = np.load(ids_file)
            
            logger.info(f"Loaded FAISS index with {len(self.product_ids)} products")

            # Verify index type
            if not isinstance(self.index, faiss.IndexFlatIP):
                logger.warning("Index is not using inner product metric")

        except Exception as e:
            logger.error(f"Error loading FAISS index: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load search index: {str(e)}")

    def get_embedding(self, image: Image.Image) -> np.ndarray:
        """Get normalized CLIP embedding for a PIL image"""
        try:
            # Preprocess image
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            image_input = self.preprocess(image).unsqueeze(0).to(self.device)
            
            # Get embedding
            with torch.no_grad():
                embedding = self.model.encode_image(image_input).cpu().numpy().astype('float32')
            
            # Normalize for cosine similarity
            faiss.normalize_L2(embedding)
            return embedding
            
        except Exception as e:
            logger.error(f"Error creating embedding: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

    def search_similar_images(self, query_embedding: np.ndarray, top_k: int = 10) -> Dict[str, Any]:
        """Search for similar images using FAISS"""
        try:
            start_time = time.time()
            
            # Ensure embedding is normalized
            faiss.normalize_L2(query_embedding)
            
            # Search using FAISS
            similarities, indices = self.index.search(query_embedding, top_k)
            
            # Prepare results
            results = []
            for i in range(top_k):
                if indices[0][i] >= 0:  # Valid index
                    product_id = self.product_ids[indices[0][i]]
                    
                    # Create image URL
                    image_filename = f"{product_id}.jpg"
                    image_path = os.path.join(self.images_dir, image_filename)
                    
                    # Check if image exists, try .png if .jpg doesn't exist
                    if not os.path.exists(image_path):
                        image_filename = f"{product_id}.png"
                        image_path = os.path.join(self.images_dir, image_filename)
                    
                    image_url = f"/images/{image_filename}" if os.path.exists(image_path) else None
                    
                    result = {
                        "id": int(indices[0][i]),
                        "product_id": str(product_id),
                        "similarity": float(similarities[0][i]),
                        "rank": i + 1,
                        "image_url": image_url,
                        "image_path": image_path if os.path.exists(image_path) else None,
                        "metadata": {
                            "filename": image_filename,
                            "exists": os.path.exists(image_path) if image_path else False
                        }
                    }
                    results.append(result)
            
            search_time = time.time() - start_time
            
            return {
                "results": results,
                "search_time": search_time,
                "total_found": len(results)
            }
            
        except Exception as e:
            logger.error(f"Error during search: {e}")
            raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# Initialize the search service
try:
    search_service = StylumiaImageSearch()
    logger.info("Stylumia Image Search service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize search service: {e}")
    search_service = None

@app.get("/")
async def root():
    return {
        "message": "Stylumia Image Search API is running",
        "status": "healthy" if search_service else "error",
        "device": search_service.device if search_service else "unknown"
    }

@app.get("/health")
async def health_check():
    if not search_service:
        raise HTTPException(status_code=503, detail="Search service not available")
    
    return {
        "status": "healthy",
        "device": search_service.device,
        "total_products": len(search_service.product_ids),
        "clip_model_loaded": search_service.model is not None,
        "faiss_index_loaded": search_service.index is not None
    }

@app.post("/search")
async def search_similar_images(
    file: UploadFile = File(...),
    top_k: int = 10
):
    """
    Upload an image and get similar fashion items
    """
    if not search_service:
        raise HTTPException(status_code=503, detail="Search service not available")
    
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate top_k parameter
        if top_k < 1 or top_k > 50:
            raise HTTPException(status_code=400, detail="top_k must be between 1 and 50")
        
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        logger.info(f"Processing image: {file.filename}, size: {len(contents)} bytes, dimensions: {image.size}")
        
        # Create embedding using CLIP
        query_embedding = search_service.get_embedding(image)
        
        # Search for similar images
        search_results = search_service.search_similar_images(query_embedding, top_k)
        
        # Prepare response
        response = {
            "success": True,
            "query_image": {
                "filename": file.filename,
                "size": len(contents),
                "dimensions": f"{image.width}x{image.height}",
                "mode": image.mode
            },
            "results": search_results["results"],
            "total_found": search_results["total_found"],
            "search_time": search_results["search_time"],
            "processing_info": {
                "device": search_service.device,
                "embedding_shape": query_embedding.shape
            }
        }
        
        logger.info(f"Search completed: {search_results['total_found']} results in {search_results['search_time']:.4f}s")
        
        return response
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/search-by-product-id")
async def search_by_product_id(
    product_id: str,
    top_k: int = 10
):
    """
    Search for similar images using an existing product ID
    """
    if not search_service:
        raise HTTPException(status_code=503, detail="Search service not available")
    
    try:
        # Find the product in our database
        if product_id not in search_service.product_ids:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")
        
        # Get the image path
        image_path = None
        for ext in ['.jpg', '.png']:
            potential_path = os.path.join(search_service.images_dir, f"{product_id}{ext}")
            if os.path.exists(potential_path):
                image_path = potential_path
                break
        
        if not image_path:
            raise HTTPException(status_code=404, detail=f"Image for product {product_id} not found")
        
        # Load and process the image
        image = Image.open(image_path)
        query_embedding = search_service.get_embedding(image)
        
        # Search for similar images
        search_results = search_service.search_similar_images(query_embedding, top_k)
        
        return {
            "success": True,
            "query_product_id": product_id,
            "results": search_results["results"],
            "total_found": search_results["total_found"],
            "search_time": search_results["search_time"]
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Product search error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/product/{product_id}")
async def get_product_info(product_id: str):
    """
    Get information about a specific product
    """
    if not search_service:
        raise HTTPException(status_code=503, detail="Search service not available")
    
    try:
        if product_id not in search_service.product_ids:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")
        
        # Check for image files
        image_info = {}
        for ext in ['.jpg', '.png']:
            image_path = os.path.join(search_service.images_dir, f"{product_id}{ext}")
            if os.path.exists(image_path):
                image_info = {
                    "filename": f"{product_id}{ext}",
                    "path": image_path,
                    "url": f"/images/{product_id}{ext}",
                    "exists": True
                }
                break
        
        return {
            "product_id": product_id,
            "image": image_info,
            "index_position": int(np.where(search_service.product_ids == product_id)[0][0])
        }
        
    except Exception as e:
        logger.error(f"Product info error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/stats")
async def get_stats():
    """
    Get API statistics and information
    """
    if not search_service:
        raise HTTPException(status_code=503, detail="Search service not available")
    
    return {
        "total_products": len(search_service.product_ids),
        "device": search_service.device,
        "clip_model": "ViT-B/32",
        "index_type": "FAISS IndexFlatIP (Cosine Similarity)",
        "supported_formats": ["jpg", "png", "webp", "gif"],
        "max_top_k": 50
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )