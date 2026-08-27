const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Layers'
  },
  badge_color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'indigo'
  },
  modules: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('modules');
      if (!rawValue) return [];
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return Array.isArray(rawValue) ? rawValue : [];
    },
    set(val) {
      if (Array.isArray(val)) {
        this.setDataValue('modules', val);
      } else if (typeof val === 'string') {
        try {
          this.setDataValue('modules', JSON.parse(val));
        } catch (e) {
          this.setDataValue('modules', []);
        }
      } else {
        this.setDataValue('modules', []);
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'packages',
  timestamps: true,
  paranoid: true
});

module.exports = Package;
