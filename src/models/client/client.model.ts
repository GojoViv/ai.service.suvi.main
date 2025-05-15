// Assuming the ClientModel is already imported along with necessary interfaces
import { ClientModel } from "./client.schema";
import { IClient } from "../../types";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

// Function to create a new client
const createClient = async (clientData: IClient): Promise<IClient> => {
  try {
    const client = new ClientModel(clientData);
    await client.save();
    logger.info({ message: "Client created", client });
    return client;
  } catch (error) {
    logger.error({ message: "Error creating client", error });
    throw new ExternalServiceError("Error creating client");
  }
};

// Function to get all clients
const getAllClients = async (): Promise<IClient[]> => {
  try {
    const clients = await ClientModel.find({});
    logger.info({ message: "Retrieved all clients", count: clients.length });
    return clients;
  } catch (error) {
    logger.error({ message: "Error retrieving clients", error });
    throw new ExternalServiceError("Error retrieving clients");
  }
};

// Function to get a client by ID
const getClientById = async (clientId: string): Promise<IClient | null> => {
  try {
    const client = await ClientModel.findById(clientId);
    logger.info({ message: "Retrieved client by ID", clientId, client });
    return client;
  } catch (error) {
    logger.error({ message: "Error retrieving client by ID", clientId, error });
    throw new ExternalServiceError("Error retrieving client by ID");
  }
};

// Function to update a client by ID
const updateClient = async (
  clientId: string,
  updateData: Partial<IClient>
): Promise<IClient | null> => {
  try {
    const updatedClient = await ClientModel.findByIdAndUpdate(
      clientId,
      updateData,
      { new: true }
    );
    logger.info({ message: "Updated client", clientId, updatedClient });
    return updatedClient;
  } catch (error) {
    logger.error({ message: "Error updating client", clientId, error });
    throw new ExternalServiceError("Error updating client");
  }
};

// Function to delete a client by ID
const deleteClient = async (clientId: string): Promise<IClient | null> => {
  try {
    const deletedClient = await ClientModel.findByIdAndDelete(clientId);
    logger.info({ message: "Deleted client", clientId, deletedClient });
    return deletedClient;
  } catch (error) {
    logger.error({ message: "Error deleting client", clientId, error });
    throw new ExternalServiceError("Error deleting client");
  }
};

export {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
};
