"""
API endpoints for Leads Management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
import json

from src.app.database.connection import get_db
from src.app.database.models import User, Lead, LeadActivity, LeadReminder, Facility
from src.app.auth.dependencies import get_current_user

router = APIRouter(prefix="/leads", tags=["leads"])


# Pydantic models for request/response
class LeadCreate(BaseModel):
    """Request model for creating a lead."""
    facility_id: Optional[int] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = 0.0
    notes: Optional[str] = None
    tags: Optional[List[str]] = []


class LeadUpdate(BaseModel):
    """Request model for updating a lead."""
    status: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_position: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    estimated_value: Optional[float] = None
    probability: Optional[int] = None
    expected_close_date: Optional[date] = None
    next_followup_date: Optional[datetime] = None


class LeadResponse(BaseModel):
    """Response model for a lead."""
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    website: Optional[str]
    rating: float
    status: str
    contact_name: Optional[str]
    contact_phone: Optional[str]
    contact_email: Optional[str]
    contact_position: Optional[str]
    notes: Optional[str]
    tags: List[str]
    estimated_value: Optional[float]
    probability: int
    expected_close_date: Optional[date]
    next_followup_date: Optional[datetime]
    contact_count: int
    score: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ActivityCreate(BaseModel):
    """Request model for creating an activity."""
    activity_type: str  # call, email, meeting, note
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = None


class ActivityResponse(BaseModel):
    """Response model for an activity."""
    id: int
    activity_type: str
    title: str
    description: Optional[str]
    duration_minutes: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReminderCreate(BaseModel):
    """Request model for creating a reminder."""
    reminder_date: datetime
    reminder_type: str  # call, email, meeting, task
    title: str
    description: Optional[str] = None


class ReminderResponse(BaseModel):
    """Response model for a reminder."""
    id: int
    reminder_date: datetime
    reminder_type: str
    title: str
    description: Optional[str]
    is_completed: bool
    
    class Config:
        from_attributes = True


class LeadStats(BaseModel):
    """Dashboard statistics."""
    total_leads: int
    new_leads: int
    contacted_leads: int
    won_leads: int
    lost_leads: int
    total_value: float
    pipeline_value: float
    conversion_rate: float


# Helper function to calculate lead score
def calculate_lead_score(lead: Lead) -> int:
    """Calculate lead score (0-100) based on various factors."""
    score = 0
    
    # Rating quality (max 30 points)
    if lead.rating >= 4.5:
        score += 30
    elif lead.rating >= 4.0:
        score += 20
    elif lead.rating >= 3.5:
        score += 10
    
    # Contact completeness (max 20 points)
    if lead.phone:
        score += 5
    if lead.email:
        score += 5
    if lead.website:
        score += 5
    if lead.contact_name and lead.contact_position:
        score += 5
    
    # Engagement (max 25 points)
    if lead.contact_count > 0:
        score += min(lead.contact_count * 5, 15)
    if lead.status in ['qualified', 'proposal', 'negotiation']:
        score += 10
    
    # Deal potential (max 25 points)
    if lead.estimated_value:
        if lead.estimated_value > 100000:
            score += 25
        elif lead.estimated_value > 50000:
            score += 15
        elif lead.estimated_value > 10000:
            score += 10
    
    # Recency bonus (max 5 points)
    if lead.last_contact_date:
        days_since = (datetime.now() - lead.last_contact_date).days
        if days_since <= 3:
            score += 5
    
    return min(score, 100)


# API endpoints
@router.post("/", response_model=LeadResponse)
async def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new lead."""
    
    # Check if lead already exists (for facility-based leads)
    if lead_data.facility_id:
        existing = db.query(Lead).filter(
            Lead.user_id == current_user.id,
            Lead.facility_id == lead_data.facility_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This facility is already in your leads"
            )
    
    # Create lead
    lead = Lead(
        user_id=current_user.id,
        facility_id=lead_data.facility_id,
        name=lead_data.name,
        phone=lead_data.phone,
        email=lead_data.email,
        address=lead_data.address,
        website=lead_data.website,
        rating=lead_data.rating,
        notes=lead_data.notes,
        tags=json.dumps(lead_data.tags) if lead_data.tags else None,
        status="new",
        created_at=datetime.now()
    )
    
    # Calculate initial score
    lead.score = calculate_lead_score(lead)
    
    db.add(lead)
    db.commit()
    db.refresh(lead)
    
    # Log activity
    activity = LeadActivity(
        lead_id=lead.id,
        user_id=current_user.id,
        activity_type="created",
        title="Lead created",
        description=f"Added {lead.name} to leads",
        created_at=datetime.now()
    )
    db.add(activity)
    db.commit()
    
    # Parse tags for response
    lead.tags = json.loads(lead.tags) if lead.tags else []
    
    return lead


