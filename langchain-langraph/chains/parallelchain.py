from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel
from langchain_groq import ChatGroq

load_dotenv()

model = ChatGroq(model="openai/gpt-oss-20b")
parser = StrOutputParser()

summary_prompt = PromptTemplate.from_template(
    "Summarize this text in 2 sentences:\n{text}"
)

sentiment_prompt = PromptTemplate.from_template(
    "Identify the sentiment of this text as positive, negative, or neutral:\n{text}"
)

keyword_prompt = PromptTemplate.from_template(
    "Extract 5 important keywords from this text:\n{text}"
)

summary_chain = summary_prompt | model | parser
sentiment_chain = sentiment_prompt | model | parser
keyword_chain = keyword_prompt | model | parser

parallel_chain = RunnableParallel(
    summary=summary_chain,
    sentiment=sentiment_chain,
    keywords=keyword_chain,
)

result = parallel_chain.invoke({
    "text": "I absolutely loved the new restaurant. "
            "The food was delicious and the staff were incredibly friendly."
})

print(result)