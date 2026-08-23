from typing import Annotated

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from pydantic import BaseModel

load_dotenv()
propmt="""I bought this gadget expecting a seamless experience, but the battery barely holds a charge for half the advertised time. Furthermore, the buggy software constantly crashes and disconnects, making the device practically unusable. Save your money and look for a more reliable alternative, because this overpriced product feels like an unfinished beta test."""
llm=ChatGroq(model="openai/gpt-oss-20b")
class Schema(BaseModel):
    key_themes:Annotated[list[str],"must write down all the key themes discuss in the reivew"]
    sentiment:Annotated[str,"must return sentiment of the review either positive or negative"]
    summary:Annotated[str,"must write down the  berif summary from the review"]

sturctured_model=llm.with_structured_output(Schema)
response=sturctured_model.invoke(propmt)
print(response)