@router.get("/", response_model=List[LeadResponse])
async def get_leads(
    status_filter: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all leads for the current user."""
    
    query = db.query(Lead).filter(Lead.user_id == current_user.id)
    
    # Apply status filter
    if status_filter:
        query = query.filter(Lead.status == status_filter)
    
    # Order by score (highest first), then by created date (newest first)
    leads = query.order_by(Lead.score.desc(), Lead.created_at.desc()).offset(skip).limit(limit).all()
    
    # Parse tags for each lead
    for lead in leads:
        lead.tags = json.loads(lead.tags) if lead.tags else []
    
    return leads


@router.get("/stats", response_model=LeadStats)
async def get_lead_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics."""
    
    all_leads = db.query(Lead).filter(Lead.user_id == current_user.id).all()
    
    total_leads = len(all_leads)
    new_leads = len([l for l in all_leads if l.status == 'new'])
    contacted_leads = len([l for l in all_leads if l.status in ['contacted', 'qualified', 'proposal', 'negotiation']])
    won_leads = len([l for l in all_leads if l.status == 'won'])
    lost_leads = len([l for l in all_leads if l.status == 'lost'])
    
    total_value = sum([l.estimated_value for l in all_leads if l.status == 'won' and l.estimated_value])
    pipeline_value = sum([l.estimated_value for l in all_leads if l.status not in ['won', 'lost'] and l.estimated_value])
    
    conversion_rate = (won_leads / total_leads * 100) if total_leads > 0 else 0
    
    return LeadStats(
        total_leads=total_leads,
        new_leads=new_leads,
        contacted_leads=contacted_leads,
        won_leads=won_leads,
        lost_leads=lost_leads,
        total_value=total_value,
        pipeline_value=pipeline_value,
        conversion_rate=round(conversion_rate, 1)
    )


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific lead."""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Parse tags
    lead.tags = json.loads(lead.tags) if lead.tags else []
    
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a lead."""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Track changes for activity log
    changes = []
    old_status = lead.status
    
    # Update fields
    if lead_data.status is not None and lead_data.status != lead.status:
        changes.append(f"Status changed from {lead.status} to {lead_data.status}")
        lead.status = lead_data.status
        
        # Update contact dates
        if lead_data.status == 'contacted' and not lead.first_contact_date:
            lead.first_contact_date = datetime.now()
        lead.last_contact_date = datetime.now()
        lead.contact_count += 1
    
    if lead_data.contact_name is not None:
        lead.contact_name = lead_data.contact_name
    if lead_data.contact_phone is not None:
        lead.contact_phone = lead_data.contact_phone
    if lead_data.contact_email is not None:
        lead.contact_email = lead_data.contact_email
    if lead_data.contact_position is not None:
        lead.contact_position = lead_data.contact_position
    if lead_data.notes is not None:
        lead.notes = lead_data.notes
    if lead_data.tags is not None:
        lead.tags = json.dumps(lead_data.tags)
    if lead_data.estimated_value is not None:
        if lead.estimated_value != lead_data.estimated_value:
            changes.append(f"Value changed to ${lead_data.estimated_value}")
        lead.estimated_value = lead_data.estimated_value
    if lead_data.probability is not None:
        lead.probability = lead_data.probability
    if lead_data.expected_close_date is not None:
        lead.expected_close_date = lead_data.expected_close_date
    if lead_data.next_followup_date is not None:
        lead.next_followup_date = lead_data.next_followup_date
    
    lead.updated_at = datetime.now()
    
    # Recalculate score
    lead.score = calculate_lead_score(lead)
    
    db.commit()
    db.refresh(lead)
    
    # Log activity if status changed
    if changes:
        activity = LeadActivity(
            lead_id=lead.id,
            user_id=current_user.id,
            activity_type="status_change" if old_status != lead.status else "value_change",
            title="Lead updated",
            description="; ".join(changes),
            created_at=datetime.now()
        )
        db.add(activity)
        db.commit()
    
    # Parse tags
    lead.tags = json.loads(lead.tags) if lead.tags else []
    
    return lead


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a lead."""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    db.delete(lead)
    db.commit()
    
    return {"success": True, "message": "Lead deleted successfully"}


# Activity endpoints
@router.post("/{lead_id}/activities", response_model=ActivityResponse)
async def create_activity(
    lead_id: int,
    activity_data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log an activity for a lead."""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    activity = LeadActivity(
        lead_id=lead_id,
        user_id=current_user.id,
        activity_type=activity_data.activity_type,
        title=activity_data.title,
        description=activity_data.description,
        duration_minutes=activity_data.duration_minutes,
        created_at=datetime.now()
    )
    
    db.add(activity)
    
    # Update lead contact tracking
    lead.last_contact_date = datetime.now()
    lead.contact_count += 1
    if not lead.first_contact_date:
        lead.first_contact_date = datetime.now()
    
    db.commit()
    db.refresh(activity)
    
    return activity


@router.get("/{lead_id}/activities", response_model=List[ActivityResponse])
async def get_activities(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all activities for a lead."""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    activities = db.query(LeadActivity).filter(
        LeadActivity.lead_id == lead_id
    ).order_by(LeadActivity.created_at.desc()).all()
    
    return activities


# Reminder endpoints
@router.post("/{lead_id}/reminders", response_model=ReminderResponse)
async def create_reminder(
    lead_id: int,
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a reminder for a lead."""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    reminder = LeadReminder(
        lead_id=lead_id,
        user_id=current_user.id,
        reminder_date=reminder_data.reminder_date,
        reminder_type=reminder_data.reminder_type,
        title=reminder_data.title,
        description=reminder_data.description,
        created_at=datetime.now()
    )
    
    db.add(reminder)
    
    # Update lead next followup date
    lead.next_followup_date = reminder_data.reminder_date
    
    db.commit()
    db.refresh(reminder)
    
    return reminder


@router.get("/reminders/upcoming", response_model=List[ReminderResponse])
async def get_upcoming_reminders(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get upcoming reminders."""
    
    from datetime import timedelta
    end_date = datetime.now() + timedelta(days=days)
    
    reminders = db.query(LeadReminder).filter(
        LeadReminder.user_id == current_user.id,
        LeadReminder.is_completed == False,
        LeadReminder.reminder_date <= end_date
    ).order_by(LeadReminder.reminder_date.asc()).all()
    
    return reminders

