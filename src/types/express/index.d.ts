import { IEmployee } from "../IEmployee";

declare global {
  namespace Express {
    interface User extends IEmployee {}
  }
}
