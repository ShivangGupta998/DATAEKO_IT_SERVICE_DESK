from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.database import get_db
from app.models.knowledge_base import KnowledgeArticle
from app.models.user import User
from app.schemas.knowledge_base import (
    KnowledgeArticleCreate,
    KnowledgeArticleUpdate,
    KnowledgeArticleResponse,
)
from app.core.dependencies import get_current_user, require_roles

# ============================================================
# ROUTER DEFINITION
# ============================================================

router = APIRouter(
    prefix="/knowledge-base",
    tags=["Knowledge Base"]
)

# Role Constants
ADMIN = 1
MANAGER = 2
TECHNICIAN = 3
EMPLOYEE = 4


# ============================================================
# SEARCH ARTICLES
# ============================================================

@router.get("/search", response_model=List[KnowledgeArticleResponse])
def search_articles(
    q: Optional[str] = Query(None, description="Search query string"),
    category: Optional[str] = Query(None, description="Filter by article category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(KnowledgeArticle)

    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                KnowledgeArticle.title.ilike(search_pattern),
                KnowledgeArticle.content.ilike(search_pattern),
                KnowledgeArticle.category.ilike(search_pattern)
            )
        )

    if category:
        query = query.filter(KnowledgeArticle.category.ilike(f"%{category}%"))

    return query.order_by(KnowledgeArticle.created_at.desc()).all()


# ============================================================
# CREATE ARTICLE
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.post(
    "",
    response_model=KnowledgeArticleResponse,
    status_code=status.HTTP_201_CREATED
)
@router.post(
    "/",
    response_model=KnowledgeArticleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_article(
    article_data: KnowledgeArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN, MANAGER, TECHNICIAN))
):
    article = KnowledgeArticle(
        title=article_data.title,
        content=article_data.content,
        category=article_data.category,
        is_published=article_data.is_published if article_data.is_published is not None else True,
        created_by=current_user.id
    )

    db.add(article)
    db.commit()
    db.refresh(article)
    return article


# ============================================================
# GET ALL ARTICLES
# ============================================================

@router.get("", response_model=List[KnowledgeArticleResponse])
@router.get("/", response_model=List[KnowledgeArticleResponse])
def get_articles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(KnowledgeArticle)
    return query.order_by(KnowledgeArticle.created_at.desc()).all()


# ============================================================
# GET SINGLE ARTICLE
# ============================================================

@router.get("/{article_id}", response_model=KnowledgeArticleResponse)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=404,
            detail="Knowledge base article not found"
        )

    return article


# ============================================================
# UPDATE ARTICLE
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.patch("/{article_id}", response_model=KnowledgeArticleResponse)
def update_article(
    article_id: int,
    article_data: KnowledgeArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN, MANAGER, TECHNICIAN))
):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=404,
            detail="Knowledge base article not found"
        )

    if article_data.title is not None:
        article.title = article_data.title
    if article_data.content is not None:
        article.content = article_data.content
    if article_data.category is not None:
        article.category = article_data.category
    if article_data.is_published is not None:
        article.is_published = article_data.is_published

    db.commit()
    db.refresh(article)
    return article


# ============================================================
# DELETE ARTICLE
# ADMIN / MANAGER
# ============================================================

@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN, MANAGER))
):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=404,
            detail="Knowledge base article not found"
        )

    db.delete(article)
    db.commit()
    return None