from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import create_engine, text
import pandas as pd
import json
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

BASE_DIR = os.path.dirname(__file__)
dotenv_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI()
security = HTTPBasic()

SHARED_PASSWORD = os.getenv("APP_PASSWORD", "changeme")

url = os.getenv("DATABASE_URL")
engine = create_engine(url)

webpage = os.getenv("WEBPAGE_URL")


# Property class to match with database
class Property(BaseModel):
    asset_num: int
    legal_description: Optional[str] = None
    location: Optional[str] = None
    account_number: Optional[str] = None
    current_appraisal: Optional[float] = None
    square_footage: Optional[float] = None
    acres: Optional[float] = None
    total_acreage_percent: Optional[float] = None
    owned_by: Optional[str] = None
    exemption: Optional[str] = None
    county: Optional[str] = None
    name_on_account: Optional[str] = None
    mailing_address: Optional[str] = None
    management_notes: Optional[str] = None
    status: Optional[str] = None

# Check for correct password
def check_password(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.password != SHARED_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return True

app.add_middleware(
    CORSMiddleware,
    allow_origins=[webpage],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Login
@app.post("/login")
def login(auth: bool = Depends(check_password)):
    return {"message": "Login successful"}

# Delete
@app.delete("/properties/{asset_num}")
def delete_property(asset_num: int):
    with engine.begin() as conn:
        conn.execute(
            text("""DELETE FROM properties WHERE asset_num = :asset_num"""),
            {"asset_num": asset_num}

        )

        conn.execute(
            text("""DELETE FROM property_ownership WHERE property_id = :asset_num"""),
            {"asset_num": asset_num}
        )
    return {"message": f"Property {asset_num} deleted"}

# Get List of Owners
@app.get("/owners")
def get_owners():
    df = pd.read_sql("SELECT * FROM owners;", engine)
    return df.to_dict(orient="records")

# Get List of Properties
@app.get("/properties")
def get_properties(owner_id: int = None):
    if owner_id:
        query = """
        SELECT p.* 
        FROM properties p
        JOIN property_ownership po ON p.asset_num = po.property_id
        WHERE po.owner_id = %s
        ORDER BY p.asset_num;
        """
        df = pd.read_sql(query, engine, params=(owner_id,))
    else:
        df = pd.read_sql("SELECT * FROM properties ORDER BY asset_num;", engine)

    # Convert safely to JSON-serializable object
    return json.loads(df.to_json(orient="records"))

# Add New Property
@app.post("/properties")
def add_property(prop: Property):
    
    query = text("""
    INSERT INTO properties (
        asset_num, legal_description, location, account_number, current_appraisal,
        square_footage, acres, "%_of_total_acreage", owned_by, exemption,
        county, name_on_account, mailing_address, management_notes, status
    ) VALUES (
        :asset_num, :legal_description, :location, :account_number, :current_appraisal,
        :square_footage, :acres, :total_acreage_percent, :owned_by, :exemption,
        :county, :name_on_account, :mailing_address, :management_notes, :status
    ) RETURNING asset_num;
    """)

    with engine.begin() as conn:
        
        # Add Property to Database
        owners = ["JLA", "DLE", "SE", "JE", "KLO", "DWL", "RKL", "Wilson", "Ament"]
        result = conn.execute(query, prop.model_dump())
        new_prop_num = result.scalar()

        # Update Ownership Table
        for i, owner in enumerate(owners, start=1):
            if prop.owned_by and owner in prop.owned_by:
                conn.execute(
                    text("INSERT INTO property_ownership (property_id, owner_id) VALUES (:pid, :oid);"),
                    {"pid": new_prop_num, "oid": i}
                )
    return {"message": "Property added", "property_id": new_prop_num}

@app.put("/properties/{asset_num}")
def update_property(asset_num: int, prop: Property):
    with engine.begin() as conn:
        query = text("""
            UPDATE properties
            SET legal_description = :legal_description,
                location = :location,
                owned_by = :owned_by,
                management_notes = :management_notes,
                status = :status
            WHERE asset_num = :asset_num
            RETURNING *;
        """)
        result = conn.execute(query, {**prop.model_dump(), "asset_num": asset_num}).mappings().first()
    if not result:
        raise HTTPException(status_code=404, detail="Property not found")
    return result