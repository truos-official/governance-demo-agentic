import json
import openai
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
FINE_TUNE_FILE = Path("data/fine_tune_data.jsonl")

def upload_training_file() -> str:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    with open(FINE_TUNE_FILE, "rb") as f:
        response = client.files.create(file=f, purpose="fine-tune")
    print(f"Uploaded file ID: {response.id}")
    return response.id

def create_fine_tune_job(file_id: str)->str:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.fine_tuning.jobs.create(training_file=file_id, model="gpt-4o-mini-2024-07-18")
    print(f"Created fine-tune job ID: {response.id}")
    return response.id

def check_job_status(job_id: str) -> dict:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    job = client.fine_tuning.jobs.retrieve(job_id)
    print(f"Job status: {job.status}")
    return job

if __name__ == "__main__":
    file_id = upload_training_file()
    job_id = create_fine_tune_job(file_id)