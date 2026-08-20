const BaseController = require('../BaseController');
const socketService = require('../../../Services/SocketService');

/**
 * AdminSocketController
 * Provides endpoints for Super Admin to monitor active socket clients, view real-time connection logs, and broadcast events.
 */
class AdminSocketController extends BaseController {
  constructor() {
    super();
    this.getMetrics = this.getMetrics.bind(this);
    this.getLogs = this.getLogs.bind(this);
    this.getClients = this.getClients.bind(this);
    this.disconnectClient = this.disconnectClient.bind(this);
    this.broadcast = this.broadcast.bind(this);
    this.clearLogs = this.clearLogs.bind(this);
  }

  /**
   * Get live socket metrics and gateway health
   */
  async getMetrics(req, res) {
    try {
      const metrics = socketService.getMetrics();
      return this.sendResponse(res, metrics, 'Socket metrics retrieved successfully');
    } catch (error) {
      console.error('Error fetching socket metrics:', error);
      return this.sendError(res, 'Failed to fetch socket metrics', 500);
    }
  }

  /**
   * Get paginated and filtered socket activity logs
   */
  async getLogs(req, res) {
    try {
      const { page, limit, eventType, search } = req.query;
      const result = socketService.getLogs({ page, limit, eventType, search });
      return this.sendResponse(res, result, 'Socket logs retrieved successfully');
    } catch (error) {
      console.error('Error fetching socket logs:', error);
      return this.sendError(res, 'Failed to fetch socket logs', 500);
    }
  }

  /**
   * Get list of currently connected active socket clients
   */
  async getClients(req, res) {
    try {
      const clients = socketService.getActiveClients();
      return this.sendResponse(res, clients, 'Active socket clients retrieved successfully');
    } catch (error) {
      console.error('Error fetching socket clients:', error);
      return this.sendError(res, 'Failed to fetch active clients', 500);
    }
  }

  /**
   * Force disconnect a specific client socket
   */
  async disconnectClient(req, res) {
    try {
      const { socketId } = req.params;
      const { reason } = req.body;

      if (!socketId) {
        return this.sendError(res, 'Socket ID is required', 400);
      }

      const success = socketService.disconnectClient(socketId, reason);
      if (!success) {
        return this.sendError(res, 'Client socket not found or already disconnected', 404);
      }

      return this.sendResponse(res, { socketId }, 'Socket client disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting socket client:', error);
      return this.sendError(res, 'Failed to disconnect socket client', 500);
    }
  }

  /**
   * Broadcast message to connected sockets or rooms
   */
  async broadcast(req, res) {
    try {
      const { message, type, targetRoom } = req.body;

      if (!message || !message.trim()) {
        return this.sendError(res, 'Broadcast message cannot be empty', 400);
      }

      const payload = socketService.broadcast(message, type || 'info', targetRoom || null);
      return this.sendResponse(res, payload, 'Broadcast message sent successfully');
    } catch (error) {
      console.error('Error sending socket broadcast:', error);
      return this.sendError(res, 'Failed to send broadcast message', 500);
    }
  }

  /**
   * Clear in-memory log history
   */
  async clearLogs(req, res) {
    try {
      socketService.clearLogs();
      return this.sendResponse(res, null, 'Socket logs cleared successfully');
    } catch (error) {
      console.error('Error clearing socket logs:', error);
      return this.sendError(res, 'Failed to clear socket logs', 500);
    }
  }
}

module.exports = new AdminSocketController();
