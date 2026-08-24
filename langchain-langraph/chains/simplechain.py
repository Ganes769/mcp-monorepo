from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

load_dotenv()
model=ChatGroq(model="openai/gpt-oss-20b")
propmt=PromptTemplate(template="Generate  three fact about a topic {topic}",input_variables=["topic"])
parser=StrOutputParser()
chain=propmt|model|parser
# print(chain)
result=chain.invoke({"topic":"aliens"})
print(result)