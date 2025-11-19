  import { useEffect, useState } from "react";
  import { useDispatch, useSelector } from "react-redux";
  import Navbar from "../components/Navbar";
  import {
    fetchOwnerProperties,
    updateOwnerProperty,
    deleteOwnerProperty,
  } from "../store/propertySlice";

  export default function OwnerMyProperties() {
    const dispatch = useDispatch();
    const { ownerItems, ownerStatus, ownerError, ownerMutationStatus } =
      useSelector((state) => state.properties);
    const [edit, setEdit] = useState(null);
    const [localMsg, setLocalMsg] = useState("");

    useEffect(() => {
      if (ownerStatus === "idle") {
        dispatch(fetchOwnerProperties());
      }
    }, [dispatch, ownerStatus]);

    const save = async (id, data) => {
      const result = await dispatch(updateOwnerProperty({ id, updates: data }));
      if (updateOwnerProperty.fulfilled.match(result)) {
        setEdit(null);
        setLocalMsg("Property updated!");
      }
    };

    const remove = async (id) => {
      if (!confirm("Delete this property?")) return;
      const result = await dispatch(deleteOwnerProperty(id));
      if (deleteOwnerProperty.fulfilled.match(result)) {
        setLocalMsg("Property deleted.");
      }
    };

    return (
      <div>
        <Navbar />
        <div className="p-6 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">My Properties</h2>
          {localMsg && <p className="text-emerald-600 mb-3">{localMsg}</p>}
          {ownerError && <p className="text-rose-600 mb-3">{ownerError}</p>}
          {ownerStatus === "loading" ? (
            <p className="text-gray-500">Loading...</p>
          ) : ownerItems.length === 0 ? (
            <p className="text-gray-500">No properties yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerItems.map((p) => (
                <div key={p._id || p.id} className="border rounded-lg bg-white shadow p-3 space-y-2">
                  <img
                    src={p.photo_url || "https://picsum.photos/600/400"}
                    className="w-full h-40 object-cover rounded"
                    alt={p.title}
                  />
                  {edit === (p._id || p.id) ? (
                    <Editor initial={p} onCancel={() => setEdit(null)} onSave={(data)=>save(p._id || p.id, data)} saving={ownerMutationStatus === "loading"} />
                  ) : (
                    <>
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="text-gray-500 text-sm">{p.location}</p>
                      <p className="text-gray-700 text-sm">${p.price} / night</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setEdit(p._id || p.id)} className="flex-1 bg-amber-500 text-white py-1 rounded">Edit</button>
                        <button onClick={() => remove(p._id || p.id)} className="flex-1 bg-red-500 text-white py-1 rounded disabled:bg-red-300" disabled={ownerMutationStatus === "loading"}>
                          Delete
                        </button>
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

  function Editor({ initial, onCancel, onSave, saving }) {
    const [f, setF] = useState({
      ...initial,
      amenities: Array.isArray(initial.amenities)
        ? initial.amenities.join(", ")
        : initial.amenities || "",
    });
    const onChange = (e) => {
      const { name, value } = e.target;
      if (name === "bedrooms") {
        const computedGuests =
          value && !Number.isNaN(Number(value)) ? String(Number(value) * 2) : "";
        setF({ ...f, bedrooms: value, guests: computedGuests });
      } else {
        setF({ ...f, [name]: value });
      }
    };

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
        <input
          className="border p-2 rounded w-full bg-gray-50"
          name="guests"
          placeholder="Guests"
          value={f.guests || ""}
          onChange={(e) => setF({ ...f, guests: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2 rounded w-full" type="date" name="available_from" value={f.available_from || ""} onChange={onChange}/>
          <input className="border p-2 rounded w-full" type="date" name="available_to" value={f.available_to || ""} onChange={onChange}/>
        </div>
        <input className="border p-2 rounded w-full" name="photo_url" value={f.photo_url || ""} onChange={onChange}/>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(f)}
            className="flex-1 bg-emerald-600 text-white py-1 rounded disabled:bg-emerald-300"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onCancel} className="flex-1 bg-gray-300 py-1 rounded">Cancel</button>
        </div>
      </div>
    );
  }
