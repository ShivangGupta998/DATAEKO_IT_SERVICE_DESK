import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TicketList from "./pages/tickets/TicketList";
import TicketCreate from "./pages/tickets/TicketCreate";
import TicketDetails from "./pages/tickets/TicketDetails";
import Login from "./pages/auth/Login";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/tickets" element={<TicketList />} />

        <Route
          path="/tickets/create"
          element={<TicketCreate />}
        />

        <Route
          path="/tickets/:ticketId"
          element={<TicketDetails />}
        />

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;