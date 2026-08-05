import { useEffect, useState } from "react";
import { getTickets } from "../../services/ticketService";
import type { Ticket } from "../../types/ticket";

const TicketList = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchTickets = async () => {
      try {
        const data = await getTickets();

        if (mounted) {
          setTickets(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load tickets:", err);

        if (mounted) {
          setError("Unable to load tickets.");
          setLoading(false);
        }
      }
    };

    fetchTickets();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "all") {
      return true;
    }

    return ticket.status.toLowerCase() === filter;
  });

  if (loading) {
    return <p>Loading tickets...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Ticket Queue</h2>

      <a href="/tickets/create">
        <button type="button">
          Create Ticket
        </button>
      </a>

      <div>
        <label htmlFor="status-filter">
          Filter by status:
        </label>

        <select
          id="status-filter"
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
        >
          <option value="all">
            All Tickets
          </option>

          <option value="open">
            Open
          </option>

          <option value="in progress">
            In Progress
          </option>

          <option value="resolved">
            Resolved
          </option>

          <option value="closed">
            Closed
          </option>
        </select>
      </div>

      <br />

      {filteredTickets.length === 0 ? (
        <p>No tickets found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Source</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>

                <td>{ticket.title}</td>

                <td>{ticket.category}</td>

                <td>{ticket.priority}</td>

                <td>{ticket.status}</td>

                <td>{ticket.source}</td>

                <td>
                  <a
                    href={`/tickets/${ticket.id}`}
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TicketList;