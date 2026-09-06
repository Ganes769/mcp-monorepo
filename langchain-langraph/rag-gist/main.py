import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore

load_dotenv()
llm=ChatGroq(model="openai/gpt-oss-20b")
embedding=HuggingFaceEmbeddings(  model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstores=PineconeVectorStore(index_name=os.environ["INDEX_NAME"],embedding=embedding)

retriver=vectorstores.as_retriever(search_args={"k":3})
prompt_template = ChatPromptTemplate.from_template(
    """Answer the question based only on the following context:

{context}

Question: {question}
"If the context is not meet the question answer then use your own knowlwdge"
Provide a detailed answer:"""
)

query="explain pinecode?"
docs = retriver.invoke(query)
print("docs from pinecode",docs)
message=prompt_template.format_messages(context=docs, question=query)
response = llm.invoke(message)
print("response",response.content)