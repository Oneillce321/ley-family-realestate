import React, { useEffect, useState} from "react";
import "./App.css";
 
function Properties() {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [properties, setProperties] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [editRowId, setEditRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [dropdownRowId, setDropdownRowId] = useState(null);
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
    management_notes: "",
    status: ""
    });
  
  const API_URL = process.env.REACT_APP_API_URL;

  // Fetch Owners
  useEffect(() => {
    fetch(`${API_URL}/owners`)
      .then(res => res.json())
      .then(data => setOwners(data));
  }, [API_URL]);


  // Fetch Properties
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


  // Handle Delete Property
   const handleDeleteProperty = (assetNum) => {

    // Confirm Deletion
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


  // Handle Add Property 
   const handleAddProperty = () => {

    const payload = { ...newProperty };

    // Convert empty strings to null
    Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
        payload[key] = null;
        }
    });

    // Set Next Asset Number
    const maxAssetNum = properties.reduce((max, prop) => {
        const num = parseInt(prop.asset_num, 10);
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

   const handleEditClick = (property) => {
    setEditRowId(property.asset_num); // Start editing this row
    setEditFormData({ ...property}); // Copy current values
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveClick = async () => {
    try {
      const res = await fetch(`${API_URL}/properties/${editRowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        // Update local state
        setProperties((prev) =>
          prev.map((p) =>
            p.asset_num === editRowId ? { ...p, ...editFormData } : p
          )
        );
        setRefresh(!refresh);
        setEditRowId(null); // Exit edit mode
      } else {
        alert("Failed to save changes");
      }
    } catch (err) {
      console.error("Error saving changes:", err);
    }
  };

  const handleCancelClick = () => {
    setEditRowId(null); // Exit edit mode without saving
  };

  const handleDropClick = (assetNum) => {
    if (assetNum === dropdownRowId){
      setDropdownRowId(null)
    }else {
      setDropdownRowId(assetNum)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Real Estate Properties</h1>

      {/* Owner Select Dropdown */}
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
      
      {/* Add Properties Inputs */}
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

      {/* Properties Table */}
      <table className="border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border p-2">Asset #</th>
            <th className="border p-2">Legal Description</th>
            <th className="border p-2">Location</th>
            <th className="border p-2">Owned By</th>
            <th className="border p-2">Management Notes</th>
            <th className="border p-2">Status</th>
          </tr>

        </thead>
        <tbody>
           {properties.map((prop) => (

             <React.Fragment>
              {/* Main Row */}
              <tr key={prop.asset_num}>
                <td className="border p-2">{prop.asset_num}</td>

                {editRowId === prop.asset_num ? (
                  <>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="legal_description"
                        value={editFormData.legal_description}
                        onChange={handleEditChange}
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="location"
                        value={editFormData.location}
                        onChange={handleEditChange}
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="owned_by"
                        value={editFormData.owned_by}
                        onChange={handleEditChange}
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="management_notes"
                        value={editFormData.management_notes}
                        onChange={handleEditChange}
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditChange}
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={handleSaveClick}
                        className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelClick}
                        className="bg-gray-400 text-white px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border p-2">{prop.legal_description}</td>
                    <td className="border p-2">{prop.location}</td>
                    <td className="border p-2">{prop.owned_by}</td>
                    <td className="border p-2">{prop.management_notes}</td>
                    <td className="border p-2">{prop.status}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleDropClick(prop.asset_num)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        {dropdownRowId === prop.asset_num ? "-" : "+"}
                      </button>
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleEditClick(prop)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                    </td>
                    <td className="border p-2">
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded"
                        onClick={() => handleDeleteProperty(prop.asset_num)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>

              {/* Expanded Row */}
              {dropdownRowId === prop.asset_num && (
                <tr>
                  <td colSpan="8" className="border p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <p><strong>Account #:</strong> {prop.account_number}</p>
                      <p><strong>Appraisal:</strong> {prop.current_appraisal}</p>
                      <p><strong>Square Footage:</strong> {prop.square_footage}</p>
                      <p><strong>Acres:</strong> {prop.acres}</p>
                      <p><strong>Total Acreage %:</strong> {prop.total_acreage_percent}</p>
                      <p><strong>Exemption:</strong> {prop.exemption}</p>
                      <p><strong>County:</strong> {prop.county}</p>
                      <p><strong>Name on Account:</strong> {prop.name_on_account}</p>
                      <p><strong>Mailing Address:</strong> {prop.mailing_address}</p>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Properties;