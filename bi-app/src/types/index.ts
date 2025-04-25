/**
 * The Enum object for Status of a ProblemRequest. 
 * Can be one of the following:
 * - PENDING
 * - PROCESSING
 * - DONE
 * - DID_NOT_MEET
 */
export type Status = 'PENDING' | 'PROCESSING' | 'DONE' | 'DID_NOT_MEET';

/**
 * The DTO object for User model that is not client facing
 */
export interface UserDTO {
    id: number;
    email: string;
    first_name: string;
    last_name: string
    job_title: string;
    company: string;
}

/**
 * The User SignUp request body for the create of CRUD operations
 */
export interface UserSignupReqBody {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

/**
 * The DTO object for ProblemRequest that is not client facing
 */
export interface ProblemRequestDTO {
    id: number;
    user: number;
    role_description: string;
    problem_description: string;
    problem_parameters: string;
    problem_insights: string;
    solution_summary: string;
    status: Status;
}

/**
 * The Create request body of the CRUD operation for ProblemRequest
 */
export interface CreateProblemRequestBody {
    userId: number;
    roleDescription: string;
    problemDescription: string;
    problemParameters?: string;
}

/**
 * The Read response body of the CRUD operation for ProblemRequest
 */
export interface ReadProblemRequestResponse {
    id: number;
    status: Status;
    solutionSummary?: string;
}

