from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()


# ============================================================
# 1. LOAD PDF
# ============================================================

loader = PyPDFLoader("ganesh.pdf")

documents = loader.load()

print("Loaded documents:", len(documents))


# ============================================================
# 2. SPLIT PDF
# ============================================================

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)

docs = text_splitter.split_documents(
    documents
)

print("Number of chunks:", len(docs))


# ============================================================
# 3. EMBEDDINGS
# ============================================================

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# ============================================================
# 4. VECTOR DATABASE
# ============================================================

vector_space = Chroma.from_documents(
    documents=docs,
    embedding=embeddings,
    collection_name="portfolio-rag"
)


# ============================================================
# 5. RETRIEVER
# ============================================================

retriever = vector_space.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 4,
        "lambda_mult": 0.5
    }
)


# ============================================================
# 6. LLM
# ============================================================

model = ChatGroq(
    model="openai/gpt-oss-20b"
)


# ============================================================
# 7. PROMPT
# ============================================================

prompt = PromptTemplate(
    template="""
You are an AI assistant answering questions about Ganesh's CV.

Use ONLY the information in the context below.

Context:
{context}

Question:
{question}

If the answer is present in the context, answer it directly.

If the answer is NOT present in the context, say:
"I don't know based on the information available in the document."

Answer:
""",
    input_variables=[
        "context",
        "question"
    ]
)


# ============================================================
# 8. OUTPUT PARSER
# ============================================================

parser = StrOutputParser()


# ============================================================
# 9. FORMAT DOCUMENTS
# ============================================================

def format_docs(docs):

    return "\n\n".join(
        doc.page_content
        for doc in docs
    )


# ============================================================
# 10. RAG CHAIN
# ============================================================

rag_chain = (
    {
        "context": retriever | format_docs,
        "question": lambda x: x
    }
    | prompt
    | model
    | parser
)


# ============================================================
# 11. QUESTION
# ============================================================

query = "What technologies does Ganesh know?"


# ============================================================
# 12. DEBUG RETRIEVAL
# ============================================================

retrieved_docs = retriever.invoke(
    query
)

print("\n==============================")
print("RETRIEVED DOCUMENTS")
print("==============================")

for i, doc in enumerate(retrieved_docs):

    print(f"\n--- DOCUMENT {i + 1} ---")

    print(doc.page_content)

    print("\nMETADATA:")
    print(doc.metadata)


# ============================================================
# 13. GENERATE ANSWER
# ============================================================

response = rag_chain.invoke(
    query
)

print("\n==============================")
print("FINAL RESPONSE")
print("==============================")

print(response)
# import asyncio

# from dotenv import load_dotenv
# from langchain_chroma import Chroma
# from langchain_core.documents import Document
# from langchain_core.output_parsers import StrOutputParser
# from langchain_core.prompts import PromptTemplate
# from langchain_groq import ChatGroq
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from playwright.async_api import async_playwright

# # ============================================================
# # ENVIRONMENT
# # ============================================================

# load_dotenv()


# # ============================================================
# # CONFIGURATION
# # ============================================================

# BASE_URL = "https://ganesh-gnawali.netlify.app/"

# COLLECTION_NAME = "ganesh-portfolio"

# CHUNK_SIZE = 500
# CHUNK_OVERLAP = 100

# TOP_K = 3


# # ============================================================
# # 1. LOAD WEBSITE SECTIONS
# # ============================================================

# async def load_website_sections():

#     documents = []

#     async with async_playwright() as p:

#         browser = await p.chromium.launch(
#             headless=True
#         )

#         page = await browser.new_page()

#         print("Loading website...")

#         await page.goto(
#             BASE_URL,
#             wait_until="networkidle",
#             timeout=60000
#         )

#         print("Website loaded.")

#         # ----------------------------------------------------
#         # Find every element that has an ID
#         # ----------------------------------------------------

#         sections = await page.locator("[id]").all()

#         print(f"Found {len(sections)} elements with IDs.")

#         for section in sections:

#             try:

