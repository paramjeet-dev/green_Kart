import { useState, useRef, useEffect } from "react";
import { MapPin, Loader } from "lucide-react";
import api from "../../services/api";

export default function LocationInput({ value, onChange, onSelect, placeholder = "Search address..." }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = async (q) => {
    if (q.length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      // Routed through our own server (server/routes/geocode.js) instead of
      // calling Nominatim directly — the server caches results and attaches
      // the User-Agent Nominatim's usage policy requires, so we're not
      // hammering a third-party API straight from every user's browser.
      const { data } = await api.get("/geocode/search", { params: { q } });
      setSuggestions(data.results);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange?.(val);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (item) => {
    const address = item.display_name;
    setQuery(address);
    setSuggestions([]);
    setOpen(false);
    onSelect?.({ address, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="input-field pl-9 pr-9"
          autoComplete="off"
        />
        {loading && (
          <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="px-4 py-2.5 text-sm text-gray-text hover:bg-green-light cursor-pointer border-b border-gray-50 last:border-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-green-primary mt-0.5 flex-shrink-0" />
                <span>{item.display_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}