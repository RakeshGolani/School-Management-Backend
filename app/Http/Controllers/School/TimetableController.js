const { PeriodSlot, Timetable, TeacherProxy, Teacher, SchoolClass, AcademicYear, sequelize } = require('../../../Models');
const { Op } = require('sequelize');

class TimetableController {
  // --- Period Slots Management ---
  async getPeriodSlots(req, res) {
    try {
      const school_id = req.school_id || 1;
      const { academic_year_id } = req.query;

      const whereClause = { school_id };
      if (academic_year_id) whereClause.academic_year_id = academic_year_id;

      const slots = await PeriodSlot.findAll({
        where: whereClause,
        order: [['period_number', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        data: slots
      });
    } catch (error) {
      console.error('Error fetching period slots:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async createOrUpdatePeriodSlot(req, res) {
    try {
      const school_id = req.school_id || 1;
      const { id, academic_year_id, period_number, title, start_time, end_time, is_break } = req.body;

      if (!period_number || !title || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
      }

      if (id) {
        const slot = await PeriodSlot.findOne({ where: { id, school_id } });
        if (!slot) return res.status(404).json({ success: false, message: 'Period slot not found' });

        await slot.update({ academic_year_id, period_number, title, start_time, end_time, is_break });
        return res.status(200).json({ success: true, message: 'Period slot updated successfully', data: slot });
      } else {
        const newSlot = await PeriodSlot.create({
          school_id,
          academic_year_id: academic_year_id || null,
          period_number,
          title,
          start_time,
          end_time,
          is_break: is_break || false
        });
        return res.status(201).json({ success: true, message: 'Period slot created successfully', data: newSlot });
      }
    } catch (error) {
      console.error('Error saving period slot:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async deletePeriodSlot(req, res) {
    try {
      const school_id = req.school_id || 1;
      const { id } = req.params;

      const deleted = await PeriodSlot.destroy({ where: { id, school_id } });
      if (!deleted) return res.status(404).json({ success: false, message: 'Period slot not found' });

      return res.status(200).json({ success: true, message: 'Period slot deleted successfully' });
    } catch (error) {
      console.error('Error deleting period slot:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // --- Timetable Allocation & Conflict Checks ---
  async allocateSlot(req, res) {
    try {
      const school_id = req.school_id || 1;
      const { id, class_id, subject_name, teacher_id, period_slot_id, day_of_week, academic_year_id, room_number } = req.body;

      if (!class_id || !subject_name || !teacher_id || !period_slot_id || !day_of_week) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Check 1: Teacher Conflict Check
      const teacherConflictWhere = {
        school_id,
        teacher_id,
        period_slot_id,
        day_of_week
      };
      if (academic_year_id) teacherConflictWhere.academic_year_id = academic_year_id;
      if (id) teacherConflictWhere.id = { [Op.ne]: id };

      const teacherConflict = await Timetable.findOne({
        where: teacherConflictWhere,
        include: [{ model: SchoolClass, as: 'schoolClass', attributes: ['class_name', 'section'] }]
      });

      if (teacherConflict) {
        const className = teacherConflict.schoolClass ? `${teacherConflict.schoolClass.class_name} ${teacherConflict.schoolClass.section || ''}` : 'another class';
        return res.status(400).json({
          success: false,
          conflictType: 'TEACHER_BUSY',
          message: `Teacher is already assigned to ${className} on ${day_of_week} in this period slot!`
        });
      }

      // Check 2: Class Conflict Check
      const classConflictWhere = {
        school_id,
        class_id,
        period_slot_id,
        day_of_week
      };
      if (academic_year_id) classConflictWhere.academic_year_id = academic_year_id;
      if (id) classConflictWhere.id = { [Op.ne]: id };

      const classConflict = await Timetable.findOne({ where: classConflictWhere });
      if (classConflict) {
        return res.status(400).json({
          success: false,
          conflictType: 'CLASS_SLOT_TAKEN',
          message: `Class already has an assigned period slot on ${day_of_week}!`
        });
      }

      // Save Allocation
      if (id) {
        const entry = await Timetable.findOne({ where: { id, school_id } });
        if (!entry) return res.status(404).json({ success: false, message: 'Timetable allocation not found' });

        await entry.update({ class_id, subject_name, teacher_id, period_slot_id, day_of_week, academic_year_id, room_number });
        return res.status(200).json({ success: true, message: 'Period allocated updated successfully', data: entry });
      } else {
        const newEntry = await Timetable.create({
          school_id,
          academic_year_id: academic_year_id || null,
          class_id,
          subject_name,
          teacher_id,
          period_slot_id,
          day_of_week,
          room_number: room_number || null
        });
        return res.status(201).json({ success: true, message: 'Period allocated successfully', data: newEntry });
      }
    } catch (error) {
      console.error('Error allocating timetable slot:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async deleteAllocation(req, res) {
    try {
      const school_id = req.school_id || 1;
      const { id } = req.params;

      const deleted = await Timetable.destroy({ where: { id, school_id } });
      if (!deleted) return res.status(404).json({ success: false, message: 'Timetable entry not found' });

      return res.status(200).json({ success: true, message: 'Period unallocated successfully' });
    } catch (error) {
      console.error('Error deleting timetable allocation:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // --- Schedule Views ---
  async getClassTimetable(req, res) {
    try {
      const school_id = req.school_id || 1;
      const { class_id } = req.params;
      const { academic_year_id } = req.query;

      const whereClause = { school_id, class_id };
      if (academic_year_id) whereClause.academic_year_id = academic_year_id;

      const allocations = await Timetable.findAll({
        where: whereClause,
        include: [
          { model: Teacher, as: 'teacher', attributes: ['id', 'name', 'email'] },
          { model: PeriodSlot, as: 'periodSlot' }
        ]
      });

      return res.status(200).json({ success: true, data: allocations });
    } catch (error) {
      console.error('Error fetching class timetable:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getTeacherTimetable(req, res) {
    try {
      const school_id = req.school_id || 1;
      const { teacher_id } = req.params;
      const { academic_year_id } = req.query;

      const whereClause = { school_id, teacher_id };
      if (academic_year_id) whereClause.academic_year_id = academic_year_id;

      const allocations = await Timetable.findAll({
        where: whereClause,
        include: [
          { model: SchoolClass, as: 'schoolClass', attributes: ['id', 'name', 'section'] },
          { model: PeriodSlot, as: 'periodSlot' }
        ]
      });

      return res.status(200).json({ success: true, data: allocations });
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // --- Daily Substitutions / Proxies ---
  async assignProxy(req, res) {
    try {
      const { timetable_id, date, original_teacher_id, substitute_teacher_id, reason } = req.body;

      if (!timetable_id || !date || !original_teacher_id || !substitute_teacher_id) {
        return res.status(400).json({ success: false, message: 'Missing required proxy details' });
      }

      const proxy = await TeacherProxy.create({
        timetable_id,
        date,
        original_teacher_id,
        substitute_teacher_id,
        reason: reason || 'Teacher on Leave',
        status: 'ASSIGNED'
      });

      return res.status(201).json({ success: true, message: 'Proxy teacher assigned successfully', data: proxy });
    } catch (error) {
      console.error('Error assigning proxy:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new TimetableController();
