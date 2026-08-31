import os

from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

load_dotenv()
# print(os.getenv("GROQ_API_KEY"))
prompt = PromptTemplate(
    template="""Generate  some intresting fact about the person {person}""",
    input_variables=["person"],
)
llm = ChatGroq(temperature=0.1, model="qwen/qwen3.8-27b")
chain = prompt | llm
response = chain.invoke({"person": "elon musk"})
print(response.content)
