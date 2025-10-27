# WorkBuddy Agent Server

A microservice that provides intelligent business intelligence analysis using large language models (LLMs). This agent server leverages AI to analyze uploaded data, generate insights, and create actionable improvement plans.

## Overview

The Agent Server is designed as a specialized component within the WorkBuddy ecosystem, providing:

- **Data Interpretation**: Uses LLMs to analyze complex datasets and extract meaningful insights
- **Insight Generation**: Produces actionable recommendations based on data patterns and trends
- **Plan Creation**: Generates structured improvement plans using proven frameworks
- **Context Awareness**: Incorporates domain knowledge, leadership models, and best practices

## Architecture

### Core Components

- **Express Server**: RESTful API endpoints for client interactions
- **LLM Integration**: OpenAI and other LLM provider support
- **Route Handlers**: Specialized endpoints for analysis, planning, and health checks
- **Service Layer**: Core business logic for analysis and insight generation
- **Utilities**: File handling, logging, and supporting functions
- **Knowledge Base**: Contextual information and reference materials

### API Endpoints

- `GET /health` - Server status and health monitoring
- `POST /analyze` - Submit data for LLM-based interpretation
- `POST /generate-plan` - Request structured improvement plans

## Getting Started

### Prerequisites
- Node.js 18+
- TypeScript
- OpenAI API key (for LLM services)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Configuration

Environment variables:
- `PORT`: Server port (default: 3001)
- `OPENAI_API_KEY`: Your OpenAI API key for LLM services

## Directory Structure

```
agent-server/
├── package.json              # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── src/
│   ├── index.ts             # Application entry point
│   ├── routes/              # API route handlers
│   │   ├── analyze.ts       # Data analysis endpoint
│   │   ├── generatePlan.ts  # Plan generation endpoint
│   │   └── health.ts        # Health check endpoint
│   ├── llm/                 # LLM integration layer
│   │   ├── openaiClient.ts  # OpenAI API client
│   │   ├── promptBuilder.ts # Prompt construction
│   │   └── outputParser.ts  # Response parsing/validation
│   ├── context/             # Agent context and purpose
│   │   ├── purpose.md       # Mission and vision
│   │   ├── role.md          # System role definition
│   │   ├── objectives.md    # Goals and constraints
│   │   └── goals.json       # Structured objectives
│   ├── knowledge/           # Reference materials
│   │   ├── leadership_models.md     # Leadership frameworks
│   │   ├── improvement_frameworks.md # Best practices
│   │   └── example_insights.md      # Insight templates
│   ├── services/            # Business logic
│   │   ├── analysis.ts      # Data analysis service
│   │   ├── insightGenerator.ts # Insight creation
│   │   └── reportBuilder.ts # Report generation
│   └── utils/               # Utility functions
│       ├── fileHelpers.ts   # File I/O operations
│       └── logger.ts        # Logging utility
└── README.md                # This documentation
```

## Development Status

This is a foundational implementation with placeholder functions. Key areas for implementation:

- [ ] LLM API integration and rate limiting
- [ ] Advanced prompt engineering with context files
- [ ] Output validation and confidence scoring
- [ ] File upload and processing capabilities
- [ ] Report generation (JSON/PDF formats)
- [ ] Error handling and logging infrastructure
- [ ] Security and authentication layers
- [ ] Performance optimization and caching
- [ ] Testing and quality assurance

## Contributing

Contributions to improve the agent server are welcome. Focus areas:

- Enhanced LLM integrations
- Improved analysis algorithms
- Additional knowledge base materials
- Security enhancements
- Performance optimizations

## License

[Specify license - e.g., MIT, Apache 2.0]

## Related Components

- **bi-app**: Main WorkBuddy application
- **web-ui**: Frontend interface
- **[Other microservices]**: Related system components
