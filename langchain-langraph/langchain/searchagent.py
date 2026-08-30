import os

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from tavily import TavilyClient

load_dotenv()

tavily = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))


@tool
def search(query: str) -> str:
    """Search the web for current information."""
    print(f"search: {query}")
    result = tavily.search(query=query, max_results=3)
    return str(result)


llm = ChatGroq(model="qwen/qwen3.8-27b")
agent = create_agent(model=llm, tools=[search])
response = agent.invoke(
    {"messages": [HumanMessage(content="who is better messi or ronaldo?")]}
)
print(response)
