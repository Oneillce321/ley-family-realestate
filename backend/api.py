from fastapi import FastAPI
from sqlalchemy import create_engine
import pandas as pd
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine("postgresql://postgres:Yofoj4%40321@localhost:5432/real_estate")

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