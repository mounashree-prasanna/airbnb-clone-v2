  import { useEffect, useState } from "react";
  import axios from "axios";
  import Navbar from "../components/Navbar";

  export default function OwnerMyProperties() {
    const [items, setItems] = useState([]);
    const [edit, setEdit] = useState(null);
    const [msg, setMsg] = useState("");

    const load = async () => {
      setMsg("");
      try {
        const res = await axios.get("http://localhost:5000/api/properties/owner/me", {
          withCredentials: true,
        });
        setItems(res.data);
      } catch (err) {
        console.error(err);
        setMsg("Failed to load properties.");
      }
    };

    useEffect(() => { load(); }, []);

    const save = async (id, data) => {
      try {
        await axios.put(`http://localhost:5000/api/properties/owner/${id}`, data, { withCredentials: true });
        setEdit(null);
        load();
      } catch (err) {
        console.error(err);
        alert("Update failed");
      }
    };

    const remove = async (id) => {
      if (!confirm("Delete this property?")) return;
      try {
        await axios.delete(`http://localhost:5000/api/properties/owner/${id}`, { withCredentials: true });
        load();
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    };

    return (
      <div>
        <Navbar />
        <div className="p-6 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">My Properties</h2>
          {msg && <p className="text-rose-600 mb-3">{msg}</p>}
          {items.length === 0 ? (
            <p className="text-gray-500">No properties yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((p) => (
                <div key={p.id} className="border rounded-lg bg-white shadow p-3 space-y-2">
                  <img
                    src={p.photo_url || "https://picsum.photos/600/400"}
                    className="w-full h-40 object-cover rounded"
                    alt={p.title}
                  />
                  {edit === p.id ? (
                    <Editor initial={p} onCancel={() => setEdit(null)} onSave={(data)=>save(p.id, data)} />
                  ) : (
                    <>
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="text-gray-500 text-sm">{p.location}</p>
                      <p className="text-gray-700 text-sm">${p.price} / night</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setEdit(p.id)} className="flex-1 bg-amber-500 text-white py-1 rounded">Edit</button>
                        <button onClick={() => remove(p.id)} className="flex-1 bg-red-500 text-white py-1 rounded">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function Editor({ initial, onCancel, onSave }) {
    const [f, setF] = useState({ ...initial });
    const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

    return (
      <div className="space-y-2">
        <input className="border p-2 rounded w-full" name="title" value={f.title} onChange={onChange}/>
        <input className="border p-2 rounded w-full" name="location" value={f.location} onChange={onChange}/>
        <input className="border p-2 rounded w-full" name="price" value={f.price} onChange={onChange}/>
        <input className="border p-2 rounded w-full" name="amenities" value={f.amenities || ""} onChange={onChange}/>
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2 rounded w-full" name="bedrooms" value={f.bedrooms || ""} onChange={onChange}/>
          <input className="border p-2 rounded w-full" name="bathrooms" value={f.bathrooms || ""} onChange={onChange}/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2 rounded w-full" type="date" name="available_from" value={f.available_from || ""} onChange={onChange}/>
          <input className="border p-2 rounded w-full" type="date" name="available_to" value={f.available_to || ""} onChange={onChange}/>
        </div>
        <input className="border p-2 rounded w-full" name="photo_url" value={f.photo_url || ""} onChange={onChange}/>
        <div className="flex gap-2">
          <button onClick={() => onSave(f)} className="flex-1 bg-emerald-600 text-white py-1 rounded">Save</button>
          <button onClick={onCancel} className="flex-1 bg-gray-300 py-1 rounded">Cancel</button>
        </div>
      </div>
    );
  }
