import { useEffect, useState } from "react";
import "./App.css";

function Properties() {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [properties, setProperties] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [newProperty, setNewProperty] = useState({
    asset_num: null,
    legal_description: "",
    location: "",
    account_number: "",
    current_appraisal: "",
    square_footage: "",
    acres: "",
    total_acreage_percent: "",
    owned_by: "",
    exemption: "",
    county: "",
    name_on_account: "",
    mailing_address: "",
    managment_notes: "",
    status: ""
    });
  
  const API_URL = process.env.REACT_APP_API_URL;

  // FETCH OWNERS AND PROPERTIES
  useEffect(() => {
    fetch(`${API_URL}/owners`)
      .then(res => res.json())
      .then(data => setOwners(data));
  }, [API_URL]);

  useEffect(() => {
    if (selectedOwner) {
      fetch(`${API_URL}/properties?owner_id=${selectedOwner}`)
        .then(res => res.json())
        .then(data => setProperties(data));
    } else {
      fetch(`${API_URL}/properties`)
        .then(res => res.json())
        .then(data => setProperties(data));
    }
  }, [selectedOwner, refresh, API_URL]);

  // HANDLE DELETE PROPERTY
   const handleDeleteProperty = (assetNum) => {
      const confirmDelete = window.confirm(
      `Are you sure you want to delete property #${assetNum}?`
    );

    if (!confirmDelete) return;

    fetch(`${API_URL}/properties/${parseInt(assetNum, 10)}`, {
      method: "DELETE",
    })
      .then(res => {
        if (res.ok) {
          setRefresh(!refresh); // trigger refresh if needed
        } else {
          alert(`Failed to delete property with Asset #${assetNum}`);
        }
      });
  };


  // HANDLE ADD PROPERTY
   const handleAddProperty = () => {

    const payload = { ...newProperty };

    // Convert empty strings to null
    Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
        payload[key] = null;
        }
    });

    const maxAssetNum = properties.reduce((max, prop) => {
        const num = parseInt(prop["asset_#"], 10);
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    payload["asset_num"] = maxAssetNum + 1;

    // Convert number-like fields
    ["acres", "square_footage", "current_appraisal", "total_acreage_percent"].forEach(field => {
        if (payload[field] !== null) {
        payload[field] = parseFloat(payload[field]);
        }
    });

    fetch(`${API_URL}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
            alert(data.error);
        } else{
            setRefresh(!refresh); // trigger refresh if needed
        }
        setNewProperty({
            asset_num: null,
            legal_description: "",
            location: "",
            account_number: "",
            current_appraisal: "",
            square_footage: "",
            acres: "",
            total_acreage_percent: "",
            owned_by: "",
            exemption: "",
            county: "",
            name_on_account: "",
            mailing_address: "",
            management_notes: "",
            status: ""
        }); // reset form
      });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Real Estate Properties</h1>
    
      <select
        className="border p-2 mb-4"
        value={selectedOwner}
        onChange={(e) => setSelectedOwner(e.target.value)}
      >
        <option value="">Select an Owner</option>
        {owners.map((owner) => (
          <option key={owner.owner_id} value={owner.owner_id}>
            {owner.owner_name}
          </option>
        ))}
      </select>

      <div className="mb-4 p-4 border rounded bg-gray-100">
        <h2 className="font-semibold mb-2">Add New Property</h2>
        {Object.keys(newProperty).map((field) => (
            
        field === "asset_num" ? null :
          <input
            key={field}
            className="border p-2 m-1"
            placeholder={field}
            value={newProperty[field]}
            onChange={(e) =>
              setNewProperty({ ...newProperty, [field]: e.target.value })
            }
          />
        ))}
        <button
          className="bg-blue-500 text-white p-2 rounded ml-2"
          onClick={handleAddProperty}
        >
          Add Property
        </button>
      </div>

      <table className="border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border p-2">Asset #</th>
            <th className="border p-2">Legal Description</th>
            <th className="border p-2">Location</th>
            <th className="border p-2">Account Number</th>
            <th className="border p-2">Acres</th>
            <th className="border p-2">Owned By</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop, idx) => (
            <tr key={idx}>
              <td className="border p-2">{prop["asset_#"]}</td>
              <td className="border p-2">{prop.legal_description}</td>
              <td className="border p-2">{prop.location}</td>
              <td className="border p-2">{prop.account_number}</td>
              <td className="border p-2">{prop.acres}</td>
              <td className="border p-2">{prop.owned_by}</td>

              <td className="border p-2">
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => handleDeleteProperty(prop["asset_#"])}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Properties;