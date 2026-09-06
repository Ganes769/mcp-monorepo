import os
import time

from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import CharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

EMBED_DIM = 384
INDEX_NAME = os.environ.get("INDEX_NAME", "rag-gist-minilm")


def ensure_index(name: str, dimension: int) -> str:
    """Use an existing index only if its dimension matches; else create a MiniLM index."""
    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
    existing = {idx["name"]: idx for idx in pc.list_indexes()}

    if name in existing:
        info = pc.describe_index(name)
        if info.dimension == dimension:
            print(f"using index {name} (dim={info.dimension})")
            return name
        print(
            f"index {name} is dim={info.dimension}, need {dimension}; "
            f"creating companion index"
        )
        name = f"{name}-minilm" if not name.endswith("-minilm") else name

    if name not in {idx["name"] for idx in pc.list_indexes()}:
        print(f"creating Pinecone index {name} (dim={dimension})")
        pc.create_index(
            name=name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        while not pc.describe_index(name).status.get("ready"):
            time.sleep(1)
    else:
        info = pc.describe_index(name)
        if info.dimension != dimension:
            raise RuntimeError(
                f"Index {name} is dim={info.dimension}, expected {dimension}"
            )
    print(f"using index {name} (dim={dimension})")
    return name


loader = TextLoader("data.txt")
documents = loader.load()
print(f"loaded {len(documents)} document(s)")

print("splitting")
text_splitter = CharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    is_separator_regex=False,
)
texts = text_splitter.split_documents(documents=documents)
print(f"created {len(texts)} chunks")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
print(f"embedding model ready ({EMBED_DIM}-dim)")

index_name = ensure_index(INDEX_NAME, EMBED_DIM)

vectorstore = PineconeVectorStore.from_documents(
    texts,
    embeddings,
    index_name=index_name,
)
print(f"ingested into Pinecone index: {index_name}")
print(vectorstore)
