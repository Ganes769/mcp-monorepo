from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()
from langchain.agents import create_agent

llm=ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite")
response=llm.invoke("Hello langchain! , Explain yourself in one sentence")
print(response.content)
def get_weather(city: str) -> str:
    """Get the weather for a given city."""
    return f"It's always sunny in {city}!"


agent = create_agent(
   model="google_genai:gemini-3.5-flash-lite",
    tools=[get_weather],
    system_prompt="You are a helpful assistant",
)

result = agent.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": "What's the weather in San Francisco?"
            }
        ]
    }
)

print(result["messages"][-1].content_blocks)
