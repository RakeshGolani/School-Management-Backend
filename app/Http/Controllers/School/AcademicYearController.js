const BaseController = require('../BaseController');
const { AcademicYear, sequelize } = require('../../../Models');

class AcademicYearController extends BaseController {
  /**
   * Get all academic years for a school
   */
  async index(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;

      const academicYears = await AcademicYear.findAll({
        where: { school_id },
        order: [['start_date', 'DESC']]
      });

      return this.sendResponse(res, academicYears, 'Academic years retrieved successfully');
    } catch (error) {
      console.error('Error fetching academic years:', error);
      return this.sendError(res, 'Failed to fetch academic years', error.message, 500);
    }
  }

  /**
   * Get active academic year for a school
   */
  async getActive(req, res) {
    try {
      const school_id = req.user?.school_id || req.query.school_id || 1;

      let activeYear = await AcademicYear.findOne({
        where: { school_id, is_active: true }
      });

      if (!activeYear) {
        // If no active year is set, get the latest one
        activeYear = await AcademicYear.findOne({
          where: { school_id },
          order: [['start_date', 'DESC']]
        });
      }

      return this.sendResponse(res, activeYear, 'Active academic year retrieved successfully');
    } catch (error) {
      console.error('Error fetching active academic year:', error);
      return this.sendError(res, 'Failed to fetch active academic year', error.message, 500);
    }
  }

  /**
   * Create a new academic year
   */
  async store(req, res) {
    try {
      const school_id = req.user?.school_id || req.body.school_id || 1;
      const { year_name, start_date, end_date, is_active, description } = req.body;

      if (!year_name || !start_date || !end_date) {
        return this.sendValidationError(res, [], 'year_name, start_date, and end_date are required');
      }

      // If set as active, deactivate all other years for this school
      if (is_active) {
        await AcademicYear.update(
          { is_active: false },
          { where: { school_id } }
        );
      }

      // Determine initial status based on date
      const now = new Date();
      const sDate = new Date(start_date);
      const eDate = new Date(end_date);
      let status = 'UPCOMING';
      if (now >= sDate && now <= eDate) {
        status = 'ACTIVE';
      } else if (now > eDate) {
        status = 'COMPLETED';
      }

      const academicYear = await AcademicYear.create({
        school_id,
        year_name,
        start_date,
        end_date,
        is_active: !!is_active,
        status,
        description
      });

      return this.sendResponse(res, academicYear, 'Academic year created successfully', 201);
    } catch (error) {
      console.error('Error creating academic year:', error);
      return this.sendError(res, 'Failed to create academic year', error.message, 500);
    }
  }

  /**
   * Update an academic year
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { year_name, start_date, end_date, is_active, status, description } = req.body;

      const academicYear = await AcademicYear.findByPk(id);
      if (!academicYear) {
        return this.sendError(res, 'Academic year not found', null, 404);
      }

      if (is_active) {
        await AcademicYear.update(
          { is_active: false },
          { where: { school_id: academicYear.school_id } }
        );
      }

      await academicYear.update({
        year_name: year_name || academicYear.year_name,
        start_date: start_date || academicYear.start_date,
        end_date: end_date || academicYear.end_date,
        is_active: is_active !== undefined ? !!is_active : academicYear.is_active,
        status: status || academicYear.status,
        description: description !== undefined ? description : academicYear.description
      });

      return this.sendResponse(res, academicYear, 'Academic year updated successfully');
    } catch (error) {
      console.error('Error updating academic year:', error);
      return this.sendError(res, 'Failed to update academic year', error.message, 500);
    }
  }

  /**
   * Set specific academic year as active
   * Automatically updates past sessions to COMPLETED and auto-creates the next UPCOMING session if needed.
   */
  async setActive(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const academicYear = await AcademicYear.findByPk(id, { transaction });
      if (!academicYear) {
        await transaction.rollback();
        return this.sendError(res, 'Academic year not found', null, 404);
      }

      const school_id = academicYear.school_id;

      // 1. Mark existing active years as false & recalculate status (older -> COMPLETED, future -> UPCOMING)
      const allYears = await AcademicYear.findAll({ where: { school_id }, transaction });
      for (const yr of allYears) {
        if (yr.id !== academicYear.id) {
          const isOlder = new Date(yr.start_date) < new Date(academicYear.start_date);
          await yr.update({ 
            is_active: false,
            status: isOlder ? 'COMPLETED' : 'UPCOMING'
          }, { transaction });
        }
      }

      // 2. Activate selected academic year
      await academicYear.update({ is_active: true, status: 'ACTIVE' }, { transaction });

      // 3. Auto-generate Next Academic Year if no UPCOMING session exists
      const upcomingExists = await AcademicYear.findOne({
        where: {
          school_id,
          status: 'UPCOMING'
        },
        transaction
      });

      let autoCreatedNextYear = null;

      if (!upcomingExists) {
        // Calculate next year boundaries based on activated year
        const currentStart = new Date(academicYear.start_date);
        const currentEnd = new Date(academicYear.end_date);

        const nextStart = new Date(currentStart);
        nextStart.setFullYear(nextStart.getFullYear() + 1);

        const nextEnd = new Date(currentEnd);
        nextEnd.setFullYear(nextEnd.getFullYear() + 1);

        const nextStartStr = nextStart.toISOString().split('T')[0];
        const nextEndStr = nextEnd.toISOString().split('T')[0];

        // Format next year name e.g. "2027-2028"
        const startYearNum = nextStart.getFullYear();
        const endYearNum = nextEnd.getFullYear();
        const nextYearName = `${startYearNum}-${endYearNum}`;

        // Check if name exists to prevent unique key violation
        const nameExists = await AcademicYear.findOne({
          where: { school_id, year_name: nextYearName },
          transaction
        });

        if (!nameExists) {
          autoCreatedNextYear = await AcademicYear.create({
            school_id,
            year_name: nextYearName,
            start_date: nextStartStr,
            end_date: nextEndStr,
            is_active: false,
            status: 'UPCOMING',
            description: `Auto-generated upcoming session for ${nextYearName}`
          }, { transaction });
        }
      }

      await transaction.commit();

      let msg = `Academic year '${academicYear.year_name}' set as active.`;
      if (autoCreatedNextYear) {
        msg += ` Next academic year '${autoCreatedNextYear.year_name}' was automatically created as UPCOMING!`;
      }

      return this.sendResponse(res, { activeYear: academicYear, autoCreatedNextYear }, msg);
    } catch (error) {
      await transaction.rollback();
      console.error('Error setting active academic year:', error);
      return this.sendError(res, 'Failed to set active academic year', error.message, 500);
    }
  }

  /**
   * Delete an academic year
   * ACTIVE and COMPLETED academic sessions cannot be deleted for historical data integrity.
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const academicYear = await AcademicYear.findByPk(id);
      if (!academicYear) {
        return this.sendError(res, 'Academic year not found', null, 404);
      }

      if (academicYear.is_active || academicYear.status === 'ACTIVE' || academicYear.status === 'COMPLETED') {
        return this.sendError(res, 'Cannot delete ACTIVE or COMPLETED academic sessions to preserve historical data integrity.', null, 400);
      }

      await academicYear.destroy();
      return this.sendResponse(res, null, 'Academic year deleted successfully');
    } catch (error) {
      console.error('Error deleting academic year:', error);
      return this.sendError(res, 'Failed to delete academic year', error.message, 500);
    }
  }
}

module.exports = new AcademicYearController();
