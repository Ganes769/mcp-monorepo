import os
from typing import List

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from tavily import TavilyClient

load_dotenv()
class Source(BaseModel):
    """Schema for source used by  agent"""
    url:str=Field(description="The URL of the source")
class AgentResponse(BaseModel):
    """"Schema for agent response"""
    ans:str=Field(description="Agent answer for schema")
    sources:list[Source]=Field(default_factory=list,description="list of sources used to generate the asnwer")
    better:str=Field(description="is this better for human being life?")

tavily = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))


@tool
def search(query: str) -> str:
    """Search the web for current information."""
    print(f"search: {query}")
    result = tavily.search(query=query, max_results=3)
    return str(result)

llm=ChatGroq(model="qwen/qwen3.8-27b")
agent = create_agent(model=llm, tools=[search],response_format=AgentResponse)
response = agent.invoke(
    {"messages": [HumanMessage(content="is ai is better for human?")]}
)
print(response)
