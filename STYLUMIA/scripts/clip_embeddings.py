import os
import clip
import torch
from PIL import Image
from typing import Union
import numpy as np

# Initialize CLIP model (loaded once at startup)
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = None, None

def initialize_clip():
    """Initialize CLIP model (call this once at startup)"""
    global model, preprocess
    if model is None or preprocess is None:
        model, preprocess = clip.load("ViT-B/32", device=device)

def get_embedding(image_input: Union[str, Image.Image]) -> np.ndarray:  # Changed return type
    """
    Get CLIP embedding for either an image file path or PIL Image object
    
    Args:
        image_input: Either a path string or PIL Image object
        
    Returns:
        np.ndarray: The image embedding as float32 numpy array (shape [1, 512])
        None: If processing fails
    """
    # Initialize CLIP if not already done
    if model is None or preprocess is None:
        initialize_clip()
    
    try:
        # Handle either path string or PIL Image
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                raise FileNotFoundError(f"Image file not found: {image_input}")
            image = Image.open(image_input)
        elif isinstance(image_input, Image.Image):
            image = image_input
        else:
            raise ValueError("Input must be either image path (str) or PIL Image object")
        
        # Process and get embedding
        image_tensor = preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            embedding = model.encode_image(image_tensor)
            
        # Convert to numpy array and ensure float32 type
        return embedding.cpu().numpy().astype('float32')  # Added conversion
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return None
# Example usage
'''if __name__ == "__main__":
    # Initialize once
    initialize_clip()
    
    # Test with file path
    embedding = get_embedding("path/to/image.jpg")
    if embedding is not None:
        print(f"Embedding from path: {embedding.shape}")
    
    # Test with PIL Image
    from PIL import Image
    img = Image.open("path/to/image.jpg")
    embedding = get_embedding(img)
    if embedding is not None:
        print(f"Embedding from PIL Image: {embedding.shape}")'''