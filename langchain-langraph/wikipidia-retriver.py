from langchain_community.retrievers import WikipediaRetriever

retriever = WikipediaRetriever(top_k_results=2, lang="en")
query = "Nepal mountains"
docs = retriever.invoke(query)

print(len(docs))
for i, doc in enumerate(docs):
    print("content", doc.page_content)