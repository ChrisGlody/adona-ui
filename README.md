# Adona UI

A comprehensive web application for managing workflows, skills, functions, and observability for the Adona platform.

## Overview

Adona UI is a modern, feature-rich dashboard built with Next.js that provides tools for:
- **Workflow Management**: Build and manage complex workflows with a visual builder
- **Skills Registry**: Register and manage AI skills and capabilities
- **Function Registry**: Catalog and manage reusable functions
- **RL Studio**: Reinforcement Learning workflow development and analysis
- **Bixbench**: Benchmarking and performance analysis tools
- **Observability**: Monitor workflow runs, metrics, logs, and incidents

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ (or latest LTS)
- pnpm (install via `npm install -g pnpm`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ChrisGlody/adona-ui
cd adona-ui
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server (requires build first)
- `pnpm lint` - Run ESLint to check code quality

## Project Structure

```
adona-ui/
├── app/                    # Next.js app router pages
│   ├── bixbench/          # Benchmarking tool
│   ├── function-registry/  # Function catalog
│   ├── rl-studio/         # Reinforcement Learning studio
│   ├── skill-designer/    # Skill design interface
│   ├── skills-registry/   # Skills catalog
│   ├── workflow-builder/  # Visual workflow builder
│   └── workflow-runs/     # Workflow execution monitoring
├── components/            # React components
│   ├── ui/               # Reusable UI components (Radix UI)
│   └── [feature]/        # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── public/               # Static assets
└── styles/               # Global styles
```

## Features

### Workflow Builder
Visual drag-and-drop interface for creating and editing workflows with support for:
- Node-based workflow design
- Customizable workflow settings
- Real-time preview

### Skills Registry
Manage and catalog AI skills with:
- Skill metadata and documentation
- Version tracking
- Search and filtering capabilities

### Function Registry
Centralized catalog of reusable functions with:
- Function documentation
- Parameter specifications
- Usage tracking

### RL Studio
Reinforcement Learning development environment featuring:
- Reward function design
- Workflow trace analysis
- Training visualization

### Bixbench
Benchmarking and performance analysis tools including:
- Performance metrics visualization
- Skill breakdown analysis
- Dataset management

### Observability Dashboard
Comprehensive monitoring and observability with:
- Real-time logs explorer
- Incident tracking and management
- Metrics visualization
- Workflow run monitoring

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Path aliases configured (`@/*` maps to project root)

### Component Architecture

- Components are organized by feature/module
- Reusable UI components in `components/ui/`
- Feature-specific components co-located with their pages

### Styling

- Tailwind CSS for utility-first styling
- Dark mode support via `next-themes`
- Custom theme configuration

## Configuration

### Next.js Config

- TypeScript build errors are ignored during build (for development flexibility)
- Images are unoptimized (can be configured for production)

### Environment Variables

Create a `.env.local` file for environment-specific configuration (if needed).

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `pnpm lint`
4. Test your changes locally
5. Submit a pull request

## License

Private project - All rights reserved.
