import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import {
  addOwnerProperty,
} from "../store/propertySlice";

export default function OwnerAddProperty() {
  const dispatch = useDispatch();
  const {
    ownerMutationStatus,
    ownerMutationError,
    ownerMutationMessage,
  } = useSelector((state) => state.properties);

  const [form, setForm] = useState({
    title: "",
    type: "",
    description: "",
    location: "",
    price: "",
    amenities: "",
    bedrooms: "",
    bathrooms: "",
    available_from: "",
    available_to: "",
    photo_url: "",
    guests: "",
  });
  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "bedrooms") {
      const computedGuests =
        value && !Number.isNaN(Number(value)) ? String(Number(value) * 2) : "";
      setForm({ ...form, bedrooms: value, guests: computedGuests });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const clearForm = () =>
    setForm({
      title: "",
      type: "",
      description: "",
      location: "",
      price: "",
      amenities: "",
      bedrooms: "",
      bathrooms: "",
      available_from: "",
      available_to: "",
      photo_url: "",
      guests: "",
    });

  const onSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(addOwnerProperty(form));
    if (addOwnerProperty.fulfilled.match(resultAction)) {
      clearForm();
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Post a New Property</h2>
        {ownerMutationMessage && ownerMutationStatus === "succeeded" && (
          <p className="mb-3 text-emerald-600">{ownerMutationMessage}</p>
        )}
        {ownerMutationError && (
          <p className="mb-3 text-rose-600">{ownerMutationError}</p>
        )}
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3">
          <input className="border p-2 rounded" placeholder="Title" name="title" value={form.title} onChange={onChange} required/>
          <select
            className="border p-2 rounded"
            name="type"
            value={form.type}
            onChange={onChange}
            required
          >
            <option value="">Select type</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Condo">Condo</option>
            <option value="Studio">Studio</option>
            <option value="Other">Other</option>
          </select>
          <textarea className="border p-2 rounded" placeholder="Description" name="description" value={form.description} onChange={onChange}/>
          <input className="border p-2 rounded" placeholder="Location" name="location" value={form.location} onChange={onChange} required/>
          <input className="border p-2 rounded" placeholder="Price" name="price" value={form.price} onChange={onChange} required/>
          <input className="border p-2 rounded" placeholder="Amenities (comma separated)" name="amenities" value={form.amenities} onChange={onChange}/>
          <div className="grid grid-cols-2 gap-3">
            <input className="border p-2 rounded" placeholder="Bedrooms" name="bedrooms" value={form.bedrooms} onChange={onChange}/>
            <input className="border p-2 rounded" placeholder="Bathrooms" name="bathrooms" value={form.bathrooms} onChange={onChange}/>
          </div>
          <input
            className="border p-2 rounded bg-gray-50"
            placeholder="Guests (auto-calculated)"
            name="guests"
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input className="border p-2 rounded" type="date" name="available_from" value={form.available_from} onChange={onChange}/>
            <input className="border p-2 rounded" type="date" name="available_to" value={form.available_to} onChange={onChange}/>
          </div>
          <input className="border p-2 rounded" placeholder="Photo URL" name="photo_url" value={form.photo_url} onChange={onChange}/>
          <button
            disabled={ownerMutationStatus === "loading"}
            className="bg-rose-500 text-white px-4 py-2 rounded disabled:bg-rose-300"
          >
            {ownerMutationStatus === "loading" ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
