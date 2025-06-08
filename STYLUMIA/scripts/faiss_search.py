import faiss
import numpy as np
import os
from typing import List

class EmbeddingSimilaritySearch:
    def __init__(self, index_path: str = "faiss_index"):
        """
        Initialize FAISS search system for embedding-based similarity
        
        Args:
            index_path: Path to directory containing:
                - cosine_index.faiss
                - product_ids.npy
        """
        self.index = None
        self.product_ids = None
        self._load_index(index_path)

    def _load_index(self, index_path: str):
        """Load FAISS index and product IDs"""
        if not os.path.exists(index_path):
            raise FileNotFoundError(f"Index directory not found: {index_path}")

        index_file = os.path.join(index_path, "cosine_index.faiss")
        ids_file = os.path.join(index_path, "product_ids.npy")

        if not os.path.exists(index_file) or not os.path.exists(ids_file):
            raise FileNotFoundError("Required index files not found")

        self.index = faiss.read_index(index_file)
        self.product_ids = np.load(ids_file)

    def search(self, embedding: np.ndarray, top_k: int = 5) -> List[str]:
        """
        Find similar products given an embedding vector
        
        Args:
            embedding: Input embedding vector (shape [512] or [1, 512])
            top_k: Number of similar products to return
            
        Returns:
            List of similar product IDs (strings)
        """
        # Ensure proper shape and type
        query = embedding.reshape(1, -1).astype('float32')
        faiss.normalize_L2(query)
        
        # Search the index
        _, indices = self.index.search(query, top_k)
        
        # Return product IDs
        return [str(self.product_ids[i]) for i in indices[0] if i >= 0]

# Example usage
'''if __name__ == "__main__":
    # Initialize search engine
    search_engine = EmbeddingSimilaritySearch("faiss_index")

    # Example with random embedding
    test_embedding = np.random.rand(512).astype('float32')  # Mock CLIP embedding
    
    try:
        # Get similar products
        similar_product_ids = search_engine.search(test_embedding, top_k=5)
        
        # Prepare mock response
        results = [{
            "product_id": pid,
            "image_url": f"/images/{pid}.jpg",
            "product_name": f"Product {pid[:6]}",
            "brand": "Sample Brand",
            "price": 99.99
        } for pid in similar_product_ids]
        
        print({
            "success": True,
            "results": results
        })
        
    except Exception as e:
        print({
            "success": False,
            "error": str(e)
        })'''