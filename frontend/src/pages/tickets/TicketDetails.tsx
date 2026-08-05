import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import type { Ticket } from "../../types/ticket";

interface TicketActivity {
  id: number;
  ticket_id: number;
  user_id: number;
  action: string;
  comment: string | null;
  created_at: string;
}

const TicketDetails = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketActivity[]>([]);

  const [assigneeId, setAssigneeId] = useState("");

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("You are not logged in.");
          return;
        }

        const response = await axios.get<Ticket>(
          `http://127.0.0.1:8000/tickets/${ticketId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setTicket(response.data);

        if (response.data.assignee_id !== null) {
          setAssigneeId(
            String(response.data.assignee_id)
          );
        }
      } catch (error: unknown) {
        console.error(
          "Failed to load ticket:",
          error
        );

        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;

          if (typeof detail === "string") {
            setError(detail);
          } else {
            setError("Unable to load ticket.");
          }
        } else {
          setError("Unable to load ticket.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          return;
        }

        const response = await axios.get<TicketActivity[]>(
          `http://127.0.0.1:8000/tickets/${ticketId}/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setHistory(response.data);
      } catch (error: unknown) {
        console.error(
          "Failed to load ticket history:",
          error
        );
      } finally {
        setHistoryLoading(false);
      }
    };

    if (ticketId) {
      fetchTicket();
      fetchHistory();
    }
  }, [ticketId]);

  const handleAssignment = async () => {
    if (!ticketId) {
      setError("Ticket ID is missing.");
      return;
    }

    if (!assigneeId) {
      setError("Please enter an agent ID.");
      return;
    }

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await axios.patch<Ticket>(
        `http://127.0.0.1:8000/tickets/${ticketId}`,
        {
          assignee_id: Number(assigneeId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setTicket(response.data);

      setMessage(
        "Ticket assigned successfully."
      );

      // Refresh history after assignment
      const historyResponse =
        await axios.get<TicketActivity[]>(
          `http://127.0.0.1:8000/tickets/${ticketId}/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setHistory(historyResponse.data);
    } catch (error: unknown) {
      console.error(
        "Assignment error:",
        error
      );

      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;

        if (typeof detail === "string") {
          setError(detail);
        } else {
          setError("Unable to assign ticket.");
        }
      } else {
        setError("Unable to assign ticket.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading ticket...</p>;
  }

  if (!ticket) {
    return (
      <div>
        <p>{error || "Ticket not found."}</p>

        <button
          type="button"
          onClick={() => navigate("/tickets")}
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="ticket-details-page">
      <h2>Ticket Details</h2>

      <div>
        <p>
          <strong>ID:</strong>{" "}
          {ticket.id}
        </p>

        <p>
          <strong>Title:</strong>{" "}
          {ticket.title}
        </p>

        <p>
          <strong>Description:</strong>{" "}
          {ticket.description}
        </p>

        <p>
          <strong>Category:</strong>{" "}
          {ticket.category}
        </p>

        <p>
          <strong>Priority:</strong>{" "}
          {ticket.priority}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {ticket.status}
        </p>

        <p>
          <strong>Source:</strong>{" "}
          {ticket.source}
        </p>

        <p>
          <strong>Requester ID:</strong>{" "}
          {ticket.requester_id}
        </p>

        <p>
          <strong>Current Assignee:</strong>{" "}
          {ticket.assignee_id ?? "Not assigned"}
        </p>
      </div>

      <hr />

      <h3>Assign Ticket</h3>

      <label htmlFor="assignee">
        Agent User ID
      </label>

      <br />

      <input
        id="assignee"
        type="number"
        placeholder="Enter agent user ID"
        value={assigneeId}
        onChange={(event) =>
          setAssigneeId(event.target.value)
        }
      />

      <br />
      <br />

      <button
        type="button"
        onClick={handleAssignment}
        disabled={saving}
      >
        {saving
          ? "Assigning..."
          : "Assign Ticket"}
      </button>

      {message && (
        <p>{message}</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      <hr />

      <h3>Ticket History</h3>

      {historyLoading ? (
        <p>Loading history...</p>
      ) : history.length === 0 ? (
        <p>No history available.</p>
      ) : (
        <div>
          {history.map((activity) => (
            <div key={activity.id}>
              <p>
                <strong>
                  {activity.action}
                </strong>
              </p>

              {activity.comment && (
                <p>
                  {activity.comment}
                </p>
              )}

              <p>
                User ID: {activity.user_id}
              </p>

              <p>
                {new Date(
                  activity.created_at
                ).toLocaleString()}
              </p>

              <hr />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/tickets")}
      >
        Back to Tickets
      </button>
    </div>
  );
};

export default TicketDetails;