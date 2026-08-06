import api from "./api";
import type { Ticket } from "../types/ticket";

export const getTickets = async (): Promise<Ticket[]> => {
  const token = localStorage.getItem("access_token");

  console.log("Token:", token);

  const response = await api.get<Ticket[]>("/tickets/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};