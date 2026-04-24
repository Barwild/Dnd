import string
import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def gen_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.post("", response_model=schemas.CampaignResponse)
def create_campaign(data: schemas.CampaignCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    """Crear una nueva campaña (solo DMs, pero jugadores también pueden)."""
    code = gen_code()
    while db.query(models.Campaign).filter(models.Campaign.code == code).first():
        code = gen_code()
    
    campaign = models.Campaign(
        name=data.name.strip(),
        code=code,
        description=data.description,
        dm_user_id=current_user.id
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    # DM is automatically a member
    member = models.CampaignMember(campaign_id=campaign.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    
    return _campaign_response(campaign, db)


@router.get("", response_model=List[schemas.CampaignResponse])
def get_my_campaigns(db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    """Obtener campañas del usuario (como DM o como miembro)."""
    # Campaigns where user is DM
    dm_campaigns = db.query(models.Campaign).filter(
        models.Campaign.dm_user_id == current_user.id
    ).all()
    
    # Campaigns where user is a member
    member_campaign_ids = [m.campaign_id for m in 
        db.query(models.CampaignMember).filter(
            models.CampaignMember.user_id == current_user.id
        ).all()
    ]
    member_campaigns = db.query(models.Campaign).filter(
        models.Campaign.id.in_(member_campaign_ids),
        models.Campaign.dm_user_id != current_user.id
    ).all()
    
    all_campaigns = dm_campaigns + member_campaigns
    return [_campaign_response(c, db) for c in all_campaigns]


@router.get("/{campaign_id}", response_model=schemas.CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    return _campaign_response(campaign, db)


@router.post("/join", response_model=schemas.CampaignResponse)
def join_campaign(data: schemas.CampaignJoin, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    """Unirse a una campaña por código."""
    campaign = db.query(models.Campaign).filter(
        models.Campaign.code == data.code.upper().strip()
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada. Revisa el código.")
    
    # Check if already a member
    existing = db.query(models.CampaignMember).filter(
        models.CampaignMember.campaign_id == campaign.id,
        models.CampaignMember.user_id == current_user.id
    ).first()
    if not existing:
        member = models.CampaignMember(campaign_id=campaign.id, user_id=current_user.id)
        db.add(member)
        db.commit()
    
    return _campaign_response(campaign, db)


@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    if campaign.dm_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el DM puede eliminar la campaña")
    db.delete(campaign)
    db.commit()
    return {"message": "Campaña eliminada"}


@router.post("/{campaign_id}/leave")
def leave_campaign(campaign_id: int, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    """Salir de una campaña."""
    member = db.query(models.CampaignMember).filter(
        models.CampaignMember.campaign_id == campaign_id,
        models.CampaignMember.user_id == current_user.id
    ).first()
    if member:
        db.delete(member)
        db.commit()
    return {"message": "Has salido de la campaña"}


def _campaign_response(campaign, db):
    member_count = db.query(models.CampaignMember).filter(
        models.CampaignMember.campaign_id == campaign.id
    ).count()
    dm = db.query(models.User).filter(models.User.id == campaign.dm_user_id).first()
    return schemas.CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        code=campaign.code,
        description=campaign.description or "",
        dm_user_id=campaign.dm_user_id,
        created_at=campaign.created_at,
        member_count=member_count,
        dm_name=dm.display_name if dm else ""
    )
