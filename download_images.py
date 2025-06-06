import pandas as pd
import requests
from tqdm import tqdm
import os

csv_path = r'C:\Users\ANAND\Downloads\STYLUMIA\data\jeans_bd_processed_data.csv'

# just to makje sure, trying all possible encodings
try:
    df = pd.read_csv(csv_path, encoding='utf-8')
except UnicodeDecodeError:
    try:
        df = pd.read_csv(csv_path, encoding='latin1')
    except Exception as e:
        print(f"Failed to read CSV: {e}")
        exit()

print(f"Successfully loaded {len(df)} rows")

# Creating directoiry
os.makedirs('images_jeans', exist_ok=True)

def download_image(url, save_path):
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True
        return False
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

# Downloading images
for idx, row in tqdm(df.iterrows(), total=len(df)):
    img_url = row['feature_image_s3']
    save_path = f"images_jeans/{row['product_id']}.jpg"
    if not os.path.exists(save_path):
        download_image(img_url, save_path)

print("Image download complete!")