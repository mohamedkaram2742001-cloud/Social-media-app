import z from "zod";
import { pagainationValidation } from "../validation";

export type PaginationDTO = z.infer<typeof pagainationValidation.query>