import json
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
import wandb

load_dotenv()

FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:truos::DHxtzUS8"
BASE_MODEL = "gpt-4o-mini"

TEST_QUESTIONS = [
    "What role does the private sector play in AI governance?",
    "How does the UN address AI risks in military applications?",
    "What are the key principles for responsible AI development?"
]

def evaluate_model(model: str, question: str) -> str:
    llm = ChatOpenAI(model=model, temperature=0)
    response = llm.invoke(question).content
    return response

if __name__ == "__main__":
    wandb.init(project="un-governance-demo", name="fine-tune-evaluation")
    
    print("Starting evaluation...")
    results = []
    for i, question in enumerate(TEST_QUESTIONS):
        print(f"Evaluating: {question}")
        ft_response = evaluate_model(FINE_TUNED_MODEL, question)
        base_response = evaluate_model(BASE_MODEL, question)
        
        results.append({
            "question": question,
            "fine_tuned_response": ft_response,
            "base_response": base_response
        })
        
        wandb.log({
            "question_index": i,
            "question": question,
            "fine_tuned_response": ft_response,
            "base_response": base_response
        })
    
    wandb.finish()
    
    print(f"Saving {len(results)} results...")
    with open("evaluation_results.json", "w") as f:
        json.dump(results, f, indent=4)
    print("Done.")