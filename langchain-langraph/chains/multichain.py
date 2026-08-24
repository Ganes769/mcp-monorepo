from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_groq import ChatGroq

load_dotenv()
llm=ChatGroq(model="openai/gpt-oss-20b")
prompt1=PromptTemplate(template="Generate berif research report on topic {topic}",input_variables=["topic"])

prompt2=PromptTemplate(template="Generate the short summary of the  text {text}",input_variables=["texts"])

parser=StrOutputParser()
chain = (
    prompt1
    | llm
    | parser
    | RunnableLambda(lambda text: {"text": text})
    | prompt2
    | llm
    | parser
)
result=chain.invoke({"topic":"AI"})
print(result)