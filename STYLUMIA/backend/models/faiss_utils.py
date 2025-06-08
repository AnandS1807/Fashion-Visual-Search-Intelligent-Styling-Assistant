import faiss
import numpy as np
import os

class FaissSearch:
    def __init__(self):
        self.index = None
        self.product_ids = []
        self.load_index()
    
    def load_index(self):
        index_path = "backend/faiss_index/cosine_index.faiss"
        ids_path = "backend/faiss_index/product_ids.npy"
        
        if os.path.exists(index_path) and os.path.exists(ids_path):
            self.index = faiss.read_index(index_path)
            self.product_ids = np.load(ids_path)
        else:
            raise FileNotFoundError("FAISS index files not found")

    def search(self, query_embedding, top_k=5):
        faiss.normalize_L2(query_embedding)
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for i in range(top_k):
            if indices[0][i] >= 0:
                results.append({
                    "product_id": self.product_ids[indices[0][i]],
                    "similarity": float(distances[0][i])
                })
        
        return results

# Global instance
faiss_search = FaissSearch()

def search_similar_items(embedding, top_k=5):
    return faiss_search.search(embedding, top_k)