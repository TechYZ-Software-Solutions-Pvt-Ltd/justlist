"""
Simplified Facility search API endpoints.
Basic version without complex dependencies.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import time
import logging
import json
from dataclasses import asdict

from src.app.database.connection import get_db
from src.app.database.models import User, SearchHistory, Facility
from src.app.auth.dependencies import get_current_user, get_optional_user
from pydantic import BaseModel
from src.app.services.places_service import PlacesService
from src.app.models.facility import SearchQuery

router = APIRouter(prefix="/facilities", tags=["facilities"])


class FacilitySearchRequest(BaseModel):
    """Facility search request model."""
    api_key: str
    place_type: str
    city: str
    country: str
    max_results: int = 20


class FacilityResponse(BaseModel):
    """Facility response model."""
    id: int
    name: str
    contact_number: Optional[str]
    address: Optional[str]
    google_rating: float
    website: Optional[str]
    place_id: Optional[str]
    created_at: datetime


class SearchHistoryResponse(BaseModel):
    """Search history response model."""
    id: int
    place_type: str
    city: str
    country: str
    max_results: int
    results_count: int
    search_query: str
    created_at: datetime


@router.post("/search")
async def search_facilities(
    search_request: FacilitySearchRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """Search facilities. Saves history if user is authenticated."""
    logger = logging.getLogger("facility_finder")
    t0 = time.time()
    
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    # Handle proxy headers (X-Forwarded-For, X-Real-IP)
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
    elif "x-real-ip" in request.headers:
        client_ip = request.headers["x-real-ip"].strip()
    
    logger.info(f"facilities.search:start user=anon ip={client_ip} city={search_request.city} type={search_request.place_type} max={search_request.max_results}")
    query = SearchQuery(
        place_type=search_request.place_type,
        city=search_request.city,
        country=search_request.country,
        max_results=search_request.max_results,
    )

    ok, msg = query.validate()
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    try:
        service = PlacesService(api_key=search_request.api_key, client_id=client_ip)
        result = service.search_places(query)
    except HTTPException as e:
        # Re-raise HTTP exceptions from Places service
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during search: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

    # Save search history for authenticated users
    if current_user:
        try:
            search_history = SearchHistory(
                user_id=current_user.id,
                place_type=search_request.place_type,
                city=search_request.city,
                country=search_request.country,
                max_results=search_request.max_results,
                results_count=result.total_found,
                search_query=f"{search_request.place_type} in {search_request.city}, {search_request.country}",
                created_at=datetime.now()
            )
            db.add(search_history)
            db.commit()
            db.refresh(search_history)
            
            # Clean up old search history (keep only latest 30)
            user_history_count = db.query(SearchHistory).filter(SearchHistory.user_id == current_user.id).count()
            if user_history_count > 30:
                # Delete oldest entries beyond 30
                oldest_entries = db.query(SearchHistory).filter(
                    SearchHistory.user_id == current_user.id
                ).order_by(SearchHistory.created_at.asc()).limit(user_history_count - 30).all()
                
                for entry in oldest_entries:
                    db.delete(entry)
                db.commit()
                logger.info(f"facilities.search:history_cleanup user={current_user.username} deleted {len(oldest_entries)} old entries")
            
            # Store the facilities for this search (simplified for now)
            if result.facilities:
                for facility_data in result.facilities:
                    facility = Facility(
                        search_id=search_history.id,
                        name=facility_data.name,
                        contact_number=facility_data.contact_number or "",
                        whatsapp_number=facility_data.whatsapp_number or "",
                        email=facility_data.email or "",
                        established_year=facility_data.established_year or "",
                        location=facility_data.location or "",
                        address=facility_data.address or "",
                        google_rating=facility_data.google_rating or 0.0,
                        instagram_id=facility_data.instagram_id or "",
                        website=facility_data.website or "",
                        place_id=facility_data.place_id or "",
                        formatted_address=facility_data.formatted_address or "",
                        international_phone_number=facility_data.international_phone_number or "",
                        formatted_phone_number=facility_data.formatted_phone_number or "",
                        url=facility_data.url or "",
                        user_ratings_total=facility_data.user_ratings_total or 0,
                        price_level=facility_data.price_level or 0,
                        business_status=facility_data.business_status or "",
                        types=json.dumps(facility_data.types) if facility_data.types else None,
                        vicinity=facility_data.vicinity or "",
                        plus_code=facility_data.plus_code or "",
                        geometry=json.dumps(facility_data.geometry) if facility_data.geometry else None,
                        created_at=datetime.now()
                    )
                    db.add(facility)
                
                db.commit()
                logger.info(f"facilities.search:facilities_saved count={len(result.facilities)} search_id={search_history.id}")
            
            logger.info(f"facilities.search:history_saved id={search_history.id} user={current_user.username}")
        except Exception as e:
            logger.error(f"facilities.search:history_save_failed user={current_user.username} error={e}")
            # Don't fail the search if history saving fails

    # Serialize dataclasses to plain dicts
    payload = asdict(result)
    # Convert timestamp to isoformat string for frontend
    if isinstance(payload.get("timestamp"), (int, float)):
        from datetime import datetime as _dt
        payload["timestamp"] = _dt.fromtimestamp(payload["timestamp"]).isoformat()
    elif hasattr(result.timestamp, "isoformat"):
        payload["timestamp"] = result.timestamp.isoformat()

    duration_ms = int((time.time() - t0) * 1000)
    logger.info(f"facilities.search:done duration_ms={duration_ms} total_found={payload.get('total_found')}")
    return payload


@router.get("/history", response_model=List[SearchHistoryResponse])
async def get_search_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's search history."""
    search_history = db.query(SearchHistory).filter(
        SearchHistory.user_id == current_user.id
    ).order_by(SearchHistory.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        SearchHistoryResponse(
            id=search.id,
            place_type=search.place_type,
            city=search.city,
            country=search.country,
            max_results=search.max_results,
            results_count=search.results_count,
            search_query=search.search_query,
            created_at=search.created_at
        ) for search in search_history
    ]


@router.get("/history/{search_id}/facilities", response_model=List[FacilityResponse])
async def get_search_history_facilities(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get facilities for a specific search history entry."""
    # Verify the search history belongs to the user
    search = db.query(SearchHistory).filter(
        SearchHistory.id == search_id,
        SearchHistory.user_id == current_user.id
    ).first()
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search history not found"
        )
    
    # Get facilities for this search
    facilities = db.query(Facility).filter(
        Facility.search_id == search_id
    ).all()
    
    return [
        FacilityResponse(
            id=facility.id,
            name=facility.name,
            contact_number=facility.contact_number,
            address=facility.address,
            google_rating=facility.google_rating,
            website=facility.website,
            place_id=facility.place_id,
            created_at=facility.created_at
        ) for facility in facilities
    ]


@router.delete("/history/{search_id}")
async def delete_search_history(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a search history entry."""
    search = db.query(SearchHistory).filter(
        SearchHistory.id == search_id,
        SearchHistory.user_id == current_user.id
    ).first()
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search history not found"
        )
    
    # Delete associated facilities
    db.query(Facility).filter(Facility.search_id == search_id).delete()
    
    # Delete search history
    db.delete(search)
    db.commit()
    
    return {"message": "Search history deleted successfully"}
