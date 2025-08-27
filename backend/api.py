from fastapi import FastAPI
from sqlalchemy import create_engine
import pandas as pd
import json
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#Have to set database URL
url = os.getenv("DATABASE_URL")
engine = create_engine(url)

@app.get("/owners")
def get_owners():
    df = pd.read_sql("SELECT * FROM owners;", engine)
    return df.to_dict(orient="records")

@app.get("/properties")
def get_properties(owner_id: int = None):
    if owner_id:
        query = """
        SELECT p.* 
        FROM properties p
        JOIN property_ownership po ON p."asset_#" = po.property_id
        WHERE po.owner_id = %s;
        """
        df = pd.read_sql(query, engine, params=(owner_id,))
    else:
        df = pd.read_sql("SELECT * FROM properties;", engine)

    # Convert safely to JSON-serializable object
    return json.loads(df.to_json(orient="records"))