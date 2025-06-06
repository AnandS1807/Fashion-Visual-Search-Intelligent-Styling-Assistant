import os
import clip
import torch
from PIL import Image

# 1. Load CLIP model (automatically downloads)
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# 2. Process one image
def get_embedding(image_path):
    image = Image.open(image_path)
    image_input = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        return model.encode_image(image_input)

# 3. Example usage
embedding = get_embedding(r"C:\Users\ANAND\Downloads\STYLUMIA\images_dressees\0a0e1710dcdddf87624fc1e55a9d58385342f388c0692ea3ab9abb9e4af203d7.jpg")
print(f"Embedding shape: {embedding.shape}")  # Should be [1, 512]




import numpy as np

# Create embeddings folder
os.makedirs("embeddings", exist_ok=True)

# Process all images
for img_file in os.listdir(r"C:\Users\ANAND\Downloads\STYLUMIA\images_dressees"):
    if img_file.endswith((".jpg", ".png")):
        try:
            product_id = os.path.splitext(img_file)[0]  # Gets 'P1001' from 'P1001.jpg'
            embedding = get_embedding(f"C:\\Users\\ANAND\\Downloads\\STYLUMIA\\images_dressees\\{img_file}")
            
            # Save as .npy file
            np.save(f"embeddings/{product_id}.npy", embedding.cpu().numpy())
            print(f"Saved {product_id}")
            
        except Exception as e:
            print(f"Error with {img_file}: {str(e)}")


