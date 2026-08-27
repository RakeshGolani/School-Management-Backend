const BaseController = require('../BaseController');
const Bus = require('../../../Models/Bus');
const BusRoute = require('../../../Models/BusRoute');
const BusStop = require('../../../Models/BusStop');
const Student = require('../../../Models/Student');

class TransportController extends BaseController {
  constructor() {
    super();
    this.getRoutes = this.getRoutes.bind(this);
    this.createRoute = this.createRoute.bind(this);
    this.updateRoute = this.updateRoute.bind(this);
    this.deleteRoute = this.deleteRoute.bind(this);

    this.getStops = this.getStops.bind(this);
    this.createStop = this.createStop.bind(this);
    this.updateStop = this.updateStop.bind(this);
    this.deleteStop = this.deleteStop.bind(this);

    this.getBuses = this.getBuses.bind(this);
    this.createBus = this.createBus.bind(this);
    this.updateBus = this.updateBus.bind(this);
    this.deleteBus = this.deleteBus.bind(this);

    this.getAssignedStudents = this.getAssignedStudents.bind(this);
    this.updateStudentTransport = this.updateStudentTransport.bind(this);
    
    this.updateBusLocation = this.updateBusLocation.bind(this);
    this.getLiveLocations = this.getLiveLocations.bind(this);
  }

  // ===================== BUS ROUTES =====================

  async getRoutes(req, res) {
    try {
      const routes = await BusRoute.findAll({
        include: [{
          model: BusStop,
          as: 'stops',
          include: [{
            model: Student,
            as: 'students',
            attributes: ['id', 'first_name', 'last_name', 'admission_number', 'grade', 'section', 'photo', 'gender']
          }]
        }],
        order: [
          ['createdAt', 'DESC'],
          [{ model: BusStop, as: 'stops' }, 'sequence', 'ASC']
        ]
      });
      return this.sendResponse(res, routes, 'Bus routes retrieved successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to fetch bus routes');
    }
  }

  async createRoute(req, res) {
    try {
      const { route_name, route_code } = req.body;
      if (!route_name || !route_code) {
        return this.sendError(res, 'Route name and code are required', 400);
      }
      const existing = await BusRoute.findOne({ where: { route_code } });
      if (existing) {
        return this.sendError(res, 'Route code already exists', 400);
      }
      const route = await BusRoute.create({ route_name, route_code });
      return this.sendResponse(res, route, 'Bus route created successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to create bus route');
    }
  }

  async updateRoute(req, res) {
    try {
      const { id } = req.params;
      const { route_name, route_code } = req.body;
      const route = await this.findByUuidOrPk(BusRoute, id);
      if (!route) {
        return this.sendError(res, 'Bus route not found', 404);
      }
      await route.update({ route_name, route_code });
      return this.sendResponse(res, route, 'Bus route updated successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to update bus route');
    }
  }

  async deleteRoute(req, res) {
    try {
      const { id } = req.params;
      const route = await this.findByUuidOrPk(BusRoute, id);
      if (!route) {
        return this.sendError(res, 'Bus route not found', 404);
      }
      // Check if stops or buses are attached
      const stopsCount = await BusStop.count({ where: { route_id: id } });
      const busesCount = await Bus.count({ where: { route_id: id } });
      if (stopsCount > 0 || busesCount > 0) {
        return this.sendError(res, 'Cannot delete route. It has associated stops or buses.', 400);
      }
      await route.destroy();
      return this.sendResponse(res, null, 'Bus route deleted successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to delete bus route');
    }
  }

  // ===================== BUS STOPS =====================

  async getStops(req, res) {
    try {
      const stops = await BusStop.findAll({
        order: [
          ['route_id', 'ASC'],
          ['sequence', 'ASC']
        ]
      });
      return this.sendResponse(res, stops, 'Bus stops retrieved successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to fetch bus stops');
    }
  }

  async createStop(req, res) {
    try {
      const { route_id, stop_name, sequence, pickup_time, drop_off_time, latitude, longitude } = req.body;
      if (!route_id || !stop_name || sequence === undefined) {
        return this.sendError(res, 'Route ID, stop name, and sequence are required', 400);
      }
      const stop = await BusStop.create({ 
        route_id, 
        stop_name, 
        sequence, 
        pickup_time, 
        drop_off_time,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      });
      return this.sendResponse(res, stop, 'Bus stop created successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to create bus stop');
    }
  }

  async updateStop(req, res) {
    try {
      const { id } = req.params;
      const { route_id, stop_name, sequence, pickup_time, drop_off_time, latitude, longitude } = req.body;
      const stop = await this.findByUuidOrPk(BusStop, id);
      if (!stop) {
        return this.sendError(res, 'Bus stop not found', 404);
      }
      await stop.update({ 
        route_id, 
        stop_name, 
        sequence, 
        pickup_time, 
        drop_off_time,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : stop.latitude,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : stop.longitude
      });
      return this.sendResponse(res, stop, 'Bus stop updated successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to update bus stop');
    }
  }

