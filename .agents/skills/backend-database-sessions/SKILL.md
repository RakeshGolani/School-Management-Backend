---
name: backend-database-sessions
description: Guidelines for database migrations, Sequelize models, transactions, and academic session filtering in School-Management-Backend
---

# Backend Database & Session Skill

Guidelines for backend development:

## Controller Patterns
- Extend `BaseController` and bind async methods in constructor.
- Use `this.sendResponse(res, data, message, statusCode)` and `this.sendError(res, message, statusCode)`.
- Wrap multi-table updates (e.g. Student + StudentAcademicSession) in `const transaction = await sequelize.transaction()`.

## Academic Year Scoping
- If `academic_year_id` query parameter is provided, join with session tables (`StudentAcademicSession`, `TeacherClassAssignment`, `AttendanceLog`, `StudentFee`).
- Ensure `database/seed.js` includes all foreign key associations when seeding mock data.
