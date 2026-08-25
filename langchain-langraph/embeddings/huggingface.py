from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()
embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

text1 = "New York is a busy city."
text2 = "New York is a crowded place."
text3 = "Cricket is a popular sport."

vector1 = embedding.embed_query(text1)
vector2 = embedding.embed_query(text2)
vector3 = embedding.embed_query(text3)

print(len(vector1))
print(vector1[:5])