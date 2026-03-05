from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from elastic_retriever import connect, hybrid_search
from prompt_library import get_prompt

load_dotenv()


def build_chain(prompt_type: str = "factual", topic: str = "AI Governance"):
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    prompt = get_prompt(prompt_type)
    
    client=connect()
    

    def chain(query: str) -> str:
        results = hybrid_search(client, query)
        context = "\n\n".join([r['_source']['content'] for r in results])
        formatted_prompt = prompt.format(context=context, question=query, topic=topic)
        response = llm.invoke(formatted_prompt)
        return response.content

    return chain

if __name__ == "__main__":
    chain = build_chain()
    result = chain("What role does the private sector play in AI governance?")
    print(result)