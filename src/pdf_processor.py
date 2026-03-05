"""Extract text from PDF files."""

import PyPDF2
from pathlib import Path


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file."""
    
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
    
    return text

def save_text(text: str, output_path: str):
    """Save text to a file."""
    
    with open(output_path, 'w', encoding='utf-8') as file:
        file.write(text)

def process_all_pdfs():
    """Process all PDFs and save extracted text."""
    
    pdf_folder = Path("data/pdfs")
    output_folder = Path("data/processed")
    output_folder.mkdir(exist_ok=True)  # Create folder if doesn't exist
    
    pdf_files = list(pdf_folder.glob("*.pdf"))
    
    print(f"Found {len(pdf_files)} PDF files\n")
    
    for pdf_path in pdf_files:
        print(f"Processing: {pdf_path.name}")
        
        # Extract text
        text = extract_text_from_pdf(pdf_path)
        
        # Create output filename (change .pdf to .txt)
        output_name = pdf_path.stem + ".txt"
        output_path = output_folder / output_name
        
        # Save
        save_text(text, output_path)
        
        print(f"  → Saved to {output_path}\n")


if __name__ == "__main__":
    process_all_pdfs()