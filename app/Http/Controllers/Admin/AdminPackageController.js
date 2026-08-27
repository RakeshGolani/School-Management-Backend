const { Package, School } = require('../../../Models');
const ApiResponse = require('../../../Traits/ApiResponse');
const { SYSTEM_MODULES } = require('../../../../config/modules');

class AdminPackageController {
  /**
   * Helper to find model by UUID or Primary Key
   */
  static async findByUuidOrPk(Model, identifier, options = {}) {
    if (!identifier) return null;
    const isUuid = typeof identifier === 'string' && identifier.includes('-');
    if (isUuid || isNaN(identifier)) {
      return await Model.findOne({
        where: { uuid: identifier },
        ...options
      });
    }
    const { Op } = require('sequelize');
    return await Model.findOne({
      where: {
        [Op.or]: [
          { uuid: identifier },
          { id: parseInt(identifier, 10) }
        ]
      },
      ...options
    });
  }

  /**
   * List all packages with school counts
   */
  static async index(req, res) {
    try {
      const packages = await Package.findAll({
        order: [['sort_order', 'ASC'], ['id', 'ASC']]
      });

      // Calculate school count per package
      const packageList = await Promise.all(packages.map(async (pkg) => {
        const count = await School.count({ where: { package_id: pkg.id } });
        const plain = pkg.toJSON();
        plain.schools_count = count;
        return plain;
      }));

      return res.json({
        success: true,
        message: 'Packages fetched successfully',
        data: {
          packages: packageList,
          system_modules: SYSTEM_MODULES
        }
      });
    } catch (error) {
      console.error('Error fetching packages:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch packages',
        error: error.message
      });
    }
  }

  /**
   * Get single package details
   */
  static async show(req, res) {
    try {
      const { id } = req.params;
      const pkg = await AdminPackageController.findByUuidOrPk(Package, id);

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      const schoolsCount = await School.count({ where: { package_id: pkg.id } });
      const data = pkg.toJSON();
      data.schools_count = schoolsCount;

      return res.json({
        success: true,
        message: 'Package details fetched',
        data
      });
    } catch (error) {
      console.error('Error fetching package:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch package details',
        error: error.message
      });
    }
  }

  /**
   * Update package details or enabled modules
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, icon, badge_color, modules, is_active, sort_order } = req.body;

      const pkg = await AdminPackageController.findByUuidOrPk(Package, id);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      await pkg.update({
        name: name !== undefined ? name : pkg.name,
        description: description !== undefined ? description : pkg.description,
        icon: icon !== undefined ? icon : pkg.icon,
        badge_color: badge_color !== undefined ? badge_color : pkg.badge_color,
        modules: modules !== undefined ? modules : pkg.modules,
        is_active: is_active !== undefined ? is_active : pkg.is_active,
        sort_order: sort_order !== undefined ? sort_order : pkg.sort_order
      });

      return res.json({
        success: true,
        message: 'Package updated successfully',
        data: pkg
      });
    } catch (error) {
      console.error('Error updating package:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update package',
        error: error.message
      });
    }
  }
}

module.exports = AdminPackageController;
