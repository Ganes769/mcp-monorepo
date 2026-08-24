from langchain_community.document_loaders import (
    DirectoryLoader,
    PyPDFLoader,
    TextLoader,
)

pdf_loader = DirectoryLoader(
    path="docs",
    glob="*.pdf",
    loader_cls=PyPDFLoader
)

txt_loader = DirectoryLoader(
    path="docs",
    glob="*.txt",
    loader_cls=TextLoader
)

pdf_docs = pdf_loader.load()
txt_docs = txt_loader.load()

docs = pdf_docs + txt_docs

print(f"Loaded {len(docs)} documents")

for doc in docs:
    print(doc.metadata)
    print(doc.page_content)
    print("---")