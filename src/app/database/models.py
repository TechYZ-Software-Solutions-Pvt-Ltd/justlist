"""
Database models for Facility Finder.
Defines all database tables and relationships.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .connection import Base


class User(Base):
    """User model for authentication and user management."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    search_history = relationship("SearchHistory", back_populates="user")
    api_keys = relationship("UserAPIKey", back_populates="user")
    leads = relationship("Lead", back_populates="user", cascade="all, delete-orphan")


class UserAPIKey(Base):
    """User API keys for Google Places API."""
    __tablename__ = "user_api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    api_key = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="api_keys")


class SearchHistory(Base):
    """Search history for users."""
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for anonymous users
    place_type = Column(String(255), nullable=False)
    city = Column(String(255), nullable=False)
    country = Column(String(255), nullable=False)
    max_results = Column(Integer, default=20)
    results_count = Column(Integer, default=0)
    search_query = Column(Text, nullable=False)  # Full query string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="search_history")
    facilities = relationship("Facility", back_populates="search")


class Facility(Base):
    """Facility model for storing search results."""
    __tablename__ = "facilities"
    
    id = Column(Integer, primary_key=True, index=True)
    search_id = Column(Integer, ForeignKey("search_history.id"), nullable=False)
    name = Column(String(255), nullable=False)
    contact_number = Column(String(50), nullable=True)
    whatsapp_number = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    established_year = Column(String(10), nullable=True)
    location = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    google_rating = Column(Float, default=0.0)
    instagram_id = Column(String(255), nullable=True)
    website = Column(String(500), nullable=True)
    place_id = Column(String(255), unique=True, index=True, nullable=True)
    
    # Google Places API additional fields
    formatted_address = Column(Text, nullable=True)
    international_phone_number = Column(String(50), nullable=True)
    formatted_phone_number = Column(String(50), nullable=True)
    url = Column(String(500), nullable=True)
    user_ratings_total = Column(Integer, default=0)
    price_level = Column(Integer, default=0)
    business_status = Column(String(100), nullable=True)
    types = Column(Text, nullable=True)  # JSON string of business types
    vicinity = Column(String(255), nullable=True)
    plus_code = Column(String(50), nullable=True)
    geometry = Column(Text, nullable=True)  # JSON string of coordinates
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    search = relationship("SearchHistory", back_populates="facilities")
    leads = relationship("Lead", back_populates="facility")


class Lead(Base):
    """Lead model for tracking sales opportunities."""
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)  # Nullable for manual leads
    
    # Facility info (denormalized for manual leads)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)
    rating = Column(Float, default=0.0)
    
    # Lead status workflow
    status = Column(String(50), default="new", index=True)
    # Statuses: new, contacted, qualified, proposal, negotiation, won, lost
    
    # Contact person details
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_position = Column(String(100), nullable=True)
    
    # Lead details
    notes = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)  # JSON array: ["hot-lead", "decision-maker"]
    
    # Deal information
    estimated_value = Column(Float, nullable=True)
    probability = Column(Integer, default=0)  # 0-100%
    expected_close_date = Column(Date, nullable=True)
    
    # Outreach tracking
    first_contact_date = Column(DateTime, nullable=True)
    last_contact_date = Column(DateTime, nullable=True, index=True)
    next_followup_date = Column(DateTime, nullable=True, index=True)
    contact_count = Column(Integer, default=0)
    
    # Lead scoring
    score = Column(Integer, default=0)  # 0-100 (auto-calculated)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="leads")
    facility = relationship("Facility", back_populates="leads")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")
    reminders = relationship("LeadReminder", back_populates="lead", cascade="all, delete-orphan")


class LeadActivity(Base):
    """Activity log for leads (calls, emails, notes, etc)."""
    __tablename__ = "lead_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Activity type
    activity_type = Column(String(50), nullable=False)
    # Types: call, email, meeting, note, status_change, value_change, created
    
    # Activity details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # For calls/meetings
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    lead = relationship("Lead", back_populates="activities")
    user = relationship("User")


class LeadReminder(Base):
    """Reminders for lead follow-ups."""
    __tablename__ = "lead_reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Reminder details
    reminder_date = Column(DateTime, nullable=False, index=True)
    reminder_type = Column(String(50), nullable=False)  # call, email, meeting, task
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Notification preferences
    notify_email = Column(Boolean, default=True)
    notify_push = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    lead = relationship("Lead", back_populates="reminders")
    user = relationship("User")


class SystemConfig(Base):
    """System configuration settings."""
    __tablename__ = "system_config"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
