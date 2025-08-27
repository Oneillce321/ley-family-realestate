import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/owners")
      .then(res => res.json())
      .then(data => setOwners(data));
  }, []);

  useEffect(() => {
    if (selectedOwner) {
      fetch(`http://localhost:8000/properties?owner_id=${selectedOwner}`)
        .then(res => res.json())
        .then(data => setProperties(data));
    } else {
      fetch("http://localhost:8000/properties")
        .then(res => res.json())
        .then(data => setProperties(data));
    }
  }, [selectedOwner]);

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
