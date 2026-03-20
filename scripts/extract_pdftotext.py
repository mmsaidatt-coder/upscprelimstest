import PyPDF2

def extract_text(pdf_path):
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

if __name__ == "__main__":
    path = '/Users/mani/Desktop/upscpyq/VisionIAS - UPSC GS Paper I Question Paper 2025 with Answer Key.pdf'
    if not __import__('os').path.exists(path):
        print(f"Error: Path does not exist: {path}")
        path = '/Users/mani/Desktop/upscpyq/VisionIAS - UPSC GS Paper I Question Paper 2025 with Answer Key.pdf'
    
    text = extract_text(path)
    
    with open('data/visionias-key.txt', 'w') as f:
        f.write(text)
        
    print(f"Extracted {len(text)} characters.")
    print("--- HEAD ---")
    print(text[:1500])
    print("--- TAIL ---")
    print(text[-2000:])
