from fastapi import Header, HTTPException, status
from pydantic import BaseModel
from typing import Literal

class User(BaseModel):
    id: str
    email: str
    role: Literal["leader", "tester", "guest"]

def verify_role(required_role: Literal["leader", "tester", "guest"]):
    """
    FastAPI dependency to enforce RBAC.
    Expects an Authorization header. For development, a mock token (e.g., 'Bearer mock-leader-token') is parsed.
    """
    def dependency(authorization: str = Header(None)):
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header is required."
            )
        
        # Simpler parsing of mock token claims
        token = authorization.replace("Bearer ", "").strip()
        
        # Simulated User Claims parsing
        if "leader" in token:
            user = User(id="user-leader-1", email="carlos@pmopilot.com", role="leader")
        elif "tester" in token:
            user = User(id="user-tester-1", email="ana@pmopilot.com", role="tester")
        elif "guest" in token:
            user = User(id="user-guest-1", email="david@pmopilot.com", role="guest")
        else:
            # Default fallback for testing convenience
            user = User(id="user-default-1", email="guest@pmopilot.com", role="guest")

        if required_role == "leader" and user.role != "leader":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Role '{required_role}' required."
            )
        if required_role == "tester" and user.role not in ["leader", "tester"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Role '{required_role}' required."
            )
            
        return user
    return dependency
