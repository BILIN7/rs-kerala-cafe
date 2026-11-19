let io;

const initSocketService = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('joinOrderRoom', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined order room: order_${orderId}`);
    });

    socket.on('joinAdminRoom', () => {
      socket.join('admin_room');
      console.log(`Admin socket ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => io;

module.exports = { initSocketService, getIO };
