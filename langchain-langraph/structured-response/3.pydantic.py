from datetime import date as Date
from typing import Annotated, Literal, Optional, TypedDict

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field

load_dotenv()
model=ChatGroq(model="openai/gpt-oss-20b")
# propmt="""I bought this gadget expecting a seamless experience, but the battery barely holds a charge for half the advertised time. Furthermore, the buggy software constantly crashes and disconnects, making the device practically unusable. Save your money and look for a more reliable alternative, because this overpriced product feels like an unfinished beta test."""
prompt = """
Author: Alex Johnson
Date: January 4, 2026

Review:
I bought this gadget expecting a seamless experience, but the battery barely
holds a charge for half the advertised time. Furthermore, the buggy software
constantly crashes and disconnects, making the device practically unusable.
Save your money and look for a more reliable alternative, because this
overpriced product feels like an unfinished beta test.
"""
class Schema(BaseModel):
    key_themes:list[str]=Field(description="must write down all the key themes discuss in the reivew")
    sentiment:Literal["pos","neg"]=Field(description="Return sentiment of the review")
    summary:str=Field(description="must write down the  berif summary from the review")
    name:str=Field(description="Extract name of the reviewer ")
    review_date: Date = Field(
        description="Date when the review was written"
    )
    author:str=Field(description="Extract the author")

structured_output=model.with_structured_output(schema=Schema)
response=structured_output.invoke(prompt)
print(response)