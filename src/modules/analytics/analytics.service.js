const prisma = require('../../config/prisma');

const getOverview = async (user = null) => {
  // We need to fetch data for the last 6 months (monthly) and last 4 weeks (weekly)
  const now = new Date();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Start of that month

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(now.getDate() - 28);

  // Fetch base data
  const appointments = await prisma.appointment.findMany({
    where: { appointment_date: { gte: sixMonthsAgo } },
    select: { appointment_date: true, status: true, id: true }
  });

  const invoices = await prisma.invoice.findMany({
    where: { date: { gte: sixMonthsAgo }, status: 'PAID' },
    select: { date: true, total: true }
  });

  const patients = await prisma.patient.findMany({
    where: { created_at: { gte: sixMonthsAgo } },
    select: { created_at: true }
  });

  // Fetch recent logs using the new centralized logic (e.g. for Admin/Overview)
  // For the overview, we assume we want all logs if called without a specific user filter initially
  // OR we can pass a system-wide "all" context.
  const { systemFeed: recentLogs } = await fetchActivityLogs(user || { role: 'admin' }, { limit: 15 });

  const getMonthAbbr = (date) => new Date(date).toLocaleString('default', { month: 'short' });

  // Generate the last 6 months array
  const monthlyDataMap = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    monthlyDataMap.set(getMonthAbbr(d), { appointments: 0, revenue: 0, noShows: 0, newPatients: 0 });
  }

  // Populate Monthly Data
  appointments.forEach(appt => {
    const month = getMonthAbbr(appt.appointment_date);
    if (monthlyDataMap.has(month)) {
      const data = monthlyDataMap.get(month);
      data.appointments += 1;
      if (appt.status === 'no_show') data.noShows += 1;
    }
  });

  invoices.forEach(inv => {
    const month = getMonthAbbr(inv.date);
    if (monthlyDataMap.has(month)) {
      monthlyDataMap.get(month).revenue += parseFloat(inv.total);
    }
  });

  patients.forEach(pat => {
    const month = getMonthAbbr(pat.created_at);
    if (monthlyDataMap.has(month)) {
      monthlyDataMap.get(month).newPatients += 1;
    }
  });

  const monthlyData = Array.from(monthlyDataMap.entries()).map(([name, data]) => ({
    name,
    ...data
  }));

  // Generate last 4 weeks data
  const weeklyDataMap = new Map();
  for (let i = 4; i >= 1; i--) {
    weeklyDataMap.set(`W${5 - i}`, { startDate: new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000), appointments: 0, revenue: 0, noShows: 0, newPatients: 0 });
  }

  const getWeekName = (date) => {
    const d = new Date(date);
    for (const [name, data] of weeklyDataMap.entries()) {
      const weekStart = data.startDate;
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (d >= weekStart && d < weekEnd) return name;
    }
    return null;
  };

  appointments.forEach(appt => {
    const week = getWeekName(appt.appointment_date);
    if (week) {
      weeklyDataMap.get(week).appointments += 1;
      if (appt.status === 'no_show') weeklyDataMap.get(week).noShows += 1;
    }
  });

  invoices.forEach(inv => {
    const week = getWeekName(inv.date);
    if (week) {
      weeklyDataMap.get(week).revenue += parseFloat(inv.total);
    }
  });

  patients.forEach(pat => {
    const week = getWeekName(pat.created_at);
    if (week) {
      weeklyDataMap.get(week).newPatients += 1;
    }
  });

  const weeklyData = Array.from(weeklyDataMap.entries()).map(([name, data]) => {
    const { startDate, ...metrics } = data;
    return { name, ...metrics };
  });

  // Compute summary totals for dashboard stat cards
  const totalAppointments = appointments.length;
  const totalNoShows = appointments.filter(a => a.status === 'no_show').length;
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;
  const totalNewPatients = patients.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

  return { monthlyData, weeklyData, systemFeed: recentLogs, summary: { totalAppointments, totalNoShows, totalCompleted, totalNewPatients, totalRevenue } };
};

/**
 * Centrally format a log entry for the UI
 */
const formatActivityLog = (log, summaryOnly = false) => {
  const logDate = new Date(log.created_at);
  const now = new Date();
  const diffMs = now - logDate;
  const diffMins = Math.floor(diffMs / 60000);
  const timeAgo = diffMins < 60 ? `${diffMins}m ago` : diffMins < 1440 ? `${Math.floor(diffMins / 60)}h ago` : `${Math.floor(diffMins / 1440)}d ago`;

  const actionMap = {
    LOGIN: { type: 'Staff Login', format: (d) => d || 'User logged in' },
    CREATE_APPOINTMENT: { type: 'Booking Created', format: (d) => `New booking: ${d}` },
    CREATE_PATIENT: { type: 'New Patient', format: (d) => `Added patient: ${d}` },
    CREATE_NOTE: { type: 'Session Note', format: (d) => `Note created: ${d}` },
    UPDATE_SETTINGS: { type: 'Settings Updated', format: (d) => d || 'Global settings updated' },
    CREATE_INVOICE: { type: 'Invoice Created', format: (d) => `New invoice: ${d}` },
    PAY_INVOICE: { type: 'Payment Received', format: (d) => `Payment: ${d}` }
  };

  const actionInfo = actionMap[log.action] || { type: log.action, format: (d) => d || 'System action' };

  const item = {
    id: log.id,
    type: actionInfo.type,
    patient: actionInfo.format(log.details),
    time: timeAgo,
    timestamp: log.created_at,
    staff: log.user?.name || 'System',
    meta: log.meta
  };
  if (summaryOnly) {
    return {
      id: item.id,
      type: item.type,
      patient: 'Restricted',
      time: item.time,
      timestamp: item.timestamp,
      staff: item.staff
    };
  }
  return item;
};

