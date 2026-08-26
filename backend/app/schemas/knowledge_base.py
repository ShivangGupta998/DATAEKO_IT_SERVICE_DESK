from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class KnowledgeArticleBase(BaseModel):
    title: str
    content: str
    category: str
    is_published: Optional[bool] = True


class KnowledgeArticleCreate(KnowledgeArticleBase):
    pass


class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None


class KnowledgeArticleResponse(KnowledgeArticleBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)