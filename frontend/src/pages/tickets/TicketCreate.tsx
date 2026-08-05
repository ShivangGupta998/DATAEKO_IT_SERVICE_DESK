import { FormEvent, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TicketCreate = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      await axios.post(
        "http://127.0.0.1:8000/tickets/",
        {
          title,
          description,
          category,
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      navigate("/tickets");
    } catch (error: unknown) {
      console.error("Create ticket error:", error);

      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;

        if (typeof detail === "string") {
          setError(detail);
        } else {
          setError("Failed to create ticket.");
        }
      } else {
        setError("Failed to create ticket.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket-create-page">
      <div className="ticket-create-card">
        <h1>Create Ticket</h1>

        <p>Create a new IT service request</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">
              Title
            </label>

            <input
              id="title"
              type="text"
              placeholder="Enter ticket title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
              minLength={5}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              placeholder="Describe the issue"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              required
              minLength={10}
              rows={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              required
            >
              <option value="">
                Select category
              </option>

              <option value="hardware">
                Hardware
              </option>

              <option value="software">
                Software
              </option>

              <option value="network">
                Network
              </option>

              <option value="access">
                Access
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">
              Priority
            </label>

            <select
              id="priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
            >
              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>

              <option value="critical">
                Critical
              </option>
            </select>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketCreate;