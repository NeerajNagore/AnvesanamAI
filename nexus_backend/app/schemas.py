from typing import Literal

from pydantic import BaseModel, Field

Lang = Literal["en", "hi", "es", "fr", "de", "ja"]
IntegrationId = Literal["openai", "grok", "tavily", "newsapi", "weather"]


class Msg(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=12000)


class ChatRequest(BaseModel):
    messages: list[Msg] = Field(min_length=1, max_length=60)
    webSearch: bool = True
    language: Lang = "en"


class ResearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    depth: Literal["quick", "standard", "deep"] = "standard"
    maxSources: int = Field(default=8, ge=1, le=20)
    includeNews: bool = False
    language: Lang = "en"


class KeyBody(BaseModel):
    apiKey: str = Field(min_length=8, max_length=512)
