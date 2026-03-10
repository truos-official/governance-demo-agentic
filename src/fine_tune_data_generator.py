import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import TextLoader

load_dotenv()

PROCESSED_DIR = Path("data/processed")
OUTPUT_FILE = Path("data/fine_tune_data.jsonl")

def load_documents():
    docs = []
    for txt_file in PROCESSED_DIR.glob("*.txt"):
        loader = TextLoader(str(txt_file), encoding="utf-8")
        docs.extend(loader.load())
    print(f"Loaded {len(docs)} documents")
    return docs

def generate_qa_pairs(doc_content: str, num_pairs: int = 10) -> list:
    llm = ChatOpenAI(model="gpt-4", temperature=0.7)
    prompt = f"""Generate {num_pairs} question-answer pairs from the following UN governance document.
Return ONLY a JSON array with this format:
[{{"question": "...", "answer": "..."}}]

Document:
{doc_content[:3000]}"""
    
    response = llm.invoke(prompt).content.strip()
    
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return []
    
def convert_to_openai_format(qa_pairs: list) -> list:
    formatted = []
    for pair in qa_pairs:
        formatted.append({"messages": [
    {"role": "system", "content": "You are a UN AI governance expert."},
    {"role": "user", "content": pair["question"]},
    {"role": "assistant", "content": pair["answer"]}
]})
    return formatted

def save_jsonl(data: list, output_file: Path):
    with output_file.open("w", encoding="utf-8") as f:
        for item in data:
            json.dump(item, f)
            f.write("\n")
    print(f"Saved {len(data)} QA pairs to {output_file}")


if __name__== "__main__":
    documents = load_documents()
    all_qa_pairs = []
    
    for doc in documents:
        qa_pairs = generate_qa_pairs(doc.page_content)
        all_qa_pairs.extend(qa_pairs)
    
    formatted_data = convert_to_openai_format(all_qa_pairs)
    save_jsonl(formatted_data, OUTPUT_FILE)
