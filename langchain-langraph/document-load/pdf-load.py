from langchain_community.document_loaders import PyPDFLoader

loader=PyPDFLoader("ganesh.pdf")
docs=loader.load()
print(docs)
print(docs[0].metadata)
print(docs[0].page_content)

