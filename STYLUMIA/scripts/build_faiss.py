import numpy as np
import faiss
import os
import time

def build_faiss_index(embeddings_dir="embeddings", output_dir="faiss_index"):
    # Validate input directory
    if not os.path.exists(embeddings_dir):
        raise FileNotFoundError(f"Directory not found: {embeddings_dir}")
    
    os.makedirs(output_dir, exist_ok=True)

    # Load embeddings
    start_time = time.time()
    embeddings = []
    product_ids = []
    
    for emb_file in os.listdir(embeddings_dir):
        if emb_file.endswith('.npy'):
            try:
                product_id = os.path.splitext(emb_file)[0]
                emb = np.load(os.path.join(embeddings_dir, emb_file))
                
                if emb.ndim == 1:
                    emb = emb.reshape(1, -1)
                if not np.isfinite(emb).all():
                    continue
                    
                embeddings.append(emb)
                product_ids.append(product_id)
            except Exception as e:
                print(f"Skipping {emb_file}: {str(e)}")
                continue

    if not embeddings:
        raise ValueError("No valid embeddings found")

    # Prepare array
    embeddings = np.vstack(embeddings).astype('float32')
    faiss.normalize_L2(embeddings)  # Critical for cosine similarity

    # Build index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index = faiss.IndexIDMap2(index)
    ids = np.arange(len(product_ids)).astype('int64')
    index.add_with_ids(embeddings, ids)

    # Save outputs
    faiss.write_index(index, os.path.join(output_dir, "cosine_index.faiss"))
    np.save(os.path.join(output_dir, "product_ids.npy"), np.array(product_ids))
    
    # Save metadata
    metadata = {
        "num_embeddings": len(product_ids),
        "embedding_dim": dimension,
        "build_time": time.time() - start_time
    }
    np.save(os.path.join(output_dir, "metadata.npy"), metadata)

    print(f"Built index with {len(product_ids)} embeddings in {metadata['build_time']:.2f}s")

if __name__ == "__main__":
    build_faiss_index()