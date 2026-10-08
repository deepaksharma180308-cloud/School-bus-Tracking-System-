const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'school_bus_secret_key_2024';
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
//  In-Memory Database (Seed Data)
// ─────────────────────────────────────────────

const db = {
  users: [
    { id: 'u1', name: 'Admin User',       email: 'admin@school.com',     password: bcrypt.hashSync('admin123', 8),     role: 'admin',     phone: '9876543210', avatar: null },
    { id: 'u2', name: 'Rajan Kumar',      email: 'driver@school.com',    password: bcrypt.hashSync('driver123', 8),    role: 'driver',    phone: '9876501234', avatar: null },
    { id: 'u3', name: 'Suresh Patel',     email: 'conductor@school.com', password: bcrypt.hashSync('conductor123', 8), role: 'conductor', phone: '9876509876', avatar: null },
    { id: 'u4', name: 'Priya Sharma',     email: 'parent1@school.com',   password: bcrypt.hashSync('parent123', 8),    role: 'parent',    phone: '9876511111', avatar: null, studentId: 's1' },
    { id: 'u5', name: 'Amit Verma',       email: 'parent2@school.com',   password: bcrypt.hashSync('parent123', 8),    role: 'parent',    phone: '9876522222', avatar: null, studentId: 's2' },
    { id: 'u6', name: 'Deepa Nair',       email: 'parent3@school.com',   password: bcrypt.hashSync('parent123', 8),    role: 'parent',    phone: '9876533333', avatar: null, studentId: 's3' },
    { id: 'u7', name: 'Kavitha Rao',      email: 'parent4@school.com',   password: bcrypt.hashSync('parent123', 8),    role: 'parent',    phone: '9876544444', avatar: null, studentId: 's4' },
    { id: 'u8', name: 'Mohit Singh',      email: 'parent5@school.com',   password: bcrypt.hashSync('parent123', 8),    role: 'parent',    phone: '9876555555', avatar: null, studentId: 's5' },
  ],

  drivers: [
    {
      id: 'dr1',
      userId: 'u2',
      name: 'Rajan Kumar',
      phone: '9876501234',
      licenseNumber: 'TN0420190012345',
      busNumber: 'TN-38-AB-1234',
      busId: 'b1',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajan',
      experience: '8 years',
      rating: 4.5,
    },
  ],

  buses: [
    {
      id: 'b1',
      number: 'TN-38-AB-1234',
      driverId: 'dr1',
      conductorId: 'u3',
      capacity: 40,
      route: 'Route A - Morning',
      routeStops: [
        { name: 'Gandhi Nagar', lat: 11.0168, lng: 76.9558, order: 1 },
        { name: 'RS Puram',     lat: 11.0020, lng: 76.9620, order: 2 },
        { name: 'Gandhipuram',  lat: 11.0168, lng: 76.9820, order: 3 },
        { name: 'Peelamedu',    lat: 11.0258, lng: 77.0160, order: 4 },
        { name: 'School',       lat: 11.0400, lng: 77.0300, order: 5 },
      ],
      tripActive: false,
      currentLocation: { lat: 11.0168, lng: 76.9558 },
      speed: 0,
      heading: 0,
      lastUpdate: new Date().toISOString(),
    },
  ],

  students: [
    { id: 's1', name: 'Arjun Sharma',    class: '5-A', busId: 'b1', parentId: 'u4', stopName: 'Gandhi Nagar', qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped' },
    { id: 's2', name: 'Sneha Verma',     class: '3-B', busId: 'b1', parentId: 'u5', stopName: 'RS Puram',     qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped' },
    { id: 's3', name: 'Kiran Nair',      class: '7-C', busId: 'b1', parentId: 'u6', stopName: 'Gandhipuram',  qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped' },
    { id: 's4', name: 'Divya Rao',       class: '2-A', busId: 'b1', parentId: 'u7', stopName: 'Peelamedu',   qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped' },
    { id: 's5', name: 'Rohit Singh',     class: '6-D', busId: 'b1', parentId: 'u8', stopName: 'RS Puram',     qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped' },
    { id: 's6', name: 'Pooja Reddy',     class: '4-B', busId: 'b1', parentId: null, stopName: 'Gandhi Nagar', qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped' },
    { id: 's7', name: 'Aditya Kumar',    class: '8-A', busId: 'b1', parentId: null, stopName: 'Peelamedu',   qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped' },
    { id: 's8', name: 'Meena Krishnan',  class: '1-C', busId: 'b1', parentId: null, stopName: 'Gandhipuram',  qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped' },
  ],

  notifications: [],
  sosAlerts: [],
  feedback: [
    { id: 'f1', parentId: 'u4', busId: 'b1', driverId: 'dr1', rating: 5, message: 'Driver is very punctual and polite. Highly satisfied!', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'f2', parentId: 'u5', busId: 'b1', driverId: 'dr1', rating: 4, message: 'Good service overall. Sometimes the bus is 5 mins late.', createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 'f3', parentId: 'u6', busId: 'b1', driverId: 'dr1', rating: 5, message: 'Very safe driving. My child feels secure.', createdAt: new Date(Date.now() - 259200000).toISOString() },
  ],
};

// Pre-generate QR codes for students
async function initQRCodes() {
  for (const student of db.students) {
    const qrData = JSON.stringify({ studentId: student.id, name: student.name, busId: student.busId });
    student.qrCode = await QRCode.toDataURL(qrData);
  }
  console.log('✅ QR codes generated for all students');
}

initQRCodes();

// ─────────────────────────────────────────────
//  Auth Middleware
// ─────────────────────────────────────────────

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ─────────────────────────────────────────────
//  Auth Routes
// ─────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...userWithoutPass } = user;
  res.json({ token, user: userWithoutPass });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userWithoutPass } = user;
  res.json(userWithoutPass);
});

// ─────────────────────────────────────────────
//  Bus Routes
// ─────────────────────────────────────────────

app.get('/api/buses', authenticateToken, (req, res) => {
  res.json(db.buses);
});

app.get('/api/buses/:id', authenticateToken, (req, res) => {
  const bus = db.buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  res.json(bus);
});

app.post('/api/buses/:id/trip/start', authenticateToken, (req, res) => {
  const bus = db.buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  bus.tripActive = true;
  bus.lastUpdate = new Date().toISOString();
  // Reset all student statuses
  db.students.filter(s => s.busId === bus.id).forEach(s => {
    s.boardingStatus = 'not_boarded';
    s.dropStatus = 'not_dropped';
  });
  io.emit('trip_started', { busId: bus.id, bus });
  addNotificationToAll('Trip Started', `Bus ${bus.number} has started its trip.`, 'info');
  res.json({ message: 'Trip started', bus });
});

app.post('/api/buses/:id/trip/stop', authenticateToken, (req, res) => {
  const bus = db.buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  bus.tripActive = false;
  bus.speed = 0;
  bus.lastUpdate = new Date().toISOString();
  io.emit('trip_stopped', { busId: bus.id, bus });
  addNotificationToAll('Trip Ended', `Bus ${bus.number} has completed its trip.`, 'success');
  res.json({ message: 'Trip stopped', bus });
});

app.post('/api/buses/:id/location', authenticateToken, (req, res) => {
  const bus = db.buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  const { lat, lng, speed, heading } = req.body;
  bus.currentLocation = { lat, lng };
  bus.speed = speed || 0;
  bus.heading = heading || 0;
  bus.lastUpdate = new Date().toISOString();
  io.emit('bus_location_update', { busId: bus.id, lat, lng, speed: bus.speed, heading: bus.heading, timestamp: bus.lastUpdate });
  res.json({ message: 'Location updated' });
});

// ─────────────────────────────────────────────
//  Driver Routes
// ─────────────────────────────────────────────

app.get('/api/drivers', authenticateToken, (req, res) => {
  res.json(db.drivers);
});

app.get('/api/drivers/:id', authenticateToken, (req, res) => {
  const driver = db.drivers.find(d => d.id === req.params.id || d.userId === req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  res.json(driver);
});

app.put('/api/drivers/:id', authenticateToken, (req, res) => {
  const driver = db.drivers.find(d => d.id === req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  Object.assign(driver, req.body);
  res.json(driver);
});

// ─────────────────────────────────────────────
//  Student Routes
// ─────────────────────────────────────────────

app.get('/api/students', authenticateToken, (req, res) => {
  const { busId, parentId } = req.query;
  let students = db.students;
  if (busId) students = students.filter(s => s.busId === busId);
  if (parentId) students = students.filter(s => s.parentId === parentId);
  res.json(students);
});

app.get('/api/students/:id', authenticateToken, (req, res) => {
  const student = db.students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

app.post('/api/students', authenticateToken, (req, res) => {
  const { name, class: cls, busId, parentId, stopName } = req.body;
  const newStudent = {
    id: `s${Date.now()}`,
    name, class: cls, busId, parentId, stopName,
    qrCode: null, boardingStatus: 'not_boarded', dropStatus: 'not_dropped',
  };
  const qrData = JSON.stringify({ studentId: newStudent.id, name: newStudent.name, busId: newStudent.busId });
  QRCode.toDataURL(qrData).then(qr => {
    newStudent.qrCode = qr;
    db.students.push(newStudent);
    res.status(201).json(newStudent);
  });
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
  const idx = db.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Student not found' });
  db.students.splice(idx, 1);
  res.json({ message: 'Student deleted' });
});

// QR Scan – mark boarding/dropping
app.post('/api/students/scan', authenticateToken, (req, res) => {
  const { studentId, action } = req.body; // action: 'board' | 'drop'
  const student = db.students.find(s => s.id === studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  if (action === 'board') {
    student.boardingStatus = 'boarded';
    student.boardedAt = new Date().toISOString();
    // Notify parent
    const notification = {
      id: uuidv4(),
      type: 'boarding',
      title: '🚌 Child Boarded',
      message: `${student.name} has boarded the bus at ${student.stopName}.`,
      targetUserId: student.parentId,
      studentId: student.id,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.push(notification);
    io.emit('student_boarded', { student, notification });
  } else if (action === 'drop') {
    student.dropStatus = 'dropped';
    student.droppedAt = new Date().toISOString();
    const notification = {
      id: uuidv4(),
      type: 'dropped',
      title: '🏠 Child Dropped',
      message: `${student.name} has been dropped at ${student.stopName}.`,
      targetUserId: student.parentId,
      studentId: student.id,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.push(notification);
    io.emit('student_dropped', { student, notification });
  }

  res.json({ message: `Student ${action === 'board' ? 'boarded' : 'dropped'} successfully`, student });
});

// ─────────────────────────────────────────────
//  Notification Routes
// ─────────────────────────────────────────────

function addNotificationToAll(title, message, type) {
  const notification = {
    id: uuidv4(),
    type,
    title,
    message,
    targetUserId: 'all',
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.push(notification);
  io.emit('notification', notification);
}

app.get('/api/notifications', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const notifications = db.notifications.filter(
    n => n.targetUserId === 'all' || n.targetUserId === userId
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifications);
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  notif.read = true;
  res.json(notif);
});

app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.notifications.filter(n => n.targetUserId === 'all' || n.targetUserId === userId)
    .forEach(n => { n.read = true; });
  res.json({ message: 'All notifications marked as read' });
});

// ─────────────────────────────────────────────
//  SOS Routes
// ─────────────────────────────────────────────

app.post('/api/sos', authenticateToken, (req, res) => {
  const { busId, location, message } = req.body;
  const bus = db.buses.find(b => b.id === busId);
  const driver = db.drivers.find(d => d.busId === busId);
  const alert = {
    id: uuidv4(),
    busId,
    busNumber: bus ? bus.number : 'Unknown',
    driverName: driver ? driver.name : 'Unknown',
    driverPhone: driver ? driver.phone : 'Unknown',
    location: location || bus?.currentLocation,
    message: message || 'SOS! Emergency! Immediate assistance required!',
    status: 'active',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  db.sosAlerts.push(alert);

  // Notify all
  const notification = {
    id: uuidv4(),
    type: 'sos',
    title: '🆘 SOS ALERT!',
    message: `Emergency alert from Bus ${alert.busNumber}! Location shared. Immediate action required!`,
    targetUserId: 'all',
    read: false,
    createdAt: new Date().toISOString(),
    sosId: alert.id,
  };
  db.notifications.push(notification);
  io.emit('sos_alert', { alert, notification });

  res.status(201).json({ message: 'SOS alert sent', alert });
});

app.get('/api/sos', authenticateToken, (req, res) => {
  res.json(db.sosAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.put('/api/sos/:id/resolve', authenticateToken, (req, res) => {
  const alert = db.sosAlerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'SOS alert not found' });
  alert.status = 'resolved';
  alert.resolvedAt = new Date().toISOString();
  io.emit('sos_resolved', { alertId: alert.id });
  res.json(alert);
});

// ─────────────────────────────────────────────
//  Feedback Routes
// ─────────────────────────────────────────────

app.get('/api/feedback', authenticateToken, (req, res) => {
  const { busId, parentId } = req.query;
  let feedback = db.feedback;
  if (busId) feedback = feedback.filter(f => f.busId === busId);
  if (parentId) feedback = feedback.filter(f => f.parentId === parentId);
  res.json(feedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/feedback', authenticateToken, (req, res) => {
  const { busId, driverId, rating, message } = req.body;
  const existing = db.feedback.find(f => f.parentId === req.user.id && f.busId === busId);
  if (existing) {
    existing.rating = rating;
    existing.message = message;
    existing.updatedAt = new Date().toISOString();
    return res.json(existing);
  }
  const newFeedback = {
    id: uuidv4(),
    parentId: req.user.id,
    busId,
    driverId,
    rating,
    message,
    createdAt: new Date().toISOString(),
  };
  db.feedback.push(newFeedback);
  res.status(201).json(newFeedback);
});

// ─────────────────────────────────────────────
//  Admin Routes
// ─────────────────────────────────────────────

app.get('/api/admin/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const activeBuses = db.buses.filter(b => b.tripActive).length;
  const totalStudents = db.students.length;
  const boardedStudents = db.students.filter(s => s.boardingStatus === 'boarded').length;
  const activeSOS = db.sosAlerts.filter(a => a.status === 'active').length;
  const avgRating = db.feedback.length
    ? (db.feedback.reduce((sum, f) => sum + f.rating, 0) / db.feedback.length).toFixed(1)
    : 0;
  res.json({ activeBuses, totalBuses: db.buses.length, totalStudents, boardedStudents, activeSOS, totalFeedback: db.feedback.length, avgRating });
});

app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const users = db.users.map(({ password: _, ...u }) => u);
  res.json(users);
});

// ─────────────────────────────────────────────
//  Socket.IO
// ─────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`📡 ${socket.id} joined room: ${room}`);
  });

  socket.on('driver_location_update', (data) => {
    const { busId, lat, lng, speed, heading } = data;
    const bus = db.buses.find(b => b.id === busId);
    if (bus) {
      bus.currentLocation = { lat, lng };
      bus.speed = speed || 0;
      bus.heading = heading || 0;
      bus.lastUpdate = new Date().toISOString();
    }
    socket.broadcast.emit('bus_location_update', {
      busId, lat, lng, speed: speed || 0, heading: heading || 0,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────
//  Start Server
// ─────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`\n🚌 School Bus Tracking Backend`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Demo Credentials:`);
  console.log(`   Admin:     admin@school.com     / admin123`);
  console.log(`   Driver:    driver@school.com    / driver123`);
  console.log(`   Conductor: conductor@school.com / conductor123`);
  console.log(`   Parent:    parent1@school.com   / parent123`);
  console.log(`   Parent 2:  parent2@school.com   / parent123\n`);
});
