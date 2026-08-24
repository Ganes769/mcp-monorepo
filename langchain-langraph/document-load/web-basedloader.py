from dotenv import load_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

load_dotenv()

# LLM
model = ChatGroq(
    model="openai/gpt-oss-20b"
)

# Prompt
prompt = PromptTemplate(
    template="""
Answer the question based only on the following webpage content.

Question:
{question}

Webpage content:
{text}

Answer:
""",
    input_variables=["question", "text"]
)

# Website
url = "https://docs.python.org/3/tutorial/introduction.html"

# Load webpage
loader = WebBaseLoader(url)

docs = loader.load()

# Output parser
parser = StrOutputParser()

# Chain
chain = prompt | model | parser

# Ask a question
result = chain.invoke({
    "question": "What is Python used for?",
    "text": docs[0].page_content
})

print(result)