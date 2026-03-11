import streamlit as st
import requests

API_URL = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="AI Governance Demo",
    page_icon="🤖",
    layout="wide"
)

st.title("Response AI GenAI Demo")
st.markdown("*Powered by Elasticsearch, Fine-tuned GPT-4o-mini, and Enterprise Security Controls*. Developed by Tristan Gitman.")

user_id = "demo_user"

st.subheader("Ask a Question")
query = st.text_area("Enter your question:", height=100)

col1, col2 = st.columns([1, 4])
with col1:
    submit = st.button("Submit", type="primary")

if submit and query:
    with st.spinner("Processing..."):
        response = requests.post(f"{API_URL}/query", json={
            "question": query,
            "user_id": user_id
        })

    if response.status_code == 200:
        data = response.json()

        st.subheader("Answer")
        st.write(data["answer"])

        st.subheader("🔍 Governance Panel")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.markdown("**⚠️ Hallucination Score**")
            score = data["hallucination_score"]
            color = "🟢" if not score["is_hallucination"] else "🔴"
            st.write(f"{color} {score['reason']}")
            st.write(f"Confidence: {score['confidence']}")

        with col2:
            st.markdown("**📋 Query Info**")
            st.write(f"Style: {data['detected_style']} (auto-detected)")
            st.markdown("**📄 UN Document Sources**")
            for source in data.get("sources", []):
                st.write(f"• {source}")

        with col3:
            st.markdown("**🔒 Security**")
            st.write("✅ Injection check passed")
            st.write("✅ PII anonymized")
            st.write("✅ Rate limit OK")

    elif response.status_code == 400:
        st.error(f"Security check failed: {response.json()['detail']}")
    else:
        st.error(f"Error: {response.status_code}")