import { Request, Response } from "express";
import { Bus } from "../models/bus_model";
import { User } from "../models/user_model";
import { Route } from "../models/route_model";
import  Trip  from "../models/trip_model";
import { ITrip } from "../types/trip_types";
import { IRoute } from "../types/route_types";
import { IBus } from "../types/bus_types";
import { IUser } from "../types/user_types";

export const dashboardController = {

    // ==================== DASHBOARD OVERVIEW ====================
    dashboardOverview: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const subCompanyId = user.subCompanyId;

            // Get current date for filtering
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get first day of current month
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            // Total active buses
            const totalActiveBuses = await Bus.countDocuments({ 
                subCompany: subCompanyId,
                status: 'active'
            });

            // Total active drivers
            const totalActiveDrivers = await User.countDocuments({ 
                subCompanyId: subCompanyId,
                role: 'driver',
                status: 'active'
            });

            // Total active routes
            const totalActiveRoutes = await Route.countDocuments({ 
                subCompany: subCompanyId,
                status: 'active'
            });

            // Total scheduled trips for today
            const totalScheduledTrips = await Trip.countDocuments({
                subCompany: subCompanyId,
                departureTime: {
                    $gte: today,
                    $lt: tomorrow
                },
                status: 'scheduled'
            });

            // Total completed trips for today
            const totalCompletedTrips = await Trip.countDocuments({
                subCompany: subCompanyId,
                arrivalTime: {
                    $gte: today,
                    $lt: tomorrow
                },
                status: 'completed'
            });

            // TODO: Implement actual revenue calculation after Paysera integration
            const dummyRevenueToday = 1000;
            const dummyRevenueMonth = 15600;

            res.status(200).json({
                data: {
                    totalActiveBuses,
                    totalActiveDrivers,
                    totalActiveRoutes,
                    totalScheduledTrips,
                    totalCompletedTrips,
                    revenueToday: dummyRevenueToday,
                    revenueMonth: dummyRevenueMonth
                }
            });
        } catch (error) {
            console.error("getDashboardData error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    recentActivities: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const subCompanyId = user.subCompanyId;

            if (!subCompanyId) {
                return res.status(400).json({ error: "Subcompany ID is required" });
            }

            // Get recent completed trips
            const recentTrips = await Trip.find({
                subCompany: subCompanyId,
                status: 'completed'
            })
            .sort({ arrivalTime: -1 })
            .limit(5)
            .select('routeId busId driverId')
            .populate<{ routeId: IRoute }>('routeId', 'origin destination')
            .populate<{ busId: IBus }>('busId', 'plateNumber')
            .populate<{ driverId: IUser }>('driverId', 'name');

            // Get maintenance alerts
            const maintenanceAlerts = await Bus.find({
                subCompany: subCompanyId,
                status: 'maintenance', 
            })
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('plateNumber name capacity type');

            // Get recent driver assignments
            const driverAssignments = await Trip.find({
                subCompany: subCompanyId,
                status: 'pending',
                departureTime: { $gte: new Date() }
            })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('routeId busId driverId')
            .populate<{ routeId: IRoute }>('routeId', 'origin destination')
            .populate<{ busId: IBus }>('busId', 'plateNumber')
            .populate<{ driverId: IUser }>('driverId', 'name');

            // Get recent route changes
            const routeChanges = await Route.find({
                subCompany: subCompanyId,
                updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            })
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('from to status updatedAt');

            // Get recent schedule updates
            const scheduleUpdates = await Trip.find({
                subCompany: subCompanyId,
                updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
                $or: [
                    { departureTime: { $exists: true } },
                    { arrivalTime: { $exists: true } }
                ]
            })
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('routeId departureTime arrivalTime updatedAt')
            .populate<{ routeId: IRoute }>('routeId', 'origin destination');

            res.status(200).json({
                data: {
                    recentTrips: recentTrips.map(trip => ({
                        route: `${trip.routeId.origin} - ${trip.routeId.destination}`,
                        bus: trip.busId.plateNumber,
                        driver: trip.driverId.name,
                        departureTime: trip.departureTime,
                        arrivalTime: trip.arrivalTime
                    })),
                    maintenanceAlerts: maintenanceAlerts.map(bus => ({
                        bus: bus.plateNumber,
                        status: bus.status,
                        // lastMaintenance: bus.lastMaintenanceDate,
                        // nextMaintenance: bus.nextMaintenanceDate
                    })),
                    driverAssignments: driverAssignments.map(assignment => ({
                        route: `${assignment.routeId.origin} - ${assignment.routeId.destination}`,
                        bus: assignment.busId.plateNumber,
                        driver: assignment.driverId.name,
                        departureTime: assignment.departureTime
                    })),
                    routeChanges: routeChanges.map(route => ({
                        route: `${route.origin} - ${route.destination}`,
                        status: route.status,
                        updatedAt: route.updatedAt,
                    })),
                    scheduleUpdates: scheduleUpdates.map(update => ({
                        route: `${update.routeId.origin} - ${update.routeId.destination}`,
                        departureTime: update.departureTime,
                        arrivalTime: update.arrivalTime,
                        updatedAt: update.updatedAt
                    }))
                }
            });
        } catch (error) {
            console.error("getRecentActivities error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    upcomingSchedule: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const subCompanyId = user.subCompanyId;

            if (!subCompanyId) {
                return res.status(400).json({ error: "Subcompany ID is required" });
            }

            // Get today's date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get today's upcoming trips with all related information
            const upcomingTrips = await Trip.find({
                subCompany: subCompanyId,
                status: 'pending',
                departureTime: {
                    $gte: today,
                    $lt: tomorrow
                }
            })
            .sort({ departureTime: 1 })
            .select('routeId busId driverId departureTime arrivalTime status')
            .populate<{ routeId: IRoute }>('routeId', 'origin destination distance duration')
            .populate<{ busId: IBus }>('busId', 'plateNumber name capacity type')
            .populate<{ driverId: IUser }>('driverId', 'name phone');

            res.status(200).json({
                data: upcomingTrips.map(trip => ({
                    tripId: trip._id,
                    route: {
                        from: trip.routeId.origin,
                        to: trip.routeId.destination,
                        distance: trip.routeId.distance,
                        // duration: trip.routeId.duration
                    },
                    bus: {
                        plateNumber: trip.busId.plateNumber,
                        name: trip.busId.name,
                        capacity: trip.busId.capacity,
                        type: trip.busId.type
                    },
                    driver: {
                        name: trip.driverId.name,
                        phone: trip.driverId.phone
                    },
                    schedule: {
                        departureTime: trip.departureTime,
                        arrivalTime: trip.arrivalTime,
                        status: trip.status
                    }
                }))
            });
        } catch (error) {
            console.error("getUpcomingSchedule error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}