/**
 * Fetch and format activity logs with pagination and role-based filtering
 */
const fetchActivityLogs = async (user, options = {}) => {
  const { page = 1, limit = 15 } = options;
  const skip = (parseInt(page) - 1) * (parseInt(limit));
  const take = Math.min(parseInt(limit), 50);

  const where = {};

  if (user && user.role === 'therapist') {
    // Role-Based Filtering: Therapist sees their own logs OR logs tied to them
    const assignedPatients = await prisma.patient.findMany({
      where: { therapist_id: user.id },
      select: { id: true }
    });
    const patientIds = assignedPatients.map(p => String(p.id));

    const assignedAppointments = await prisma.appointment.findMany({
      where: { therapist_id: user.id },
      select: { id: true }
    });
    const appointmentIds = assignedAppointments.map(a => String(a.id));

    where.OR = [
      { user_id: user.id },
      { AND: [{ target_type: 'Patient' }, { target_id: { in: patientIds } }] },
      { AND: [{ target_type: 'Appointment' }, { target_id: { in: appointmentIds } }] }
    ];
  }

  const logs = await prisma.systemActivityLog.findMany({
    where,
    take,
    skip,
    orderBy: { created_at: 'desc' },
    include: { user: { select: { name: true } } }
  });

  const total = await prisma.systemActivityLog.count({ where });

  const summaryOnly = String(user?.role || '').toLowerCase() !== 'admin';
  return {
    systemFeed: logs.map((log) => formatActivityLog(log, summaryOnly)),
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take)
    }
  };
};

const getStaffOverview = async ({ month, year } = {}) => {
  const staffRows = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'therapist', 'receptionist', 'billing'] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true
    },
    orderBy: { name: 'asc' }
  });

  // Build date filter for appointments (month scope)
  const apptWhere = {};
  if (month !== undefined && year !== undefined) {
    const m = parseInt(month);
    const y = parseInt(year);
    const startOfMonth = new Date(y, m, 1);
    const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999);
    apptWhere.appointment_date = { gte: startOfMonth, lte: endOfMonth };
  }

  const appointments = await prisma.appointment.findMany({
    where: apptWhere,
    select: {
      id: true,
      therapist_id: true,
      status: true,
      appointment_date: true,
      service: { select: { price: true, name: true } },
      patient: { select: { first_name: true, last_name: true } }
    }
  });

  const today = new Date();
  const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);

  const byTherapist = new Map();
  appointments.forEach((appt) => {
    const therapistId = appt.therapist_id;
    if (!therapistId) return;
    if (!byTherapist.has(therapistId)) {
      byTherapist.set(therapistId, {
        total: 0,
        completed: 0,
        noShows: 0,
        checkedIn: 0,
        scheduled: 0,
        todayAppts: 0,
        earnings: 0,
        appointmentsList: []
      });
    }

    const bucket = byTherapist.get(therapistId);
    bucket.total += 1;

    if (appt.status === 'completed') {
      bucket.completed += 1;
      // Only sum service fees for COMPLETED appointments
      if (appt.service?.price) {
        bucket.earnings += parseFloat(appt.service.price);
      }
    }

    if (appt.status === 'no_show') bucket.noShows += 1;
    if (appt.status === 'checked_in') bucket.checkedIn += 1;
    if (appt.status === 'scheduled') bucket.scheduled += 1;

    if (appt.appointment_date) {
      const apptKey = new Date(appt.appointment_date).toISOString().slice(0, 10);
      if (apptKey === todayKey) bucket.todayAppts += 1;
    }

    // Save appointment details for the "View More" list in UI
    bucket.appointmentsList.push({
      id: appt.id,
      date: appt.appointment_date,
      status: appt.status,
      patientName: appt.patient ? `${appt.patient.first_name} ${appt.patient.last_name}`.trim() : 'Unknown Patient',
      serviceName: appt.service?.name || 'Consultation',
      price: appt.service?.price ? parseFloat(appt.service.price) : 0
    });
  });

  const staff = staffRows.map((member) => {
    const m = byTherapist.get(member.id) || {
      total: 0,
      completed: 0,
      noShows: 0,
      checkedIn: 0,
      scheduled: 0,
      todayAppts: 0,
      earnings: 0,
      appointmentsList: []
    };

    const completionRate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
    const isActive = m.todayAppts > 0 || m.checkedIn > 0;

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      joinedDate: member.created_at || null,
      metrics: {
        ...m,
        completionRate
      },
      isActive
    };
  });

  // Total earnings across all staff
  const totalEarnings = staff.reduce((sum, s) => sum + (s.metrics?.earnings || 0), 0);

  return {
    staff,
    summary: {
      totalStaff: staff.length,
      totalAppointments: appointments.length,
      totalCompleted: appointments.filter((a) => a.status === 'completed').length,
      totalEarnings,
      roleCounts: staff.reduce((acc, s) => {
        acc[s.role] = (acc[s.role] || 0) + 1;
        return acc;
      }, {})
    }
  };
};

module.exports = {
  getOverview,
  fetchActivityLogs,
  getStaffOverview
};
