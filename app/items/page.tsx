"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Item = {
  product_code: string;
  item_description: string;
  product_group: string;
  size_quantity: string;
  size_type: string;
  location: string;
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const [form, setForm] = useState<Item>({
    product_code: "",
    item_description: "",
    product_group: "",
    size_quantity: "",
    size_type: "",
    location: "WAREHOUSE",
  });

  const productGroups = [
    "STOCK - SOFT DRINKS",
    "STOCK - BEER",
    "STOCK - SPIRITS",
    "STOCK - WINE",
    "STOCK - FOOD",
    "STOCK - FRUITS",
    "STOCK - CLEANING",
    "STOCK - PACKAGING",
  ];

  const sizeTypes = ["ML", "L", "G", "KG", "PCS", "BOTTLE", "CAN", "BOX", "PACK"];

  const locations = ["WAREHOUSE", "KITCHEN 1", "KITCHEN 2", "BAR"];

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("product_code", { ascending: true });

    if (error) {
      alert("Error loading items: " + error.message);
      return;
    }

    setItems(data || []);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function saveItem() {
    if (!form.product_code || !form.item_description) {
      alert("Please enter Product Code and Item Description.");
      return;
    }

    if (editingCode) {
      const { error } = await supabase
        .from("items")
        .update(form)
        .eq("product_code", editingCode);

      if (error) {
        alert("Update error: " + error.message);
        return;
      }

      alert("Item updated.");
    } else {
      const { error } = await supabase.from("items").insert([form]);

      if (error) {
        alert("Save error: " + error.message);
        return;
      }

      alert("Item saved.");
    }

    resetForm();
    fetchItems();
  }

  function editItem(item: Item) {
    setEditingCode(item.product_code);

    setForm({
      product_code: item.product_code || "",
      item_description: item.item_description || "",
      product_group: item.product_group || "",
      size_quantity: item.size_quantity || "",
      size_type: item.size_type || "",
      location: item.location || "WAREHOUSE",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteItem(product_code: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
      .from("items")
      .delete()
      .eq("product_code", product_code);

    if (error) {
      alert("Delete error: " + error.message);
      return;
    }

    alert("Item deleted.");
    fetchItems();
  }

  function resetForm() {
    setEditingCode(null);

    setForm({
      product_code: "",
      item_description: "",
      product_group: "",
      size_quantity: "",
      size_type: "",
      location: "WAREHOUSE",
    });
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const text = await file.text();
    const rows = text.split("\n").filter((row) => row.trim() !== "");

    const dataRows = rows.slice(1);

    const uploadedItems = dataRows.map((row) => {
      const columns = row.split(",");

      return {
        product_code: columns[0]?.trim() || "",
        item_description: columns[1]?.trim() || "",
        product_group: columns[2]?.trim() || "",
        size_quantity: columns[3]?.trim() || "",
        size_type: columns[4]?.trim() || "",
        location: columns[5]?.trim() || "WAREHOUSE",
      };
    });

    const cleanItems = uploadedItems.filter(
      (item) => item.product_code && item.item_description
    );

    if (cleanItems.length === 0) {
      alert("No valid items found in CSV.");
      return;
    }

    const { error } = await supabase.from("items").insert(cleanItems);

    if (error) {
      alert("CSV upload error: " + error.message);
      return;
    }

    alert(`${cleanItems.length} items uploaded.`);
    fetchItems();
    e.target.value = "";
  }

  return (
    <div style={{ padding: 30, width: "100%" }}>
      <div style={card}>
        <h2>{editingCode ? "Edit Item" : "Add Item"}</h2>

        <input
          name="product_code"
          value={form.product_code}
          onChange={handleChange}
          placeholder="Product Code"
          style={input}
        />

        <input
          name="item_description"
          value={form.item_description}
          onChange={handleChange}
          placeholder="Item Description"
          style={input}
        />

        <select
          name="product_group"
          value={form.product_group}
          onChange={handleChange}
          style={input}
        >
          <option value="">Select Product Group</option>
          {productGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <input
          name="size_quantity"
          value={form.size_quantity}
          onChange={handleChange}
          placeholder="Size Quantity"
          style={input}
        />

        <select
          name="size_type"
          value={form.size_type}
          onChange={handleChange}
          style={input}
        >
          <option value="">Size Type</option>
          {sizeTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          name="location"
          value={form.location}
          onChange={handleChange}
          style={input}
        >
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        <button onClick={saveItem} style={saveBtn}>
          {editingCode ? "Update Item" : "Save Item"}
        </button>

        {editingCode && (
          <button onClick={resetForm} style={cancelBtn}>
            Cancel
          </button>
        )}
      </div>

      <div style={card}>
        <h2>CSV Upload</h2>
        <p>
          CSV columns must be: Product Code, Item Description, Product Group,
          Size Quantity, Size Type, Location
        </p>

        <input type="file" accept=".csv" onChange={handleCsvUpload} />
      </div>

      <table style={table}>
        <thead>
          <tr style={thead}>
            <th style={th}>Product Code</th>
            <th style={th}>Item Description</th>
            <th style={th}>Product Group</th>
            <th style={th}>Size Quantity</th>
            <th style={th}>Size Type</th>
            <th style={th}>Location</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.product_code}-${index}`}>
              <td style={td}>{item.product_code}</td>
              <td style={td}>{item.item_description}</td>
              <td style={td}>{item.product_group}</td>
              <td style={td}>{item.size_quantity}</td>
              <td style={td}>{item.size_type}</td>
              <td style={td}>{item.location}</td>
              <td style={td}>
                <button onClick={() => editItem(item)} style={editBtn}>
                  Edit
                </button>

                <button
                  onClick={() => deleteItem(item.product_code)}
                  style={deleteBtn}
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

const card = {
  background: "white",
  padding: 25,
  borderRadius: 6,
  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  marginBottom: 30,
};

const input = {
  width: "100%",
  padding: 14,
  marginBottom: 15,
  fontSize: 18,
  border: "1px solid #333",
};

const table = {
  width: "100%",
  background: "white",
  borderCollapse: "collapse" as const,
  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
};

const thead = {
  background: "#e5e7eb",
};

const th = {
  padding: 18,
  textAlign: "left" as const,
  fontSize: 18,
  borderBottom: "1px solid #333",
};

const td = {
  padding: 18,
  fontSize: 18,
  borderBottom: "1px solid #ddd",
};

const saveBtn = {
  background: "#2563eb",
  color: "white",
  padding: "14px 24px",
  border: "none",
  borderRadius: 4,
  fontSize: 18,
  cursor: "pointer",
  marginRight: 10,
};

const cancelBtn = {
  background: "#6b7280",
  color: "white",
  padding: "14px 24px",
  border: "none",
  borderRadius: 4,
  fontSize: 18,
  cursor: "pointer",
};

const editBtn = {
  background: "#f59e0b",
  color: "white",
  padding: "8px 12px",
  border: "none",
  borderRadius: 4,
  fontSize: 16,
  cursor: "pointer",
  marginRight: 8,
};

const deleteBtn = {
  background: "red",
  color: "white",
  padding: "8px 12px",
  border: "none",
  borderRadius: 4,
  fontSize: 16,
  cursor: "pointer",
};