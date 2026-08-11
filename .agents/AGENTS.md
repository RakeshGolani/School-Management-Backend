# AGENTS.md — School-Management-Backend Rules

## Architectural Guidelines
- Framework: Node.js, Express.js REST API with Sequelize ORM (MySQL).
- Code Architecture: Controller -> Service/Model -> Resource / BaseController.
- Models & Relationships: Always register relations in `app/Models/index.js`.
- Session Scoping: Academic endpoints MUST filter by `academic_year_id` query param or active academic year.
- Database Migrations & Seeds: Keep migrations in `database/migrations/` synchronized with `app/Models/` and `database/seed.js`.

## Token Efficiency Rules
1. Read specific line ranges with `view_file` to keep context lightweight.
2. Edit targeted blocks using `replace_file_content` or `multi_replace_file_content`.
3. Verify model schemas using `grep_search` before writing query logic.
