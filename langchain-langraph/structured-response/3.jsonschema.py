from datetime import date as Date

from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

model = ChatGroq(
    model="openai/gpt-oss-20b"
)

prompt = """
Author: Alex Johnson
Date: January 4, 2026

Review:
I bought this gadget expecting a seamless experience, but the battery barely
holds a charge for half the advertised time. Furthermore, the buggy software
constantly crashes and disconnects, making the device practically unusable.
Save your money and look for a more reliable alternative, because this
overpriced product feels like an unfinished beta test.
"""


schema = {
    "title": "Review",
    "description": "Extract structured information from a product review.",
    "type": "object",
    "properties": {
        "key_themes": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "Write down all the key themes discussed in the review."
        },
        "sentiment": {
            "type": "string",
            "enum": ["pos", "neg"],
            "description": "Return the sentiment of the review."
        },
        "summary": {
            "type": "string",
            "description": "Write a brief summary of the review."
        },
        "name": {
            "type": "string",
            "description": "Extract the name of the reviewer."
        },
        "review_date": {
            "type": "string",
            "format": "date",
            "description": "Date when the review was written."
        },
        "author": {
            "type": "string",
            "description": "Extract the author of the review."
        }
    },
    "required": [
        "key_themes",
        "sentiment",
        "summary",
        "name",
        "review_date",
        "author"
    ],
    "additionalProperties": False
}


structured_output = model.with_structured_output(
    schema
)

response = structured_output.invoke(prompt)

print(response)