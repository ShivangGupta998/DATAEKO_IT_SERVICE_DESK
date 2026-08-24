from typing import List
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query
)
from sqlalchemy.orm import Session, joinedload

from app.database.database import get_db
from app.models.knowledge_base import KnowledgeArticle
from app.models.user import User
from app.schemas.knowledge_base import (
    KnowledgeArticleCreate,
    KnowledgeArticleResponse,
    KnowledgeArticleUpdate
)
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/knowledge-base",
    tags=["Knowledge Base"]
)


def get_user_id(user_obj) -> int:
    """Safely extracts user ID whether current_user is a dict or User ORM object."""
    if isinstance(user_obj, dict):
        return user_obj.get("user_id") or user_obj.get("id")
    return getattr(user_obj, "id", None)


def get_role_id(user_obj) -> int:
    """Safely extracts role ID whether current_user is a dict or User ORM object."""
    if isinstance(user_obj, dict):
        return user_obj.get("role_id")
    return getattr(user_obj, "role_id", None)


def require_staff_role(current_user=Depends(get_current_user)):
    # Role IDs: 1 = Admin, 2 = Manager, 3 = Technician
    role_id = get_role_id(current_user)

    if role_id not in [1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )

    return current_user


# ============================================================
# CREATE KNOWLEDGE ARTICLE
# ============================================================

@router.post(
    "",
    response_model=KnowledgeArticleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_article(
    article_data: KnowledgeArticleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    current_user_id = get_user_id(current_user)
    user = db.query(User).filter(User.id == current_user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Force is_published to True if not explicitly provided
    is_pub = article_data.is_published if article_data.is_published is not None else True

    article = KnowledgeArticle(
        title=article_data.title,
        content=article_data.content,
        category=article_data.category,
        created_by=user.id,
        is_published=is_pub
    )

    db.add(article)
    db.commit()
    db.refresh(article)

    return article


# ============================================================
# GET ALL PUBLISHED ARTICLES
# ============================================================

@router.get(
    "",
    response_model=List[KnowledgeArticleResponse]
)
def get_all_articles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    articles = (
        db.query(KnowledgeArticle)
        .options(joinedload(KnowledgeArticle.author))
        .filter(KnowledgeArticle.is_published == True)
        .order_by(KnowledgeArticle.created_at.desc())
        .all()
    )

    return articles


# ============================================================
# GET MY CREATED ARTICLES
# ============================================================

@router.get(
    "/my",
    response_model=List[KnowledgeArticleResponse]
)
def get_my_articles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    current_user_id = get_user_id(current_user)
    articles = (
        db.query(KnowledgeArticle)
        .options(joinedload(KnowledgeArticle.author))
        .filter(KnowledgeArticle.created_by == current_user_id)
        .order_by(KnowledgeArticle.created_at.desc())
        .all()
    )

    return articles


# ============================================================
# SEARCH KNOWLEDGE ARTICLES
# ============================================================

@router.get(
    "/search",
    response_model=List[KnowledgeArticleResponse]
)
def search_articles(
    keyword: str = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    articles = (
        db.query(KnowledgeArticle)
        .options(joinedload(KnowledgeArticle.author))
        .filter(
            KnowledgeArticle.is_published == True,
            (
                KnowledgeArticle.title.ilike(f"%{keyword}%")
                | KnowledgeArticle.content.ilike(f"%{keyword}%")
                | KnowledgeArticle.category.ilike(f"%{keyword}%")
            )
        )
        .all()
    )

    return articles


# ============================================================
# GET SINGLE ARTICLE
# ============================================================

@router.get(
    "/{article_id}",
    response_model=KnowledgeArticleResponse
)
def get_single_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    article = (
        db.query(KnowledgeArticle)
        .options(joinedload(KnowledgeArticle.author))
        .filter(KnowledgeArticle.id == article_id)
        .first()
    )

    if not article:
        raise HTTPException(
            status_code=404,
            detail="Article not found"
        )

    return article


# ============================================================
# UPDATE KNOWLEDGE ARTICLE
# ============================================================

@router.patch(
    "/{article_id}",
    response_model=KnowledgeArticleResponse
)
def update_article(
    article_id: int,
    update_data: KnowledgeArticleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    article = (
        db.query(KnowledgeArticle)
        .filter(KnowledgeArticle.id == article_id)
        .first()
    )

    if not article:
        raise HTTPException(
            status_code=404,
            detail="Article not found"
        )

    if update_data.title is not None:
        article.title = update_data.title

    if update_data.content is not None:
        article.content = update_data.content

    if update_data.category is not None:
        article.category = update_data.category

    if update_data.is_published is not None:
        article.is_published = update_data.is_published

    db.commit()
    db.refresh(article)

    return article


# ============================================================
# DELETE KNOWLEDGE ARTICLE
# ============================================================

@router.delete(
    "/{article_id}"
)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    article = (
        db.query(KnowledgeArticle)
        .filter(KnowledgeArticle.id == article_id)
        .first()
    )

    if not article:
        raise HTTPException(
            status_code=404,
            detail="Article not found"
        )

    db.delete(article)
    db.commit()

    return {
        "message": "Article deleted successfully"
    }