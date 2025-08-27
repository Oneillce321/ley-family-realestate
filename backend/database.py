import pandas as pd
from sqlalchemy import create_engine
import os


# Load the Excel file and read the specified sheet
df = pd.read_excel("Schedule of Land with Owners.xlsx", sheet_name="Property List", skiprows=3, nrows=38)

# Clean up the DataFrame
df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

url = os.getenv("DATABASE_URL")
engine = create_engine(url)

print(df.info())

# Create properties table in Postgres
df.to_sql(
    "properties",          # table name in Postgres
    engine,
    if_exists="replace",   # "replace" drops and recreates
    index=False            # don’t upload pandas index as a column
)

result = pd.read_sql("SELECT * FROM properties;", engine)
print(result)

# Define the owner table structure
owners = ["JLA", "DLE", "SE", "JE", "KLO", "DWL", "RKL", "Wilson", "Ament"]
owner_table = []

for i, owner in enumerate(owners, start=1):
    owner_table.append({"owner_id": i, "owner_name": owner})

df_owners = pd.DataFrame(owner_table)

# Create owners table in Postgres
df_owners.to_sql(
    "owners",             # table name in Postgres
    engine,
    if_exists="replace",  # "replace" drops and recreates
    index=False           # don’t upload pandas index as a column
)

owners_result = pd.read_sql("SELECT * FROM owners;", engine)
print(owners_result)

# Define the property ownership table structure
ownership_table = []
curr_owners = ""
curr_asset = ""
df["owned_by"] = df["owned_by"].fillna("")  # Fill NaN with empty string for easier processing

# Iterate through each asset with owners
for i in range(len(df["owned_by"])):
    curr_owners = df["owned_by"].iloc[i]
    curr_asset = df["asset_#"].iloc[i]

    # Iterate through each owner and check if they are in the current asset's owners
    for j, owner in enumerate(owners, start=1):

        if owner in curr_owners:
            # If the owner is in the current asset's owners, add to ownership table
            ownership_table.append({"property_id": curr_asset, "owner_id": j})


# Create ownership table in Postgres
df_ownership = pd.DataFrame(ownership_table)
df_ownership.to_sql(
    "property_ownership",          # table name in Postgres
    engine,
    if_exists="replace",  # "replace" drops and recreates
    index=False           # don’t upload pandas index as a column
)

ownership_result = pd.read_sql("SELECT * FROM property_ownership;", engine)
print(ownership_result)
