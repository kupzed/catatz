import { setupServer } from "msw/node";
import { externalServiceHandlers } from "./handlers";

export const mockServer = setupServer(...externalServiceHandlers);