  async deleteStop(req, res) {
    try {
      const { id } = req.params;
      const stop = await this.findByUuidOrPk(BusStop, id);
      if (!stop) {
        return this.sendError(res, 'Bus stop not found', 404);
      }
      await stop.destroy();
      return this.sendResponse(res, null, 'Bus stop deleted successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to delete bus stop');
    }
  }

  // ===================== BUSES =====================

  async getBuses(req, res) {
    try {
      const buses = await Bus.findAll({
        order: [['createdAt', 'DESC']]
      });
      return this.sendResponse(res, buses, 'Buses retrieved successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to fetch buses');
    }
  }

  async createBus(req, res) {
    try {
      const { bus_number, driver_name, driver_phone, route_id, device_id } = req.body;
      if (!bus_number || !driver_name) {
        return this.sendError(res, 'Bus number and driver name are required', 400);
      }
      const existing = await Bus.findOne({ where: { bus_number } });
      if (existing) {
        return this.sendError(res, 'Bus number already exists', 400);
      }
      const bus = await Bus.create({ bus_number, driver_name, driver_phone, route_id, device_id });
      return this.sendResponse(res, bus, 'Bus created successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to create bus');
    }
  }

  async updateBus(req, res) {
    try {
      const { id } = req.params;
      const { bus_number, driver_name, driver_phone, route_id, device_id } = req.body;
      const bus = await this.findByUuidOrPk(Bus, id);
      if (!bus) {
        return this.sendError(res, 'Bus not found', 404);
      }
      await bus.update({ bus_number, driver_name, driver_phone, route_id, device_id });
      return this.sendResponse(res, bus, 'Bus updated successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to update bus');
    }
  }

  async deleteBus(req, res) {
    try {
      const { id } = req.params;
      const bus = await this.findByUuidOrPk(Bus, id);
      if (!bus) {
        return this.sendError(res, 'Bus not found', 404);
      }
      await bus.destroy();
      return this.sendResponse(res, null, 'Bus deleted successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to delete bus');
    }
  }

  // ===================== STUDENT ASSIGNMENTS =====================

  async getAssignedStudents(req, res) {
    try {
      const students = await Student.findAll({
        where: { is_bus_service_enabled: true },
        order: [['first_name', 'ASC']]
      });
      return this.sendResponse(res, students, 'Bus subscribers retrieved successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to fetch assigned students');
    }
  }

  async updateStudentTransport(req, res) {
    try {
      const { id } = req.params; // Student ID
      const { is_bus_service_enabled, bus_route_id, bus_stop_id } = req.body;
      const student = await this.findByUuidOrPk(Student, id);
      if (!student) {
        return this.sendError(res, 'Student not found', 404);
      }
      
      const updateData = {};
      if (is_bus_service_enabled !== undefined) updateData.is_bus_service_enabled = is_bus_service_enabled;
      if (bus_route_id !== undefined) updateData.bus_route_id = bus_route_id === '' ? null : bus_route_id;
      if (bus_stop_id !== undefined) updateData.bus_stop_id = bus_stop_id === '' ? null : bus_stop_id;

      await student.update(updateData);
      return this.sendResponse(res, student, 'Student transport details updated successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to update student transport details');
    }
  }

  // ===================== LIVE TRACKING =====================

  async updateBusLocation(req, res) {
    try {
      const { device_id, bus_id, lat, lng } = req.body;
      
      let bus;
      if (device_id) {
        bus = await Bus.findOne({ where: { device_id } });
      } else if (bus_id) {
        bus = await Bus.findByPk(bus_id);
      }

      if (!bus) {
        return this.sendError(res, 'Bus not found', 404);
      }

      await bus.update({
        current_lat: lat,
        current_lng: lng,
        last_location_update: new Date()
      });

      // Broadcast via Socket.io to frontend
      if (req.io) {
        req.io.emit('busLocationUpdate', {
          bus_id: bus.id,
          bus_number: bus.bus_number,
          route_id: bus.route_id,
          lat,
          lng,
          last_update: bus.last_location_update
        });
      }

      return this.sendResponse(res, null, 'Location updated successfully');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to update location');
    }
  }

  async getLiveLocations(req, res) {
    try {
      const buses = await Bus.findAll({
        attributes: ['id', 'bus_number', 'driver_name', 'driver_phone', 'route_id', 'current_lat', 'current_lng', 'last_location_update']
      });
      return this.sendResponse(res, buses, 'Live locations retrieved');
    } catch (error) {
      console.error(error);
      return this.sendError(res, 'Failed to fetch live locations');
    }
  }
}

module.exports = new TransportController();
