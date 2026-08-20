/**
 * SocketService
 * In-memory real-time tracking, metrics, client management, and event logging for Socket.IO.
 */
class SocketService {
  constructor() {
    this.io = null;
    this.logs = [];
    this.maxLogs = 500;
    this.metrics = {
      totalConnections: 0,
      totalDisconnections: 0,
      totalEventsEmitted: 0,
      startedAt: new Date()
    };
  }

  init(io) {
    this.io = io;

    this.io.on('connection', (socket) => {
      this.metrics.totalConnections++;
      
      const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                       socket.handshake.address || 
                       '127.0.0.1';
      const transport = socket.conn.transport.name; // 'polling' or 'websocket'
      const userAgent = socket.handshake.headers['user-agent'] || 'Unknown Device';

      this.logEvent({
        eventType: 'CONNECT',
        socketId: socket.id,
        transport,
        ip: clientIp,
        userAgent,
        details: 'Client established connection with Socket.IO gateway',
        metadata: {
          query: socket.handshake.query
        }
      });

      // Transport upgrade listener
      socket.conn.on('upgrade', (newTransport) => {
        this.logEvent({
          eventType: 'TRANSPORT_UPGRADE',
          socketId: socket.id,
          transport: newTransport.name,
          ip: clientIp,
          details: `Connection transport upgraded to ${newTransport.name}`
        });
      });

      // Join specific room
      socket.on('joinRoute', (routeId) => {
        socket.join(`route_${routeId}`);
        this.logEvent({
          eventType: 'JOIN_ROOM',
          socketId: socket.id,
          transport: socket.conn.transport.name,
          ip: clientIp,
          details: `Joined tracking room: route_${routeId}`,
          metadata: { room: `route_${routeId}`, routeId }
        });
      });

      socket.on('joinSchoolRoom', (schoolId) => {
        socket.join(`school_${schoolId}`);
        this.logEvent({
          eventType: 'JOIN_ROOM',
          socketId: socket.id,
          transport: socket.conn.transport.name,
          ip: clientIp,
          details: `Joined school room: school_${schoolId}`,
          metadata: { room: `school_${schoolId}`, schoolId }
        });
      });

      // Bus telemetry update
      socket.on('updateBusLocation', (data) => {
        this.metrics.totalEventsEmitted++;
        this.io.emit('busLocationUpdate', data);
        this.logEvent({
          eventType: 'BUS_UPDATE',
          socketId: socket.id,
          transport: socket.conn.transport.name,
          ip: clientIp,
          details: `Bus #${data.bus_number || data.bus_id} location telemetry broadcasted`,
          metadata: data
        });
      });

      // Disconnect listener
      socket.on('disconnect', (reason) => {
        this.metrics.totalDisconnections++;
        this.logEvent({
          eventType: 'DISCONNECT',
          socketId: socket.id,
          transport: socket.conn?.transport?.name || 'unknown',
          ip: clientIp,
          details: `Client disconnected: ${reason}`,
          metadata: { reason }
        });
      });

      // Error listener
      socket.on('error', (err) => {
        this.logEvent({
          eventType: 'ERROR',
          socketId: socket.id,
          transport: socket.conn?.transport?.name || 'unknown',
          ip: clientIp,
          details: `Socket error: ${err.message || err}`,
          metadata: { error: String(err) }
        });
      });
    });

    console.log('[SocketService] Real-time tracking and logging initialized.');
  }

  logEvent({ eventType, socketId, transport = 'websocket', ip = '127.0.0.1', userAgent = '', details = '', metadata = null }) {
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toISOString(),
      eventType,
      socketId,
      transport,
      ip,
      userAgent,
      details,
      metadata
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  getMetrics() {
    if (!this.io) {
      return {
        activeSocketsCount: 0,
        totalConnections: 0,
        totalDisconnections: 0,
        totalEventsEmitted: 0,
        roomsCount: 0,
        uptimeSeconds: 0,
        gatewayStatus: 'offline'
      };
    }

    const socketsCount = this.io.sockets.sockets.size;
    const roomsCount = this.io.sockets.adapter.rooms.size;
    const uptimeSeconds = Math.floor((Date.now() - new Date(this.metrics.startedAt).getTime()) / 1000);

    return {
      activeSocketsCount: socketsCount,
      totalConnections: this.metrics.totalConnections,
      totalDisconnections: this.metrics.totalDisconnections,
      totalEventsEmitted: this.metrics.totalEventsEmitted,
      roomsCount,
      uptimeSeconds,
      startedAt: this.metrics.startedAt,
      gatewayStatus: 'healthy'
    };
  }

  getLogs({ page = 1, limit = 20, eventType, search }) {
    let filtered = [...this.logs];

    if (eventType && eventType !== 'ALL') {
      filtered = filtered.filter(l => l.eventType === eventType);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(l => 
        (l.socketId && l.socketId.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.ip && l.ip.includes(q)) ||
        (l.eventType && l.eventType.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    return {
      data: paginated,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    };
  }

  getActiveClients() {
    if (!this.io) return [];

    const clients = [];
    for (const [id, socket] of this.io.sockets.sockets) {
      const rooms = Array.from(socket.rooms).filter(r => r !== id);
      clients.push({
        socketId: id,
        transport: socket.conn?.transport?.name || 'websocket',
        ip: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || '127.0.0.1',
        connectedAt: socket.handshake.time,
        rooms,
        query: socket.handshake.query
      });
    }

    return clients;
  }

  disconnectClient(socketId, reason = 'Force disconnected by administrator') {
    if (!this.io) return false;
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      this.logEvent({
        eventType: 'FORCE_DISCONNECT',
        socketId,
        transport: socket.conn?.transport?.name || 'websocket',
        ip: socket.handshake.address || '127.0.0.1',
        details: `Client disconnected by Admin: ${reason}`,
        metadata: { reason }
      });
      socket.disconnect(true);
      return true;
    }
    return false;
  }

  broadcast(message, type = 'info', targetRoom = null) {
    if (!this.io) return false;

    const payload = {
      id: 'bc_' + Date.now(),
      title: 'System Broadcast',
      message,
      type,
      timestamp: new Date().toISOString()
    };

    if (targetRoom) {
      this.io.to(targetRoom).emit('systemBroadcast', payload);
    } else {
      this.io.emit('systemBroadcast', payload);
    }

    this.metrics.totalEventsEmitted++;
    this.logEvent({
      eventType: 'BROADCAST',
      socketId: 'SERVER_ADMIN',
      transport: 'server',
      details: `Admin broadcast sent: "${message}"`,
      metadata: { targetRoom: targetRoom || 'ALL', payload }
    });

    return payload;
  }

  clearLogs() {
    this.logs = [];
    return true;
  }
}

module.exports = new SocketService();