#                 section_id = await section.get_attribute("id")

#                 if not section_id:
#                     continue

#                 text = await section.inner_text()

#                 text = text.strip()

#                 # Ignore empty sections
#                 if not text:
#                     continue

#                 # Ignore extremely small elements
#                 if len(text) < 30:
#                     continue

#                 source = f"{BASE_URL}#{section_id}"

#                 print("\n--------------------------------")
#                 print(f"Section: {section_id}")
#                 print(f"Characters: {len(text)}")
#                 print(f"Source: {source}")
#                 print("--------------------------------")

#                 documents.append(
#                     Document(
#                         page_content=text,
#                         metadata={
#                             "source": source,
#                             "section": section_id
#                         }
#                     )
#                 )

#             except Exception as e:

#                 print(
#                     f"Could not process section: {e}"
#                 )

#         await browser.close()

#     return documents


# # ============================================================
# # 2. SPLIT DOCUMENTS
# # ============================================================

# def split_documents(documents):

#     print("\n==============================")
#     print("SPLITTING DOCUMENTS")
#     print("==============================")

#     text_splitter = RecursiveCharacterTextSplitter(
#         chunk_size=CHUNK_SIZE,
#         chunk_overlap=CHUNK_OVERLAP
#     )

#     docs = text_splitter.split_documents(
#         documents
#     )

#     print(
#         f"Original documents: {len(documents)}"
#     )

#     print(
#         f"Total chunks: {len(docs)}"
#     )

#     return docs


# # ============================================================
# # 3. CREATE EMBEDDINGS
# # ============================================================

# def create_embeddings():

#     print("\n==============================")
#     print("CREATING EMBEDDING MODEL")
#     print("==============================")

#     embeddings = HuggingFaceEmbeddings(
#         model_name="sentence-transformers/all-MiniLM-L6-v2"
#     )

#     return embeddings


# # ============================================================
# # 4. CREATE CHROMA VECTOR DATABASE
# # ============================================================

# def create_vector_database(docs, embeddings):

#     print("\n==============================")
#     print("CREATING CHROMA DATABASE")
#     print("==============================")

#     vector_space = Chroma.from_documents(
#         documents=docs,
#         embedding=embeddings,
#         collection_name=COLLECTION_NAME
#     )

#     print("Chroma database created.")

#     return vector_space


# # ============================================================
# # 5. CREATE RETRIEVER
# # ============================================================

# def create_retriever(vector_space):

#     retriever = vector_space.as_retriever(
#         search_type="mmr",
#         search_kwargs={
#             "k": TOP_K,
#             "lambda_mult": 0.5
#         }
#     )

#     return retriever


# # ============================================================
# # 6. CREATE RAG CHAIN
# # ============================================================

# def create_rag_chain(retriever):

#     print("\n==============================")
#     print("CREATING RAG CHAIN")
#     print("==============================")


#     # --------------------------------------------------------
#     # LLM
#     # --------------------------------------------------------

#     model = ChatGroq(
#         model="openai/gpt-oss-20b"
#     )


#     # --------------------------------------------------------
#     # Prompt
#     # --------------------------------------------------------

#     prompt = PromptTemplate(
#         template="""
# You are an AI assistant for Ganesh Gnawali's portfolio website.

# Your job is to answer questions about Ganesh using ONLY
# the information contained in the provided context.

# Rules:

# 1. Do not invent information.
# 2. Do not make assumptions.
# 3. If the answer is not in the context, say:
#    "I don't know based on the information available
#    on the portfolio."
# 4. Give a concise but useful answer.
# 5. If useful, mention the portfolio section where
#    the information came from.

# Context:

# {context}

# Question:

# {question}

# Answer:
# """,
#         input_variables=[
#             "context",
#             "question"
#         ]
#     )


#     # --------------------------------------------------------
#     # Format retrieved documents
#     # --------------------------------------------------------

#     def format_docs(docs):

#         formatted_documents = []

#         for doc in docs:

#             section = doc.metadata.get(
#                 "section",
#                 "unknown"
#             )

