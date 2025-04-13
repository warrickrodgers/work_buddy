export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string
    created_at: Date;
    last_login: Date;
    job_title: string;
    company: string;
    password_hash: string;
    auth_method: string;
    problem_request: Array<object>;
    insight_feedback: Array<object>;
}

export interface ProblemRequest {
    id: number;
    user: number;
    role_description: string;
    problem_description: string;
    problem_parameters: string;
    problem_insights: string;
    solution_summary: string;
    problem_data?: object;
    created_at: Date;
    processed_at: Date;
    status: object;
    metric_temp?: object;
}