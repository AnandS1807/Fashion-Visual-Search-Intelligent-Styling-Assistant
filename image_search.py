import os
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import time

class ImageSearchEngine:
    def __init__(self, embeddings_dir="embeddings"):
        self.embeddings_dir = embeddings_dir
        self.embeddings_cache = {}
        self.load_all_embeddings()
    
    def load_all_embeddings(self):
        """Load all embeddings into memory for fast search"""
        print(f"Loading embeddings from {self.embeddings_dir}...")
        start_time = time.time()
        
        if not os.path.exists(self.embeddings_dir):
            print(f"Error: Directory '{self.embeddings_dir}' not found!")
            return
        
        embedding_files = [f for f in os.listdir(self.embeddings_dir) if f.endswith('.npy')]
        
        if not embedding_files:
            print(f"No .npy files found in '{self.embeddings_dir}'")
            return
        
        for emb_file in embedding_files:
            try:
                product_id = os.path.splitext(emb_file)[0]
                emb_path = os.path.join(self.embeddings_dir, emb_file)
                embedding = np.load(emb_path)
                
                # Ensure embedding is 2D
                if embedding.ndim == 1:
                    embedding = embedding.reshape(1, -1)
                
                self.embeddings_cache[product_id] = embedding
                
            except Exception as e:
                print(f"Error loading {emb_file}: {e}")
        
        load_time = time.time() - start_time
        print(f"Loaded {len(self.embeddings_cache)} embeddings in {load_time:.2f} seconds")
    
    def search_by_embedding(self, query_embedding, top_k=5):
        """
        Search using a pre-computed query embedding
        Args:
            query_embedding: numpy array of query embedding
            top_k: number of top results to return
        Returns:
            List of tuples (product_id, similarity_score)
        """
        if len(self.embeddings_cache) == 0:
            print("No embeddings loaded!")
            return []
        
        # Ensure query embedding is 2D
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        similarities = {}
        
        for product_id, stored_embedding in self.embeddings_cache.items():
            try:
                # Check shape compatibility
                if query_embedding.shape[1] != stored_embedding.shape[1]:
                    continue
                
                similarity = cosine_similarity(query_embedding, stored_embedding)[0][0]
                similarities[product_id] = float(similarity)
                
            except Exception as e:
                print(f"Error computing similarity for {product_id}: {e}")
                continue
        
        # Return top matches
        top_matches = sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return top_matches
    
    def search_by_product_id(self, query_product_id, top_k=5):
        """
        Search using an existing product's embedding as query
        Args:
            query_product_id: ID of the product to use as query
            top_k: number of top results to return
        Returns:
            List of tuples (product_id, similarity_score)
        """
        if query_product_id not in self.embeddings_cache:
            print(f"Product ID '{query_product_id}' not found in embeddings!")
            return []
        
        query_embedding = self.embeddings_cache[query_product_id]
        results = self.search_by_embedding(query_embedding, top_k + 1)  # +1 to exclude self
        
        # Remove the query product itself from results
        filtered_results = [(pid, score) for pid, score in results if pid != query_product_id]
        return filtered_results[:top_k]

def quick_search(query_product_id, embeddings_dir="embeddings", top_k=5):
    """
    Quick search function for one-time use
    Args:
        query_product_id: Product ID to search for similar items
        embeddings_dir: Directory containing embeddings
        top_k: Number of results to return
    Returns:
        List of tuples (product_id, similarity_score)
    """
    if not os.path.exists(embeddings_dir):
        print(f"Directory '{embeddings_dir}' not found!")
        return []
    
    # Load query embedding
    query_path = os.path.join(embeddings_dir, f"{query_product_id}.npy")
    if not os.path.exists(query_path):
        print(f"Query embedding '{query_product_id}.npy' not found!")
        return []
    
    query_embedding = np.load(query_path)
    if query_embedding.ndim == 1:
        query_embedding = query_embedding.reshape(1, -1)
    
    # Compare with all other embeddings
    similarities = {}
    for emb_file in os.listdir(embeddings_dir):
        if emb_file.endswith('.npy') and emb_file != f"{query_product_id}.npy":
            try:
                product_id = os.path.splitext(emb_file)[0]
                emb_path = os.path.join(embeddings_dir, emb_file)
                stored_embedding = np.load(emb_path)
                
                if stored_embedding.ndim == 1:
                    stored_embedding = stored_embedding.reshape(1, -1)
                
                if query_embedding.shape[1] == stored_embedding.shape[1]:
                    similarity = cosine_similarity(query_embedding, stored_embedding)[0][0]
                    similarities[product_id] = float(similarity)
                    
            except Exception as e:
                print(f"Error processing {emb_file}: {e}")
                continue
    
    return sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:top_k]

# Example usage
if __name__ == "__main__":
    # Method 1: Using the search engine class (recommended for multiple searches)
    print("=== Method 1: Using SearchEngine Class ===")
    search_engine = ImageSearchEngine("embeddings")
    
    # Search using a product ID (assuming you have embeddings saved)
    query_id = "0db4fdcd020d547dce64636d3bf3501d9472b2bcf8ba8f9218c1f381e3f227d2"
    results = search_engine.search_by_product_id(query_id, top_k=5)
    print(f"Top 5 similar products to {query_id}:")
    for product_id, similarity in results:
        print(f"  {product_id}: {similarity:.4f}")
    
    print("\n" + "="*50 + "\n")
    
    # Method 2: Quick one-time search
    print("=== Method 2: Quick Search ===")
    results2 = quick_search(query_id, "embeddings", top_k=3)
    print(f"Top 3 similar products (quick search):")
    for product_id, similarity in results2:
        print(f"  {product_id}: {similarity:.4f}")