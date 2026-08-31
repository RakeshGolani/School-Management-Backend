const { Package, PlanFeature, School, sequelize } = require('../../../Models');
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
   * List all plans/packages with features and school counts
   */
  static async index(req, res) {
    try {
      const packages = await Package.findAll({
        include: [
          {
            model: PlanFeature,
            as: 'features',
            required: false,
            attributes: ['id', 'uuid', 'feature_text', 'sort_order', 'is_active']
          }
        ],
        order: [
          ['sort_order', 'ASC'],
          ['id', 'ASC'],
          [{ model: PlanFeature, as: 'features' }, 'sort_order', 'ASC']
        ]
      });

      // Calculate school count per package
      const packageList = await Promise.all(packages.map(async (pkg) => {
        const count = await School.count({ where: { package_id: pkg.id } });
        const plain = pkg.toJSON();
        plain.schools_count = count;
        // Sort features by sort_order
        if (Array.isArray(plain.features)) {
          plain.features.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        return plain;
      }));

      return res.json({
        success: true,
        message: 'Plans fetched successfully',
        data: {
          packages: packageList,
          plans: packageList,
          system_modules: SYSTEM_MODULES
        }
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription plans',
        error: error.message
      });
    }
  }

  /**
   * Get single plan/package details with features
   */
  static async show(req, res) {
    try {
      const { id } = req.params;
      const pkg = await AdminPackageController.findByUuidOrPk(Package, id, {
        include: [
          {
            model: PlanFeature,
            as: 'features',
            required: false,
            attributes: ['id', 'uuid', 'feature_text', 'sort_order', 'is_active']
          }
        ],
        order: [
          [{ model: PlanFeature, as: 'features' }, 'sort_order', 'ASC']
        ]
      });

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }

      const schoolsCount = await School.count({ where: { package_id: pkg.id } });
      const data = pkg.toJSON();
      data.schools_count = schoolsCount;
      if (Array.isArray(data.features)) {
        data.features.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }

      return res.json({
        success: true,
        message: 'Plan details fetched',
        data
      });
    } catch (error) {
      console.error('Error fetching plan:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch plan details',
        error: error.message
      });
    }
  }

  /**
   * Update plan/package details, pricing, and sync plan_features table
   */
  static async update(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { 
        name, 
        tagline, 
        description, 
        badge_text, 
        badge_color, 
        icon, 
        monthly_price, 
        annual_price, 
        currency, 
        currency_symbol, 
        is_popular, 
        base_students_limit,
        base_buses_limit,
        modules, 
        is_active, 
        sort_order,
        features 
      } = req.body;

      const pkg = await AdminPackageController.findByUuidOrPk(Package, id, { transaction: t });
      if (!pkg) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }

      await pkg.update({
        name: name !== undefined ? name : pkg.name,
        tagline: tagline !== undefined ? tagline : pkg.tagline,
        description: description !== undefined ? description : pkg.description,
        badge_text: badge_text !== undefined ? badge_text : pkg.badge_text,
        badge_color: badge_color !== undefined ? badge_color : pkg.badge_color,
        icon: icon !== undefined ? icon : pkg.icon,
        monthly_price: monthly_price !== undefined ? parseFloat(monthly_price) || 0 : pkg.monthly_price,
        annual_price: annual_price !== undefined ? parseFloat(annual_price) || 0 : pkg.annual_price,
        currency: currency !== undefined ? currency : pkg.currency,
        currency_symbol: currency_symbol !== undefined ? currency_symbol : pkg.currency_symbol,
        is_popular: is_popular !== undefined ? is_popular : pkg.is_popular,
        base_students_limit: base_students_limit !== undefined ? parseInt(base_students_limit, 10) : pkg.base_students_limit,
        base_buses_limit: base_buses_limit !== undefined ? parseInt(base_buses_limit, 10) : pkg.base_buses_limit,
        modules: modules !== undefined ? modules : pkg.modules,
        is_active: is_active !== undefined ? is_active : pkg.is_active,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : pkg.sort_order
      }, { transaction: t });

      // Sync relational features in plan_features table if provided
      if (Array.isArray(features)) {
        // Delete existing features for this plan
        await PlanFeature.destroy({
          where: { plan_id: pkg.id },
          transaction: t
        });

        // Insert incoming features
        const featureRecords = features
          .map((f, index) => {
            const featureText = typeof f === 'string' ? f.trim() : (f?.feature_text || '').trim();
            if (!featureText) return null;
            return {
              plan_id: pkg.id,
              feature_text: featureText,
              sort_order: (typeof f === 'object' && f?.sort_order !== undefined) ? f.sort_order : index + 1,
              is_active: (typeof f === 'object' && f?.is_active !== undefined) ? f.is_active : true
            };
          })
          .filter(Boolean);

        if (featureRecords.length > 0) {
          await PlanFeature.bulkCreate(featureRecords, { transaction: t });
        }
      }

      await t.commit();

      // Fetch refreshed plan with features
      const updatedPlan = await AdminPackageController.findByUuidOrPk(Package, pkg.id, {
        include: [
          {
            model: PlanFeature,
            as: 'features',
            attributes: ['id', 'uuid', 'feature_text', 'sort_order', 'is_active']
          }
        ],
        order: [
          [{ model: PlanFeature, as: 'features' }, 'sort_order', 'ASC']
        ]
      });

      return res.json({
        success: true,
        message: 'Plan updated successfully',
        data: updatedPlan
      });
    } catch (error) {
      await t.rollback();
      console.error('Error updating plan:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update plan',
        error: error.message
      });
    }
  }
}

module.exports = AdminPackageController;
