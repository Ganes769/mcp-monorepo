# from typing import TypedDict

from dotenv import load_dotenv

# from langchain_groq import ChatGroq

load_dotenv()

# model=ChatGroq(model="openai/gpt-oss-20b")
# class Review(TypedDict):
#     sentiment:str
#     summary:str

# propmt="""I bought this gadget expecting a seamless experience, but the battery barely holds a charge for half the advertised time. Furthermore, the buggy software constantly crashes and disconnects, making the device practically unusable. Save your money and look for a more reliable alternative, because this overpriced product feels like an unfinished beta test."""
# structured_prompt=model.with_structured_output(Review)
# response=structured_prompt.invoke(propmt)
# print(response)
# from langchain_groq import ChatGroq
# from pydantic import BaseModel, Field


# class Review(BaseModel):
#     product_name: str
#     rating: int = Field(ge=1, le=5)
#     comment: str


# llm = ChatGroq(
#     model="openai/gpt-oss-20b",
#     temperature=0,
# )

# structured_llm = llm.with_structured_output(Review)

# result = structured_llm.invoke(
#     "Write a review for an iPhone. The review should be negative."
# )

# print(result)