export interface UserDTO {
    id: number;
    email: string;
    first_name: string;
    last_name: string
    job_title: string;
    company: string;
}

export interface ProblemRequestDTO {
    id: number;
    user: number;
    role_description: string;
    problem_description: string;
    problem_parameters: string;
    problem_insights: string;
    solution_summary: string;
    status: object;
}

