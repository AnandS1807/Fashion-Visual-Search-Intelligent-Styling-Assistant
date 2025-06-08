export interface SearchResult {
    product_id: string;
    similarity: number;
}

export const uploadImage = async (file: File): Promise<SearchResult[]> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:8000/api/v1/search', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};