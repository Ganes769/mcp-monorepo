
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.tools import tool
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langsmith import traceable

load_dotenv()

MODEL = "qwen2.5:7b"
MAX_ITERATION = 10


@tool
def get_produuct_price(product: str) -> float:
    """Look for the product price from the catalog"""
    print(f"Executing for the product {product}")

    prices = {
        "laptop": 1231.9,
        "headphones": 1000,
        "keyboard": 1232
    }

    return prices.get(product, 0)


@tool
def apply_discount(price: float, discount_tier: str) -> float:
    """Apply discount on the product according to price and discount tier.

    Available tier: gold, bronze, silver
    """
    print(f"Executing discount for the tier {discount_tier}")

    discount_percentages = {
        "bronze": 4,
        "silver": 8,
        "gold": 50
    }

    discount = discount_percentages.get(discount_tier, 0)

    return round(price * (1 - discount / 100), 2)


@traceable(name="Langchain agent loop")
def run_agent(question: str):

    tools = [get_produuct_price, apply_discount]
    tool_dict = {t.name: t for t in tools}

    llm = init_chat_model(
        model=f"ollama:{MODEL}"
    )

    llm_with_tool = llm.bind_tools(tools=tools)

    print(f"Question: {question}")

    messages = [
        SystemMessage(
            content=(
                "You are a helpful shopping assistant. "
                "You have access to product catalog and discount tools. "
                "Never guess the price. "
                "You must call get_produuct_price to get the product price "
                "and apply_discount to apply the discount."
                "Return currency in pound"
            )
        ),
        HumanMessage(content=question)
    ]

    for iteration in range(1, MAX_ITERATION + 1):

        print(f"Iteration: {iteration}")

        ai_message = llm_with_tool.invoke(messages)

        messages.append(ai_message)

        tool_calls = ai_message.tool_calls

        if not tool_calls:
            print(ai_message.content)
            return ai_message.content

        tool_call = tool_calls[0]
        print(tool_call)

        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        tool = tool_dict[tool_name]

        tool_result = tool.invoke(tool_args)

        print(f"Tool result: {tool_result}")

        messages.append(
            ToolMessage(
                content=str(tool_result),
                tool_call_id=tool_call["id"]
            )
        )

    return "Maximum iterations reached."


if __name__ == "__main__":
    run_agent(
        "What is the price of a headphones after applying gold discount?"
    )

