from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


# ============================================================
# CREATE KNOWLEDGE ARTICLE
# ============================================================

class KnowledgeArticleCreate(BaseModel):
    title: str
    content: str
    category: str
    is_published: bool = True  # FIX: Default to True so articles show up immediately
    tags: Optional[Any] = None


# ============================================================
# UPDATE KNOWLEDGE ARTICLE
# ============================================================

class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None
    tags: Optional[Any] = None


# ============================================================
# AUTHOR RESPONSE SCHEMA
# ============================================================

class AuthorResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# RESPONSE
# ============================================================

class KnowledgeArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    created_by: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[AuthorResponse] = None

    model_config = ConfigDict(from_attributes=True)