#             source = doc.metadata.get(
#                 "source",
#                 ""
#             )

#             formatted_documents.append(
#                 f"""
# SECTION: {section}

# SOURCE: {source}

# CONTENT:
# {doc.page_content}
# """
#             )

#         return "\n\n".join(
#             formatted_documents
#         )


#     # --------------------------------------------------------
#     # RAG chain
#     # --------------------------------------------------------

#     rag_chain = (
#         {
#             "context": retriever | format_docs,
#             "question": lambda x: x
#         }
#         | prompt
#         | model
#         | StrOutputParser()
#     )

#     return rag_chain


# # ============================================================
# # 7. DEBUG RETRIEVAL
# # ============================================================

# def test_retrieval(retriever, question):

#     print("\n==============================")
#     print("RETRIEVAL")
#     print("==============================")

#     docs = retriever.invoke(
#         question
#     )

#     print(
#         f"Retrieved {len(docs)} documents."
#     )

#     for i, doc in enumerate(docs):

#         print(
#             f"\n--- RESULT {i + 1} ---"
#         )

#         print(
#             "Section:",
#             doc.metadata.get("section")
#         )

#         print(
#             "Source:",
#             doc.metadata.get("source")
#         )

#         print(
#             "Content:"
#         )

#         print(
#             doc.page_content[:1000]
#         )

#     return docs


# # ============================================================
# # 8. ASK QUESTION
# # ============================================================

# def ask_question(
#     rag_chain,
#     retriever,
#     question
# ):

#     print("\n")
#     print("=" * 60)
#     print("QUESTION")
#     print("=" * 60)

#     print(question)


#     # --------------------------------------------------------
#     # First test retrieval
#     # --------------------------------------------------------

#     test_retrieval(
#         retriever,
#         question
#     )


#     # --------------------------------------------------------
#     # Generate answer
#     # --------------------------------------------------------

#     print("\n==============================")
#     print("GENERATING ANSWER")
#     print("==============================")

#     response = rag_chain.invoke(
#         question
#     )

#     print("\nANSWER:")
#     print(response)

#     return response


# # ============================================================
# # 9. MAIN
# # ============================================================

# async def main():

#     # --------------------------------------------------------
#     # Load website
#     # --------------------------------------------------------

#     documents = await load_website_sections()


#     if not documents:

#         print(
#             "ERROR: No website sections were found."
#         )

#         return


#     print("\n==============================")
#     print("WEBSITE DOCUMENTS")
#     print("==============================")

#     for doc in documents:

#         print(
#             f"\nSection: {doc.metadata['section']}"
#         )

#         print(
#             f"Characters: {len(doc.page_content)}"
#         )


#     # --------------------------------------------------------
#     # Split
#     # --------------------------------------------------------

#     docs = split_documents(
#         documents
#     )


#     # --------------------------------------------------------
#     # Embeddings
#     # --------------------------------------------------------

#     embeddings = create_embeddings()


#     # --------------------------------------------------------
#     # Chroma
#     # --------------------------------------------------------

#     vector_space = create_vector_database(
#         docs,
#         embeddings
#     )


#     # --------------------------------------------------------
#     # Retriever
#     # --------------------------------------------------------

#     retriever = create_retriever(
#         vector_space
#     )


#     # --------------------------------------------------------
#     # RAG
#     # --------------------------------------------------------

#     rag_chain = create_rag_chain(
#         retriever
#     )


#     # --------------------------------------------------------
#     # Questions
#     # --------------------------------------------------------

#     questions = [

#         "What technologies does Ganesh know?",

#         "What education does Ganesh have?",

#         "What experience does Ganesh have?",

#         "What projects has Ganesh worked on?",

#         "What experience does Ganesh have with MCP?"

#     ]


#     for question in questions:

#         ask_question(
#             rag_chain,
#             retriever,
#             question
#         )


# # ============================================================
# # RUN
# # ============================================================

# if __name__ == "__main__":

#     asyncio.run(main())