from typing import Literal

from dotenv import load_dotenv
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableBranch, RunnableLambda
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field

load_dotenv()

model=ChatGroq(model="openai/gpt-oss-20b")
parser=StrOutputParser()
class Feedback(BaseModel):
    sentiment:Literal["positive","negative"]=Field(description="The sentiment should be either positive or negative")
parser2=PydanticOutputParser(pydantic_object=   Feedback)
prompt1 = PromptTemplate(
    template="""Classify the sentiment of the feedback as either positive or negative.

Feedback: {feedback}

{format_instructions}""",
    input_variables=["feedback"],
    partial_variables={
        "format_instructions": parser2.get_format_instructions()
    },
)
classifier_chain=prompt1|model|parser2
prompt2=PromptTemplate(template="write an appropriate positive response for the feedbacl {feedback}",input_variables=["feedback"])
prompt3=PromptTemplate(template="write an appropriate negative response for the feedbacl {feedback}",input_variables=["feedback"])
branch_chain=RunnableBranch((lambda x:x.sentiment=="positive",prompt2|model|parser),(lambda x:x.sentiment=="negative",prompt3|model|parser),RunnableLambda(lambda X:"No valid statement found"))
chain=classifier_chain|branch_chain
result=chain.invoke({"feedback":"This is the  worst place i have ever been"})
print(result)