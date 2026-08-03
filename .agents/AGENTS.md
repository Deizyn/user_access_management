# Project Rules & Customizations

## Superpowers Workflow Enabled
This project uses the **Superpowers Antigravity** workflow skills located in `.agents/skills/`.

Available skills:
- `brainstorming`: Interactive design and specification refinement before writing code.
- `writing-plans`: Creates structured implementation plans with clear verification steps.
- `executing-plans`: Executes implementation plans step-by-step.
- `systematic-debugging`: Root-cause tracing and systematic debugging workflows.
- `test-driven-development`: True red/green TDD methodology.
- `subagent-driven-development`: Dispatches parallel/isolated subagents for discrete tasks.
- `verification-before-completion`: Ensures empirical verification before completing work.

## Mandatory Documentation Protocol (`docs/`)
- **READ FIRST**: Before performing any bug fix, feature addition, schema modification, or code change, you MUST read the documentation files under `docs/` (`docs/system_development_log.md`, `docs/work_activity_log.md`, `docs/database_integration_guide.md`, `docs/README.md`) to understand the current architecture, data structures, and past fix history.
- **UPDATE ALWAYS**: Every time a change, fix, optimization, or feature update is implemented, you MUST update the corresponding documentation files in `docs/` (`system_development_log.md` and `work_activity_log.md`) with detailed logs of what was changed and why before declaring completion.
