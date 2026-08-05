const sequelize = require('../../config/database');
const School = require('./School');
const Admin = require('./Admin');
const Teacher = require('./Teacher');
const Parent = require('./Parent');
const Student = require('./Student');
const BusRoute = require('./BusRoute');
const BusStop = require('./BusStop');
const Bus = require('./Bus');
const AttendanceLog = require('./AttendanceLog');
const BusAttendanceLog = require('./BusAttendanceLog');

// 1. Parent - Student Relationships
Parent.hasMany(Student, { foreignKey: 'parent_id', as: 'children' });
Student.belongsTo(Parent, { foreignKey: 'parent_id', as: 'parent' });

// School - Teacher Relationships
School.hasMany(Teacher, { foreignKey: 'school_id', as: 'teachers' });
Teacher.belongsTo(School, { foreignKey: 'school_id', as: 'school' });


// 2. BusRoute - BusStop Relationships
BusRoute.hasMany(BusStop, { foreignKey: 'route_id', as: 'stops' });
BusStop.belongsTo(BusRoute, { foreignKey: 'route_id', as: 'route' });

// 3. BusRoute - Bus Relationships
BusRoute.hasMany(Bus, { foreignKey: 'route_id', as: 'buses' });
Bus.belongsTo(BusRoute, { foreignKey: 'route_id', as: 'route' });

// 4. Student - BusRoute / BusStop (Optional Transport subscription)
Student.belongsTo(BusRoute, { foreignKey: 'bus_route_id', as: 'busRoute' });
Student.belongsTo(BusStop, { foreignKey: 'bus_stop_id', as: 'busStop' });

// 5. Student - AttendanceLog
Student.hasMany(AttendanceLog, { foreignKey: 'student_id', as: 'attendanceLogs' });
AttendanceLog.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// 6. Student - BusAttendanceLog
Student.hasMany(BusAttendanceLog, { foreignKey: 'student_id', as: 'busAttendanceLogs' });
BusAttendanceLog.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// 7. Bus - BusAttendanceLog
Bus.hasMany(BusAttendanceLog, { foreignKey: 'bus_id', as: 'scanLogs' });
BusAttendanceLog.belongsTo(Bus, { foreignKey: 'bus_id', as: 'bus' });

// 8. BusRoute - BusAttendanceLog
BusRoute.hasMany(BusAttendanceLog, { foreignKey: 'route_id', as: 'scanLogs' });
BusAttendanceLog.belongsTo(BusRoute, { foreignKey: 'route_id', as: 'route' });

// 9. BusStop - BusAttendanceLog
BusStop.hasMany(BusAttendanceLog, { foreignKey: 'stop_id', as: 'scanLogs' });
BusAttendanceLog.belongsTo(BusStop, { foreignKey: 'stop_id', as: 'stop' });

module.exports = {
  sequelize,
  School,
  Admin,
  Teacher,
  Parent,
  Student,
  BusRoute,
  BusStop,
  Bus,
  AttendanceLog,
  BusAttendanceLog
};
