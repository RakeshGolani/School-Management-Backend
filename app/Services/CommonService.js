const db = require('../Models');

const models = {
  school: db.School,
  admin: db.Admin,
  teacher: db.Teacher,
  parent: db.Parent,
  student: db.Student,
  bus_route: db.BusRoute,
  bus_stop: db.BusStop,
  bus: db.Bus
};

class CommonService {
  static async updateStatus(module, id, status) {
    const Model = models[module];
    if (!Model) {
      throw { status: 400, message: "Invalid module specified" };
    }

    const entity = await Model.findByPk(id);
    if (!entity) {
      throw { status: 404, message: `${module} not found` };
    }

    entity.status = status;
    await entity.save();

    return { id: entity.id, status: entity.status };
  }

  static async deleteEntity(module, id) {
    const Model = models[module];
    if (!Model) {
      throw { status: 400, message: "Invalid module specified" };
    }

    const entity = await Model.findByPk(id);
    if (!entity) {
      throw { status: 404, message: `${module} not found` };
    }

    await entity.destroy();
    return { id };
  }
}

module.exports = CommonService;
