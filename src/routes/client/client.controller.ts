// Importing necessary modules and types
import { Request, Response } from "express";
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../../models/client/client.model"; // Adjust import path as necessary
import logger from "../../utils/logger";
import {
  NotFoundError,
  ExternalServiceError,
  asyncHandler,
} from "../../utils/errors";

// Create a new Client
const httpCreateClient = asyncHandler(async (req: Request, res: Response) => {
  const clientData = req.body;
  const client = await createClient(clientData);

  // Sanitize client data before sending
  const sanitizedClient = {
    ...client,
    sensitiveData: "REDACTED",
    apiKeys: undefined,
    credentials: undefined,
  };

  logger.info("Client created successfully", { clientId: client._id });
  return res.status(201).json(sanitizedClient);
});

// Get all Clients
const httpGetAllClients = asyncHandler(async (_: Request, res: Response) => {
  const clients = await getAllClients();

  // Sanitize client data before sending
  const sanitizedClients = clients.map((client) => ({
    ...client,
    sensitiveData: "REDACTED",
    apiKeys: undefined,
    credentials: undefined,
  }));

  logger.info("All clients retrieved successfully", { count: clients.length });
  return res.status(200).json(sanitizedClients);
});

// Get a Client by ID
const httpGetClientById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await getClientById(id);

  if (!client) {
    logger.warn("Client not found", { clientId: id });
    throw new NotFoundError("Client not found");
  }

  // Sanitize client data before sending
  const sanitizedClient = {
    ...client,
    sensitiveData: "REDACTED",
    apiKeys: undefined,
    credentials: undefined,
  };

  logger.info("Client retrieved successfully", { clientId: id });
  return res.status(200).json(sanitizedClient);
});

// Update a Client by ID
const httpUpdateClientById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedClient = await updateClient(id, updateData);

    if (!updatedClient) {
      logger.warn("Client not found for update", { clientId: id });
      throw new NotFoundError("Client not found");
    }

    // Sanitize client data before sending
    const sanitizedClient = {
      ...updatedClient,
      sensitiveData: "REDACTED",
      apiKeys: undefined,
      credentials: undefined,
    };

    logger.info("Client updated successfully", { clientId: id });
    return res.status(200).json(sanitizedClient);
  }
);

// Delete a Client by ID
const httpDeleteClientById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deletedClient = await deleteClient(id);

    if (!deletedClient) {
      logger.warn("Client not found for deletion", { clientId: id });
      throw new NotFoundError("Client not found");
    }

    logger.info("Client deleted successfully", { clientId: id });
    return res.status(204).send();
  }
);

// Exporting controller functions
export {
  httpCreateClient,
  httpGetAllClients,
  httpGetClientById,
  httpUpdateClientById,
  httpDeleteClientById,
};
